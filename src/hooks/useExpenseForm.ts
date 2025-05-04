
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PaymentType } from "@/types/models";
import { format } from "date-fns";
import { ExpenseFormData } from "./expense/expenseFormTypes";
import { useSingleExpenseHandler } from "./expense/useSingleExpenseHandler";
import { useInstallmentExpenseHandler } from "./expense/useInstallmentExpenseHandler";
import { useRecurringExpenseHandler } from "./expense/useRecurringExpenseHandler";
import { useAppStore } from "@/store";

export function useExpenseForm(editId?: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    categories, 
    paymentSources, 
    expenses, 
    addExpense, 
    updateExpense, 
    addMultipleExpenses 
  } = useAppStore();
  
  const { handleSingleExpense } = useSingleExpenseHandler();
  const { handleInstallmentExpense } = useInstallmentExpenseHandler();
  const { handleRecurringExpense } = useRecurringExpenseHandler();
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    id: "",
    amount: "",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
    name: "",
    categoryId: categories.length > 0 ? categories[0].id : "",
    paymentSourceId: paymentSources.length > 0 ? paymentSources[0].id : "",
    paymentType: "one-time",
    totalAmount: "",
    numberOfInstallments: "3",
    startDate: new Date(),
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
          totalAmount: "",
          numberOfInstallments: "3",
          startDate: new Date(),
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

  const handleStartDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
  };

  const handlePaymentTypeChange = (paymentType: PaymentType) => {
    setFormData((prev) => ({ ...prev, paymentType }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || ((formData.paymentType === "installment" || formData.paymentType === "recurring") && !formData.startDate)) {
      toast({
        title: "שגיאה",
        description: "יש להזין תאריך",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (formData.paymentType === "installment") {
        const installmentExpenses = handleInstallmentExpense(formData);
        await addMultipleExpenses(installmentExpenses);
        
        toast({
          title: "התשלומים נוספו",
          description: `נוספו ${installmentExpenses.length} תשלומים בהצלחה`,
        });
      } else if (formData.paymentType === "recurring") {
        const recurringExpenses = handleRecurringExpense(formData);
        await addMultipleExpenses(recurringExpenses);
        
        toast({
          title: "התשלומים הקבועים נוספו",
          description: "נוספו 12 תשלומים קבועים בהצלחה",
        });
      } else {
        const expense = handleSingleExpense(formData, editId);
        
        if (editId) {
          // Update existing expense
          await updateExpense(editId, expense);
          toast({
            title: "ההוצאה עודכנה",
            description: "פרטי ההוצאה עודכנו בהצלחה",
          });
        } else {
          // Add new expense
          await addExpense(expense);
          
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

  return {
    formData,
    isSubmitting,
    categories,
    paymentSources,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleStartDateChange,
    handlePaymentTypeChange,
    handleSubmit
  };
}
