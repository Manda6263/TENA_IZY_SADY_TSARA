import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import ImportData from './pages/ImportData';
import ExportData from './pages/ExportData';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/ui/Toast';
import { useTheme } from './hooks/useTheme';
import './App.css';
import './i18n';

function App() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.className = resolvedTheme;
  }, [resolvedTheme]);

  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <AnimatePresence mode="wait">
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Login />
                    </motion.div>
                  } 
                />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route 
                    path="/" 
                    element={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Dashboard />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/sales" 
                    element={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Sales />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/inventory" 
                    element={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Inventory />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/import" 
                    element={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ImportData />
                      </motion.div>
                    
                    } 
                  />
                  <Route 
                    path="/export" 
                    element={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ExportData />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Admin />
                      </motion.div>
                    } 
                  />
                </Route>
              </Routes>
            </AnimatePresence>
            <Toast />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;