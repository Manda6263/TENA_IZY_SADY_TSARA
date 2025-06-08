import { supabase } from '../lib/supabase';

// =============================================
// CATEGORIES SERVICE
// =============================================

export class CategoriesService {
  static async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    return data || [];
  }

  static async create(categoryData: {
    name: string;
    description?: string;
    color?: string;
    sort_order?: number;
  }) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

// =============================================
// SUPPLIERS SERVICE
// =============================================

export class SuppliersService {
  static async getAll() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async create(supplierData: {
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

// =============================================
// REGISTERS SERVICE
// =============================================

export class RegistersService {
  static async getAll() {
    const { data, error } = await supabase
      .from('registers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async create(registerData: {
    name: string;
    location?: string;
    opening_cash?: number;
  }) {
    const { data, error } = await supabase
      .from('registers')
      .insert([{
        ...registerData,
        current_cash: registerData.opening_cash || 0
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCash(id: string, amount: number, operation: 'add' | 'subtract' | 'set') {
    let updateQuery;
    
    if (operation === 'set') {
      updateQuery = { current_cash: amount };
    } else {
      // Use SQL to safely update cash amount
      const { data, error } = await supabase.rpc('update_register_cash', {
        register_id: id,
        amount: operation === 'add' ? amount : -amount
      });
      
      if (error) throw error;
      return data;
    }
    
    const { data, error } = await supabase
      .from('registers')
      .update(updateQuery)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// =============================================
// STOCK MOVEMENTS SERVICE
// =============================================

export class StockMovementsService {
  static async getAll(filters: {
    product_id?: string;
    movement_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  } = {}) {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, sku),
        user_profiles!performed_by (username)
      `)
      .order('created_at', { ascending: false });

    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    
    if (filters.movement_type) {
      query = query.eq('movement_type', filters.movement_type);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async create(movementData: {
    product_id: string;
    movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    unit_cost?: number;
    reference_type?: string;
    reference_id?: string;
    reason?: string;
  }) {
    const { data, error } = await supabase.rpc('create_stock_movement', {
      p_product_id: movementData.product_id,
      p_movement_type: movementData.movement_type,
      p_quantity: movementData.quantity,
      p_unit_cost: movementData.unit_cost,
      p_reference_type: movementData.reference_type,
      p_reference_id: movementData.reference_id,
      p_reason: movementData.reason
    });
    
    if (error) throw error;
    return data;
  }
}

// =============================================
// STOCK ALERTS SERVICE
// =============================================

export class StockAlertsService {
  static async getActive() {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select(`
        *,
        products (name, sku, current_stock, threshold)
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async resolve(id: string) {
    const { data, error } = await supabase
      .from('stock_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async bulkResolve(productIds: string[]) {
    const { data, error } = await supabase
      .from('stock_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .in('product_id', productIds)
      .eq('is_resolved', false);
    
    if (error) throw error;
    return data;
  }
}

// =============================================
// TRANSACTIONS SERVICE
// =============================================

export class TransactionsService {
  static async getAll(filters: {
    date_from?: string;
    date_to?: string;
    register_id?: string;
    seller_id?: string;
    status?: string;
    limit?: number;
  } = {}) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        registers (name),
        user_profiles!seller_id (username),
        payment_methods (name, type),
        transaction_items (
          *,
          products (name, sku)
        )
      `)
      .order('transaction_date', { ascending: false });

    if (filters.date_from) {
      query = query.gte('transaction_date', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('transaction_date', filters.date_to);
    }
    
    if (filters.register_id) {
      query = query.eq('register_id', filters.register_id);
    }
    
    if (filters.seller_id) {
      query = query.eq('seller_id', filters.seller_id);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async create(transactionData: {
    register_id: string;
    customer_name?: string;
    payment_method_id?: string;
    payment_reference?: string;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }>;
    notes?: string;
  }) {
    const { data, error } = await supabase.rpc('process_sale_transaction', {
      p_register_id: transactionData.register_id,
      p_customer_name: transactionData.customer_name,
      p_payment_method_id: transactionData.payment_method_id,
      p_payment_reference: transactionData.payment_reference,
      p_items: JSON.stringify(transactionData.items),
      p_notes: transactionData.notes
    });
    
    if (error) throw error;
    return data;
  }

  static async cancel(id: string, reason: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Restore stock for cancelled transaction
    const { data: items } = await supabase
      .from('transaction_items')
      .select('product_id, quantity')
      .eq('transaction_id', id);
    
    if (items) {
      for (const item of items) {
        await StockMovementsService.create({
          product_id: item.product_id,
          movement_type: 'in',
          quantity: item.quantity,
          reference_type: 'cancellation',
          reference_id: id,
          reason: 'Transaction cancelled: ' + reason
        });
      }
    }
    
    return data;
  }
}

// =============================================
// ACTIVITY LOGS SERVICE
// =============================================

export class ActivityLogsService {
  static async getAll(filters: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  } = {}) {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user_profiles (username, email)
      `)
      .order('created_at', { ascending: false });

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async log(
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ) {
    const { data, error } = await supabase.rpc('log_activity', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_old_values: oldValues ? JSON.stringify(oldValues) : null,
      p_new_values: newValues ? JSON.stringify(newValues) : null
    });
    
    if (error) throw error;
    return data;
  }
}

// =============================================
// DASHBOARD SERVICE
// =============================================

export class DashboardService {
  static async getComprehensiveMetrics(dateFrom?: string, dateTo?: string) {
    const { data, error } = await supabase.rpc('get_comprehensive_dashboard_metrics', {
      date_from: dateFrom,
      date_to: dateTo
    });
    
    if (error) throw error;
    return data;
  }

  static async getDailySummaries(limit: number = 30) {
    const { data, error } = await supabase
      .from('daily_summaries')
      .select(`
        *,
        products!top_selling_product_id (name)
      `)
      .order('summary_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  static async generateDailySummary(date?: string) {
    const { data, error } = await supabase.rpc('generate_daily_summary', {
      summary_date: date || new Date().toISOString().split('T')[0]
    });
    
    if (error) throw error;
    return data;
  }
}

// =============================================
// SYSTEM SETTINGS SERVICE
// =============================================

export class SystemSettingsService {
  static async getAll(category?: string) {
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async getPublic() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('is_public', true);
    
    if (error) throw error;
    return data || [];
  }

  static async update(category: string, key: string, value: any) {
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value: JSON.stringify(value),
        updated_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('category', category)
      .eq('key', key)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async create(settingData: {
    category: string;
    key: string;
    value: any;
    data_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
    description?: string;
    is_public?: boolean;
  }) {
    const { data, error } = await supabase
      .from('system_settings')
      .insert([{
        ...settingData,
        value: JSON.stringify(settingData.value),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}