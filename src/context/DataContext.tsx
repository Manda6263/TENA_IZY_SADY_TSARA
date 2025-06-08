import React, { createContext, useContext, ReactNode } from 'react';
import { useSales, useProducts, useLogs, useDashboardMetrics } from '../hooks/useSupabaseData';
import { SalesService, ProductsService, ImportExportService } from '../services/supabaseService';

interface DataContextType {
  // Data hooks
  sales: ReturnType<typeof useSales>;
  products: ReturnType<typeof useProducts>;
  logs: ReturnType<typeof useLogs>;
  metrics: ReturnType<typeof useDashboardMetrics>;
  
  // Service methods
  salesService: typeof SalesService;
  productsService: typeof ProductsService;
  importExportService: typeof ImportExportService;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const sales = useSales();
  const products = useProducts();
  const logs = useLogs();
  const metrics = useDashboardMetrics();

  const value = {
    sales,
    products,
    logs,
    metrics,
    salesService: SalesService,
    productsService: ProductsService,
    importExportService: ImportExportService,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}