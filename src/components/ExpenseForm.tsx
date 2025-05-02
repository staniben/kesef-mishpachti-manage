
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Expense, PaymentType } from "@/types";
import { format } from "date-fns";
import { BasicExpenseFields } from "./expense/BasicExpenseFields";
import { DateTimeInputs } from "./expense/DateTimeInputs";
import { InstallmentFields } from "./expense/InstallmentFields";
import { RecurringFields } from "./expense/RecurringFields";
import { createBaseExpense, generateInstallmentExpenses, generateRecurringExpenses } from "@/utils/expenseUtils";

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
      // For installments, this is the first payment
      const expenseData: Expense = createBaseExpense(
        editId,
        parseFloat(formData.amount),
        formData.date,
        formData.time,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        formData.paymentType
      );
      
      // Add additional fields based on payment type
      if (formData.paymentType === "installments") {
        const totalInstallments = parseInt(formData.totalInstallments || "1");
        const installmentAmount = parseFloat((parseFloat(formData.amount) / totalInstallments).toFixed(2));
        
        // Update the first payment amount and add installment details
        expenseData.amount = installmentAmount;
        expenseData.installmentNumber = 1;
        expenseData.totalInstallments = totalInstallments;
        expenseData.isInstallment = true;
        expenseData.name = `${formData.name} (1/${totalInstallments})`;
      } else if (formData.paymentType === "recurring" && formData.recurringEndDate) {
        expenseData.recurringEndDate = format(formData.recurringEndDate, "yyyy-MM-dd");
        expenseData.isRecurring = true;
        expenseData.recurrenceType = "monthly";
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
          generateInstallmentExpenses(expenseData, addExpense);
        } else if (formData.paymentType === "recurring") {
          generateRecurringExpenses(expenseData, addExpense);
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">{editId ? "עריכת הוצאה" : "הוספת הוצאה חדשה"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BasicExpenseFields
          name={formData.name}
          amount={formData.amount}
          categoryId={formData.categoryId}
          paymentSourceId={formData.paymentSourceId}
          paymentType={formData.paymentType}
          categories={categories}
          paymentSources={paymentSources}
          onInputChange={handleChange}
          onSelectChange={handleSelectChange}
        />
        
        <DateTimeInputs
          date={formData.date}
          time={formData.time}
          onDateChange={handleDateChange}
          onTimeChange={handleChange}
        />
        
        {formData.paymentType === "installments" && (
          <InstallmentFields 
            installmentNumber={formData.installmentNumber}
            totalInstallments={formData.totalInstallments}
            onChange={handleChange}
          />
        )}
        
        {formData.paymentType === "recurring" && (
          <RecurringFields
            recurringEndDate={formData.recurringEndDate}
            startDate={formData.date}
            onRecurringEndDateChange={handleRecurringEndDateChange}
          />
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
