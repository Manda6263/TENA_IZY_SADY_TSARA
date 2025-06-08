import React, { useState } from 'react';
import { Settings, Shield, Database, Users, RefreshCw, AlertTriangle } from 'lucide-react';

const Admin: React.FC = () => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  const handleAction = (action: string) => {
    setSelectedAction(action);
    setConfirmReset(true);
  };
  
  const confirmAction = () => {
    setConfirmReset(false);
    setActionInProgress(true);
    
    // Simulate action processing
    setTimeout(() => {
      setActionInProgress(false);
      setActionComplete(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setActionComplete(false);
        setSelectedAction(null);
      }, 3000);
    }, 2000);
  };

  const adminCards = [
    { 
      title: 'Réinitialiser les ventes', 
      icon: <RefreshCw size={24} className="text-red-500" />,
      description: 'Supprimer toutes les données de ventes de la base de données',
      action: 'resetSales',
      dangerous: true
    },
    { 
      title: 'Réinitialiser le stock', 
      icon: <RefreshCw size={24} className="text-orange-500" />,
      description: 'Remettre toutes les quantités de stock à zéro',
      action: 'resetStock',
      dangerous: true
    },
    { 
      title: 'Gestion des utilisateurs', 
      icon: <Users size={24} className="text-primary-600" />,
      description: 'Ajouter, modifier ou supprimer des comptes utilisateurs',
      action: 'manageUsers',
      dangerous: false
    },
    { 
      title: 'Sauvegarder la base', 
      icon: <Database size={24} className="text-green-600" />,
      description: 'Créer une sauvegarde complète de la base de données',
      action: 'backupDatabase',
      dangerous: false
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administration</h1>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle size={24} className="text-yellow-500 mr-3 mt-0.5" />
          <div>
            <p className="text-yellow-700 font-medium">Zone d'administration</p>
            <p className="text-yellow-600 text-sm">
              Cette section contient des actions sensibles qui peuvent affecter l'intégrité 
              des données. Veuillez procéder avec précaution.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card, index) => (
          <div key={index} className="card hover:border hover:border-gray-200 hover:shadow-md">
            <div className="flex items-start">
              <div className="p-3 rounded-lg bg-gray-100 mr-4">
                {card.icon}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-lg">{card.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{card.description}</p>
                
                <button 
                  onClick={() => handleAction(card.action)}
                  className={`btn ${card.dangerous ? 'btn-danger' : 'btn-primary'}`}
                >
                  {card.dangerous ? 'Réinitialiser' : 'Accéder'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Sécurité et Permissions</h2>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start">
            <Shield size={24} className="text-primary-600 mr-3 mt-1" />
            <div>
              <h3 className="font-medium mb-2">Paramètres de sécurité</h3>
              
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="form-label">Mot de passe admin</label>
                    <button className="text-sm text-primary-600 hover:text-primary-700">
                      Modifier
                    </button>
                  </div>
                  <input
                    type="password"
                    value="••••••••"
                    readOnly
                    className="form-input bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="form-label mb-2">Permissions d'accès</label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="perm1" 
                          className="mr-2"
                          checked
                          readOnly
                        />
                        <label htmlFor="perm1">Accès au module d'import</label>
                      </div>
                      <span className="text-sm text-gray-500">Admin uniquement</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="perm2" 
                          className="mr-2"
                          checked
                          readOnly
                        />
                        <label htmlFor="perm2">Accès au module d'export</label>
                      </div>
                      <span className="text-sm text-gray-500">Admin, Utilisateurs</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="perm3" 
                          className="mr-2"
                          checked
                          readOnly
                        />
                        <label htmlFor="perm3">Modification du stock</label>
                      </div>
                      <span className="text-sm text-gray-500">Admin uniquement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-700">Confirmation requise</h2>
              <p className="text-gray-600 mt-2">
                Cette action est irréversible et supprimera définitivement les données.
                Êtes-vous sûr de vouloir continuer?
              </p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setConfirmReset(false)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button 
                onClick={confirmAction}
                className="btn btn-danger flex-1"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Action in Progress Modal */}
      {actionInProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Opération en cours</h2>
            <p className="text-gray-600 mt-2">
              Veuillez patienter pendant le traitement...
            </p>
          </div>
        </div>
      )}
      
      {/* Action Complete Modal */}
      {actionComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
            <div className="bg-green-100 rounded-full p-3 inline-block mx-auto mb-4">
              <Check size={24} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Opération terminée</h2>
            <p className="text-gray-600 mt-2">
              L'action a été effectuée avec succès.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;