
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Expense, PaymentType, RecurrenceType } from "@/types";
import { format } from "date-fns";
import { addMonths } from "date-fns";
import { createBaseExpense } from "@/utils/expenseUtils";
import { v4 as uuidv4 } from 'uuid';

export function useExpenseForm(editId?: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories, paymentSources, expenses, addExpense, updateExpense, addMultipleExpenses } = useAppContext();
  
  const [formData, setFormData] = useState<{
    id: string;
    amount: string;
    date: Date | undefined;
    time: string;
    name: string;
    categoryId: string;
    paymentSourceId: string;
    paymentType: PaymentType;
    // For installment payments
    totalAmount: string;
    numberOfInstallments: string;
    startDate: Date | undefined;
  }>({
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
  
  const handleSubmit = (e: React.FormEvent) => {
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
        handleInstallmentExpense();
      } else if (formData.paymentType === "recurring") {
        handleRecurringExpense();
      } else {
        handleSingleExpense();
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

  const handleSingleExpense = () => {
    const totalAmount = parseFloat(formData.amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("יש להזין סכום חיובי");
    }
    
    // Create the expense object
    const expense: Expense = createBaseExpense(
      editId,
      totalAmount,
      formData.date!,
      formData.time,
      formData.name,
      formData.categoryId,
      formData.paymentSourceId,
      formData.paymentType
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
  };

  const handleInstallmentExpense = () => {
    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error("יש להזין סכום חיובי");
    }
    
    const installments = parseInt(formData.numberOfInstallments, 10);
    if (isNaN(installments) || installments < 2) {
      throw new Error("יש להזין לפחות 2 תשלומים");
    }

    if (!formData.startDate) {
      throw new Error("יש להזין תאריך התחלה");
    }
    
    // Calculate monthly amount
    const monthlyAmount = totalAmount / installments;
    
    // Create multiple expenses for each installment
    const installmentExpenses: Expense[] = [];
    
    for (let i = 0; i < installments; i++) {
      const installmentDate = addMonths(formData.startDate, i);
      const formattedDate = format(installmentDate, "yyyy-MM-dd");
      
      const expense: Expense = {
        id: new Date().getTime().toString() + "-" + i, // Ensure unique IDs for each installment
        amount: monthlyAmount,
        date: formattedDate,
        time: formData.time,
        name: `${formData.name} (${i+1}/${installments})`,
        categoryId: formData.categoryId,
        paymentSourceId: formData.paymentSourceId,
        paymentType: "installment",
        installmentNumber: i + 1,
        totalInstallments: installments,
        isInstallment: true,
      };
      
      installmentExpenses.push(expense);
    }
    
    // Add all installment expenses
    addMultipleExpenses(installmentExpenses);
    
    toast({
      title: "התשלומים נוספו",
      description: `נוספו ${installments} תשלומים בהצלחה`,
    });
  };

  const handleRecurringExpense = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("יש להזין סכום חיובי");
    }

    if (!formData.startDate) {
      throw new Error("יש להזין תאריך התחלה");
    }
    
    // Generate a unique recurrence ID
    const recurrenceId = uuidv4();
    const recurrenceType: RecurrenceType = "monthly";
    
    // Create 12 monthly recurring expenses
    const recurringExpenses: Expense[] = [];
    
    for (let i = 0; i < 12; i++) {
      const recurringDate = addMonths(formData.startDate, i);
      const formattedDate = format(recurringDate, "yyyy-MM-dd");
      
      const expense: Expense = {
        id: new Date().getTime().toString() + "-recurring-" + i, // Ensure unique IDs
        amount: amount,
        date: formattedDate,
        time: formData.time,
        name: formData.name,
        categoryId: formData.categoryId,
        paymentSourceId: formData.paymentSourceId,
        paymentType: "recurring",
        isRecurring: true,
        recurrenceId: recurrenceId,
        recurrenceType: recurrenceType
      };
      
      recurringExpenses.push(expense);
    }
    
    // Add all recurring expenses
    addMultipleExpenses(recurringExpenses);
    
    toast({
      title: "התשלומים הקבועים נוספו",
      description: "נוספו 12 תשלומים קבועים בהצלחה",
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
