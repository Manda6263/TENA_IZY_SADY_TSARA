import React from 'react';
import { Menu, BellRing, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../hooks/useI18n';
import SyncIndicator from './SyncIndicator';
import ThemeToggle from './ui/ThemeToggle';
import LanguageSelector from './ui/LanguageSelector';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm py-4 px-6 flex justify-between items-center transition-colors duration-200">
      <div className="flex items-center md:hidden">
        <button className="text-gray-500 dark:text-gray-400 focus:outline-none">
          <Menu size={24} />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-primary-800 dark:text-primary-300 hidden md:block">
          SuiviVente
        </h2>
        <SyncIndicator />
      </div>
      
      <div className="flex items-center space-x-4">
        <LanguageSelector />
        <ThemeToggle />
        
        <button className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <BellRing size={20} />
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center text-sm focus:outline-none"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-8 w-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <span className="ml-2 font-medium text-gray-700 dark:text-gray-300 hidden md:block">
              {user?.username}
            </span>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                {t('auth.loggedInAs')} <span className="font-medium">{user?.username}</span>
              </div>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <User size={16} className="inline mr-2" />
                {t('common.profile')}
              </a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings size={16} className="inline mr-2" />
                {t('common.settings')}
              </a>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;