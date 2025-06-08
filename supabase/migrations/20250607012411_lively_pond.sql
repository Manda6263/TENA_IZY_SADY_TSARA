/*
  # Helper Functions for Complete Schema
  
  Advanced functions for stock management, reporting, and automation
*/

-- =============================================
-- STOCK MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create stock movement and update product stock
CREATE OR REPLACE FUNCTION create_stock_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_unit_cost decimal DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  movement_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Insert stock movement
  INSERT INTO stock_movements (
    product_id, movement_type, quantity, unit_cost, 
    reference_type, reference_id, reason, performed_by
  ) VALUES (
    p_product_id, p_movement_type, p_quantity, p_unit_cost,
    p_reference_type, p_reference_id, p_reason, current_user_id
  ) RETURNING id INTO movement_id;
  
  -- Update product stock
  IF p_movement_type = 'in' THEN
    UPDATE products 
    SET current_stock = current_stock + p_quantity,
        updated_at = now()
    WHERE id = p_product_id;
  ELSIF p_movement_type = 'out' THEN
    UPDATE products 
    SET current_stock = current_stock - p_quantity,
        updated_at = now()
    WHERE id = p_product_id;
  ELSIF p_movement_type = 'adjustment' THEN
    UPDATE products 
    SET current_stock = p_quantity,
        updated_at = now()
    WHERE id = p_product_id;
  END IF;
  
  -- Check for stock alerts
  PERFORM check_stock_alerts(p_product_id);
  
  RETURN movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and create stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts(p_product_id uuid)
RETURNS void AS $$
DECLARE
  product_record products%ROWTYPE;
  alert_type text;
BEGIN
  -- Get product details
  SELECT * INTO product_record FROM products WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Determine alert type
  IF product_record.current_stock = 0 THEN
    alert_type := 'out_of_stock';
  ELSIF product_record.current_stock <= product_record.threshold THEN
    alert_type := 'low_stock';
  ELSE
    -- Resolve existing alerts if stock is above threshold
    UPDATE stock_alerts 
    SET is_resolved = true, resolved_at = now(), resolved_by = auth.uid()
    WHERE product_id = p_product_id AND is_resolved = false;
    RETURN;
  END IF;
  
  -- Create alert if it doesn't exist
  INSERT INTO stock_alerts (product_id, alert_type, threshold_value, current_value)
  VALUES (p_product_id, alert_type, product_record.threshold, product_record.current_stock)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process sale and update stock
