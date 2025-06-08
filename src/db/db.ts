import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Sale {
  id?: number;
  date: string;
  product: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  total: number;
  seller: string;
  register: string;
}

export interface Product {
  id?: number;
  name: string;
  category: string;
  subcategory: string;
  initialStock: number;
  currentStock: number;
  price: number;
  threshold: number;
}

export interface User {
  id?: number;
  username: string;
  password: string;
  role: string;
  lastLogin?: string;
}

export interface Log {
  id?: number;
  date: string;
  user: string;
  action: string;
  details: string;
}

// Define the database
class SuiviVenteDB extends Dexie {
  sales!: Table<Sale, number>;
  products!: Table<Product, number>;
  users!: Table<User, number>;
  logs!: Table<Log, number>;

  constructor() {
    super('suiviVenteDB');
    
    this.version(1).stores({
      sales: '++id, date, product, category, seller, register',
      products: '++id, name, category, subcategory, currentStock',
      users: '++id, username, role',
      logs: '++id, date, user, action'
    });
    
    // Add hooks or initialize data here if needed
    this.on('populate', () => this.populateInitialData());
  }
  
  // Add some initial sample data
  async populateInitialData() {
    // Add default users
    await this.users.bulkAdd([
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' }
    ]);
    
    // Add sample products
    const products = [
      { name: 'Fanta Orange', category: 'Boissons', subcategory: 'Sodas', initialStock: 100, currentStock: 48, price: 2.50, threshold: 20 },
      { name: 'Coca-Cola', category: 'Boissons', subcategory: 'Sodas', initialStock: 150, currentStock: 77, price: 2.80, threshold: 30 },
      { name: 'Sandwich Jambon', category: 'Alimentation', subcategory: 'Sandwichs', initialStock: 80, currentStock: 35, price: 4.50, threshold: 15 },
      { name: 'Eau Minérale', category: 'Boissons', subcategory: 'Eaux', initialStock: 200, currentStock: 113, price: 1.20, threshold: 40 },
      { name: 'Chips Sel', category: 'Alimentation', subcategory: 'Snacks', initialStock: 120, currentStock: 52, price: 1.80, threshold: 25 },
    ];
    await this.products.bulkAdd(products);
    
    // Add sample sales
    const sales = [
      { date: '2023-04-10', product: 'Fanta Orange', category: 'Boissons', subcategory: 'Sodas', price: 2.50, quantity: 5, total: 12.50, seller: 'Jean', register: 'Caisse 1' },
      { date: '2023-04-10', product: 'Coca-Cola', category: 'Boissons', subcategory: 'Sodas', price: 2.80, quantity: 10, total: 28.00, seller: 'Sophie', register: 'Caisse 2' },
      { date: '2023-04-11', product: 'Sandwich Jambon', category: 'Alimentation', subcategory: 'Sandwichs', price: 4.50, quantity: 8, total: 36.00, seller: 'Thomas', register: 'Caisse 1' },
      { date: '2023-04-11', product: 'Eau Minérale', category: 'Boissons', subcategory: 'Eaux', price: 1.20, quantity: 15, total: 18.00, seller: 'Marie', register: 'Caisse 3' },
      { date: '2023-04-12', product: 'Chips Sel', category: 'Alimentation', subcategory: 'Snacks', price: 1.80, quantity: 12, total: 21.60, seller: 'Jean', register: 'Caisse 2' },
    ];
    await this.sales.bulkAdd(sales);
    
    // Add initial log
    await this.logs.add({
      date: new Date().toISOString(),
      user: 'system',
      action: 'initialization',
      details: 'Database initialized with sample data'
    });
  }
  
  // Helper function to log actions
  async logAction(user: string, action: string, details: string) {
    return await this.logs.add({
      date: new Date().toISOString(),
      user,
      action,
      details
    });
  }
}

export const db = new SuiviVenteDB();

// Export some helper functions for common operations
export async function getSales(filters = {}) {
  return await db.sales.toArray();
}

export async function getProducts(filters = {}) {
  return await db.products.toArray();
}

export async function getLogs(filters = {}) {
  return await db.logs.orderBy('date').reverse().toArray();
}

export async function updateProductStock(productId: number, newStock: number) {
  return await db.products.update(productId, { currentStock: newStock });
}

export async function addSale(sale: Sale) {
  const id = await db.sales.add(sale);
  
  // Update product stock
  const product = await db.products.where('name').equals(sale.product).first();
  if (product) {
    await updateProductStock(product.id!, product.currentStock - sale.quantity);
  }
  
  await db.logAction('system', 'add_sale', `Added sale: ${sale.product} (${sale.quantity} units)`);
  
  return id;
}

export async function resetData(dataType: 'sales' | 'products' | 'all') {
  if (dataType === 'sales' || dataType === 'all') {
    await db.sales.clear();
  }
  
  if (dataType === 'products' || dataType === 'all') {
    // For products, reset stock to initial values
    const products = await db.products.toArray();
    for (const product of products) {
      await db.products.update(product.id!, { currentStock: product.initialStock });
    }
  }
  
  await db.logAction('system', 'reset_data', `Reset data: ${dataType}`);
}