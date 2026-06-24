import { useEffect } from "react";
import { useAuthStore } from "../stores/useAuthStore";
import { authService } from "../services/supabase/auth";

export function useSupabaseAuth() {
  const { user, loading, error, initialize, signOut, initialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loginWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      console.error("Google Auth failure:", err);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    return await authService.signInWithPassword(email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    return await authService.signUp(email, password, name);
  };

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    logout: signOut,
    isAuthenticated: !!user,
    initialized,
  };
}
