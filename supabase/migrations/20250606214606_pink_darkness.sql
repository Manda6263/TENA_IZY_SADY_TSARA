/*
  # Initial Schema Setup for SuiviVente

  1. New Tables
    - `sales` - Sales transactions with product details
    - `products` - Product inventory and pricing
    - `logs` - System activity logging
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only policies for sensitive operations
*/

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  product text NOT NULL,
  category text NOT NULL,
  subcategory text DEFAULT '',
  price decimal(10,2) NOT NULL,
  quantity integer NOT NULL,
  total decimal(10,2) NOT NULL,
  seller text NOT NULL,
  register text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  subcategory text DEFAULT '',
  initial_stock integer NOT NULL DEFAULT 0,
  current_stock integer NOT NULL DEFAULT 0,
  price decimal(10,2) NOT NULL,
  threshold integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Sales policies
CREATE POLICY "Users can read all sales"
  ON sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert sales"
  ON sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sales"
  ON sales
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete sales"
  ON sales
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Users can read all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Logs policies
CREATE POLICY "Users can read their own logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(seller);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date);
CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON sales 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();