
import { PaymentType } from "@/types";

export interface ExpenseFormData {
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
}
