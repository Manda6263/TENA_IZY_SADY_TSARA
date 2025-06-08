import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Settings, 
  Shield, 
  Database, 
  Activity, 
  FileText,
  BarChart3,
  HardDrive
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import UserManagement from '../components/admin/UserManagement';
import SystemSettings from '../components/admin/SystemSettings';

const Admin: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { 
      id: 'users', 
      label: t('admin.users.title'), 
      icon: Users,
      description: t('admin.users.subtitle')
    },
    { 
      id: 'settings', 
      label: t('admin.settings.title'), 
      icon: Settings,
      description: t('admin.settings.subtitle')
    },
    { 
      id: 'security', 
      label: t('admin.security.title'), 
      icon: Shield,
      description: 'Gérer la sécurité et les permissions'
    },
    { 
      id: 'audit', 
      label: t('admin.audit.title'), 
      icon: FileText,
      description: t('admin.audit.subtitle')
    },
    { 
      id: 'health', 
      label: t('admin.health.title'), 
      icon: Activity,
      description: t('admin.health.subtitle')
    },
    { 
      id: 'backups', 
      label: t('admin.backups.title'), 
      icon: HardDrive,
      description: t('admin.backups.subtitle')
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'security':
        return <div className="p-8 text-center text-gray-500">Security module coming soon...</div>;
      case 'audit':
        return <div className="p-8 text-center text-gray-500">Audit log module coming soon...</div>;
      case 'health':
        return <div className="p-8 text-center text-gray-500">System health module coming soon...</div>;
      case 'backups':
        return <div className="p-8 text-center text-gray-500">Backup management module coming soon...</div>;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('admin.subtitle')}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </div>
                  
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;