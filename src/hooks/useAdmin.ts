import { useState, useEffect } from 'react';
import { User, Permission } from '../types/auth';
import { SystemSettings, AuditLog, SystemHealth, BackupInfo, BulkOperation } from '../types/admin';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);

  // User Management
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email!,
        password: generateTemporaryPassword(),
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          is_active: userData.isActive ?? true,
          profile_data: userData.profile,
          permissions: userData.permissions
        });
      
      if (profileError) throw profileError;
      
      // Send invitation email
      await sendInvitationEmail(userData.email!, generateTemporaryPassword());
      
      await fetchUsers();
      toast.success('User created successfully');
      return true;
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: updates.username,
          role: updates.role,
          is_active: updates.isActive,
          profile_data: updates.profile,
          permissions: updates.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      await fetchUsers();
      toast.success('User updated successfully');
      return true;
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Soft delete - deactivate user
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      await fetchUsers();
      toast.success('User deactivated successfully');
      return true;
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateUsers = async (userIds: string[], updates: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds);
      
      if (error) throw error;
      
      await fetchUsers();
      toast.success(`${userIds.length} users updated successfully`);
      return true;
      
    } catch (error) {
      console.error('Error bulk updating users:', error);
      toast.error('Failed to update users');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // System Settings
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    }
  };

  const updateSetting = async (key: string, value: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);
      
      if (error) throw error;
      
      await fetchSettings();
      toast.success('Setting updated successfully');
      return true;
      
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      return false;
    }
  };

  // Audit Logs
  const fetchAuditLogs = async (filters?: {
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    }
  };

  // System Health
  const checkSystemHealth = async () => {
    try {
      const startTime = Date.now();
      
      // Test database connection
      const { error: dbError } = await supabase
        .from('system_settings')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      // Get active users count
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const health: SystemHealth = {
        status: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'critical',
        uptime: Date.now() - (new Date().setHours(0, 0, 0, 0)), // Simplified uptime
        responseTime,
        databaseStatus: dbError ? 'disconnected' : responseTime < 1000 ? 'connected' : 'slow',
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        cpuUsage: Math.random() * 100, // Placeholder
        activeUsers: activeUsers || 0,
        lastChecked: new Date().toISOString()
      };
      
      setSystemHealth(health);
      return health;
      
    } catch (error) {
      console.error('Error checking system health:', error);
      const health: SystemHealth = {
        status: 'critical',
        uptime: 0,
        responseTime: 0,
        databaseStatus: 'disconnected',
        memoryUsage: 0,
        cpuUsage: 0,
        activeUsers: 0,
        lastChecked: new Date().toISOString()
      };
      setSystemHealth(health);
      return health;
    }
  };

  // Backup Management
  const createBackup = async (type: 'manual' | 'scheduled' = 'manual'): Promise<boolean> => {
    try {
      setLoading(true);
      
      const backup: Partial<BackupInfo> = {
        type,
        status: 'pending',
        size: 0,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('backups')
        .insert(backup)
        .select()
        .single();
      
      if (error) throw error;
      
      // Simulate backup process
      setTimeout(async () => {
        await supabase
          .from('backups')
          .update({
            status: 'completed',
            size: Math.floor(Math.random() * 1000000) + 500000,
            completed_at: new Date().toISOString(),
            download_url: `/api/backups/${data.id}/download`
          })
          .eq('id', data.id);
        
        await fetchBackups();
      }, 3000);
      
      await fetchBackups();
      toast.success('Backup started');
      return true;
      
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to fetch backups');
    }
  };

  // Utility functions
  const generateTemporaryPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const sendInvitationEmail = async (email: string, password: string) => {
    // In a real app, this would send an actual email
    console.log(`Invitation email sent to ${email} with password: ${password}`);
  };

  // Initialize data
  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchAuditLogs({ limit: 100 });
    fetchBackups();
    checkSystemHealth();
    
    // Set up periodic health checks
    const healthInterval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(healthInterval);
  }, []);

  return {
    // Data
    users,
    permissions,
    settings,
    auditLogs,
    systemHealth,
    backups,
    bulkOperations,
    loading,
    
    // User Management
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    
    // Settings
    fetchSettings,
    updateSetting,
    
    // Audit
    fetchAuditLogs,
    
    // Health
    checkSystemHealth,
    
    // Backup
    createBackup,
    fetchBackups
  };
}