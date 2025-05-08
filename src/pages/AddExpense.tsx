
import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAppStore } from "@/store";
import { Loader2 } from "lucide-react";

export default function AddExpense() {
  const { categories, paymentSources, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Ensure categories and payment sources are loaded
        if (categories.length === 0) {
          await fetchCategories();
        }
        if (paymentSources.length === 0) {
          await fetchPaymentSources();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categories.length, paymentSources.length, fetchCategories, fetchPaymentSources]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ExpenseForm />
    </div>
  );
}
