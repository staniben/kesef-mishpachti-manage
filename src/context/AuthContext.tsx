
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string, persistSession?: boolean) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);
        
        if (newSession?.user) {
          console.log("User authenticated:", newSession.user.id);
          console.log("Access token present:", !!newSession.access_token);
        } else {
          console.log("No authenticated user");
        }
      }
    );

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session check:", initialSession ? "Session found" : "No session");
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsLoading(false);
      
      if (initialSession?.user) {
        console.log("User authenticated:", initialSession.user.id);
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

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
