import { useState, useEffect, useRef } from 'react';
import { supabase, Sale, Product, Log } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Mock data for fallback when Supabase is not available
const mockSales: Sale[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    product: 'Fanta Orange',
    category: 'Boissons',
    subcategory: 'Sodas',
    price: 2.50,
    quantity: 5,
    total: 12.50,
    seller: 'Jean',
    register: 'Caisse 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    product: 'Coca-Cola',
    category: 'Boissons',
    subcategory: 'Sodas',
    price: 2.80,
    quantity: 10,
    total: 28.00,
    seller: 'Sophie',
    register: 'Caisse 2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fanta Orange',
    category: 'Boissons',
    subcategory: 'Sodas',
    initial_stock: 100,
    current_stock: 48,
    price: 2.50,
    threshold: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Coca-Cola',
    category: 'Boissons',
    subcategory: 'Sodas',
    initial_stock: 150,
    current_stock: 77,
    price: 2.80,
    threshold: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && 
         key && 
         url !== 'https://demo.supabase.co' && 
         url !== 'https://placeholder.supabase.co' &&
         key !== 'demo-key' && 
         key !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk3NzEyMDAsImV4cCI6MTk2NTM0NzIwMH0.placeholder';
};

// Retry utility function
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

// Custom hook for real-time sales data with retry logic
export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Data fetching effect (depends on retryCount)
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const fetchSales = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('Using mock data - Supabase not configured');
          setSales(mockSales);
          setError('Using offline mode - Please configure Supabase');
          setLoading(false);
          return;
        }

        const result = await retryOperation(async () => {
          const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });

          if (error) throw error;
          return data || [];
        });

        setSales(result);
        setError(null);
        setRetryCount(0);
      } catch (err) {
        console.error('Error fetching sales:', err);
        setError('Using offline mode - Connection failed');
        setSales(mockSales);
        
        // Schedule retry if not too many attempts
        if (retryCount < 3) {
          retryTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 5000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSales();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  // Real-time subscription effect (runs once on mount)
  useEffect(() => {
    // Set up real-time subscription only if Supabase is configured and channel doesn't exist
    if (isSupabaseConfigured() && !channelRef.current) {
      try {
        channelRef.current = supabase
          .channel('sales_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'sales' },
            (payload) => {
              console.log('Sales change detected:', payload);
              
              try {
                if (payload.eventType === 'INSERT') {
                  setSales(prev => [payload.new as Sale, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                  setSales(prev => prev.map(sale => 
                    sale.id === payload.new.id ? payload.new as Sale : sale
                  ));
                } else if (payload.eventType === 'DELETE') {
                  setSales(prev => prev.filter(sale => sale.id !== payload.old.id));
                }
              } catch (err) {
                console.error('Error processing real-time update:', err);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Sales real-time subscription active');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Sales real-time subscription error');
              setError('Real-time connection lost');
            }
          });
      } catch (err) {
        console.error('Error setting up real-time subscription:', err);
      }
    }

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, []); // Empty dependency array - runs once on mount

  const refetch = async () => {
    setLoading(true);
    setRetryCount(0);
    try {
      if (!isSupabaseConfigured()) {
        setSales(mockSales);
        setError('Using offline mode - Please configure Supabase');
        return;
      }

      const result = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
      });

      setSales(result);
      setError(null);
    } catch (err) {
      console.error('Error refetching sales:', err);
      setSales(mockSales);
      setError('Using offline mode - Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return { sales, loading, error, refetch, retryCount };
}

// Custom hook for real-time products data with retry logic
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Data fetching effect (depends on retryCount)
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    const fetchProducts = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('Using mock data - Supabase not configured');
          setProducts(mockProducts);
          setError('Using offline mode - Please configure Supabase');
          setLoading(false);
          return;
        }

        const result = await retryOperation(async () => {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');

          if (error) throw error;
          return data || [];
        });

        setProducts(result);
        setError(null);
        setRetryCount(0);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Using offline mode - Connection failed');
        setProducts(mockProducts);
        
        // Schedule retry if not too many attempts
        if (retryCount < 3) {
          retryTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 5000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryCount]);

  // Real-time subscription effect (runs once on mount)
  useEffect(() => {
    // Set up real-time subscription only if Supabase is configured and channel doesn't exist
    if (isSupabaseConfigured() && !channelRef.current) {
      try {
        channelRef.current = supabase
          .channel('products_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' },
            (payload) => {
              console.log('Products change detected:', payload);
              
              try {
                if (payload.eventType === 'INSERT') {
                  setProducts(prev => [...prev, payload.new as Product].sort((a, b) => a.name.localeCompare(b.name)));
                } else if (payload.eventType === 'UPDATE') {
                  setProducts(prev => prev.map(product => 
                    product.id === payload.new.id ? payload.new as Product : product
                  ));
                } else if (payload.eventType === 'DELETE') {
                  setProducts(prev => prev.filter(product => product.id !== payload.old.id));
                }
              } catch (err) {
                console.error('Error processing real-time update:', err);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Products real-time subscription active');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Products real-time subscription error');
              setError('Real-time connection lost');
            }
          });
      } catch (err) {
        console.error('Error setting up real-time subscription:', err);
      }
    }

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, []); // Empty dependency array - runs once on mount

  const refetch = async () => {
    setLoading(true);
    setRetryCount(0);
    try {
      if (!isSupabaseConfigured()) {
        setProducts(mockProducts);
        setError('Using offline mode - Please configure Supabase');
        return;
      }

      const result = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      });

      setProducts(result);
      setError(null);
    } catch (err) {
      console.error('Error refetching products:', err);
      setProducts(mockProducts);
      setError('Using offline mode - Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch, retryCount };
}

// Custom hook for real-time logs data
export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Data fetching effect (runs once on mount)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setLogs([]);
          setError('Using offline mode - Please configure Supabase');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLogs(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Using offline mode - Connection failed');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Real-time subscription effect (runs once on mount)
  useEffect(() => {
    // Set up real-time subscription only if Supabase is configured and channel doesn't exist
    if (isSupabaseConfigured() && !channelRef.current) {
      try {
        channelRef.current = supabase
          .channel('logs_changes')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'logs' },
            (payload) => {
              console.log('New log entry:', payload);
              setLogs(prev => [payload.new as Log, ...prev.slice(0, 99)]);
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error setting up real-time subscription:', err);
      }
    }

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (err) {
          console.error('Error removing channel:', err);
        }
      }
    };
  }, []); // Empty dependency array - runs once on mount

  const refetch = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setLogs([]);
        setError('Using offline mode - Please configure Supabase');
        return;
      }

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error refetching logs:', err);
      setLogs([]);
      setError('Using offline mode - Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, error, refetch };
}

// Combined hook for dashboard metrics with real-time updates
export function useDashboardMetrics() {
  const { sales } = useSales();
  const { products } = useProducts();

  const metrics = {
    totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
    totalQuantity: sales.reduce((sum, sale) => sum + sale.quantity, 0),
    totalStock: products.reduce((sum, product) => sum + product.current_stock, 0),
    averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
    lowStockProducts: products.filter(p => p.current_stock <= p.threshold && p.current_stock > 0),
    outOfStockProducts: products.filter(p => p.current_stock === 0),
    salesByCategory: sales.reduce((acc, sale) => {
      acc[sale.category] = (acc[sale.category] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>),
    salesBySeller: sales.reduce((acc, sale) => {
      acc[sale.seller] = (acc[sale.seller] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>)
  };

  return metrics;
}