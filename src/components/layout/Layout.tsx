
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { UserProfile } from "../UserProfile";
import { StoreInitializer } from "../StoreInitializer";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/services/localStorage";

export function Layout() {
  const [visibilityChanged, setVisibilityChanged] = useState(false);
  const { refreshAllData, dataStatus, categories, paymentSources, setTheme } = useAppStore();
  const { isAuthenticated } = useAuth();
  const [hasInitialData, setHasInitialData] = useState(false);
  const [initialLoadAttempt, setInitialLoadAttempt] = useState(0);
  
  // Load theme from storage on initialization
  useEffect(() => {
    const savedTheme = storage.get('theme', 'default');
    setTheme(savedTheme);
  }, []);
  
  // Check if required data is available for child routes
  const isDataReady = categories.length > 0 && paymentSources.length > 0;
  
  // Handle initial data loading on mount
  useEffect(() => {
    if (isAuthenticated && !isDataReady && initialLoadAttempt < 3) {
      // Only attempt to load data if we're authenticated and haven't exceeded retry attempts
      console.log(`Layout: Initial data load attempt ${initialLoadAttempt + 1}`);
      
      // Add a short delay on retry attempts
      const timer = setTimeout(() => {
        refreshAllData().catch(err => {
          console.error("Error in Layout data refresh:", err);
          setInitialLoadAttempt(prev => prev + 1);
        });
      }, initialLoadAttempt * 500); // Increasing backoff delay
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isDataReady, initialLoadAttempt, refreshAllData]);
  
  // Mark data as loaded once we have some data
  useEffect(() => {
    if (isDataReady && !hasInitialData) {
      console.log("Layout: Required data is now available");
      setHasInitialData(true);
    }
  }, [isDataReady, hasInitialData]);
  
  // Handle document visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab is visible again, refreshing data...");
        setVisibilityChanged(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Refresh data when visibility changes
  useEffect(() => {
    if (visibilityChanged) {
      refreshAllData();
      setVisibilityChanged(false);
    }
  }, [visibilityChanged, refreshAllData]);

  // Function to retry data loading
  const handleRetryDataLoad = () => {
    refreshAllData();
    setInitialLoadAttempt(prev => prev + 1);
  };

  // Show loading state if we're still loading initial data
  const showLoadingState = isAuthenticated && !isDataReady && initialLoadAttempt < 3;
  const showErrorState = isAuthenticated && !isDataReady && initialLoadAttempt >= 3;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 overflow-x-hidden">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6 mt-12 md:mt-0">
              <h1 className="text-2xl font-bold">ניהול תקציב משפחתי</h1>
              <div className="flex items-center gap-4">
                <UserProfile />
              </div>
            </div>
            
            {showLoadingState && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">טוען נתונים...</p>
                  <p className="text-sm text-muted-foreground">מאחזר קטגוריות ואמצעי תשלום</p>
                </div>
              </div>
            )}
            
            {showErrorState && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted p-6 rounded-lg max-w-md mx-auto">
                  <p className="text-lg font-medium mb-4">לא ניתן לטעון את הנתונים</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    נכשל בטעינת הנתונים הנדרשים למערכת. נא לנסות שוב או להתחבר מחדש.
                  </p>
                  <Button onClick={handleRetryDataLoad}>
                    נסה שוב
                  </Button>
                </div>
              </div>
            )}
            
            {(!isAuthenticated || isDataReady) && <Outlet />}
          </div>
        </main>
      </div>
      <StoreInitializer />
    </SidebarProvider>
  );
}
