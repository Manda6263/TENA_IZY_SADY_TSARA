-- Function to update product stock when a sale is made
CREATE OR REPLACE FUNCTION update_product_stock(product_name text, quantity_sold integer)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET current_stock = current_stock - quantity_sold,
      updated_at = now()
  WHERE name = product_name;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Product % not found for stock update', product_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to restore product stock when a sale is deleted
CREATE OR REPLACE FUNCTION restore_product_stock(product_name text, quantity_to_restore integer)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET current_stock = current_stock + quantity_to_restore,
      updated_at = now()
  WHERE name = product_name;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Product % not found for stock restoration', product_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reset all product stock to initial values
CREATE OR REPLACE FUNCTION reset_all_stock()
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET current_stock = initial_stock,
      updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update stock when sales are inserted
CREATE OR REPLACE FUNCTION trigger_update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock when a new sale is inserted
  IF TG_OP = 'INSERT' THEN
    PERFORM update_product_stock(NEW.product, NEW.quantity);
    RETURN NEW;
  END IF;
  
  -- Restore stock when a sale is deleted
  IF TG_OP = 'DELETE' THEN
    PERFORM restore_product_stock(OLD.product, OLD.quantity);
    RETURN OLD;
  END IF;
  
  -- Handle updates (restore old quantity, deduct new quantity)
  IF TG_OP = 'UPDATE' THEN
    -- Only update stock if product or quantity changed
    IF OLD.product != NEW.product OR OLD.quantity != NEW.quantity THEN
      PERFORM restore_product_stock(OLD.product, OLD.quantity);
      PERFORM update_product_stock(NEW.product, NEW.quantity);
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock updates
DROP TRIGGER IF EXISTS auto_update_stock_on_sale ON sales;
CREATE TRIGGER auto_update_stock_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_stock_on_sale();

-- Function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  WITH filtered_sales AS (
    SELECT * FROM sales 
    WHERE (date_from IS NULL OR date >= date_from)
      AND (date_to IS NULL OR date <= date_to)
  ),
  metrics AS (
    SELECT 
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(quantity), 0) as total_quantity,
      COALESCE(COUNT(*), 0) as total_transactions,
      COALESCE(AVG(total), 0) as average_sale
    FROM filtered_sales
  ),
  stock_metrics AS (
    SELECT 
      COALESCE(SUM(current_stock), 0) as total_stock,
      COUNT(CASE WHEN current_stock <= threshold THEN 1 END) as low_stock_count,
      COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_count
    FROM products
  ),
  category_sales AS (
    SELECT json_object_agg(category, total) as sales_by_category
    FROM (
      SELECT category, SUM(total) as total
      FROM filtered_sales
      GROUP BY category
    ) cat_sales
  ),
  seller_sales AS (
    SELECT json_object_agg(seller, total) as sales_by_seller
    FROM (
      SELECT seller, SUM(total) as total
      FROM filtered_sales
      GROUP BY seller
    ) sell_sales
  )
  SELECT json_build_object(
    'totalSales', m.total_sales,
    'totalQuantity', m.total_quantity,
    'totalTransactions', m.total_transactions,
    'averageSale', m.average_sale,
    'totalStock', sm.total_stock,
    'lowStockCount', sm.low_stock_count,
    'outOfStockCount', sm.out_of_stock_count,
    'salesByCategory', COALESCE(cs.sales_by_category, '{}'::json),
    'salesBySeller', COALESCE(ss.sales_by_seller, '{}'::json)
  ) INTO result
  FROM metrics m, stock_metrics sm, category_sales cs, seller_sales ss;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;