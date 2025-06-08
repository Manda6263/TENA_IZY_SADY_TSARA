import React from 'react';
import { Menu, BellRing, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-4 px-6 flex justify-between items-center">
      <div className="flex items-center md:hidden">
        <button className="text-gray-500 focus:outline-none">
          <Menu size={24} />
        </button>
      </div>
      
      <h2 className="text-xl font-semibold text-primary-800 hidden md:block">SuiviVente</h2>
      
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-primary-600 transition-colors">
          <BellRing size={20} />
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center text-sm focus:outline-none"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <span className="ml-2 font-medium text-gray-700 hidden md:block">
              {user?.username}
            </span>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                Connecté en tant que <span className="font-medium">{user?.username}</span>
              </div>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profil
              </a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Paramètres
              </a>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;