import { supabase, Sale, Product, Log } from '../lib/supabase';

// Sales Services
export class SalesService {
  static async addSale(saleData: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Start a transaction-like operation
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Update product stock automatically
      const { error: stockError } = await supabase.rpc('update_product_stock', {
        product_name: saleData.product,
        quantity_sold: saleData.quantity
      });

      if (stockError) {
        console.warn('Stock update failed:', stockError);
        // Don't throw error here as sale was successful
      }

      // Log the action
      await this.logAction('add_sale', `Added sale: ${saleData.product} (${saleData.quantity} units)`);

      return sale;
    } catch (error) {
      console.error('Error adding sale:', error);
      throw error;
    }
  }

  static async updateSale(id: string, updates: Partial<Sale>) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logAction('update_sale', `Updated sale #${id}`);
      return data;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  }

  static async deleteSale(id: string) {
    try {
      // Get sale details first for stock restoration
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the sale
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Restore product stock
      const { error: stockError } = await supabase.rpc('restore_product_stock', {
        product_name: sale.product,
        quantity_to_restore: sale.quantity
      });

      if (stockError) {
        console.warn('Stock restoration failed:', stockError);
      }

      await this.logAction('delete_sale', `Deleted sale: ${sale.product}`);
      return true;
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }

  static async getSalesWithFilters(filters: any = {}) {
    try {
      let query = supabase.from('sales').select('*');

      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.seller) {
        query = query.eq('seller', filters.seller);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.register) {
        query = query.eq('register', filters.register);
      }

      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }

  private static async logAction(action: string, details: string) {
    try {
      await supabase.from('logs').insert([{
        action,
        details,
        date: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }
}

// Products Services
export class ProductsService {
  static async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      await this.logAction('add_product', `Added product: ${productData.name}`);
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logAction('update_product', `Updated product #${id}`);
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string) {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('name')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await this.logAction('delete_product', `Deleted product: ${product.name}`);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async getProductsWithFilters(filters: any = {}) {
    try {
      let query = supabase.from('products').select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      if (filters.stockStatus) {
        if (filters.stockStatus === 'low') {
          query = query.filter('current_stock', 'lte', 'threshold');
        } else if (filters.stockStatus === 'out') {
          query = query.eq('current_stock', 0);
        } else if (filters.stockStatus === 'available') {
          query = query.gt('current_stock', 0);
        }
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async resetStock() {
    try {
      const { error } = await supabase.rpc('reset_all_stock');
      
      if (error) throw error;

      await this.logAction('reset_stock', 'Reset all product stock to initial values');
      return true;
    } catch (error) {
      console.error('Error resetting stock:', error);
      throw error;
    }
  }

  private static async logAction(action: string, details: string) {
    try {
      await supabase.from('logs').insert([{
        action,
        details,
        date: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }
}

// Import/Export Services
export class ImportExportService {
  static async importSales(salesData: any[]) {
    try {
      const results = {
        success: 0,
        duplicates: 0,
        errors: 0,
        errorDetails: [] as string[]
      };

      // Process in batches for better performance
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < salesData.length; i += batchSize) {
        batches.push(salesData.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const validSales = [];
        
        for (const saleData of batch) {
          try {
            // Check for duplicates
            const { data: existing } = await supabase
              .from('sales')
              .select('id')
              .eq('date', saleData.date)
              .eq('product', saleData.product)
              .eq('quantity', saleData.quantity)
              .eq('seller', saleData.seller)
              .eq('register', saleData.register)
              .eq('total', saleData.total)
              .single();

            if (existing) {
              results.duplicates++;
              continue;
            }

            // Validate required fields
            if (!saleData.date || !saleData.product || !saleData.seller || 
                !saleData.quantity || !saleData.total) {
              results.errors++;
              results.errorDetails.push(`Missing required fields for ${saleData.product}`);
              continue;
            }

            validSales.push({
              date: saleData.date,
              product: saleData.product,
              category: saleData.category || 'Non spécifié',
              subcategory: saleData.subcategory || '',
              price: parseFloat(saleData.price) || 0,
              quantity: parseInt(saleData.quantity) || 0,
              total: parseFloat(saleData.total) || 0,
              seller: saleData.seller,
              register: saleData.register || 'Import'
            });

          } catch (error) {
            results.errors++;
            results.errorDetails.push(`Error processing ${saleData.product}: ${error}`);
          }
        }

        // Bulk insert valid sales
        if (validSales.length > 0) {
          const { data, error } = await supabase
            .from('sales')
            .insert(validSales)
            .select();

          if (error) {
            results.errors += validSales.length;
            results.errorDetails.push(`Bulk insert error: ${error.message}`);
          } else {
            results.success += data?.length || 0;
            
            // Update stock for each product
            for (const sale of validSales) {
              try {
                await supabase.rpc('update_product_stock', {
                  product_name: sale.product,
                  quantity_sold: sale.quantity
                });
              } catch (stockError) {
                console.warn(`Stock update failed for ${sale.product}:`, stockError);
              }
            }
          }
        }
      }

      await this.logAction('import_sales', 
        `Imported ${results.success} sales, ${results.duplicates} duplicates, ${results.errors} errors`
      );

      return results;
    } catch (error) {
      console.error('Error importing sales:', error);
      throw error;
    }
  }

  static async exportData(options: {
    dataType: 'sales' | 'products' | 'all';
    dateRange?: { start: string; end: string };
  }) {
    try {
      let data: any[] = [];

      if (options.dataType === 'sales' || options.dataType === 'all') {
        const sales = await SalesService.getSalesWithFilters(options.dateRange ? {
          dateFrom: options.dateRange.start,
          dateTo: options.dateRange.end
        } : {});
        data = [...data, ...sales];
      }

      if (options.dataType === 'products' || options.dataType === 'all') {
        const products = await ProductsService.getProductsWithFilters();
        data = [...data, ...products];
      }

      await this.logAction('export_data', `Exported ${options.dataType} data (${data.length} records)`);
      
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  private static async logAction(action: string, details: string) {
    try {
      await supabase.from('logs').insert([{
        action,
        details,
        date: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }
}