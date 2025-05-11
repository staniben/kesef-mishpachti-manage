
import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase, checkRlsAccess, refreshSessionIfNeeded, forceRefreshData } from "@/integrations/supabase/client";

export function StoreInitializer() {
  const { toast } = useToast();
  const { user, session, isAuthenticated } = useAuth();
  const { 
    fetchExpenses, 
    fetchCategories, 
    fetchPaymentSources, 
    setStoreDataStatus
  } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Create a memoized version of the initialization logic
  const initializeStore = useCallback(async (forceRefresh = false) => {
    if (isInitializing) return; // Prevent concurrent initialization
    
    try {
      setIsInitializing(true);
      
      if (!isAuthenticated || !user || !session) {
        console.log("Skipping store initialization: No authenticated user");
        return;
      }
      
      console.log(`[${new Date().toISOString()}] Initializing store with user:`, user.id);
      
      // Update store to indicate loading is happening
      setStoreDataStatus('loading');
      
      // Ensure token is fresh before proceeding
      const isSessionValid = await refreshSessionIfNeeded();
      if (!isSessionValid) {
        toast({
          title: "בעיית אימות",
          description: "יש בעיה עם תוקף האימות, נא להתחבר מחדש",
          variant: "destructive",
        });
        setStoreDataStatus('error');
        return;
      }
      
      // If forceRefresh is true, clear any cached data
      if (forceRefresh) {
        await forceRefreshData();
      }
      
      // Parallel data loading to improve performance
      console.log(`[${new Date().toISOString()}] Starting parallel data fetching...`);
      
      try {
        await Promise.all([
          fetchCategories(),
          fetchPaymentSources(),
          fetchExpenses()
        ]);
        console.log(`[${new Date().toISOString()}] Parallel data loading complete!`);
        
        // Update store status
        setStoreDataStatus('ready');
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in parallel data loading:`, error);
        
        // Fall back to sequential loading if parallel loading fails
        console.log(`[${new Date().toISOString()}] Falling back to sequential loading...`);
        
        // Sequential data loading with timing and retries
        // 1. First load categories
        console.log(`[${new Date().toISOString()}] Fetching categories...`);
        const categoriesStart = performance.now();
        try {
          await fetchCategories();
          console.log(`Categories loaded in ${(performance.now() - categoriesStart).toFixed(2)}ms`);
        } catch (error) {
          console.error("Failed to load categories, retrying once:", error);
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            await fetchCategories();
          } catch (retryError) {
            console.error("Second attempt to load categories failed:", retryError);
          }
        }
        
        // 2. Then load payment sources
        console.log(`[${new Date().toISOString()}] Fetching payment sources...`);
        const sourcesStart = performance.now();
        try {
          await fetchPaymentSources();
          console.log(`Payment sources loaded in ${(performance.now() - sourcesStart).toFixed(2)}ms`);
        } catch (error) {
          console.error("Failed to load payment sources, retrying once:", error);
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            await fetchPaymentSources();
          } catch (retryError) {
            console.error("Second attempt to load payment sources failed:", retryError);
          }
        }
        
        // 3. Finally load expenses
        console.log(`[${new Date().toISOString()}] Fetching expenses...`);
        const expensesStart = performance.now();
        try {
          await fetchExpenses();
          console.log(`Expenses loaded in ${(performance.now() - expensesStart).toFixed(2)}ms`);
        } catch (error) {
          console.error("Failed to load expenses, retrying once:", error);
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            await fetchExpenses();
          } catch (retryError) {
            console.error("Second attempt to load expenses failed:", retryError);
          }
        }
        
        // Update store status
        setStoreDataStatus('ready');
      }
      
      // All data loaded successfully
      setIsInitialized(true);
      console.log(`[${new Date().toISOString()}] Store initialization complete!`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error initializing store:`, error);
      setInitializationAttempts(prev => prev + 1);
      
      // Update store status
      setStoreDataStatus('error');
      
      let errorMessage = "אירעה שגיאה בטעינת הנתונים, נא לרענן את הדף";
      if (error instanceof Error) {
        if (error.message.includes("JWT") || error.message.includes("auth")) {
          errorMessage = "אירעה שגיאה באימות המשתמש, נא להתחבר מחדש";
        } else if (error.message.includes("policy")) {
          errorMessage = "שגיאת הרשאות: אין גישה לנתונים. נא להתחבר מחדש";
        }
      }
      
      if (initializationAttempts >= 2) {
        errorMessage += ` (ניסיון ${initializationAttempts + 1})`;
      }
      
      toast({
        title: "שגיאה בטעינת נתונים",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [fetchCategories, fetchPaymentSources, fetchExpenses, toast, user, session, isAuthenticated, initializationAttempts, isInitializing, setStoreDataStatus]);
  
  // Initialize store when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && session && !isInitialized && !isInitializing) {
      console.log(`[${new Date().toISOString()}] Auth state detected, initializing store...`);
      initializeStore();
    }
  }, [isAuthenticated, user, session, isInitialized, isInitializing, initializeStore]);
  
  // Set up a visibility change listener to re-fetch data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && isInitialized) {
        console.log("Document became visible, refreshing data...");
        initializeStore(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, isInitialized, initializeStore]);
  
  // This is a null component that just initializes the store
  return null;
}
