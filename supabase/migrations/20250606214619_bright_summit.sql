/*
  # Sample Data for SuiviVente

  1. Sample Products
    - Various categories (Boissons, Alimentation)
    - Different subcategories and stock levels
    
  2. Sample Sales
    - Historical sales data
    - Multiple sellers and registers
*/

-- Insert sample products
INSERT INTO products (name, category, subcategory, initial_stock, current_stock, price, threshold) VALUES
  ('Fanta Orange', 'Boissons', 'Sodas', 100, 48, 2.50, 20),
  ('Coca-Cola', 'Boissons', 'Sodas', 150, 77, 2.80, 30),
  ('Sandwich Jambon', 'Alimentation', 'Sandwichs', 80, 35, 4.50, 15),
  ('Eau Minérale', 'Boissons', 'Eaux', 200, 113, 1.20, 40),
  ('Chips Sel', 'Alimentation', 'Snacks', 120, 52, 1.80, 25),
  ('Café Expresso', 'Boissons', 'Café', 90, 67, 1.50, 20),
  ('Croissant', 'Alimentation', 'Viennoiseries', 60, 23, 1.20, 10),
  ('Jus d''Orange', 'Boissons', 'Jus', 80, 45, 2.20, 15),
  ('Salade César', 'Alimentation', 'Salades', 40, 18, 5.50, 8),
  ('Thé Vert', 'Boissons', 'Thé', 70, 34, 1.80, 15)
ON CONFLICT (name) DO NOTHING;

-- Insert sample sales (recent dates)
INSERT INTO sales (date, product, category, subcategory, price, quantity, total, seller, register) VALUES
  (CURRENT_DATE - INTERVAL '1 day', 'Fanta Orange', 'Boissons', 'Sodas', 2.50, 5, 12.50, 'Jean', 'Caisse 1'),
  (CURRENT_DATE - INTERVAL '1 day', 'Coca-Cola', 'Boissons', 'Sodas', 2.80, 10, 28.00, 'Sophie', 'Caisse 2'),
  (CURRENT_DATE - INTERVAL '2 days', 'Sandwich Jambon', 'Alimentation', 'Sandwichs', 4.50, 8, 36.00, 'Thomas', 'Caisse 1'),
  (CURRENT_DATE - INTERVAL '2 days', 'Eau Minérale', 'Boissons', 'Eaux', 1.20, 15, 18.00, 'Marie', 'Caisse 3'),
  (CURRENT_DATE - INTERVAL '3 days', 'Chips Sel', 'Alimentation', 'Snacks', 1.80, 12, 21.60, 'Jean', 'Caisse 2'),
  (CURRENT_DATE - INTERVAL '3 days', 'Café Expresso', 'Boissons', 'Café', 1.50, 20, 30.00, 'Sophie', 'Caisse 1'),
  (CURRENT_DATE - INTERVAL '4 days', 'Croissant', 'Alimentation', 'Viennoiseries', 1.20, 15, 18.00, 'Thomas', 'Caisse 2'),
  (CURRENT_DATE - INTERVAL '4 days', 'Jus d''Orange', 'Boissons', 'Jus', 2.20, 8, 17.60, 'Marie', 'Caisse 3'),
  (CURRENT_DATE - INTERVAL '5 days', 'Salade César', 'Alimentation', 'Salades', 5.50, 6, 33.00, 'Jean', 'Caisse 1'),
  (CURRENT_DATE - INTERVAL '5 days', 'Thé Vert', 'Boissons', 'Thé', 1.80, 12, 21.60, 'Sophie', 'Caisse 2'),
  (CURRENT_DATE, 'Fanta Orange', 'Boissons', 'Sodas', 2.50, 3, 7.50, 'Thomas', 'Caisse 1'),
  (CURRENT_DATE, 'Coca-Cola', 'Boissons', 'Sodas', 2.80, 7, 19.60, 'Marie', 'Caisse 3'),
  (CURRENT_DATE, 'Eau Minérale', 'Boissons', 'Eaux', 1.20, 10, 12.00, 'Jean', 'Caisse 2'),
  (CURRENT_DATE, 'Sandwich Jambon', 'Alimentation', 'Sandwichs', 4.50, 4, 18.00, 'Sophie', 'Caisse 1'),
  (CURRENT_DATE, 'Chips Sel', 'Alimentation', 'Snacks', 1.80, 6, 10.80, 'Thomas', 'Caisse 3');

-- Insert initial system log
INSERT INTO logs (action, details) VALUES
  ('system_initialization', 'Database initialized with sample data for SuiviVente application');