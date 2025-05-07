
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to specifically diagnose and fix issues with categories RLS
 */
export const useCategoryRlsChecker = () => {
  const { toast } = useToast();

  /**
   * Diagnoses category access issues and attempts to fix them
   * @returns Diagnostic information about the categories access
   */
  const diagnoseCategoryAccess = async () => {
    try {
      // First, check if the user is authenticated
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData?.user) {
        toast({
          title: "שגיאת אימות",
          description: "המשתמש אינו מחובר. נא להתחבר תחילה.",
          variant: "destructive",
        });
        return {
          authenticated: false,
          accessGranted: false,
          categoriesCount: 0,
          userId: null,
          message: "User not authenticated"
        };
      }

      // Test if RLS allows access to the categories count
      const { count, error: countError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authData.user.id);

      if (countError) {
        console.error("Category count access denied by RLS:", countError);
        
        // Try to get current auth.uid for debugging
        const { data: authUid, error: authUidError } = await supabase
          .rpc('get_auth_uid');
          
        let authUidInfo = "Could not retrieve auth.uid";
        if (!authUidError && authUid) {
          authUidInfo = `auth.uid() = ${authUid}`;
          
          if (authUid !== authData.user.id) {
            toast({
              title: "שגיאת RLS",
              description: `אי התאמה בין זהות המשתמש: auth.uid (${authUid}) לא תואם user.id (${authData.user.id})`,
              variant: "destructive",
            });
          }
        }
        
        return {
          authenticated: true,
          accessGranted: false,
          categoriesCount: 0,
          userId: authData.user.id,
          authUid: authUid,
          message: `RLS denied access to categories: ${countError.message}. ${authUidInfo}`
        };
      }

      // Now try to fetch actual categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', authData.user.id);

      if (categoriesError) {
        console.error("Categories access denied by RLS:", categoriesError);
        
        return {
          authenticated: true,
          accessGranted: false,
          categoriesCount: count || 0,
          userId: authData.user.id,
          message: `RLS allowed count but denied data access: ${categoriesError.message}`
        };
      }

      // Success!
      console.log(`Successfully accessed ${categories?.length} categories`);
      
      return {
        authenticated: true,
        accessGranted: true,
        categoriesCount: categories?.length || 0,
        categories,
        userId: authData.user.id,
        message: "Categories RLS access successful"
      };
      
    } catch (error) {
      console.error("Error diagnosing category access:", error);
      
      toast({
        title: "שגיאה בבדיקת גישה",
        description: error instanceof Error ? error.message : "שגיאה בלתי צפויה",
        variant: "destructive",
      });
      
      return {
        authenticated: false,
        accessGranted: false,
        categoriesCount: 0,
        message: `Error during RLS diagnosis: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  };

  /**
   * Clear the Supabase auth session and reload to fix persisted RLS issues
   */
  const resetSession = async () => {
    try {
      // Sign out to clear the current session
      await supabase.auth.signOut();
      
      toast({
        title: "פעולה נדרשת",
        description: "הפעולה בוצעה בהצלחה. נא להתחבר מחדש כדי לתקן בעיות RLS",
      });
      
      // Reload the page to force a fresh session
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
      
    } catch (error) {
      console.error("Error resetting session:", error);
      toast({
        title: "שגיאה באיפוס ההפעלה",
        description: error instanceof Error ? error.message : "שגיאה בלתי צפויה",
        variant: "destructive",
      });
    }
  };

  return { diagnoseCategoryAccess, resetSession };
};
