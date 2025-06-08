import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Globe,
  Palette
} from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';

const SystemSettings: React.FC = () => {
  const { settings, updateSetting, loading } = useAdmin();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, any>>({});

  const tabs = [
    { id: 'general', label: t('admin.settings.general'), icon: Settings },
    { id: 'security', label: t('admin.settings.security'), icon: Shield },
    { id: 'notifications', label: t('admin.settings.notifications'), icon: Bell },
    { id: 'database', label: t('admin.settings.database'), icon: Database },
    { id: 'appearance', label: t('admin.settings.appearance'), icon: Palette }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setUnsavedChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      for (const [key, value] of Object.entries(unsavedChanges)) {
        await updateSetting(key, value);
      }
      setUnsavedChanges({});
      toast.success(t('admin.settings.saved'));
    } catch (error) {
      toast.error(t('admin.settings.saveError'));
    }
  };

  const resetSettings = () => {
    setUnsavedChanges({});
    toast.success(t('admin.settings.reset'));
  };

  const getSettingValue = (key: string, defaultValue: any = '') => {
    if (key in unsavedChanges) {
      return unsavedChanges[key];
    }
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="form-label">{t('admin.settings.appName')}</label>
        <input
          type="text"
          value={getSettingValue('app_name', 'SuiviVente')}
          onChange={(e) => handleSettingChange('app_name', e.target.value)}
          className="form-input"
        />
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.companyName')}</label>
        <input
          type="text"
          value={getSettingValue('company_name', '')}
          onChange={(e) => handleSettingChange('company_name', e.target.value)}
          className="form-input"
        />
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.timezone')}</label>
        <select
          value={getSettingValue('timezone', 'Europe/Paris')}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="form-input"
        >
          <option value="Europe/Paris">Europe/Paris</option>
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New_York</option>
          <option value="Asia/Tokyo">Asia/Tokyo</option>
        </select>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.currency')}</label>
        <select
          value={getSettingValue('currency', 'EUR')}
          onChange={(e) => handleSettingChange('currency', e.target.value)}
          className="form-input"
        >
          <option value="EUR">Euro (€)</option>
          <option value="USD">US Dollar ($)</option>
          <option value="GBP">British Pound (£)</option>
          <option value="JPY">Japanese Yen (¥)</option>
        </select>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.language')}</label>
        <select
          value={getSettingValue('default_language', 'fr')}
          onChange={(e) => handleSettingChange('default_language', e.target.value)}
          className="form-input"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="form-label">{t('admin.settings.sessionTimeout')}</label>
        <select
          value={getSettingValue('session_timeout', 3600)}
          onChange={(e) => handleSettingChange('session_timeout', parseInt(e.target.value))}
          className="form-input"
        >
          <option value={1800}>30 minutes</option>
          <option value={3600}>1 hour</option>
          <option value={7200}>2 hours</option>
          <option value={14400}>4 hours</option>
          <option value={28800}>8 hours</option>
        </select>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.maxLoginAttempts')}</label>
        <input
          type="number"
          min="3"
          max="10"
          value={getSettingValue('max_login_attempts', 5)}
          onChange={(e) => handleSettingChange('max_login_attempts', parseInt(e.target.value))}
          className="form-input"
        />
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.lockoutDuration')}</label>
        <select
          value={getSettingValue('lockout_duration', 900)}
          onChange={(e) => handleSettingChange('lockout_duration', parseInt(e.target.value))}
          className="form-input"
        >
          <option value={300}>5 minutes</option>
          <option value={900}>15 minutes</option>
          <option value={1800}>30 minutes</option>
          <option value={3600}>1 hour</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="require2fa"
          checked={getSettingValue('require_2fa', false)}
          onChange={(e) => handleSettingChange('require_2fa', e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <label htmlFor="require2fa" className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.settings.require2FA')}
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="forcePasswordChange"
          checked={getSettingValue('force_password_change', true)}
          onChange={(e) => handleSettingChange('force_password_change', e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <label htmlFor="forcePasswordChange" className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.settings.forcePasswordChange')}
        </label>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="emailNotifications"
          checked={getSettingValue('email_notifications', true)}
          onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <label htmlFor="emailNotifications" className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.settings.emailNotifications')}
        </label>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.smtpHost')}</label>
        <input
          type="text"
          value={getSettingValue('smtp_host', '')}
          onChange={(e) => handleSettingChange('smtp_host', e.target.value)}
          className="form-input"
          placeholder="smtp.gmail.com"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('admin.settings.smtpPort')}</label>
          <input
            type="number"
            value={getSettingValue('smtp_port', 587)}
            onChange={(e) => handleSettingChange('smtp_port', parseInt(e.target.value))}
            className="form-input"
          />
        </div>
        
        <div>
          <label className="form-label">{t('admin.settings.smtpSecurity')}</label>
          <select
            value={getSettingValue('smtp_security', 'tls')}
            onChange={(e) => handleSettingChange('smtp_security', e.target.value)}
            className="form-input"
          >
            <option value="none">None</option>
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.smtpUsername')}</label>
        <input
          type="text"
          value={getSettingValue('smtp_username', '')}
          onChange={(e) => handleSettingChange('smtp_username', e.target.value)}
          className="form-input"
        />
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.smtpPassword')}</label>
        <input
          type="password"
          value={getSettingValue('smtp_password', '')}
          onChange={(e) => handleSettingChange('smtp_password', e.target.value)}
          className="form-input"
        />
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.fromEmail')}</label>
        <input
          type="email"
          value={getSettingValue('from_email', '')}
          onChange={(e) => handleSettingChange('from_email', e.target.value)}
          className="form-input"
          placeholder="noreply@company.com"
        />
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="form-label">{t('admin.settings.backupFrequency')}</label>
        <select
          value={getSettingValue('backup_frequency', 'daily')}
          onChange={(e) => handleSettingChange('backup_frequency', e.target.value)}
          className="form-input"
        >
          <option value="hourly">{t('admin.settings.hourly')}</option>
          <option value="daily">{t('admin.settings.daily')}</option>
          <option value="weekly">{t('admin.settings.weekly')}</option>
          <option value="monthly">{t('admin.settings.monthly')}</option>
        </select>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.retentionPeriod')}</label>
        <select
          value={getSettingValue('backup_retention', 30)}
          onChange={(e) => handleSettingChange('backup_retention', parseInt(e.target.value))}
          className="form-input"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoBackup"
          checked={getSettingValue('auto_backup', true)}
          onChange={(e) => handleSettingChange('auto_backup', e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <label htmlFor="autoBackup" className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.settings.autoBackup')}
        </label>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.logLevel')}</label>
        <select
          value={getSettingValue('log_level', 'info')}
          onChange={(e) => handleSettingChange('log_level', e.target.value)}
          className="form-input"
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.logRetention')}</label>
        <select
          value={getSettingValue('log_retention', 90)}
          onChange={(e) => handleSettingChange('log_retention', parseInt(e.target.value))}
          className="form-input"
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={180}>6 months</option>
          <option value={365}>1 year</option>
        </select>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="form-label">{t('admin.settings.theme')}</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="form-input"
        >
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
          <option value="system">{t('theme.system')}</option>
        </select>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.primaryColor')}</label>
        <div className="grid grid-cols-6 gap-2 mt-2">
          {[
            '#1E3A8A', '#7C3AED', '#DC2626', '#059669', 
            '#D97706', '#DB2777', '#0891B2', '#4338CA'
          ].map(color => (
            <button
              key={color}
              onClick={() => handleSettingChange('primary_color', color)}
              className={`w-10 h-10 rounded-lg border-2 ${
                getSettingValue('primary_color', '#1E3A8A') === color 
                  ? 'border-gray-900 dark:border-white' 
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.logoUrl')}</label>
        <input
          type="url"
          value={getSettingValue('logo_url', '')}
          onChange={(e) => handleSettingChange('logo_url', e.target.value)}
          className="form-input"
          placeholder="https://example.com/logo.png"
        />
      </div>
      
      <div>
        <label className="form-label">{t('admin.settings.faviconUrl')}</label>
        <input
          type="url"
          value={getSettingValue('favicon_url', '')}
          onChange={(e) => handleSettingChange('favicon_url', e.target.value)}
          className="form-input"
          placeholder="https://example.com/favicon.ico"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="compactMode"
          checked={getSettingValue('compact_mode', false)}
          onChange={(e) => handleSettingChange('compact_mode', e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <label htmlFor="compactMode" className="text-sm text-gray-700 dark:text-gray-300">
          {t('admin.settings.compactMode')}
        </label>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'security': return renderSecuritySettings();
      case 'notifications': return renderNotificationSettings();
      case 'database': return renderDatabaseSettings();
      case 'appearance': return renderAppearanceSettings();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('admin.settings.subtitle')}
          </p>
        </div>
        
        {Object.keys(unsavedChanges).length > 0 && (
          <div className="flex space-x-3">
            <button
              onClick={resetSettings}
              className="btn btn-secondary flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              {t('common.reset')}
            </button>
            
            <button
              onClick={saveSettings}
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              <Save size={16} className="mr-2" />
              {t('common.save')}
            </button>
          </div>
        )}
      </div>

      {/* Unsaved Changes Warning */}
      {Object.keys(unsavedChanges).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                {t('admin.settings.unsavedChanges')}
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                {t('admin.settings.unsavedChangesDesc')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={16} className="mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;