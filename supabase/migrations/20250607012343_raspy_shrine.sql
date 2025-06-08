/*
  # Sample Data for Complete Schema
  
  Insert sample data for all new tables to demonstrate functionality
*/

-- Insert sample categories
INSERT INTO categories (name, description, color, sort_order) VALUES
  ('Boissons', 'Toutes les boissons', '#3B82F6', 1),
  ('Alimentation', 'Produits alimentaires', '#10B981', 2),
  ('Snacks', 'Collations et en-cas', '#F59E0B', 3),
  ('Hygiène', 'Produits d''hygiène', '#8B5CF6', 4),
  ('Divers', 'Autres produits', '#6B7280', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample subcategories
INSERT INTO subcategories (category_id, name, sort_order) 
SELECT c.id, subcat.name, subcat.sort_order
FROM categories c
CROSS JOIN (VALUES
  ('Boissons', 'Sodas', 1),
  ('Boissons', 'Eaux', 2),
  ('Boissons', 'Jus', 3),
  ('Boissons', 'Café', 4),
  ('Boissons', 'Thé', 5),
  ('Alimentation', 'Sandwichs', 1),
  ('Alimentation', 'Salades', 2),
  ('Alimentation', 'Plats chauds', 3),
  ('Alimentation', 'Desserts', 4),
  ('Snacks', 'Chips', 1),
  ('Snacks', 'Biscuits', 2),
  ('Snacks', 'Chocolats', 3),
  ('Snacks', 'Bonbons', 4),
  ('Hygiène', 'Savons', 1),
  ('Hygiène', 'Dentifrice', 2),
  ('Divers', 'Accessoires', 1)
) AS subcat(category_name, name, sort_order)
WHERE c.name = subcat.category_name
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
  ('Coca-Cola France', 'Jean Martin', 'contact@coca-cola.fr', '01.23.45.67.89', '92100 Boulogne-Billancourt'),
  ('Danone', 'Marie Dubois', 'pro@danone.fr', '01.34.56.78.90', '75009 Paris'),
  ('Nestlé France', 'Pierre Durand', 'b2b@nestle.fr', '01.45.67.89.01', '77186 Noisiel'),
  ('Unilever', 'Sophie Bernard', 'contact@unilever.fr', '01.56.78.90.12', '92200 Neuilly-sur-Seine'),
  ('Fournisseur Local', 'Paul Moreau', 'contact@local.fr', '01.67.89.01.23', '75001 Paris')
ON CONFLICT (name) DO NOTHING;

-- Insert sample registers
INSERT INTO registers (name, location, current_cash, opening_cash) VALUES
  ('Caisse 1', 'Entrée principale', 150.00, 100.00),
  ('Caisse 2', 'Zone self-service', 200.00, 150.00),
  ('Caisse 3', 'Sortie rapide', 100.00, 50.00)
ON CONFLICT (name) DO NOTHING;

-- Insert sample payment methods
INSERT INTO payment_methods (name, type, requires_reference) VALUES
  ('Espèces', 'cash', false),
  ('Carte Bancaire', 'card', true),
  ('Chèque', 'check', true),
  ('Virement', 'transfer', true),
  ('Ticket Restaurant', 'other', false)
ON CONFLICT (name) DO NOTHING;

-- Update existing products with new fields
UPDATE products SET 
  category_id = (SELECT id FROM categories WHERE name = products.category LIMIT 1),
  subcategory_id = (SELECT s.id FROM subcategories s 
                   JOIN categories c ON s.category_id = c.id 
                   WHERE c.name = products.category AND s.name = products.subcategory LIMIT 1),
  supplier_id = (SELECT id FROM suppliers ORDER BY random() LIMIT 1),
  barcode = '123456789' || LPAD((random() * 1000)::int::text, 3, '0'),
  sku = 'SKU-' || UPPER(LEFT(name, 3)) || '-' || LPAD((random() * 1000)::int::text, 3, '0'),
  unit = 'unit',
  cost_price = price * 0.6, -- 40% margin
  margin_percent = 40.0,
  is_active = true,
  reorder_point = threshold,
  max_stock = initial_stock * 2
WHERE category_id IS NULL;

-- Insert sample system settings
INSERT INTO system_settings (category, key, value, data_type, description, is_public) VALUES
  ('general', 'app_name', '"SuiviVente"', 'string', 'Application name', true),
  ('general', 'company_name', '"Ma Boutique"', 'string', 'Company name', true),
  ('general', 'currency', '"EUR"', 'string', 'Default currency', true),
  ('general', 'timezone', '"Europe/Paris"', 'string', 'Default timezone', true),
  ('general', 'language', '"fr"', 'string', 'Default language', true),
  ('alerts', 'low_stock_threshold', '10', 'number', 'Default low stock threshold', false),
  ('alerts', 'email_notifications', 'true', 'boolean', 'Enable email notifications', false),
  ('sales', 'auto_print_receipt', 'true', 'boolean', 'Auto print receipts', false),
  ('sales', 'require_customer_info', 'false', 'boolean', 'Require customer information', false),
  ('backup', 'auto_backup_enabled', 'true', 'boolean', 'Enable automatic backups', false),
  ('backup', 'backup_frequency', '"daily"', 'string', 'Backup frequency', false)
ON CONFLICT (category, key) DO NOTHING;

-- Insert sample stock movements for existing products
INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, reference_type, reason, performed_by)
SELECT 
  p.id,
  'in',
  p.initial_stock,
  p.cost_price,
  'initial',
  'Initial stock entry',
  (SELECT id FROM auth.users LIMIT 1)
FROM products p
WHERE p.initial_stock > 0;

-- Create sample stock alerts for low stock products
INSERT INTO stock_alerts (product_id, alert_type, threshold_value, current_value)
SELECT 
  p.id,
  CASE 
    WHEN p.current_stock = 0 THEN 'out_of_stock'
    WHEN p.current_stock <= p.threshold THEN 'low_stock'
    ELSE 'low_stock'
  END,
  p.threshold,
  p.current_stock
FROM products p
WHERE p.current_stock <= p.threshold;

-- Insert sample daily summary for today
INSERT INTO daily_summaries (
  summary_date,
  total_sales,
  total_transactions,
  total_items_sold,
  average_transaction,
  cash_sales,
  card_sales,
  top_selling_product_id,
  top_selling_quantity
)
SELECT 
  CURRENT_DATE,
  COALESCE(SUM(s.total), 0),
  COUNT(s.id),
  COALESCE(SUM(s.quantity), 0),
  COALESCE(AVG(s.total), 0),
  COALESCE(SUM(CASE WHEN s.register = 'Caisse 1' THEN s.total ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN s.register != 'Caisse 1' THEN s.total ELSE 0 END), 0),
  (SELECT p.id FROM products p JOIN sales s2 ON p.name = s2.product 
   WHERE s2.date = CURRENT_DATE GROUP BY p.id ORDER BY SUM(s2.quantity) DESC LIMIT 1),
  (SELECT SUM(s2.quantity) FROM sales s2 
   WHERE s2.date = CURRENT_DATE AND s2.product = (
     SELECT s3.product FROM sales s3 WHERE s3.date = CURRENT_DATE 
     GROUP BY s3.product ORDER BY SUM(s3.quantity) DESC LIMIT 1
   ))
FROM sales s
WHERE s.date = CURRENT_DATE
ON CONFLICT (summary_date) DO NOTHING;