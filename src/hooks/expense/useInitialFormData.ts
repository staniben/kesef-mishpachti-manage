
import { useState, useEffect } from "react";
import { Expense, ExpenseCategory, PaymentSource } from "@/types/models";
import { ExpenseFormData } from "./expenseFormTypes";
import { format } from "date-fns";

export function useInitialFormData(
  editId: string | undefined,
  expenses: Expense[],
  categories: ExpenseCategory[],
  paymentSources: PaymentSource[]
) {
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

  return { formData, setFormData };
}
