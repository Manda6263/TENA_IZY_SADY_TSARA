import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      
      if (success) {
        navigate('/');
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary-600 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <BarChart size={48} />
          </div>
          <h1 className="text-2xl font-bold">SuiviVente</h1>
          <p className="text-primary-100 mt-1">
            Solution de suivi des ventes et du stock
          </p>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 text-center">
            Connexion
          </h2>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="form-label">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Entrez votre nom d'utilisateur"
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Entrez votre mot de passe"
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="mb-2">Utilisateurs de démonstration:</p>
            <div className="flex justify-center space-x-6">
              <div className="text-left">
                <p><span className="font-medium">Admin:</span> admin</p>
                <p><span className="font-medium">Mot de passe:</span> admin123</p>
              </div>
              <div className="text-left">
                <p><span className="font-medium">Utilisateur:</span> user</p>
                <p><span className="font-medium">Mot de passe:</span> user123</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 text-center text-xs text-gray-500 border-t">
          SuiviVente v1.0 - © 2024 Tous droits réservés
        </div>
      </div>
    </div>
  );
};

export default Login;