import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id: string;
  username: string;
  role: 'admin' | 'user';
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    // Check if user data exists in local storage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real app, this would be an API call to validate credentials
    if (username === 'admin' && password === 'admin123') {
      const user = { id: '1', username: 'admin', role: 'admin' as const };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } else if (username === 'user' && password === 'user123') {
      const user = { id: '2', username: 'user', role: 'user' as const };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}