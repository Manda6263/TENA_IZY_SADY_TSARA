import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useData } from '../context/DataContext';

const SyncIndicator: React.FC = () => {
  const { sales, products } = useData();
  
  const isLoading = sales.loading || products.loading;
  const hasError = sales.error || products.error;
  const retryCount = (sales as any).retryCount || 0;

  const getStatus = () => {
    if (isLoading) {
      return {
        icon: <RefreshCw size={16} className="animate-spin text-blue-500" />,
        text: 'Synchronisation...',
        color: 'text-blue-600'
      };
    }
    
    if (hasError) {
      if (hasError.includes('offline mode')) {
        return {
          icon: <WifiOff size={16} className="text-yellow-500" />,
          text: 'Mode hors ligne',
          color: 'text-yellow-600'
        };
      }
      
      return {
        icon: <AlertTriangle size={16} className="text-red-500" />,
        text: retryCount > 0 ? `Reconnexion... (${retryCount}/3)` : 'Erreur de connexion',
        color: 'text-red-600'
      };
    }
    
    return {
      icon: <Wifi size={16} className="text-green-500" />,
      text: 'Synchronisé',
      color: 'text-green-600'
    };
  };

  const status = getStatus();

  return (
    <div className="flex items-center space-x-2 text-sm">
      {status.icon}
      <span className={status.color}>{status.text}</span>
    </div>
  );
};

export default SyncIndicator;