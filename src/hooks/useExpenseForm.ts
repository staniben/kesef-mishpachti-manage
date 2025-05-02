
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Expense } from "@/types";
import { format } from "date-fns";
import { createBaseExpense } from "@/utils/expenseUtils";

export function useExpenseForm(editId?: string) {
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
  }>({
    id: "",
    amount: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
    name: "",
    categoryId: categories.length > 0 ? categories[0].id : "",
    paymentSourceId: paymentSources.length > 0 ? paymentSources[0].id : "",
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
      
      // Create the expense object
      const expense: Expense = createBaseExpense(
        editId,
        totalAmount,
        formData.date,
        formData.time,
        formData.name,
        formData.categoryId,
        formData.paymentSourceId,
        "one-time"
      );
      
      if (editId) {
        // Update existing expense
        updateExpense(editId, expense);
        toast({
          title: "ההוצאה עודכנה",
          description: "פרטי ההוצאה עודכנו בהצלחה",
        });
      } else {
        // Add new expense
        addExpense(expense);
        
        toast({
          title: "ההוצאה נוספה",
          description: "ההוצאה נוספה בהצלחה",
        });
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

  return {
    formData,
    isSubmitting,
    categories,
    paymentSources,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleSubmit
  };
}
