import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Gets the current authenticated user with session validation
 * @returns User object or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return data.user;
};

/**
 * Checks if there's a valid session and user
 * @returns Object containing user, session and auth status
 */
export const checkAuthStatus = async () => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Error checking session:', sessionError);
    return { user: null, session: null, isAuthenticated: false };
  }
  
  const session = sessionData?.session;
  const user = session?.user;
  
  if (!session || !user) {
    console.log('No active session or user found');
    return { user: null, session: null, isAuthenticated: false };
  }
  
  // Check token expiration
  const expiresAt = session.expires_at;
  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired = expiresAt && expiresAt < currentTime;
  
  if (isExpired) {
    console.warn('Session has expired');
    return { user: null, session: null, isAuthenticated: false };
  }
  
  return { 
    user, 
    session, 
    isAuthenticated: true,
    expiresIn: expiresAt ? expiresAt - currentTime : null
  };
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Gets the base URL for the current environment (production or development)
 * @returns Base URL as a string
 */
export const getBaseUrl = (): string => {
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  return `${url.protocol}//${url.host}`;
};
