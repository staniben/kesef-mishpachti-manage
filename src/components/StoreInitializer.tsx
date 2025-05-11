
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase, checkRlsAccess } from "@/integrations/supabase/client";

export function StoreInitializer() {
  const { toast } = useToast();
  const { user, session, isAuthenticated } = useAuth();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Enhanced debugging information for RLS and authentication issues
  const logAuthDebugInfo = (userId: string | undefined, sessionObj: any) => {
    console.log("==== AUTH DEBUG INFO ====");
    console.log(`User authenticated: ${!!userId}`);
    console.log(`User ID: ${userId || 'MISSING'}`);
    console.log(`Session present: ${!!sessionObj}`);
    console.log(`Access token present: ${sessionObj?.access_token ? 'Yes' : 'No'}`);
    
    if (sessionObj) {
      const expiresAt = sessionObj.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const expiresInSeconds = expiresAt - now;
      const expiresInMinutes = Math.floor(expiresInSeconds / 60);
      
      console.log(`Session expires in: ${expiresInMinutes} minutes (${expiresInSeconds} seconds)`);
      console.log(`Session expiry timestamp: ${new Date(expiresAt * 1000).toISOString()}`);
      console.log(`Current time: ${new Date().toISOString()}`);
      
      if (expiresInMinutes < 10) {
        console.warn("⚠️ WARNING: Session expires soon! This may cause data loading issues.");
      }
    }
    console.log("========================");
  };
  
  // Initialize store with data from services
  useEffect(() => {
    // Only attempt to initialize when we have a definitive auth state
    if (isFirstLoad) {
      console.log("First load, checking auth state...");
      console.log("Auth state:", { user: !!user, session: !!session, isAuthenticated });
      setIsFirstLoad(false);
      
      if (user && session) {
        logAuthDebugInfo(user.id, session);
      }
    }
    
    if (!isAuthenticated || !user || !session) {
      console.log("Skipping store initialization: No authenticated user");
      return;
    }
    
    if (isInitialized) {
      console.log("Store already initialized, skipping");
      return;
    }

    const initializeStore = async () => {
      try {
        console.log(`[${new Date().toISOString()}] Initializing store with user:`, user.id);
        
        // Log detailed auth information
        logAuthDebugInfo(user.id, session);
        
        // Ensure supabase client has correct auth token before proceeding
        if (!session?.access_token) {
          throw new Error("No access token available for authenticated requests");
        }
        
        // Test RLS access comprehensively before attempting data fetch
        console.log("Testing RLS access...");
        const rlsStatus = await checkRlsAccess();
        console.log("RLS access check result:", rlsStatus);
        
        if (!rlsStatus.success) {
          console.error("⚠️ RLS access check failed:", rlsStatus.message);
          console.error("This might cause data loading issues.");
          // Don't throw error here - try to load data anyway
        }
        
        // Use a sequential loading approach with timing for debugging
        // 1. First load categories
        console.log(`[${new Date().toISOString()}] Fetching categories...`);
        const categoriesStart = performance.now();
        await fetchCategories();
        console.log(`Categories loaded in ${(performance.now() - categoriesStart).toFixed(2)}ms`);
        
        // 2. Then load payment sources
        console.log(`[${new Date().toISOString()}] Fetching payment sources...`);
        const sourcesStart = performance.now();
        await fetchPaymentSources();
        console.log(`Payment sources loaded in ${(performance.now() - sourcesStart).toFixed(2)}ms`);
        
        // 3. Finally load expenses which might reference categories and payment sources
        console.log(`[${new Date().toISOString()}] Fetching expenses...`);
        const expensesStart = performance.now();
        await fetchExpenses();
        console.log(`Expenses loaded in ${(performance.now() - expensesStart).toFixed(2)}ms`);
        
        // All data loaded successfully
        setIsInitialized(true);
        console.log(`[${new Date().toISOString()}] Store initialization complete!`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error initializing store:`, error);
        
        // Track initialization attempts
        setInitializationAttempts(prev => prev + 1);
        
        // Get detailed error information
        let errorMessage = "אירעה שגיאה בטעינת הנתונים, נא לרענן את הדף";
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          console.error("Error stack:", error.stack);
          
          if (error.message.includes("JWT") || error.message.includes("auth")) {
            errorMessage = "אירעה שגיאה באימות המשתמש, נא להתחבר מחדש";
            
            // Additional debugging for auth errors
            logAuthDebugInfo(user?.id, session);
          } else if (error.message.includes("policy")) {
            errorMessage = "שגיאת הרשאות: אין גישה לנתונים. נא להתחבר מחדש";
            console.error("Possible RLS policy violation");
          }
        }
        
        // After multiple failed attempts, show a more detailed error and suggest actions
        if (initializationAttempts >= 2) {
          errorMessage += ` (ניסיון ${initializationAttempts + 1})`;
          
          if (initializationAttempts === 2) {
            errorMessage += " - נא לנסות להתחבר מחדש";
          } else if (initializationAttempts >= 3) {
            errorMessage += " - נא לנסות לנקות את המטמון (cache) ולהתחבר מחדש";
          }
        }
        
        // Show toast with error information
        toast({
          title: "שגיאה בטעינת נתונים",
          description: errorMessage,
          variant: "destructive",
        });
        
        // If we're having persistent auth issues after 3 attempts, force a sign-out
        if (initializationAttempts >= 3 && 
            error instanceof Error && 
            (error.message.includes("JWT") || error.message.includes("auth"))) {
          console.warn("Multiple auth failures detected, attempting to sign out and clear session");
          // Don't actually force sign-out as it might confuse the user
          // Just add a hint to do so
          toast({
            title: "בעיית אימות",
            description: "מומלץ להתנתק מהמערכת ולהתחבר מחדש",
            variant: "destructive",
          });
        }
      }
    };
    
    console.log(`[${new Date().toISOString()}] Attempting to initialize store...`);
    initializeStore();
  }, [fetchCategories, fetchPaymentSources, fetchExpenses, toast, user, session, isAuthenticated, isInitialized, initializationAttempts]);
  
  // This is a null component that just initializes the store
  return null;
}
