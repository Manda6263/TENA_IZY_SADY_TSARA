import { db, Sale, Product, User, Log } from '../db/db';

// Sales Services
export async function getAllSales(filters: any = {}) {
  let query = db.sales.toCollection();
  
  // Apply filters if provided
  if (filters.dateFrom) {
    query = query.filter(sale => new Date(sale.date) >= new Date(filters.dateFrom));
  }
  
  if (filters.dateTo) {
    query = query.filter(sale => new Date(sale.date) <= new Date(filters.dateTo));
  }
  
  if (filters.seller) {
    query = query.filter(sale => sale.seller === filters.seller);
  }
  
  if (filters.category) {
    query = query.filter(sale => sale.category === filters.category);
  }
  
  if (filters.product) {
    query = query.filter(sale => sale.product.toLowerCase().includes(filters.product.toLowerCase()));
  }
  
  if (filters.register) {
    query = query.filter(sale => sale.register === filters.register);
  }
  
  return await query.toArray();
}

export async function getSaleById(id: number) {
  return await db.sales.get(id);
}

export async function addNewSale(sale: Sale) {
  // Add the sale
  const saleId = await db.sales.add(sale);
  
  // Update product stock
  const product = await db.products.where('name').equals(sale.product).first();
  if (product) {
    await db.products.update(product.id!, { currentStock: product.currentStock - sale.quantity });
  }
  
  // Log the action
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'add_sale',
    details: `Added sale: ${sale.product} (${sale.quantity} units)`
  });
  
  return saleId;
}

export async function deleteSale(id: number) {
  const sale = await db.sales.get(id);
  if (!sale) return false;
  
  // Restore product stock
  const product = await db.products.where('name').equals(sale.product).first();
  if (product) {
    await db.products.update(product.id!, { currentStock: product.currentStock + sale.quantity });
  }
  
  // Delete the sale
  await db.sales.delete(id);
  
  // Log the action
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'delete_sale',
    details: `Deleted sale #${id}: ${sale.product}`
  });
  
  return true;
}

// Inventory Services
export async function getAllProducts(filters: any = {}) {
  let query = db.products.toCollection();
  
  // Apply filters if provided
  if (filters.category) {
    query = query.filter(product => product.category === filters.category);
  }
  
  if (filters.subcategory) {
    query = query.filter(product => product.subcategory === filters.subcategory);
  }
  
  if (filters.stockStatus) {
    if (filters.stockStatus === 'low') {
      query = query.filter(product => product.currentStock <= product.threshold && product.currentStock > 0);
    } else if (filters.stockStatus === 'out') {
      query = query.filter(product => product.currentStock === 0);
    } else if (filters.stockStatus === 'available') {
      query = query.filter(product => product.currentStock > product.threshold);
    }
  }
  
  if (filters.search) {
    query = query.filter(product => 
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.category.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  
  return await query.toArray();
}

export async function getProductById(id: number) {
  return await db.products.get(id);
}

export async function addNewProduct(product: Product) {
  const id = await db.products.add(product);
  
  // Log the action
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'add_product',
    details: `Added product: ${product.name} (Initial stock: ${product.initialStock})`
  });
  
  return id;
}

export async function updateProduct(id: number, updates: Partial<Product>) {
  await db.products.update(id, updates);
  
  // Log the action
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'update_product',
    details: `Updated product #${id}: ${JSON.stringify(updates)}`
  });
  
  return true;
}

export async function deleteProduct(id: number) {
  const product = await db.products.get(id);
  if (!product) return false;
  
  await db.products.delete(id);
  
  // Log the action
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'delete_product',
    details: `Deleted product: ${product.name}`
  });
  
  return true;
}

export async function resetStock() {
  const products = await db.products.toArray();
  
  for (const product of products) {
    await db.products.update(product.id!, { currentStock: product.initialStock });
  }
  
  // Log the action
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'reset_stock',
    details: 'Reset all product stock to initial values'
  });
  
  return true;
}

// Dashboard Services
export async function getDashboardMetrics(filters: any = {}) {
  // Get filtered sales
  const sales = await getAllSales(filters);
  
  // Get all products
  const products = await getAllProducts();
  
  // Calculate metrics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalStock = products.reduce((sum, product) => sum + product.currentStock, 0);
  
  // Sales by seller
  const salesBySeller: Record<string, number> = {};
  sales.forEach(sale => {
    if (!salesBySeller[sale.seller]) {
      salesBySeller[sale.seller] = 0;
    }
    salesBySeller[sale.seller] += sale.total;
  });
  
  // Sales by category
  const salesByCategory: Record<string, number> = {};
  sales.forEach(sale => {
    if (!salesByCategory[sale.category]) {
      salesByCategory[sale.category] = 0;
    }
    salesByCategory[sale.category] += sale.total;
  });
  
  // Sales by date
  const salesByDate: Record<string, number> = {};
  sales.forEach(sale => {
    if (!salesByDate[sale.date]) {
      salesByDate[sale.date] = 0;
    }
    salesByDate[sale.date] += sale.total;
  });
  
  return {
    totalSales,
    totalQuantity,
    totalStock,
    salesBySeller,
    salesByCategory,
    salesByDate
  };
}

// Logs Services
export async function getLogs(limit: number = 100) {
  return await db.logs.orderBy('date').reverse().limit(limit).toArray();
}

export async function clearLogs() {
  await db.logs.clear();
  
  // Add a log for the clear action itself
  await db.logs.add({
    date: new Date().toISOString(),
    user: 'system',
    action: 'clear_logs',
    details: 'Cleared all system logs'
  });
  
  return true;
}