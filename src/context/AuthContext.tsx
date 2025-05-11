import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, refreshSessionIfNeeded } from "@/integrations/supabase/client";
import { getBaseUrl, getPasswordResetRedirectUrl } from "@/utils/authUtils";
import { storage } from "@/services/localStorage";
import { useAppStore } from "@/store";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string, persistSession?: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<boolean>;
}

// Local storage key for persistence preference
const PERSIST_SESSION_KEY = "auth_persist_session";

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  isLoading: true,
  isAuthenticated: false,
  refreshSession: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { clearStore } = useAppStore();
  
  // Function to refresh session
  const refreshSession = async (): Promise<boolean> => {
    return await refreshSessionIfNeeded();
  };

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Setting up auth state listener`);
    
    // Get persistence preference from local storage
    const persistSession = storage.get(PERSIST_SESSION_KEY, true);
    console.log(`Session persistence preference: ${persistSession ? "Enabled" : "Disabled"}`);
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`[${new Date().toISOString()}] Auth state changed: ${event}`);
        
        // Important: Handle the state update synchronously
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsAuthenticated(!!newSession?.user);
        setIsLoading(false);
        
        // Handle sign out event to clear store
        if (event === 'SIGNED_OUT') {
          clearStore();
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log("Token was successfully refreshed");
        }
        
        // Don't make any Supabase calls from this callback to avoid deadlocks!
      }
    );

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.error("Error getting initial session:", error);
      }
      
      console.log(`[${new Date().toISOString()}] Initial session check:`, initialSession ? "Session found" : "No session");
      
      // Update state synchronously
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsAuthenticated(!!initialSession?.user);
      setIsLoading(false);
      
      if (initialSession?.user) {
        // Additional checks done outside the callback
        setTimeout(() => {
          refreshSessionIfNeeded().then(isValid => {
            if (!isValid) {
              console.warn("Initial session validation failed, may need to re-authenticate");
            }
          });
        }, 0);
      }
    });

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [clearStore]);

  const signIn = async (email: string, password: string, persistSession = true) => {
    try {
      console.log(`[${new Date().toISOString()}] Signing in with persistence: ${persistSession}`);
      
      // Save persistence preference before signing in
      storage.set(PERSIST_SESSION_KEY, persistSession);
      
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error.message);
        throw error;
      }
      
      console.log("Sign in successful, session established:", !!data.session);
      console.log("User ID:", data.user?.id);
      console.log("Access token present:", !!data.session?.access_token);
      
      // For non-persistent sessions, set up cleanup
      if (!persistSession) {
        window.addEventListener('beforeunload', () => {
          console.log("Page unloading, clearing non-persistent session");
          localStorage.removeItem('sb-pqkzybnagdobradtlwpq-auth-token');
        }, { once: true });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (error) {
        console.error("Sign up error:", error.message);
        throw error;
      }
      
      console.log("Sign up successful");
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error.message);
        throw error;
      }
      console.log("Sign out successful");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log(`Sending password reset email to: ${email}`);
      
      const redirectTo = getPasswordResetRedirectUrl();
      console.log(`Password reset redirect URL: ${redirectTo}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (error) {
        console.error("Password reset error:", error.message);
        throw error;
      }
      
      console.log("Password reset email sent successfully");
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      console.log('Attempting to update password');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        console.error("Password update error:", error.message);
        throw error;
      }
      
      console.log("Password updated successfully");
    } catch (error) {
      console.error("Password update error:", error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isLoading,
    isAuthenticated,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
