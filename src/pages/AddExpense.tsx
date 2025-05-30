import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { useAppStore } from "@/store";
import { Loader2, AlertTriangle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkRlsAccess } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { PaymentType } from "@/types";

export default function AddExpense() {
  const { categories, paymentSources, fetchCategories, fetchPaymentSources, refreshAllData, dataStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [rlsStatus, setRlsStatus] = useState<string>('checking');
  const [rlsDetails, setRlsDetails] = useState<any>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Extract query parameters for pre-filling the form
  const initialFormData = {
    paymentType: searchParams.get("type") as PaymentType || undefined,
    name: searchParams.get("name") || undefined,
    amount: searchParams.get("amount") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
    paymentSourceId: searchParams.get("paymentSourceId") || undefined,
    totalAmount: searchParams.get("totalAmount") || undefined,
    numberOfInstallments: searchParams.get("numberOfInstallments") || undefined,
  };

  // Check RLS policies on component mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setRlsStatus('no-user');
        return;
      }
      
      try {
        console.log("AddExpense: Starting detailed RLS access check...");
        const result = await checkRlsAccess();
        setRlsDetails(result);
        
        console.log("AddExpense: RLS check complete with result:", result);
        
        if (result.success) {
          if (result.match) {
            setRlsStatus('ok');
            console.log("AddExpense: RLS check passed with matching IDs");
          } else {
            setRlsStatus('mismatch');
            console.warn("AddExpense: RLS check found ID mismatch:", result.auth_uid, "vs", result.user_id);
          }
        } else {
          // Detect which specific issue occurred
          if (!result.all_tables_accessible) {
            setRlsStatus('tables-inaccessible');
            console.error("AddExpense: One or more tables are inaccessible");
          } else if (!result.auth_uid_working) {
            setRlsStatus('auth-uid-failed');
            console.error("AddExpense: auth.uid() function not working");
          } else if (!result.insert_working) {
            setRlsStatus('insert-failed');
            console.error("AddExpense: Insert test failed");
          } else {
            setRlsStatus('failed');
            console.error("AddExpense: General RLS check failure");
          }
        }
      } catch (error) {
        console.error("AddExpense: Error checking RLS access:", error);
        setRlsStatus('error');
        setRlsDetails({ error });
      }
    };
    
    checkAccess();
  }, [user]);

  // Data loading effect with retry logic
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) {
        console.warn("AddExpense: User not authenticated");
        setError("יש להתחבר למערכת כדי להוסיף הוצאה");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("AddExpense: Loading data with user:", user?.id);
        console.log("AddExpense: User authenticated:", isAuthenticated);
        console.log("AddExpense: Current data status:", dataStatus);
        
        // If data is already loading from elsewhere, wait for it
        if (dataStatus === 'loading') {
          console.log("AddExpense: Data is already loading, waiting...");
          
          // Wait a bit to see if data finishes loading
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if data is still loading
          if (dataStatus === 'loading' && retryCount < 5) {
            setRetryCount(prevCount => prevCount + 1);
            return; // Exit and let next effect iteration handle retry
          }
        }
        
        // Ensure categories and payment sources are loaded
        if (categories.length === 0 || paymentSources.length === 0) {
          console.log(`AddExpense: Missing data. Categories: ${categories.length}, Payment sources: ${paymentSources.length}`);
          
          // Force refresh all data
          console.log("AddExpense: Forcing data refresh...");
          await refreshAllData();
          
          console.log(`AddExpense: After refresh - Categories: ${categories.length}, Payment sources: ${paymentSources.length}`);
        }
        
        if (categories.length === 0) {
          console.warn("AddExpense: Still no categories after fetch");
          setError("לא נמצאו קטגוריות. אנא צור קטגוריות לפני הוספת הוצאה");
        }
        
        if (paymentSources.length === 0) {
          console.warn("AddExpense: Still no payment sources after fetch");
          setError("לא נמצאו אמצעי תשלום. אנא צור אמצעי תשלום לפני הוספת הוצאה");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("אירעה שגיאה בטעינת הנתונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categories.length, paymentSources.length, fetchCategories, fetchPaymentSources, refreshAllData, user, isAuthenticated, dataStatus, retryCount]);

  // Force retry data loading if retryCount changes
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 5) {
      const timer = setTimeout(() => {
        console.log(`AddExpense: Data retry attempt ${retryCount}...`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  // Add handler to retry RLS check
  const handleRetryRlsCheck = async () => {
    setRlsStatus('checking');
    
    try {
      toast({
        title: "בדיקה מחדש",
        description: "מבצע בדיקת הרשאות מחדש...",
      });
      
      const result = await checkRlsAccess();
      setRlsDetails(result);
      
      if (result.success) {
        if (result.match) {
          setRlsStatus('ok');
          toast({
            title: "בדיקה הסתיימה בהצלחה",
            description: "הרשאות הגישה תקינות",
            variant: "default",
          });
        } else {
          setRlsStatus('mismatch');
          toast({
            title: "אי התאמה",
            description: "זוהה חוסר התאמה בין זיהוי המשתמש למערכת ההרשאות",
            variant: "destructive",
          });
        }
      } else {
        setRlsStatus('failed');
        toast({
          title: "בדיקה נכשלה",
          description: "הרשאות הגישה אינן תקינות",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error retrying RLS check:", error);
      setRlsStatus('error');
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בבדיקת הרשאות הגישה",
        variant: "destructive",
      });
    }
  };

  // Add handler to retry data loading
  const handleRetryDataLoading = async () => {
    setIsLoading(true);
    setError(null);
    try {
      toast({
        title: "מרענן נתונים",
        description: "מנסה לטעון נתונים מחדש...",
      });
      
      await refreshAllData();
      
      if (categories.length === 0) {
        setError("לא נמצאו קטגוריות. אנא צור קטגוריות לפני הוספת הוצאה");
      }
      
      if (paymentSources.length === 0) {
        setError("לא נמצאו אמצעי תשלום. אנא צור אמצעי תשלום לפני הוספת הוצאה");
      }
      
      if (categories.length > 0 && paymentSources.length > 0) {
        toast({
          title: "רענון הצליח",
          description: "הנתונים נטענו בהצלחה",
        });
      }
    } catch (error) {
      console.error("Error retrying data load:", error);
      setError("אירעה שגיאה בטעינת הנתונים");
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הנתונים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען נתונים...</p>
          
          {retryCount > 2 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={handleRetryDataLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              נסה שוב
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>שגיאה</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetryDataLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              נסה שוב
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {rlsStatus === 'checking' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription>
            בודק הרשאות גישה...
          </AlertDescription>
        </Alert>
      )}
      
      {rlsStatus === 'no-user' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription>
            יש להתחבר למערכת כדי לבדוק הרשאות
          </AlertDescription>
        </Alert>
      )}
      
      {(rlsStatus === 'mismatch' || rlsStatus === 'auth-uid-failed') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>זוהה חוסר התאמה בין זיהוי המשתמש למערכת ההרשאות</p>
            {rlsDetails && (
              <div className="text-xs bg-muted/50 p-2 rounded">
                <div>Auth UID: {rlsDetails.auth_uid || 'לא זמין'}</div>
                <div>User ID: {rlsDetails.user_id || 'לא זמין'}</div>
              </div>
            )}
            <button 
              onClick={handleRetryRlsCheck} 
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded mt-2"
            >
              בדוק שוב
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {(rlsStatus === 'tables-inaccessible' || rlsStatus === 'insert-failed') && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>נמצאו בעיות בהרשאות גישה לטבלאות הנתונים</p>
            {rlsStatus === 'tables-inaccessible' && (
              <p className="text-xs">לא ניתן לגשת לחלק מהטבלאות במסד הנתונים</p>
            )}
            {rlsStatus === 'insert-failed' && (
              <p className="text-xs">לא ניתן להוסיף נתונים לטבלאות</p>
            )}
            <button 
              onClick={handleRetryRlsCheck} 
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded mt-2"
            >
              בדוק שוב
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {rlsStatus === 'failed' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>בדיקת הרשאות נכשלה - ייתכן שלא הוגדרו מדיניות RLS</p>
            {rlsDetails?.message && (
              <p className="text-xs">{rlsDetails.message}</p>
            )}
            <button 
              onClick={handleRetryRlsCheck} 
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded mt-2"
            >
              בדוק שוב
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {rlsStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>בדיקת מדיניות אבטחה (RLS)</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>אירעה שגיאה בבדיקת הרשאות</p>
            {rlsDetails?.error && (
              <div className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-20">
                {String(rlsDetails.error)}
              </div>
            )}
            <button 
              onClick={handleRetryRlsCheck} 
              className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded mt-2"
            >
              בדוק שוב
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {rlsStatus === 'ok' && (
        <Alert className="bg-green-50 border-green-400 text-green-700">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>הרשאות גישה תקינות</AlertTitle>
          <AlertDescription>
            מדיניות האבטחה (RLS) הוגדרה כראוי ותואמת למשתמש המחובר
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
          
          {(rlsStatus !== 'ok' && rlsStatus !== 'checking' && rlsStatus !== 'no-user') && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>מידע אבחון</AlertTitle>
              <AlertDescription>
                למרות חוסר ההתאמה בהרשאות, ניתן להמשיך ולצפות בטופס. ייתכן שפעולת השמירה לא תעבוד.
              </AlertDescription>
            </Alert>
          )}
          
          <ExpenseForm initialData={initialFormData} />
        </>
      )}
    </div>
  );
}