CREATE OR REPLACE FUNCTION process_sale_transaction(
  p_register_id uuid,
  p_customer_name text DEFAULT NULL,
  p_payment_method_id uuid DEFAULT NULL,
  p_payment_reference text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_notes text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  transaction_id uuid;
  transaction_number text;
  item jsonb;
  subtotal decimal := 0;
  total_amount decimal := 0;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Generate transaction number
  transaction_number := 'TXN-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                       LPAD(EXTRACT(epoch FROM now())::bigint::text, 10, '0');
  
  -- Create transaction header
  INSERT INTO transactions (
    transaction_number, register_id, seller_id, customer_name,
    payment_method_id, payment_reference, notes
  ) VALUES (
    transaction_number, p_register_id, current_user_id, p_customer_name,
    p_payment_method_id, p_payment_reference, p_notes
  ) RETURNING id INTO transaction_id;
  
  -- Process each item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert transaction item
    INSERT INTO transaction_items (
      transaction_id, product_id, product_name, quantity, unit_price, line_total
    ) VALUES (
      transaction_id,
      (item->>'product_id')::uuid,
      item->>'product_name',
      (item->>'quantity')::integer,
      (item->>'unit_price')::decimal,
      (item->>'line_total')::decimal
    );
    
    -- Update stock
    PERFORM create_stock_movement(
      (item->>'product_id')::uuid,
      'out',
      (item->>'quantity')::integer,
      NULL,
      'sale',
      transaction_id,
      'Sale transaction'
    );
    
    -- Add to subtotal
    subtotal := subtotal + (item->>'line_total')::decimal;
  END LOOP;
  
  -- Update transaction totals
  total_amount := subtotal; -- Add tax/discount logic here if needed
  
  UPDATE transactions 
  SET subtotal = subtotal, total_amount = total_amount, updated_at = now()
  WHERE id = transaction_id;
  
  -- Log activity
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (current_user_id, 'create', 'transaction', transaction_id, 
          jsonb_build_object('total', total_amount, 'items_count', jsonb_array_length(p_items)));
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- REPORTING FUNCTIONS
-- =============================================

-- Function to generate daily summary
CREATE OR REPLACE FUNCTION generate_daily_summary(summary_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  daily_data record;
BEGIN
  -- Calculate daily metrics
  SELECT 
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COUNT(t.id) as total_transactions,
    COALESCE(SUM(ti.quantity), 0) as total_items_sold,
    COALESCE(AVG(t.total_amount), 0) as average_transaction,
    COALESCE(SUM(CASE WHEN pm.type = 'cash' THEN t.total_amount ELSE 0 END), 0) as cash_sales,
    COALESCE(SUM(CASE WHEN pm.type = 'card' THEN t.total_amount ELSE 0 END), 0) as card_sales
  INTO daily_data
  FROM transactions t
  LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
  LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
  WHERE DATE(t.transaction_date) = summary_date
    AND t.status = 'completed';
  
  -- Get top selling product
  WITH top_product AS (
    SELECT ti.product_id, SUM(ti.quantity) as total_qty
    FROM transactions t
    JOIN transaction_items ti ON t.id = ti.transaction_id
    WHERE DATE(t.transaction_date) = summary_date
      AND t.status = 'completed'
    GROUP BY ti.product_id
    ORDER BY total_qty DESC
    LIMIT 1
  )
  
  -- Insert or update daily summary
  INSERT INTO daily_summaries (
    summary_date, total_sales, total_transactions, total_items_sold,
    average_transaction, cash_sales, card_sales, top_selling_product_id, top_selling_quantity
  )
  SELECT 
    summary_date,
    daily_data.total_sales,
    daily_data.total_transactions,
    daily_data.total_items_sold,
    daily_data.average_transaction,
    daily_data.cash_sales,
    daily_data.card_sales,
    tp.product_id,
    tp.total_qty
  FROM top_product tp
  ON CONFLICT (summary_date) 
  DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    total_transactions = EXCLUDED.total_transactions,
    total_items_sold = EXCLUDED.total_items_sold,
    average_transaction = EXCLUDED.average_transaction,
    cash_sales = EXCLUDED.cash_sales,
    card_sales = EXCLUDED.card_sales,
    top_selling_product_id = EXCLUDED.top_selling_product_id,
    top_selling_quantity = EXCLUDED.top_selling_quantity,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive dashboard metrics
CREATE OR REPLACE FUNCTION get_comprehensive_dashboard_metrics(
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  sales_data record;
  stock_data record;
  alerts_data record;
BEGIN
  -- Set default date range if not provided
  IF date_from IS NULL THEN
    date_from := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  IF date_to IS NULL THEN
    date_to := CURRENT_DATE;
  END IF;
  
  -- Get sales metrics
  SELECT 
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COALESCE(SUM(ti.quantity), 0) as total_quantity,
    COUNT(DISTINCT t.id) as total_transactions,
    COALESCE(AVG(t.total_amount), 0) as average_transaction
  INTO sales_data
  FROM transactions t
  LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
  WHERE DATE(t.transaction_date) BETWEEN date_from AND date_to
    AND t.status = 'completed';
  
  -- Get stock metrics
  SELECT 
    COALESCE(SUM(current_stock), 0) as total_stock,
    COALESCE(SUM(current_stock * price), 0) as total_stock_value,
    COUNT(*) as total_products,
    COUNT(CASE WHEN current_stock <= threshold THEN 1 END) as low_stock_count,
    COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count
  INTO stock_data
  FROM products
  WHERE is_active = true;
  
  -- Get alerts data
  SELECT 
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN is_resolved = false THEN 1 END) as active_alerts
  INTO alerts_data
  FROM stock_alerts;
  
  -- Build result JSON
  result := jsonb_build_object(
    'sales', jsonb_build_object(
      'totalSales', sales_data.total_sales,
      'totalQuantity', sales_data.total_quantity,
      'totalTransactions', sales_data.total_transactions,
      'averageTransaction', sales_data.average_transaction
    ),
    'stock', jsonb_build_object(
      'totalStock', stock_data.total_stock,
      'totalStockValue', stock_data.total_stock_value,
      'totalProducts', stock_data.total_products,
      'lowStockCount', stock_data.low_stock_count,
      'outOfStockCount', stock_data.out_of_stock_count
    ),
    'alerts', jsonb_build_object(
      'totalAlerts', alerts_data.total_alerts,
      'activeAlerts', alerts_data.active_alerts
    ),
    'dateRange', jsonb_build_object(
      'from', date_from,
      'to', date_to
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ACTIVITY LOGGING FUNCTION
-- =============================================

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  INSERT INTO activity_logs (
    user_id, action, resource_type, resource_id, old_values, new_values
  ) VALUES (
    current_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUTOMATED TRIGGERS
-- =============================================

-- Trigger to automatically log product changes
CREATE OR REPLACE FUNCTION trigger_log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity('create', 'product', NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity('update', 'product', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity('delete', 'product', OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product logging
DROP TRIGGER IF EXISTS log_product_changes ON products;
CREATE TRIGGER log_product_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_product_changes();

-- Trigger to automatically generate daily summaries
CREATE OR REPLACE FUNCTION trigger_generate_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate summary for the transaction date
  PERFORM generate_daily_summary(DATE(NEW.transaction_date));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for daily summary generation
DROP TRIGGER IF EXISTS auto_generate_daily_summary ON transactions;
CREATE TRIGGER auto_generate_daily_summary
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION trigger_generate_daily_summary();