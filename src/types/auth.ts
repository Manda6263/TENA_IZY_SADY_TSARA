export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'manager' | 'seller';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
  security?: {
    twoFactorEnabled: boolean;
    passwordLastChanged: string;
    failedLoginAttempts: number;
    lockedUntil?: string;
    passwordHistory: string[];
  };
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  conditions?: Record<string, any>;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  failureReason?: string;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'account_locked';
  details: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number; // days
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}