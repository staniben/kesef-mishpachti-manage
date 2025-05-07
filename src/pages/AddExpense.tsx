
import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useCategoryRlsChecker } from "@/utils/categoryRlsChecker";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AddExpense() {
  const { categories, fetchCategories } = useAppStore();
  const { toast } = useToast();
  const { diagnoseCategoryAccess, resetSession } = useCategoryRlsChecker();
  const [isRlsChecking, setIsRlsChecking] = useState(false);
  const [rlsDiagnostic, setRlsDiagnostic] = useState<any>(null);

  useEffect(() => {
    // Check if we have categories data
    if (categories.length === 0) {
      console.log("No categories found, attempting to fetch...");
      fetchCategories().catch(err => {
        console.error("Error fetching categories:", err);
      });
    } else {
      console.log("Categories loaded:", categories.length);
    }
  }, [categories, fetchCategories]);

  // Function to diagnose RLS issues
  const runRlsDiagnostic = async () => {
    setIsRlsChecking(true);
    try {
      const result = await diagnoseCategoryAccess();
      setRlsDiagnostic(result);
      console.log("RLS diagnostic result:", result);
      
      if (result.accessGranted) {
        toast({
          title: "בדיקת RLS הצליחה",
          description: `נמצאו ${result.categoriesCount} קטגוריות לפי מזהה המשתמש`,
        });
        
        // If diagnostic succeeded but we still have no categories, try fetching again
        if (categories.length === 0 && result.categoriesCount > 0) {
          fetchCategories();
        }
      } else {
        toast({
          title: "שגיאת RLS",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error running RLS diagnostic:", error);
    } finally {
      setIsRlsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {categories.length === 0 ? (
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle size={18} />
            <p className="text-center">שגיאה בטעינת קטגוריות</p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            לא הצלחנו לטעון את הקטגוריות, יתכן שיש בעיה בהרשאות RLS. 
            נא לבדוק את ההרשאות או לנסות לטעון מחדש.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => fetchCategories()} 
              className="w-full bg-primary"
              disabled={isRlsChecking}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRlsChecking ? 'animate-spin' : ''}`} />
              טען קטגוריות שוב
            </Button>
            
            <Button
              onClick={runRlsDiagnostic}
              variant="outline"
              className="w-full"
              disabled={isRlsChecking}
            >
              בדוק הרשאות RLS
            </Button>
            
            {rlsDiagnostic && !rlsDiagnostic.accessGranted && (
              <Button
                onClick={resetSession}
                variant="destructive"
                className="w-full mt-2"
              >
                אפס הפעלה ונסה שוב
              </Button>
            )}
          </div>
          
          {rlsDiagnostic && (
            <div className="text-xs p-2 border rounded bg-muted">
              <p><strong>אבחון RLS:</strong></p>
              <p>מאומת: {rlsDiagnostic.authenticated ? 'כן' : 'לא'}</p>
              <p>גישה: {rlsDiagnostic.accessGranted ? 'מורשה' : 'נדחה'}</p>
              {rlsDiagnostic.userId && <p>מזהה משתמש: {rlsDiagnostic.userId}</p>}
              {rlsDiagnostic.authUid && <p>מזהה אימות: {rlsDiagnostic.authUid}</p>}
              <p className="text-wrap break-all">הודעה: {rlsDiagnostic.message}</p>
            </div>
          )}
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
