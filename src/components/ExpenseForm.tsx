
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Expense, PaymentType } from "@/types";
import { format } from "date-fns";
import { BasicExpenseFields } from "./expense/BasicExpenseFields";
import { DateTimeInputs } from "./expense/DateTimeInputs";
import { RecurringFields } from "./expense/RecurringFields";
import { createBaseExpense, generateRecurringExpenses } from "@/utils/expenseUtils";

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
      const totalAmount = parseFloat(formData.amount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error("יש להזין סכום חיובי");
      }
      
      // Create the base expense object
      const baseExpense: Expense = createBaseExpense(
        editId,
        totalAmount,
        formData.date,
        formData.time,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        formData.paymentType
      );
      
      if (editId) {
        // When editing, just update the single expense
        updateExpense(editId, baseExpense);
        toast({
          title: "ההוצאה עודכנה",
          description: "פרטי ההוצאה עודכנו בהצלחה",
        });
      } else {
        // For new expenses, handle according to payment type
        if (formData.paymentType === "recurring") {
          // Generate and save all recurring expenses
          const recurringExpenses = generateRecurringExpenses(baseExpense);
          
          // Add all recurring expenses to the database
          recurringExpenses.forEach(expense => {
            addExpense(expense);
          });
          
          toast({
            title: "ההוצאות החוזרות נוספו",
            description: "נוספו 12 הוצאות חודשיות בהצלחה",
          });
        } else {
          // One-time expense - just add it as is
          addExpense(baseExpense);
          
          toast({
            title: "ההוצאה נוספה",
            description: "ההוצאה נוספה בהצלחה",
          });
        }
      }
      
      // Navigate back to the dashboard after adding/editing
      navigate("/");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה בעת שמירת ההוצאה",
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
