
import { useEffect } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AddExpense() {
  const { categories, fetchCategories } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have categories data
    if (categories.length === 0) {
      console.log("No categories found, attempting to fetch...");
      
      // Debug: Test RLS access
      const checkAccess = async () => {
        try {
          // Test direct database access
          const { data, error } = await supabase
            .from('categories')
            .select('count(*)', { count: 'exact', head: true });
            
          if (error) {
            console.error("RLS check failed:", error);
            toast({
              title: "שגיאה בטעינת קטגוריות",
              description: "בדיקת RLS נכשלה: " + error.message,
              variant: "destructive",
            });
          } else {
            console.log("RLS check passed, count:", data);
            
            // If no categories, try fetching them again
            if (categories.length === 0) {
              console.log("Manually fetching categories...");
              fetchCategories().catch(err => {
                console.error("Error fetching categories:", err);
                toast({
                  title: "שגיאה בטעינת קטגוריות",
                  description: "אירעה שגיאה בטעינת הקטגוריות. נא לנסות שוב.",
                  variant: "destructive",
                });
              });
            }
          }
        } catch (error) {
          console.error("Error checking access:", error);
        }
      };
      
      checkAccess();
    } else {
      console.log("Categories loaded:", categories.length);
    }
  }, [categories, fetchCategories, toast]);

  return (
    <div className="space-y-6">
      {categories.length === 0 ? (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-center">טוען קטגוריות...</p>
          <button
            onClick={() => fetchCategories()}
            className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
          >
            טען קטגוריות שוב
          </button>
        </div>
      ) : (
        <div className="mb-4 p-2 bg-muted rounded text-xs">
          <p>נטענו {categories.length} קטגוריות</p>
        </div>
      )}
      
      <ExpenseForm />
    </div>
  );
}
