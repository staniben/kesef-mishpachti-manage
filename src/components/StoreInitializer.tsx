
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { checkRlsAccess } from "@/integrations/supabase/client";
import { TableName } from "@/types/supabase";
import { checkUserAccess } from "@/utils/rls/rlsTestUtils";

export function StoreInitializer() {
  const { toast } = useToast();
  const { user, session, isAuthenticated } = useAuth();
  const { fetchExpenses, fetchCategories, fetchPaymentSources } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  // Enhanced debug function to check RLS access
  const checkDetailedRlsAccess = async () => {
    if (!user) return;
    
    try {
      // First use the built-in utility
      const rlsCheckResult = await checkRlsAccess();
      console.log("Basic RLS check result:", rlsCheckResult);
      
      if (!rlsCheckResult.success) {
        console.error("❗ Basic RLS check failed! This is likely preventing data access.");
        toast({
          title: "שגיאת הרשאות RLS",
          description: "בדיקת הרשאות RLS נכשלה. יתכן שלא יהיה ניתן לגשת לנתונים.",
          variant: "destructive",
        });
      }
      
      // Test each table individually with detailed logging
      const tables: TableName[] = ['categories', 'expenses', 'payment_sources', 'profiles'];
      
      for (const table of tables) {
        console.log(`Testing RLS access for table: ${table}...`);
        
        // Test count access
        const countResult = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        const countError = countResult.error;
        const count = countResult.count;
          
        if (countError) {
          console.error(`❌ RLS check for ${table} count failed:`, countError);
          console.error(`  - Code: ${countError.code}`);
          console.error(`  - Message: ${countError.message}`);
          console.error(`  - Details: ${countError.details}`);
          console.error(`  - Hint: ${countError.hint}`);
        } else {
          console.log(`✅ RLS check for ${table} passed! Found ${count} records`);
          
          // If count > 0, try to fetch one record to verify full access
          if (count && count > 0) {
            const { data, error: fetchError } = await supabase
              .from(table)
              .select('*')
              .eq('user_id', user.id)
              .limit(1)
              .single();
              
            if (fetchError) {
              console.error(`❌ RLS check for ${table} data fetch failed:`, fetchError);
            } else {
              console.log(`✅ Successfully fetched a record from ${table}:`, data);
            }
          }
        }
      }
      
      // Check if auth.uid() matches frontend user.id
      const { data: authData, error: authError } = await supabase
        .rpc('get_auth_uid');
        
      if (authError) {
        console.error("❌ Failed to get auth.uid():", authError);
      } else {
        console.log("Current auth.uid():", authData);
        console.log("Stored user.id:", user.id);
        console.log("Do they match?", authData === user.id);
        
        if (authData !== user.id) {
          console.error("⚠️ CRITICAL ERROR: auth.uid() does not match user.id in frontend!");
          toast({
            title: "שגיאת זהות משתמש",
            description: "התגלתה אי התאמה בין זהויות המשתמש. בדוק את יומן הלקוח לפרטים נוספים.",
            variant: "destructive",
          });
        }
      }
    } catch (e) {
      console.error("Error in detailed RLS access check:", e);
    }
  };
  
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
        
        // Check RLS access before attempting to fetch data
        await checkDetailedRlsAccess();
        
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
