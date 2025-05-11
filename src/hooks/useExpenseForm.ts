
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
import { useAuth } from "@/context/AuthContext";

interface InitialData {
  paymentType?: PaymentType;
  name?: string;
  amount?: string;
  categoryId?: string;
  paymentSourceId?: string;
  totalAmount?: string;
  numberOfInstallments?: string;
}

export function useExpenseForm(editId?: string, initialData?: InitialData) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
  
  // Apply initialData if provided
  useEffect(() => {
    if (initialData && !editId) {
      const updatedFormData = { ...formData };
      
      if (initialData.paymentType && ["one-time", "installment", "recurring"].includes(initialData.paymentType)) {
        updatedFormData.paymentType = initialData.paymentType;
      }
      
      if (initialData.name) {
        updatedFormData.name = initialData.name;
      }
      
      if (initialData.amount) {
        updatedFormData.amount = initialData.amount;
      }
      
      if (initialData.categoryId && categories.some(c => c.id === initialData.categoryId)) {
        updatedFormData.categoryId = initialData.categoryId;
      }
      
      if (initialData.paymentSourceId && paymentSources.some(p => p.id === initialData.paymentSourceId)) {
        updatedFormData.paymentSourceId = initialData.paymentSourceId;
      }
      
      if (initialData.totalAmount && initialData.paymentType === 'installment') {
        updatedFormData.totalAmount = initialData.totalAmount;
      }
      
      if (initialData.numberOfInstallments && initialData.paymentType === 'installment') {
        updatedFormData.numberOfInstallments = initialData.numberOfInstallments;
      }
      
      setFormData(updatedFormData);
      
      console.log("ExpenseForm initialized with URL parameters:", initialData);
    }
  }, [initialData, categories, paymentSources, editId]);
  
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

  // Effect to log initial data for debugging
  useEffect(() => {
    console.log("ExpenseForm initialized with user:", user?.id);
    console.log("Available categories:", categories);
    console.log("Available payment sources:", paymentSources);
    console.log("Initial form data:", formData);
  }, []);
  
  // Effect to update form data when categories or payment sources change
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
      console.log("Updated form with first category:", categories[0].id);
    }
    
    if (paymentSources.length > 0 && !formData.paymentSourceId) {
      setFormData(prev => ({ ...prev, paymentSourceId: paymentSources[0].id }));
      console.log("Updated form with first payment source:", paymentSources[0].id);
    }
  }, [categories, paymentSources, formData.categoryId, formData.paymentSourceId]);
  
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
    console.log("Validating form data:", formData);
    console.log("User authenticated:", !!user);
    
    if (!user) {
      toast({
        title: "שגיאת אימות",
        description: "יש להתחבר למערכת כדי להוסיף הוצאה",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.date || ((formData.paymentType === "installment" || formData.paymentType === "recurring") && !formData.startDate)) {
      toast({
        title: "שגיאה",
        description: "יש להזין תאריך",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate category exists
    if (!formData.categoryId) {
      toast({
        title: "שגיאה",
        description: "יש לבחור קטגוריה",
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.categoryId && categories.length > 0) {
      const categoryExists = categories.some(c => c.id === formData.categoryId);
      console.log("Category validation:", { categoryId: formData.categoryId, exists: categoryExists, categories: categories.map(c => c.id) });
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
    if (!formData.paymentSourceId) {
      toast({
        title: "שגיאה",
        description: "יש לבחור אמצעי תשלום",
        variant: "destructive",
      });
      return false;
    }
    
    if (formData.paymentSourceId && paymentSources.length > 0) {
      const sourceExists = paymentSources.some(s => s.id === formData.paymentSourceId);
      console.log("Payment source validation:", { sourceId: formData.paymentSourceId, exists: sourceExists, sources: paymentSources.map(s => s.id) });
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
        // Fixed: Properly await the Promise returned by handleSingleExpense
        const expense = await handleSingleExpense(formData, editId);
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
      
      // Enhanced error handling with detailed logging
      let errorMessage = "אירעה שגיאה בעת שמירת ההוצאה";
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        // Show more detailed error in development or for specific errors
        errorMessage = error.message;
        
        // Handle Supabase-specific errors
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const supabaseError = error as { code: string; message: string; details?: string };
          console.error("Supabase error code:", supabaseError.code);
          console.error("Supabase error message:", supabaseError.message);
          console.error("Supabase error details:", supabaseError.details);
          
          if (supabaseError.code === '42501') {
            errorMessage = "אין לך הרשאות מתאימות לבצע פעולה זו";
          } else if (supabaseError.code === '23505') {
            errorMessage = "רשומה עם מזהה זהה כבר קיימת במערכת";
          } else if (supabaseError.code === '23503') {
            errorMessage = "הפנייה לקטגוריה או לאמצעי תשלום שאינם קיימים במערכת";
          } else if (supabaseError.message && supabaseError.message.includes('auth')) {
            errorMessage = "בעיית אימות - נא להתחבר מחדש";
          }
        }
      } else {
        console.error("Unknown error type:", error);
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
