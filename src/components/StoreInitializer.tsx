
import { useEffect } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function StoreInitializer() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  
  // Initialize store with data from services
  useEffect(() => {
    if (!user) return;

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
  }, [fetchCategories, fetchPaymentSources, fetchExpenses, toast, user]);
  
  // This is a null component that just initializes the store
  return null;
}
