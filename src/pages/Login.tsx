import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Lock, Mail, Eye, EyeOff, AlertCircle, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('Au moins 8 caractères');
    if (!/[A-Z]/.test(password)) errors.push('Une majuscule');
    if (!/[a-z]/.test(password)) errors.push('Une minuscule');
    if (!/\d/.test(password)) errors.push('Un chiffre');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Un caractère spécial');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Common validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (isLoginMode) {
      // Login validation
      setIsLoading(true);
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
      setIsLoading(false);
    } else {
      // Registration validation
      if (!username.trim()) {
        setError('Le nom d\'utilisateur est requis');
        return;
      }

      if (username.length < 3) {
        setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
        return;
      }

      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setError('Le mot de passe doit contenir: ' + passwordErrors.join(', '));
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      setIsLoading(true);
      const success = await register(email, password, username, firstName, lastName);
      if (success) {
        setIsLoginMode(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setFirstName('');
        setLastName('');
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !validateEmail(resetEmail)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    const success = await resetPassword(resetEmail);
    if (success) {
      setResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
        setResetEmail('');
        setError('');
      }, 3000);
    }
  };

  const handleContactAdmin = () => {
    const subject = encodeURIComponent('Demande d\'assistance - SuiviVente');
    const body = encodeURIComponent(`Bonjour,

Je souhaite obtenir de l'aide concernant SuiviVente.

Détails de ma demande:
[Veuillez décrire votre demande ici]

Cordialement,
[Votre nom]`);
    
    window.location.href = `mailto:support@suivivente.com?subject=${subject}&body=${body}`;
  };

  // Contact Form Component
  const ContactForm = () => {
    const [contactData, setContactData] = useState({
      name: '',
      email: '',
      message: ''
    });
    const [sending, setSending] = useState(false);

    const handleContactSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      
      // Simulate sending (in real app, would send to backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Open email client as fallback
      const subject = encodeURIComponent('Demande d\'assistance - SuiviVente');
      const body = encodeURIComponent(`Nom: ${contactData.name}
Email: ${contactData.email}

Message:
${contactData.message}`);
      
      window.location.href = `mailto:support@suivivente.com?subject=${subject}&body=${body}`;
      
      setSending(false);
      setShowContactForm(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contacter l'administrateur</h2>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="form-label">Nom complet *</label>
              <input
                type="text"
                value={contactData.name}
                onChange={(e) => setContactData({...contactData, name: e.target.value})}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Email *</label>
              <input
                type="email"
                value={contactData.email}
                onChange={(e) => setContactData({...contactData, email: e.target.value})}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Message *</label>
              <textarea
                value={contactData.message}
                onChange={(e) => setContactData({...contactData, message: e.target.value})}
                className="form-input h-24 resize-none"
                placeholder="Décrivez votre demande..."
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowContactForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Forgot Password Modal
  const ForgotPasswordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Réinitialiser le mot de passe</h2>
        
        {resetSuccess ? (
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-3 inline-block mb-4">
              <Mail size={24} className="text-green-600" />
            </div>
            <p className="text-green-700 mb-4">
              Un email de réinitialisation a été envoyé à <strong>{resetEmail}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Vérifiez votre boîte de réception et suivez les instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <p className="text-gray-600 mb-4">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
            
            <div className="mb-4">
              <label className="form-label">Adresse email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="form-input"
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <BarChart size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SuiviVente</h1>
          <p className="text-gray-600">
            {isLoginMode ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle size={20} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 text-sm font-medium">
                    {isLoginMode ? 'Erreur de connexion' : 'Erreur d\'inscription'}
                  </p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Registration Fields */}
              {!isLoginMode && (
                <>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom d'utilisateur *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="nom_utilisateur"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Jean"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder={isLoginMode ? "Entrez votre mot de passe" : "Créez un mot de passe sécurisé"}
                    autoComplete={isLoginMode ? "current-password" : "new-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isLoginMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    8+ caractères, majuscule, minuscule, chiffre et caractère spécial
                  </p>
                )}
              </div>

              {/* Confirm Password Field (Registration only) */}
              {!isLoginMode && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Confirmez votre mot de passe"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Link (Login only) */}
              {isLoginMode && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLoginMode ? 'Connexion en cours...' : 'Inscription en cours...'}
                  </>
                ) : (
                  isLoginMode ? 'Se connecter' : 'Créer le compte'
                )}
              </button>
            </form>

            {/* Mode Toggle */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                {isLoginMode ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}{' '}
                <button
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setUsername('');
                    setFirstName('');
                    setLastName('');
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  {isLoginMode ? 'Créer un nouveau compte' : 'Se connecter'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Contact Administrator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Besoin d'aide ou d'un accès administrateur ?
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleContactAdmin}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              📧 Contacter par email
            </button>
            <button
              onClick={() => setShowContactForm(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              📝 Formulaire de contact
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            SuiviVente v1.0 - © 2024 Tous droits réservés
          </p>
        </div>
      </div>

      {/* Modals */}
      {showForgotPassword && <ForgotPasswordModal />}
      {showContactForm && <ContactForm />}
    </div>
  );
};

export default Login;