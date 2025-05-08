
import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAppStore } from "@/store";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function AddExpense() {
  const { categories, paymentSources, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("AddExpense: Loading data with user:", user?.id);
        console.log("AddExpense: User authenticated:", isAuthenticated);
        
        // Ensure categories and payment sources are loaded
        if (categories.length === 0) {
          console.log("AddExpense: No categories found, fetching...");
          await fetchCategories();
          console.log("AddExpense: Categories after fetch:", categories.length);
        }
        
        if (paymentSources.length === 0) {
          console.log("AddExpense: No payment sources found, fetching...");
          await fetchPaymentSources();
          console.log("AddExpense: Payment sources after fetch:", paymentSources.length);
        }
        
        if (categories.length === 0) {
          console.warn("AddExpense: Still no categories after fetch");
          setError("לא נמצאו קטגוריות. אנא צור קטגוריות לפני הוספת הוצאה");
        }
        
        if (paymentSources.length === 0) {
          console.warn("AddExpense: Still no payment sources after fetch");
          setError("לא נמצאו אמצעי תשלום. אנא צור אמצעי תשלום לפני הוספת הוצאה");
        }
        
        if (!isAuthenticated) {
          console.warn("AddExpense: User not authenticated");
          setError("יש להתחבר למערכת כדי להוסיף הוצאה");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("אירעה שגיאה בטעינת הנתונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categories.length, paymentSources.length, fetchCategories, fetchPaymentSources, user, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!error && (
        <>
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">פרטי משתמש:</div>
            <div className="text-xs bg-muted p-2 rounded">
              מזהה משתמש: {user?.id || 'לא מחובר'}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">קטגוריות זמינות: {categories.length}</div>
            <div className="text-sm text-muted-foreground mb-1">אמצעי תשלום זמינים: {paymentSources.length}</div>
          </div>
          
          <ExpenseForm />
        </>
      )}
    </div>
  );
}
