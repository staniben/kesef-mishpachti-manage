
import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAppStore } from "@/store";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { checkRlsAccess } from "@/integrations/supabase/client";

export default function AddExpense() {
  const { categories, paymentSources, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [rlsStatus, setRlsStatus] = useState<string>('checking');

  // Check RLS policies on component mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setRlsStatus('no-user');
        return;
      }
      
      try {
        const result = await checkRlsAccess();
        if (result.success) {
          if (result.match) {
            setRlsStatus('ok');
          } else {
            setRlsStatus('mismatch');
          }
          console.log("RLS access check result:", result);
        } else {
          setRlsStatus('failed');
          console.error("RLS access check failed:", result.error);
        }
      } catch (error) {
        setRlsStatus('error');
        console.error("Error checking RLS access:", error);
      }
    };
    
    checkAccess();
  }, [user]);

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
      
      {rlsStatus !== 'ok' && (
        <Alert variant="warning" className="bg-amber-50 border-amber-400">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription>
            {rlsStatus === 'checking' && 'בודק הרשאות גישה...'}
            {rlsStatus === 'no-user' && 'יש להתחבר למערכת כדי לבדוק הרשאות'}
            {rlsStatus === 'mismatch' && 'זוהה חוסר התאמה בין זיהוי המשתמש למערכת ההרשאות'}
            {rlsStatus === 'failed' && 'בדיקת הרשאות נכשלה - ייתכן שאין מדיניויות RLS מוגדרות'}
            {rlsStatus === 'error' && 'אירעה שגיאה בבדיקת הרשאות'}
          </AlertDescription>
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
