
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
import { useFormValidation } from "./expense/useFormValidation";
import { useInitialFormData } from "./expense/useInitialFormData";

export function useExpenseForm(editId?: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    categories, 
    paymentSources, 
    expenses, 
    addExpense, 
    updateExpense, 
    addMultipleExpenses,
    fetchCategories,
    fetchPaymentSources
  } = useAppStore();
  
  const { handleSingleExpense } = useSingleExpenseHandler();
  const { handleInstallmentExpense } = useInstallmentExpenseHandler();
  const { handleRecurringExpense } = useRecurringExpenseHandler();
  const { validateAndPrepare } = useFormValidation(categories, paymentSources, toast);
  
  // Initialize form data with default values or from existing expense if editing
  const { formData, setFormData } = useInitialFormData(editId, expenses, categories, paymentSources);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add debug logging for categories and paymentSources
  useEffect(() => {
    console.log("ExpenseForm hook - categories:", categories.length);
    console.log("ExpenseForm hook - paymentSources:", paymentSources.length);
    
    // If no data is available, try fetching again
    if (categories.length === 0) {
      console.log("No categories available in useExpenseForm, fetching...");
      fetchCategories().catch(err => console.error("Error fetching categories in hook:", err));
    }
    
    if (paymentSources.length === 0) {
      console.log("No payment sources available in useExpenseForm, fetching...");
      fetchPaymentSources().catch(err => console.error("Error fetching payment sources in hook:", err));
    }
  }, [categories, paymentSources, fetchCategories, fetchPaymentSources]);
  
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
    
    if (!validateAndPrepare(formData)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Form submission started with data:', formData);
      
      if (formData.paymentType === "installment") {
        await handleInstallmentSubmit();
      } else if (formData.paymentType === "recurring") {
        await handleRecurringSubmit();
      } else {
        await handleSingleSubmit();
      }
      
      console.log('Form submission completed successfully');
      
      // Navigate back to the dashboard after adding/editing
      navigate("/");
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSingleSubmit = async () => {
    console.log('Handling single expense');
    const expense = handleSingleExpense(formData, editId);
    console.log('Single expense ready for saving:', expense);
    
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
  };

  const handleInstallmentSubmit = async () => {
    console.log('Handling installment expense');
    const installmentExpenses = handleInstallmentExpense(formData);
    console.log('Installment expenses ready for saving:', installmentExpenses);
    
    await addMultipleExpenses(installmentExpenses);
    
    toast({
      title: "התשלומים נוספו",
      description: `נוספו ${installmentExpenses.length} תשלומים בהצלחה`,
    });
  };

  const handleRecurringSubmit = async () => {
    console.log('Handling recurring expense');
    const recurringExpenses = handleRecurringExpense(formData);
    console.log('Recurring expenses ready for saving:', recurringExpenses);
    
    await addMultipleExpenses(recurringExpenses);
    
    toast({
      title: "התשלומים הקבועים נוספו",
      description: "נוספו 12 תשלומים קבועים בהצלחה",
    });
  };

  const handleSubmitError = (error: unknown) => {
    console.error("Error saving expense:", error);
    
    // Enhanced error handling
    let errorMessage = "אירעה שגיאה בעת שמירת ההוצאה";
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      // Show more detailed error in development or for specific errors
      if (process.env.NODE_ENV === 'development' || error.message.includes("נדרש") || error.message.includes("auth")) {
        errorMessage = error.message;
      }
      
      // Handle Supabase-specific errors
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const supabaseError = error as { code: string; message: string; details?: string };
        console.error("Supabase error code:", supabaseError.code);
        console.error("Supabase error details:", supabaseError.details);
        
        if (supabaseError.code === '42501') {
          errorMessage = "אין לך הרשאות מתאימות לבצע פעולה זו";
        } else if (supabaseError.code === '23505') {
          errorMessage = "רשומה עם מזהה זהה כבר קיימת במערכת";
        } else if (supabaseError.code === '23503') {
          errorMessage = "הפנייה לקטגוריה או לאמצעי תשלום שאינם קיימים במערכת";
        }
      }
    }
    
    toast({
      title: "שגיאה",
      description: errorMessage,
      variant: "destructive",
    });
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
