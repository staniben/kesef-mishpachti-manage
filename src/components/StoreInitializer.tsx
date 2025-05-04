
import { useEffect } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

export function StoreInitializer() {
  const { toast } = useToast();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  
  // Initialize store with data from services
  useEffect(() => {
    const initializeStore = async () => {
      try {
        await Promise.all([
          fetchCategories(),
          fetchPaymentSources(),
          fetchExpenses()
        ]);
      } catch (error) {
        toast({
          title: "שגיאה בטעינת נתונים",
          description: "אירעה שגיאה בטעינת הנתונים, נא לרענן את הדף",
          variant: "destructive",
        });
        console.error("Error initializing store:", error);
      }
    };
    
    initializeStore();
  }, [fetchCategories, fetchPaymentSources, fetchExpenses, toast]);
  
  // This is a null component that just initializes the store
  return null;
}
