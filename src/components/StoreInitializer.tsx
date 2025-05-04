
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function StoreInitializer() {
  const { toast } = useToast();
  const { user, session, isAuthenticated } = useAuth();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Debug function to check RLS access
  const checkRlsAccess = async () => {
    if (!user) return;
    
    try {
      // Try a simple select query to check if RLS is allowing access
      console.log("Testing RLS for categories...");
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('count(*)', { count: 'exact', head: true });
      
      if (catError) {
        console.error("RLS check for categories failed:", catError);
      } else {
        console.log("RLS check for categories passed! Access granted.");
      }
      
      // Check if user_id is being properly recognized
      console.log("Testing auth.uid() in RLS...");
      const { data: authData, error: authError } = await supabase
        .rpc('get_auth_uid');
        
      if (authError) {
        console.error("Failed to get auth.uid():", authError);
      } else {
        console.log("Current auth.uid():", authData);
        console.log("Stored user.id:", user.id);
        console.log("Do they match?", authData === user.id);
        
        if (authData !== user.id) {
          console.error("⚠️ CRITICAL ERROR: auth.uid() does not match user.id in frontend!");
        }
      }
    } catch (e) {
      console.error("Error checking RLS access:", e);
    }
  };
  
  // Initialize store with data from services
  useEffect(() => {
    // Only attempt to initialize when we have a definitive auth state
    // This prevents trying to load when auth is still determining state
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
        
        // Ensure supabase client has correct auth token before proceeding
        if (!session?.access_token) {
          throw new Error("No access token available for authenticated requests");
        }
        
        // Check RLS access before attempting to fetch data
        await checkRlsAccess();
        
        // First load categories and payment sources
        console.log("Fetching categories...");
        await fetchCategories();
        
        console.log("Fetching payment sources...");
        await fetchPaymentSources();
        
        // Then load expenses which might reference them
        console.log("Fetching expenses...");
        await fetchExpenses();
        
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
        
        // Fix the type error - toast expects an object with specific properties
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
