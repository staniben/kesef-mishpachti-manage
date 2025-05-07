
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { checkDetailedRlsAccess, validateTokenExpiration } from "@/utils/store/accessChecker";

/**
 * Component that handles initializing the store with data from services
 */
export function StoreInitializer() {
  const { toast } = useToast();
  const { user, session, isAuthenticated } = useAuth();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Initialize store with data from services
  useEffect(() => {
    // Only attempt to initialize when we have a definitive auth state
    if (isFirstLoad) {
      console.log("First load, checking auth state...");
      console.log("Auth state:", { user: !!user, session: !!session, isAuthenticated });
      setIsFirstLoad(false);
    }
    
    if (!isAuthenticated || !user || !session) {
      console.log("Skipping store initialization: No authenticated user");
      return;
    }
    
    if (isInitialized) {
      console.log("Store already initialized");
      return;
    }

    const initializeStore = async () => {
      try {
        console.log("Initializing store with user:", user.id);
        console.log("Auth session present:", !!session);
        console.log("Session JWT:", session?.access_token ? "Present" : "Missing");
        
        // Validate token expiration
        const { valid, expiresInMinutes, warning } = validateTokenExpiration(session?.expires_at);
        console.log(`Token expires in ${expiresInMinutes} minutes`);
        
        if (warning) {
          console.warn(warning);
          toast({
            title: "שגיאת אימות",
            description: "פג תוקף האימות או שהוא יפוג בקרוב, יתכן שתתבקש להתחבר מחדש",
            variant: "warning",
          });
        }
        
        // Check RLS access before attempting to fetch data
        await checkDetailedRlsAccess(user, (message) => {
          toast({
            title: "שגיאת הרשאות RLS",
            description: "בדיקת הרשאות RLS נכשלה. יתכן שלא יהיה ניתן לגשת לנתונים.",
            variant: "destructive",
          });
        });
        
        // Load data through store actions
        await loadStoreData(fetchCategories, fetchPaymentSources, fetchExpenses, toast);
        
        setIsInitialized(true);
        console.log("Store initialization complete");
      } catch (error) {
        console.error("Error initializing store:", error);
        
        // Track initialization attempts
        setInitializationAttempts(prev => prev + 1);
        
        // Get detailed error information
        let errorMessage = "אירעה שגיאה בטעינת הנתונים, נא לרענן את הדף";
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          console.error("Error stack:", error.stack);
          
          if (error.message.includes("JWT") || error.message.includes("auth")) {
            errorMessage = "אירעה שגיאה באימות המשתמש, נא להתחבר מחדש";
          } else if (error.message.includes("policy")) {
            errorMessage = "שגיאת הרשאות: אין גישה לנתונים. נא להתחבר מחדש";
            console.error("Possible RLS policy violation");
          }
        }
        
        // After multiple failed attempts, show a more detailed error
        if (initializationAttempts >= 2) {
          errorMessage += " (ניסיון " + (initializationAttempts + 1) + ")";
        }
        
        toast({
          title: "שגיאה בטעינת נתונים",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };
    
    console.log("Attempting to initialize store...");
    initializeStore();
  }, [fetchCategories, fetchPaymentSources, fetchExpenses, toast, user, session, isAuthenticated, isInitialized, initializationAttempts]);
  
  // This is a null component that just initializes the store
  return null;
}

/**
 * Load all store data with error handling for each service
 */
async function loadStoreData(
  fetchCategories: () => Promise<void>,
  fetchPaymentSources: () => Promise<void>,
  fetchExpenses: () => Promise<void>,
  toast: any
) {
  // First load categories and payment sources with extra error handling
  console.log("Fetching categories...");
  try {
    await fetchCategories();
    console.log("Categories fetched successfully!");
  } catch (categoryError) {
    console.error("Error fetching categories:", categoryError);
    toast({
      title: "שגיאה בטעינת קטגוריות",
      description: categoryError instanceof Error ? categoryError.message : "שגיאה לא ידועה",
      variant: "destructive",
    });
  }
  
  console.log("Fetching payment sources...");
  try {
    await fetchPaymentSources();
    console.log("Payment sources fetched successfully!");
  } catch (sourceError) {
    console.error("Error fetching payment sources:", sourceError);
    toast({
      title: "שגיאה בטעינת אמצעי תשלום",
      description: sourceError instanceof Error ? sourceError.message : "שגיאה לא ידועה",
      variant: "destructive",
    });
  }
  
  // Then load expenses
  console.log("Fetching expenses...");
  try {
    await fetchExpenses();
    console.log("Expenses fetched successfully!");
  } catch (expenseError) {
    console.error("Error fetching expenses:", expenseError);
    toast({
      title: "שגיאה בטעינת הוצאות",
      description: expenseError instanceof Error ? expenseError.message : "שגיאה לא ידועה",
      variant: "destructive",
    });
  }
}
