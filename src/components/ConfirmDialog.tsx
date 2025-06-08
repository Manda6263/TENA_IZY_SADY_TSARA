import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  loading = false,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={48} className="text-red-500 mx-auto mb-4" />;
      case 'warning':
        return <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />;
      default:
        return <AlertTriangle size={48} className="text-blue-500 mx-auto mb-4" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn bg-yellow-600 text-white hover:bg-yellow-700';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          {getIcon()}
          <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button 
            onClick={onCancel}
            className="btn btn-secondary flex-1"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`${getButtonClass()} flex-1 flex items-center justify-center`}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Suppression...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;