import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../hooks/useTheme';

const Toast: React.FC = () => {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: resolvedTheme === 'dark' ? '#374151' : '#ffffff',
          color: resolvedTheme === 'dark' ? '#f9fafb' : '#111827',
          border: `1px solid ${resolvedTheme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '400px'
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff'
          }
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff'
          }
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#ffffff'
          }
        }
      }}
    />
  );
};

export default Toast;