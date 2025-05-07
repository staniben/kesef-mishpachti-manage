
import { ExpenseFormData } from "./expenseFormTypes";
import { ExpenseCategory, PaymentSource } from "@/types/models";
import { useToast } from "@/hooks/use-toast";

export type ValidationToast = ReturnType<typeof useToast>['toast'];

export function useFormValidation(
  categories: ExpenseCategory[],
  paymentSources: PaymentSource[],
  toast: ValidationToast
) {
  const validateAndPrepare = (formData: ExpenseFormData): boolean => {
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

  return { validateAndPrepare };
}
