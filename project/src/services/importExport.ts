import { db, Sale, Product, Log } from '../db/db';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Import functions
export interface ImportResult {
  success: boolean;
  totalRecords: number;
  duplicates: any[];
  newRecords: any[];
  error?: string;
}

export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsBinaryString(file);
  });
}

export async function importSales(data: any[]): Promise<ImportResult> {
  try {
    // Check for duplicates
    const existingSales = await db.sales.toArray();
    const duplicates: any[] = [];
    const newRecords: any[] = [];
    
    for (const item of data) {
      // Create a unique key for comparison
      const itemKey = `${item.date}-${item.product}-${item.quantity}-${item.seller}`;
      
      // Check if this item already exists
      const isDuplicate = existingSales.some(existing => {
        const existingKey = `${existing.date}-${existing.product}-${existing.quantity}-${existing.seller}`;
        return existingKey === itemKey;
      });
      
      if (isDuplicate) {
        duplicates.push({ ...item, isDuplicate: true });
      } else {
        newRecords.push(item);
      }
    }
    
    // If there are new records, add them and update stock
    if (newRecords.length > 0) {
      await db.transaction('rw', db.sales, db.products, db.logs, async () => {
        // Add new sales
        for (const sale of newRecords) {
          // Format sale data properly
          const formattedSale: Sale = {
            date: sale.date,
            product: sale.product,
            category: sale.category,
            subcategory: sale.subcategory || '',
            price: parseFloat(sale.price),
            quantity: parseInt(sale.quantity),
            total: parseFloat(sale.total),
            seller: sale.seller,
            register: sale.register || 'Non spécifié'
          };
          
          await db.sales.add(formattedSale);
          
          // Update product stock
          const product = await db.products.where('name').equals(sale.product).first();
          if (product) {
            const newStock = product.currentStock - sale.quantity;
            await db.products.update(product.id!, { currentStock: newStock });
          }
        }
        
        // Log the import
        await db.logs.add({
          date: new Date().toISOString(),
          user: 'system',
          action: 'import_sales',
          details: `Imported ${newRecords.length} sales records. Skipped ${duplicates.length} duplicates.`
        });
      });
    }
    
    return {
      success: true,
      totalRecords: data.length,
      duplicates,
      newRecords
    };
  } catch (error) {
    console.error('Error importing sales:', error);
    return {
      success: false,
      totalRecords: 0,
      duplicates: [],
      newRecords: [],
      error: 'Une erreur est survenue lors de l\'import'
    };
  }
}

// Export functions
export interface ExportOptions {
  fileName: string;
  dataType: 'sales' | 'inventory' | 'all';
  format: 'excel' | 'word' | 'zip';
  dateRange?: {
    start: string;
    end: string;
  };
}

export async function exportData(options: ExportOptions): Promise<boolean> {
  try {
    switch (options.format) {
      case 'excel':
        await exportToExcel(options);
        break;
      case 'word':
        // In a real app, would implement Word export
        alert('Export Word not implemented in this demo');
        break;
      case 'zip':
        // In a real app, would implement ZIP export with multiple files
        alert('Export ZIP not implemented in this demo');
        break;
    }
    
    // Log the export
    await db.logs.add({
      date: new Date().toISOString(),
      user: 'system',
      action: 'export_data',
      details: `Exported ${options.dataType} data as ${options.format}`
    });
    
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
}

async function exportToExcel(options: ExportOptions): Promise<void> {
  // Get the data
  let data: any[] = [];
  
  if (options.dataType === 'sales' || options.dataType === 'all') {
    let sales = await db.sales.toArray();
    
    // Apply date filter if provided
    if (options.dateRange && options.dateRange.start && options.dateRange.end) {
      const startDate = new Date(options.dateRange.start);
      const endDate = new Date(options.dateRange.end);
      
      sales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    
    data = [...data, ...sales];
  }
  
  if (options.dataType === 'inventory' || options.dataType === 'all') {
    const products = await db.products.toArray();
    data = [...data, ...products];
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
  // Save the file
  saveAs(blob, `${options.fileName}.xlsx`);
}