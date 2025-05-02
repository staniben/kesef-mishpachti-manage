
import { format } from "date-fns";
import { Expense, PaymentType } from "@/types";

/**
 * Creates a base expense object from form data
 */
export const createBaseExpense = (
  editId: string | undefined,
  amount: number,
  date: Date,
  time: string,
  name: string,
  categoryId: string,
  paymentSourceId: string,
  paymentType: PaymentType
): Expense => {
  return {
    id: editId || new Date().getTime().toString(),
    amount,
    date: format(date, "yyyy-MM-dd"),
    time,
    name,
    categoryId,
    paymentSourceId,
    paymentType,
  };
};
