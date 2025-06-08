import { useState, useEffect, useCallback } from 'react';
import { User, LoginAttempt, SecurityEvent, PasswordPolicy, TwoFactorSetup } from '../types/auth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Password policy
  const passwordPolicy: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    maxAge: 90
  };

  // Check session validity
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        // Check if session is expired
        const expiresAt = new Date(session.expires_at! * 1000);
        if (expiresAt <= new Date()) {
          await logout();
          return;
        }
        
        setSessionExpiry(expiresAt);
        
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            username: profile.username,
            role: profile.role,
            isActive: profile.is_active,
            lastLogin: profile.last_login,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            profile: profile.profile_data,
            security: profile.security_settings,
            permissions: profile.permissions || []
          });
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login with email and password
  const login = async (email: string, password: string, totpCode?: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Record login attempt
      await recordLoginAttempt(email, false, 'Attempting login');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        await recordLoginAttempt(email, false, error.message);
        
        // Check for account lockout
        if (error.message.includes('locked')) {
          toast.error('Account temporarily locked due to multiple failed attempts');
        } else {
          toast.error('Invalid credentials');
        }
        return false;
      }
      
      // Check 2FA if enabled
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('security_settings')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.security_settings?.twoFactorEnabled && !totpCode) {
        // Sign out and request 2FA
        await supabase.auth.signOut();
        throw new Error('2FA_REQUIRED');
      }
      
      if (profile?.security_settings?.twoFactorEnabled && totpCode) {
        // Verify TOTP code
        const isValid = await verifyTOTP(data.user.id, totpCode);
        if (!isValid) {
          await supabase.auth.signOut();
          await recordLoginAttempt(email, false, 'Invalid 2FA code');
          toast.error('Invalid 2FA code');
          return false;
        }
      }
      
      // Update last login
      await supabase
        .from('user_profiles')
        .update({ 
          last_login: new Date().toISOString(),
          'security_settings.failedLoginAttempts': 0
        })
        .eq('id', data.user.id);
      
      await recordLoginAttempt(email, true, 'Login successful');
      await recordSecurityEvent(data.user.id, 'login', { method: 'password' });
      
      toast.success('Login successful');
      return true;
      
    } catch (error: any) {
      if (error.message === '2FA_REQUIRED') {
        throw error;
      }
      
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Social login
  const loginWithProvider = async (provider: 'google' | 'github' | 'microsoft') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Social login error:', error);
      toast.error('Social login failed');
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (user) {
        await recordSecurityEvent(user.id, 'logout', {});
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setSessionExpiry(null);
      toast.success('Logged out successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Validate new password against policy
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return false;
      }
      
      // Check password history
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('security_settings')
        .eq('id', user.id)
        .single();
      
      const passwordHistory = profile?.security_settings?.passwordHistory || [];
      
      // In a real app, you'd hash and compare passwords
      if (passwordHistory.includes(newPassword)) {
        toast.error(`Cannot reuse last ${passwordPolicy.preventReuse} passwords`);
        return false;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Update password history
      const newHistory = [newPassword, ...passwordHistory].slice(0, passwordPolicy.preventReuse);
      
      await supabase
        .from('user_profiles')
        .update({
          'security_settings.passwordLastChanged': new Date().toISOString(),
          'security_settings.passwordHistory': newHistory
        })
        .eq('id', user.id);
      
      await recordSecurityEvent(user.id, 'password_change', {});
      toast.success('Password changed successfully');
      return true;
      
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
      return false;
    }
  };

  // Setup 2FA
  const setup2FA = async (): Promise<TwoFactorSetup | null> => {
    try {
      if (!user) return null;
      
      // Generate secret and QR code
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      const setup = await response.json();
      return setup;
      
    } catch (error) {
      console.error('2FA setup error:', error);
      toast.error('Failed to setup 2FA');
      return null;
    }
  };

  // Enable 2FA
  const enable2FA = async (totpCode: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      const isValid = await verifyTOTP(user.id, totpCode);
      if (!isValid) {
        toast.error('Invalid verification code');
        return false;
      }
      
      await supabase
        .from('user_profiles')
        .update({
          'security_settings.twoFactorEnabled': true
        })
        .eq('id', user.id);
      
      await recordSecurityEvent(user.id, '2fa_enabled', {});
      toast.success('Two-factor authentication enabled');
      return true;
      
    } catch (error) {
      console.error('2FA enable error:', error);
      toast.error('Failed to enable 2FA');
      return false;
    }
  };

  // Disable 2FA
  const disable2FA = async (password: string): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Verify password before disabling 2FA
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });
      
      if (error) {
        toast.error('Invalid password');
        return false;
      }
      
      await supabase
        .from('user_profiles')
        .update({
          'security_settings.twoFactorEnabled': false
        })
        .eq('id', user.id);
      
      await recordSecurityEvent(user.id, '2fa_disabled', {});
      toast.success('Two-factor authentication disabled');
      return true;
      
    } catch (error) {
      console.error('2FA disable error:', error);
      toast.error('Failed to disable 2FA');
      return false;
    }
  };

  // Utility functions
  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters`);
    }
    
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }
    
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }
    
    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }
    
    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain special characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const recordLoginAttempt = async (email: string, success: boolean, reason: string) => {
    try {
      await supabase.from('login_attempts').insert({
        email,
        success,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        failure_reason: success ? null : reason
      });
    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  };

  const recordSecurityEvent = async (userId: string, type: string, details: Record<string, any>) => {
    try {
      await supabase.from('security_events').insert({
        user_id: userId,
        type,
        details,
        ip_address: await getClientIP()
      });
    } catch (error) {
      console.error('Failed to record security event:', error);
    }
  };

  const verifyTOTP = async (userId: string, code: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      
      const result = await response.json();
      return result.valid;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  // Session management
  useEffect(() => {
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSessionExpiry(null);
        } else if (event === 'SIGNED_IN' && session) {
          await checkSession();
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [checkSession]);

  // Session expiry warning
  useEffect(() => {
    if (!sessionExpiry) return;
    
    const warningTime = new Date(sessionExpiry.getTime() - 5 * 60 * 1000); // 5 minutes before
    const now = new Date();
    
    if (warningTime > now) {
      const timeout = setTimeout(() => {
        toast.error('Session will expire in 5 minutes', {
          duration: 10000,
          id: 'session-warning'
        });
      }, warningTime.getTime() - now.getTime());
      
      return () => clearTimeout(timeout);
    }
  }, [sessionExpiry]);

  return {
    user,
    loading,
    sessionExpiry,
    passwordPolicy,
    login,
    loginWithProvider,
    logout,
    changePassword,
    setup2FA,
    enable2FA,
    disable2FA,
    validatePassword,
    checkSession
  };
}