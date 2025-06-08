import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart, ShoppingBag, Package, Import as FileImport, File as FileExport, Settings, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  
  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/sales', icon: <ShoppingBag size={20} />, label: 'Ventes' },
    { path: '/inventory', icon: <Package size={20} />, label: 'Stock' },
    { path: '/import', icon: <FileImport size={20} />, label: 'Import' },
    { path: '/export', icon: <FileExport size={20} />, label: 'Export' },
  ];
  
  // Add admin section if user is admin
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', icon: <Settings size={20} />, label: 'Admin' });
  }

  return (
    <aside className="bg-primary-800 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-4">
        <div className="flex items-center justify-center p-2 mb-6">
          <BarChart size={24} className="mr-2" />
          <h1 className="text-xl font-bold mb-0">SuiviVente</h1>
        </div>
        
        <nav className="mt-8">
          <ul>
            {navItems.map((item) => (
              <li key={item.path} className="mb-2">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-md transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;