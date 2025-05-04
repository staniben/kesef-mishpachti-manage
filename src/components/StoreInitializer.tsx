
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export function StoreInitializer() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Initialize store with data from services
  useEffect(() => {
    // Only attempt to initialize when we have a definitive auth state
    // This prevents trying to load when auth is still determining state
    if (isFirstLoad) {
      console.log("First load, checking auth state...");
      console.log("Auth state:", { user: !!user, session: !!session });
      setIsFirstLoad(false);
    }
    
    if (!user || !session) {
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
        
        // Get detailed error information
        let errorMessage = "אירעה שגיאה בטעינת הנתונים, נא לרענן את הדף";
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          
          if (error.message.includes("JWT") || error.message.includes("auth")) {
            errorMessage = "אירעה שגיאה באימות המשתמש, נא להתחבר מחדש";
          } else if (error.message.includes("policy")) {
            errorMessage = "שגיאת הרשאות: אין גישה לנתונים. נא להתחבר מחדש";
            console.error("Possible RLS policy violation");
          }
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
  }, [fetchCategories, fetchPaymentSources, fetchExpenses, toast, user, session, isInitialized]);
  
  // This is a null component that just initializes the store
  return null;
}
