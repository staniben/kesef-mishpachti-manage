
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
  
  const validateAndPrepare = () => {
    // Basic validation
    if (!formData.date || ((formData.paymentType === "installment" || formData.paymentType === "recurring") && !formData.startDate)) {
      toast({
        title: "שגיאה",
        description: "יש להזין תאריך",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate category exists
    if (formData.categoryId && categories.length > 0) {
      const categoryExists = categories.some(c => c.id === formData.categoryId);
      if (!categoryExists) {
        toast({
          title: "שגיאה",
          description: "קטגוריה לא קיימת, אנא בחר קטגוריה אחרת",
          variant: "destructive",
        });
        return false;
      }
    }
    
    // Validate payment source exists
    if (formData.paymentSourceId && paymentSources.length > 0) {
      const sourceExists = paymentSources.some(s => s.id === formData.paymentSourceId);
      if (!sourceExists) {
        toast({
          title: "שגיאה",
          description: "אמצעי תשלום לא קיים, אנא בחר אמצעי תשלום אחר",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAndPrepare()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Form submission started with data:', formData);
      
      if (formData.paymentType === "installment") {
        console.log('Handling installment expense');
        const installmentExpenses = handleInstallmentExpense(formData);
        console.log('Installment expenses ready for saving:', installmentExpenses);
        
        await addMultipleExpenses(installmentExpenses);
        
        toast({
          title: "התשלומים נוספו",
          description: `נוספו ${installmentExpenses.length} תשלומים בהצלחה`,
        });
      } else if (formData.paymentType === "recurring") {
        console.log('Handling recurring expense');
        const recurringExpenses = handleRecurringExpense(formData);
        console.log('Recurring expenses ready for saving:', recurringExpenses);
        
        await addMultipleExpenses(recurringExpenses);
        
        toast({
          title: "התשלומים הקבועים נוספו",
          description: "נוספו 12 תשלומים קבועים בהצלחה",
        });
      } else {
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
      }
      
      console.log('Form submission completed successfully');
      
      // Navigate back to the dashboard after adding/editing
      navigate("/");
    } catch (error) {
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
