import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type User = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'seller';
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  resendConfirmation: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user) {
            const newProfile = {
              id: authUser.user.id,
              email: authUser.user.email!,
              username: authUser.user.email!.split('@')[0],
              role: 'seller' as const,
              is_active: true,
              email_confirmed: authUser.user.email_confirmed_at !== null
            };

            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert([newProfile]);

            if (!insertError) {
              setUser({
                id: newProfile.id,
                email: newProfile.email,
                username: newProfile.username,
                role: newProfile.role,
                isActive: newProfile.is_active,
                emailConfirmed: newProfile.email_confirmed,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
        return;
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          username: profile.username,
          role: profile.role,
          isActive: profile.is_active,
          emailConfirmed: profile.email_confirmed,
          createdAt: profile.created_at,
          profile: profile.profile_data
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Veuillez confirmer votre email avant de vous connecter');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else {
          toast.error('Erreur de connexion: ' + error.message);
        }
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        toast.success('Connexion réussie');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Une erreur est survenue lors de la connexion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    username: string,
    firstName?: string,
    lastName?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        toast.error('Ce nom d\'utilisateur est déjà pris');
        return false;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Un compte existe déjà avec cette adresse email');
        } else {
          toast.error('Erreur lors de l\'inscription: ' + error.message);
        }
        return false;
      }

      if (data.user) {
        // Create user profile
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          username,
          role: 'seller' as const,
          is_active: true,
          email_confirmed: false,
          profile_data: {
            firstName,
            lastName
          }
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([profileData]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        toast.success('Inscription réussie! Vérifiez votre email pour confirmer votre compte.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Une erreur est survenue lors de l\'inscription');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        toast.error('Erreur lors de l\'envoi: ' + error.message);
        return false;
      }

      toast.success('Email de confirmation renvoyé');
      return true;
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast.error('Une erreur est survenue');
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        toast.error('Erreur lors de l\'envoi: ' + error.message);
        return false;
      }

      toast.success('Email de réinitialisation envoyé');
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Une erreur est survenue');
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    resendConfirmation,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}