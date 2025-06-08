import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  const themes = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') }
  ];

  return (
    <div className="relative">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {themes.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        {themes.find(t => t.value === theme)?.icon && (
          React.createElement(themes.find(t => t.value === theme)!.icon, {
            size: 16,
            className: "text-gray-400"
          })
        )}
      </div>
    </div>
  );
};

export default ThemeToggle;