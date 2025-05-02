import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Expense, PaymentType } from "@/types";
import { format, addMonths } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseFormProps {
  editId?: string;
}

export function ExpenseForm({ editId }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, paymentSources, expenses, addExpense, updateExpense } = useAppContext();
  
  const [formData, setFormData] = useState<{
    id: string;
    amount: string;
    date: Date | undefined;
    time: string;
    name: string;
    categoryId: string;
    paymentSourceId: string;
    paymentType: PaymentType;
    installmentNumber: string;
    totalInstallments: string;
    recurringEndDate: Date | undefined;
  }>({
    id: "",
    amount: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
    name: "",
    categoryId: categories.length > 0 ? categories[0].id : "",
    paymentSourceId: paymentSources.length > 0 ? paymentSources[0].id : "",
    paymentType: "one-time",
    installmentNumber: "1",
    totalInstallments: "1",
    recurringEndDate: undefined,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load expense data if editing
  useEffect(() => {
    if (editId) {
      const expenseToEdit = expenses.find((e) => e.id === editId);
      if (expenseToEdit) {
        setFormData({
          id: expenseToEdit.id,
          amount: expenseToEdit.amount.toString(),
          date: new Date(expenseToEdit.date),
          time: expenseToEdit.time || format(new Date(), "HH:mm"),
          name: expenseToEdit.name,
          categoryId: expenseToEdit.categoryId,
          paymentSourceId: expenseToEdit.paymentSourceId,
          paymentType: expenseToEdit.paymentType,
          installmentNumber: expenseToEdit.installmentNumber?.toString() || "1",
          totalInstallments: expenseToEdit.totalInstallments?.toString() || "1",
          recurringEndDate: expenseToEdit.recurringEndDate 
            ? new Date(expenseToEdit.recurringEndDate) 
            : undefined,
        });
      }
    }
  }, [editId, expenses]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, date }));
  };
  
  const handleRecurringEndDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, recurringEndDate: date }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date) {
      toast({
        title: "שגיאה",
        description: "יש להזין תאריך",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const expenseData: Expense = {
        id: editId || new Date().getTime().toString(),
        amount: parseFloat(formData.amount),
        date: format(formData.date, "yyyy-MM-dd"),
        time: formData.time,
        name: formData.name,
        categoryId: formData.categoryId,
        paymentSourceId: formData.paymentSourceId,
        paymentType: formData.paymentType,
      };
      
      // Add additional fields based on payment type
      if (formData.paymentType === "installments") {
        expenseData.installmentNumber = parseInt(formData.installmentNumber);
        expenseData.totalInstallments = parseInt(formData.totalInstallments);
      } else if (formData.paymentType === "recurring" && formData.recurringEndDate) {
        expenseData.recurringEndDate = format(formData.recurringEndDate, "yyyy-MM-dd");
      }
      
      if (editId) {
        // When editing, just update the single expense
        updateExpense(editId, expenseData);
        toast({
          title: "ההוצאה עודכנה",
          description: "פרטי ההוצאה עודכנו בהצלחה",
        });
      } else {
        // For new expenses, handle according to payment type
        addExpense(expenseData);
        
        // Generate additional expenses for installments and recurring payments
        if (formData.paymentType === "installments") {
          generateInstallmentExpenses(expenseData);
        } else if (formData.paymentType === "recurring") {
          generateRecurringExpenses(expenseData);
        }
        
        toast({
          title: "ההוצאה נוספה",
          description: formData.paymentType !== "one-time" 
            ? "ההוצאה והתשלומים העתידיים נוספו בהצלחה" 
            : "ההוצאה נוספה בהצלחה",
        });
      }
      
      navigate("/");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת שמירת ההוצאה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to generate installment expenses
  const generateInstallmentExpenses = (baseExpense: Expense) => {
    const totalAmount = baseExpense.amount;
    const totalInstallments = baseExpense.totalInstallments || 1;
    
    // Skip the first payment as it's already added
    for (let i = 1; i < totalInstallments; i++) {
      const installmentAmount = parseFloat((totalAmount / totalInstallments).toFixed(2));
      const installmentDate = addMonths(new Date(baseExpense.date), i);
      
      const installmentExpense: Expense = {
        id: new Date().getTime().toString() + i, // Unique ID
        amount: installmentAmount,
        date: format(installmentDate, "yyyy-MM-dd"),
        time: baseExpense.time,
        name: `${baseExpense.name} (${i + 1}/${totalInstallments})`,
        categoryId: baseExpense.categoryId,
        paymentSourceId: baseExpense.paymentSourceId,
        paymentType: "installments",
        installmentNumber: i + 1,
        totalInstallments: totalInstallments,
        isInstallment: true, // Mark as installment for display purposes
        relatedExpenseId: baseExpense.id, // Link to original expense
      };
      
      addExpense(installmentExpense);
    }
  };
  
  // Function to generate recurring expenses
  const generateRecurringExpenses = (baseExpense: Expense) => {
    // Default to 12 months if no end date is provided
    const endDate = baseExpense.recurringEndDate 
      ? new Date(baseExpense.recurringEndDate)
      : addMonths(new Date(baseExpense.date), 12);
    
    const startDate = new Date(baseExpense.date);
    let currentDate = addMonths(startDate, 1); // Start from next month
    let counter = 1;
    
    // Generate recurring expenses until end date or max 12 months
    while (currentDate <= endDate && counter <= 12) {
      const recurringExpense: Expense = {
        id: new Date().getTime().toString() + counter,
        amount: baseExpense.amount,
        date: format(currentDate, "yyyy-MM-dd"),
        time: baseExpense.time,
        name: `${baseExpense.name} (חודשי ${counter + 1})`,
        categoryId: baseExpense.categoryId,
        paymentSourceId: baseExpense.paymentSourceId,
        paymentType: "recurring",
        recurringEndDate: baseExpense.recurringEndDate,
        isRecurring: true, // Mark as recurring for display purposes
        recurrenceType: "monthly",
        relatedExpenseId: baseExpense.id, // Link to original expense
      };
      
      addExpense(recurringExpense);
      
      currentDate = addMonths(currentDate, 1);
      counter++;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">{editId ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">שם ההוצאה</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="שם ההוצאה"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">סכום (₪)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="הזן סכום"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>תאריך</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between text-right font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                {formData.date ? format(formData.date, "dd/MM/yyyy") : "בחר תאריך"}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={handleDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="time">שעה</Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categoryId">קטגוריה</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => handleSelectChange("categoryId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentSourceId">אמצעי תשלום</Label>
          <Select
            value={formData.paymentSourceId}
            onValueChange={(value) => handleSelectChange("paymentSourceId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר אמצעי תשלום" />
            </SelectTrigger>
            <SelectContent>
              {paymentSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentType">סוג תשלום</Label>
          <Select
            value={formData.paymentType}
            onValueChange={(value) => handleSelectChange("paymentType", value as PaymentType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג תשלום" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">חד פעמי</SelectItem>
              <SelectItem value="recurring">תשלום קבוע</SelectItem>
              <SelectItem value="installments">תשלומים</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.paymentType === "installments" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="installmentNumber">מספר תשלום</Label>
              <Input
                id="installmentNumber"
                name="installmentNumber"
                type="number"
                min="1"
                value={formData.installmentNumber}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">סה"כ תשלומים</Label>
              <Input
                id="totalInstallments"
                name="totalInstallments"
                type="number"
                min="1"
                value={formData.totalInstallments}
                onChange={handleChange}
              />
            </div>
          </>
        )}
        
        {formData.paymentType === "recurring" && (
          <div className="space-y-2">
            <Label>תאריך סיום</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between text-right font-normal",
                    !formData.recurringEndDate && "text-muted-foreground"
                  )}
                >
                  {formData.recurringEndDate 
                    ? format(formData.recurringEndDate, "dd/MM/yyyy") 
                    : "בחר תאריך סיום"}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar
                  mode="single"
                  selected={formData.recurringEndDate}
                  onSelect={handleRecurringEndDateChange}
                  initialFocus
                  disabled={(date) => date <= (formData.date || new Date())}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => navigate("/")}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "שומר..." : editId ? "עדכון" : "הוספה"}
        </Button>
      </div>
    </form>
  );
}
