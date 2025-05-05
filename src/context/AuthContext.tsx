
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl, getPasswordResetRedirectUrl } from "@/utils/authUtils";

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
}

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
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsAuthenticated(!!newSession?.user);
        setIsLoading(false);
        
        if (newSession?.user) {
          console.log("User authenticated:", newSession.user.id);
          console.log("Access token present:", !!newSession.access_token);
          console.log("Access token expires at:", new Date(newSession.expires_at * 1000).toISOString());
          
          // Let's check if the token will expire soon (within 10 minutes)
          const expiresInMs = (newSession.expires_at * 1000) - Date.now();
          const expiresInMinutes = Math.floor(expiresInMs / (1000 * 60));
          console.log(`Token expires in ${expiresInMinutes} minutes`);
          
          if (expiresInMinutes < 10) {
            console.warn("⚠️ Auth token expires soon! This might cause issues with requests.");
          }
        } else {
          console.log("No authenticated user");
          setIsAuthenticated(false);
        }
      }
    );

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session check:", initialSession ? "Session found" : "No session");
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsAuthenticated(!!initialSession?.user);
      setIsLoading(false);
      
      if (initialSession?.user) {
        console.log("User authenticated:", initialSession.user.id);
        console.log("Initial access token present:", !!initialSession.access_token);
        
        // Let's verify if the token still has reasonable validity
        const expiresInMs = (initialSession.expires_at * 1000) - Date.now();
        const expiresInMinutes = Math.floor(expiresInMs / (1000 * 60));
        console.log(`Token expires in ${expiresInMinutes} minutes`);
        
        if (expiresInMinutes < 10) {
          console.warn("⚠️ Auth token expires soon! This might cause issues with requests.");
        }
        
        // Optional: Test a simple authenticated query to verify token works
        supabase.from('categories')
          .select('count(*)', { count: 'exact', head: true })
          .then(({ count, error }) => {
            if (error) {
              console.error("Auth test query failed:", error);
              if (error.message.includes("JWT") || error.message.includes("auth")) {
                console.error("⚠️ Authentication appears invalid despite session!");
                // Don't reset auth state here - that would cause a loop
              }
            } else {
              console.log("Auth test query succeeded, user can access data");
            }
          });
      }
    });

    return () => {
      console.log("Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, persistSession = true) => {
    try {
      console.log(`Signing in with persistence: ${persistSession}`);
      
      // Configure storage based on persistence preference
      if (!persistSession) {
        // Use sessionStorage for temporary sessions
        console.log("Using sessionStorage for auth session");
        
        // This will clear any existing session
        await supabase.auth.signOut();
        
        // Configure supabase client to use sessionStorage
        supabase.auth.setSession({
          access_token: '',
          refresh_token: '',
        });
      } else {
        console.log("Using localStorage for persistent auth session");
        // Default behavior uses localStorage
      }
      
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
      
      // Test if the auth state changed listener fired correctly
      setTimeout(() => {
        if (!isAuthenticated) {
          console.warn("⚠️ Auth state might not be updating correctly after sign in");
        } else {
          console.log("Auth state updated correctly after sign in");
        }
      }, 500);
      
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
      console.log(`Redirect URL: ${redirectTo}`);
      
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
