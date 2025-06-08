export interface SystemSettings {
  id: string;
  category: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  isPublic: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  databaseStatus: 'connected' | 'disconnected' | 'slow';
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  lastChecked: string;
}

export interface BackupInfo {
  id: string;
  type: 'manual' | 'scheduled';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  size: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface BulkOperation {
  id: string;
  type: 'import' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  createdAt: string;
  completedAt?: string;
}