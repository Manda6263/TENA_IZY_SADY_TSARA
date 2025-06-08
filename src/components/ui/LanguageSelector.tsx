import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

const LanguageSelector: React.FC = () => {
  const { language, changeLanguage } = useI18n();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {languages.map(({ code, name, flag }) => (
          <option key={code} value={code}>
            {flag} {name}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <Globe size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

export default LanguageSelector;