import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, CheckCircle, FileSpreadsheet, X, Download, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';

interface ImportRow {
  [key: string]: any;
  isDuplicate?: boolean;
}

const ImportData: React.FC = () => {
  const { importExportService } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'sales' | 'stock'>('sales');
  const [rawData, setRawData] = useState<ImportRow[] | null>(null);
  const [duplicates, setDuplicates] = useState<ImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column configurations
  const SALES_COLUMNS = ['CAISSE', 'PRODUIT', 'TYPES', 'QUANTITE', 'MONTANT', 'VENDEUR', 'DATE'];
  const STOCK_COLUMNS = ['PRODUIT', 'TYPES', 'QUANTITE'];

  const getCurrentColumns = () => importType === 'sales' ? SALES_COLUMNS : STOCK_COLUMNS;

  // Normalize string for consistent comparison (handles accents and casing)
  const normalizeString = (str: string): string => {
    return str
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .toUpperCase()
      .trim();
  };

  // Handle file selection and immediate processing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== FILE SELECTION STARTED ===');
    
    // Reset everything first
    setError(null);
    setSuccess(null);
    setRawData(null);
    setDuplicates([]);
    
    const selectedFile = e.target.files?.[0];
    console.log('Selected file:', selectedFile);
    
    if (!selectedFile) {
      console.log('No file selected, returning');
      return;
    }

    console.log('File details:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size
    });

    // Validate file type
    const fileName = selectedFile.name.toLowerCase();
    const isValidFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    
    console.log('File validation:', { fileName, isValidFile });
    
    if (!isValidFile) {
      const errorMsg = 'Format de fichier non pris en charge. Utilisez Excel (.xlsx, .xls) ou CSV.';
      console.log('File validation failed:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Set file and start loading
    setFile(selectedFile);
    setIsLoading(true);
    console.log('Starting file processing...');
    
    try {
      // Parse the file
      console.log('Calling parseFile...');
      const parsedData = await parseFile(selectedFile);
      console.log('File parsed successfully:', {
        dataLength: parsedData?.length,
        sampleData: parsedData?.slice(0, 2)
      });
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error('Le fichier ne contient aucune donnée');
      }

      // Validate columns
      console.log('Validating columns...');
      const requiredColumns = getCurrentColumns();
      const firstRow = parsedData[0];
      const availableColumns = Object.keys(firstRow);
      
      console.log('Column validation:', {
        required: requiredColumns,
        available: availableColumns
      });
      
      // Normalize available columns for comparison
      const normalizedAvailable = availableColumns.map(col => normalizeString(col));
      const normalizedRequired = requiredColumns.map(col => normalizeString(col));
      
      console.log('Normalized columns:', {
        required: normalizedRequired,
        available: normalizedAvailable
      });
      
      const missingColumns = normalizedRequired.filter(reqCol => 
        !normalizedAvailable.includes(reqCol)
      );
      
      console.log('Missing columns:', missingColumns);
      
      if (missingColumns.length > 0) {
        // Map back to original column names for error message
        const originalMissingColumns = missingColumns.map(missingCol => {
          const originalIndex = normalizedRequired.indexOf(missingCol);
          return requiredColumns[originalIndex];
        });
        throw new Error(`Colonnes manquantes: ${originalMissingColumns.join(', ')}`);
      }

      // Normalize column names in data
      console.log('Normalizing data...');
      const normalizedData = parsedData.map((row, index) => {
        const normalizedRow: any = { originalIndex: index + 1 };
        
        // Create mapping from normalized column names to original values
        Object.keys(row).forEach(originalKey => {
          const normalizedKey = normalizeString(originalKey);
          
          // Find which required column this matches
          const matchingRequiredIndex = normalizedRequired.findIndex(reqCol => reqCol === normalizedKey);
          if (matchingRequiredIndex !== -1) {
            const standardColumnName = requiredColumns[matchingRequiredIndex];
            normalizedRow[standardColumnName] = row[originalKey];
          } else {
            // Keep original key if it doesn't match any required column
            normalizedRow[originalKey] = row[originalKey];
          }
        });
        
        return normalizedRow;
      });

      console.log('Normalized data sample:', normalizedData.slice(0, 2));

      // Process data and detect duplicates
      console.log('Processing data and detecting duplicates...');
      const processedData = processRawData(normalizedData);
      
      console.log('Processing results:', {
        validData: processedData.validData.length,
        duplicates: processedData.duplicates.length
      });
      
      setRawData(processedData.validData);
      setDuplicates(processedData.duplicates);
      
      console.log('=== FILE PROCESSING COMPLETED SUCCESSFULLY ===');
      
    } catch (err) {
      console.error('=== FILE PROCESSING ERROR ===', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier';
      setError(errorMessage);
      setFile(null); // Reset file on error
    } finally {
      setIsLoading(false);
      console.log('Loading state set to false');
    }
  };

  // Parse Excel/CSV file
  const parseFile = async (file: File): Promise<any[]> => {
    console.log('parseFile called with:', file.name);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log('FileReader onload triggered');
        try {
          const data = e.target?.result;
          console.log('File data loaded, type:', typeof data);
          
          let jsonData: any[];
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            console.log('Processing as CSV file');
            
            if (typeof data !== 'string') {
              throw new Error('CSV data should be string');
            }
            
            const text = data as string;
            const lines = text.split('\n').filter(line => line.trim());
            console.log('CSV lines found:', lines.length);
            
            if (lines.length === 0) {
              throw new Error('Le fichier CSV est vide');
            }
            
            // Detect delimiter
            const firstLine = lines[0];
            let delimiter = ',';
            if (firstLine.includes(';')) delimiter = ';';
            else if (firstLine.includes('\t')) delimiter = '\t';
            
            console.log('CSV delimiter detected:', delimiter);
            
            // Parse headers
            const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
            console.log('CSV headers:', headers);
            
            // Parse data rows
            jsonData = [];
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
              const row: any = {};
              
              headers.forEach((header, headerIndex) => {
                row[header] = values[headerIndex] || '';
              });
              
              // Only add row if it has some data
              if (Object.values(row).some(val => val !== '')) {
                jsonData.push(row);
              }
            }
            
            console.log('CSV parsing complete:', jsonData.length, 'rows');
            
          } else {
            console.log('Processing as Excel file');
            
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            console.log('Excel sheet:', firstSheetName);
            
            const worksheet = workbook.Sheets[firstSheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log('Excel parsing complete:', jsonData.length, 'rows');
          }
          
          console.log('Sample parsed data:', jsonData.slice(0, 2));
          resolve(jsonData);
          
        } catch (error) {
          console.error('Error in parseFile onload:', error);
          reject(new Error('Erreur lors du traitement du fichier: ' + (error as Error).message));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.onabort = () => {
        console.error('FileReader aborted');
        reject(new Error('Lecture du fichier interrompue'));
      };
      
      // Start reading the file
      try {
        if (file.name.toLowerCase().endsWith('.csv')) {
          console.log('Starting to read as text (CSV)');
          reader.readAsText(file, 'UTF-8');
        } else {
          console.log('Starting to read as binary (Excel)');
          reader.readAsBinaryString(file);
        }
      } catch (error) {
        console.error('Error starting file read:', error);
        reject(new Error('Impossible de lire le fichier'));
      }
    });
  };

  // Process raw data and detect duplicates
  const processRawData = (data: any[]) => {
    console.log('processRawData called with', data.length, 'rows');
    
    const validData: ImportRow[] = [];
    const duplicates: ImportRow[] = [];
    const seenRows = new Set<string>();

    data.forEach((row, index) => {
      // Create unique key for duplicate detection
      const requiredColumns = getCurrentColumns();
      const keyParts = requiredColumns.map(col => {
        const value = row[col];
        return String(value || '').trim().toLowerCase();
      });
      const uniqueKey = keyParts.join('|');

      console.log(`Row ${index + 1} key:`, uniqueKey);

      if (seenRows.has(uniqueKey)) {
        console.log(`Duplicate found at row ${index + 1}`);
        duplicates.push({ ...row, isDuplicate: true, rowIndex: index + 2 });
      } else {
        seenRows.add(uniqueKey);
        validData.push({ ...row, rowIndex: index + 2 });
      }
    });

    console.log('processRawData results:', {
      validData: validData.length,
      duplicates: duplicates.length
    });

    return { validData, duplicates };
  };

  // Calculate totals for display
  const calculateTotals = (data: ImportRow[]) => {
    if (importType === 'sales') {
      const totalRevenue = data.reduce((sum, row) => {
        const montant = parseFloat(String(row.MONTANT || '0').replace(',', '.')) || 0;
        return sum + montant;
      }, 0);
      
      const totalQuantity = data.reduce((sum, row) => {
        const quantite = parseInt(String(row.QUANTITE || '0')) || 0;
        return sum + quantite;
      }, 0);

      return { totalRevenue, totalQuantity };
    } else {
      const totalQuantity = data.reduce((sum, row) => {
        const quantite = parseInt(String(row.QUANTITE || '0')) || 0;
        return sum + quantite;
      }, 0);

      return { totalRevenue: 0, totalQuantity };
    }
  };

  // Validate import
  const validateImport = async () => {
    if (!rawData) return;
    
    console.log('Starting import validation...');
    setIsLoading(true);
    
    try {
      if (importType === 'sales') {
        // Convert to sales format
        const salesData = rawData.map(row => {
          const quantity = parseInt(String(row.QUANTITE || '0')) || 0;
          const montant = parseFloat(String(row.MONTANT || '0').replace(',', '.')) || 0;
          const price = quantity > 0 ? montant / quantity : 0;
          
          return {
            date: formatDate(row.DATE),
            product: String(row.PRODUIT || ''),
            category: String(row.TYPES || ''),
            subcategory: '',
            price: price,
            quantity: quantity,
            total: montant,
            seller: String(row.VENDEUR || ''),
            register: String(row.CAISSE || 'Import')
          };
        });
        
        console.log('Sending sales data for import:', salesData.slice(0, 2));
        const results = await importExportService.importSales(salesData);
        console.log('Import results:', results);
        
        setSuccess(`Import réussi! ${results.success} vente(s) importée(s), ${duplicates.length} doublon(s) ignoré(s).`);
      } else {
        // Handle stock import (placeholder for now)
        setSuccess(`Import de stock non encore implémenté. ${rawData.length} ligne(s) traitée(s).`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      setError('Erreur lors de l\'import des données: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      let date: Date;
      
      if (typeof dateValue === 'number') {
        // Excel date number
        date = new Date((dateValue - 25569) * 86400 * 1000);
      } else if (typeof dateValue === 'string') {
        const dateStr = dateValue.trim();
        
        // Try parsing as ISO date first
        date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
          // Try parsing DD/MM/YYYY or DD-MM-YYYY format
          const parts = dateStr.split(/[\/\-\.]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            const year = parseInt(parts[2]);
            
            // Handle 2-digit years
            const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
            
            if (fullYear > 1900 && month >= 0 && month < 12 && day > 0 && day <= 31) {
              date = new Date(fullYear, month, day);
            }
          }
        }
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Reset import
  const resetImport = () => {
    console.log('Resetting import state');
    setFile(null);
    setRawData(null);
    setDuplicates([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download template
  const downloadTemplate = () => {
    let template: any[];
    
    if (importType === 'sales') {
      template = [
        {
          CAISSE: 'Caisse 1',
          PRODUIT: 'Coca-Cola',
          TYPES: 'Boissons',
          QUANTITE: 5,
          MONTANT: 14.00,
          VENDEUR: 'Jean',
          DATE: '2024-01-15'
        },
        {
          CAISSE: 'Caisse 2',
          PRODUIT: 'Sandwich Jambon',
          TYPES: 'Alimentation',
          QUANTITE: 2,
          MONTANT: 9.00,
          VENDEUR: 'Sophie',
          DATE: '2024-01-15'
        }
      ];
    } else {
      template = [
        {
          PRODUIT: 'Coca-Cola',
          TYPES: 'Boissons',
          QUANTITE: 100
        },
        {
          PRODUIT: 'Sandwich Jambon',
          TYPES: 'Alimentation',
          QUANTITE: 50
        }
      ];
    }
    
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const fileName = importType === 'sales' ? 'template_import_ventes.xlsx' : 'template_import_stock.xlsx';
    XLSX.writeFile(workbook, fileName);
  };

  const totals = rawData ? calculateTotals(rawData) : { totalRevenue: 0, totalQuantity: 0 };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Import des Données</h1>
        <button 
          onClick={downloadTemplate}
          className="btn btn-secondary flex items-center"
        >
          <Download size={16} className="mr-2" />
          Télécharger le modèle
        </button>
      </div>

      {/* Import Type Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-center space-x-4">
          <span className={`font-medium ${importType === 'sales' ? 'text-primary-600' : 'text-gray-500'}`}>
            Import Ventes
          </span>
          <button
            onClick={() => {
              setImportType(importType === 'sales' ? 'stock' : 'sales');
              resetImport();
            }}
            className="flex items-center"
          >
            {importType === 'sales' ? (
              <ToggleLeft size={32} className="text-primary-600" />
            ) : (
              <ToggleRight size={32} className="text-primary-600" />
            )}
          </button>
          <span className={`font-medium ${importType === 'stock' ? 'text-primary-600' : 'text-gray-500'}`}>
            Import Stock
          </span>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {importType === 'sales' 
            ? 'Colonnes requises: CAISSE, PRODUIT, TYPES, QUANTITE, MONTANT, VENDEUR, DATE'
            : 'Colonnes requises: PRODUIT, TYPES, QUANTITE'
          }
        </p>
      </div>
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-lg text-xs">
          <strong>Debug Info:</strong>
          <br />File: {file?.name || 'None'}
          <br />Loading: {isLoading.toString()}
          <br />Raw Data: {rawData?.length || 0} rows
          <br />Duplicates: {duplicates.length}
          <br />Error: {error || 'None'}
        </div>
      )}
      
      {/* File Upload Area */}
      {!file && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
          />
          
          <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
          
          <h2 className="text-xl font-semibold mb-2">
            Importer des données {importType === 'sales' ? 'de ventes' : 'de stock'}
          </h2>
          <p className="text-gray-500 mb-4">
            Glissez-déposez un fichier Excel ou CSV, ou cliquez pour sélectionner
          </p>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary px-6"
          >
            Sélectionner un fichier
          </button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p className="mb-2">Formats pris en charge: Excel (.xlsx, .xls), CSV</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Traitement du fichier en cours...</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle size={24} className="text-red-500" />
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={resetImport}
                className="text-red-600 hover:text-red-800 mt-2 text-sm font-medium"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <CheckCircle size={24} className="text-green-500" />
            <div className="ml-3">
              <p className="text-green-700">{success}</p>
              <button 
                onClick={resetImport}
                className="text-green-600 hover:text-green-800 mt-2 text-sm font-medium"
              >
                Importer un autre fichier
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Preview */}
      {file && rawData && !success && (
        <>
          {/* File Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <FileSpreadsheet size={24} className="text-primary-600 mr-2" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {rawData.length} lignes • {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button 
                onClick={resetImport}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{rawData.length}</p>
                <p className="text-sm text-gray-600">Total lignes</p>
              </div>
              {importType === 'sales' && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totals.totalRevenue.toFixed(2)} €</p>
                  <p className="text-sm text-gray-600">Chiffre d'affaires total</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{totals.totalQuantity}</p>
                <p className="text-sm text-gray-600">Quantité totale</p>
              </div>
            </div>
          </div>

          {/* Duplicates Warning */}
          {duplicates.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <div className="flex">
                <AlertCircle size={24} className="text-yellow-500" />
                <div className="ml-3">
                  <p className="text-yellow-700 font-medium">
                    {duplicates.length} doublon(s) détecté(s)
                  </p>
                  <p className="text-yellow-600 text-sm">
                    Ces lignes seront ignorées lors de l'import car elles correspondent exactement à des données déjà présentes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full Data Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-medium">Aperçu complet des données</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {getCurrentColumns().map(col => (
                      <th key={col}>{col}</th>
                    ))}
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((item, index) => (
                    <tr key={index}>
                      {getCurrentColumns().map(col => (
                        <td key={col}>
                          {col === 'MONTANT' && importType === 'sales' 
                            ? `${parseFloat(String(item[col] || '0').replace(',', '.')).toFixed(2)} €`
                            : String(item[col] || '')
                          }
                        </td>
                      ))}
                      <td>
                        <span className="badge badge-success">Valide</span>
                      </td>
                    </tr>
                  ))}
                  {duplicates.map((item, index) => (
                    <tr key={`dup-${index}`} className="bg-yellow-50">
                      {getCurrentColumns().map(col => (
                        <td key={col}>
                          {col === 'MONTANT' && importType === 'sales' 
                            ? `${parseFloat(String(item[col] || '0').replace(',', '.')).toFixed(2)} €`
                            : String(item[col] || '')
                          }
                        </td>
                      ))}
                      <td>
                        <span className="badge badge-warning">Doublon</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Validate Import Button */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-2">
                  Valider l'importation
                </h3>
                <p className="text-gray-600">
                  {rawData.length > 0 ? (
                    <>
                      Prêt à importer <span className="font-bold text-primary-600">{rawData.length}</span> ligne(s) valide(s).
                      {duplicates.length > 0 && (
                        <span className="text-yellow-600"> {duplicates.length} doublon(s) seront ignorés.</span>
                      )}
                    </>
                  ) : (
                    "Aucune donnée valide à importer."
                  )}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button onClick={resetImport} className="btn btn-secondary">
                  Annuler
                </button>
                
                <button 
                  onClick={validateImport}
                  className="btn btn-primary flex items-center px-6"
                  disabled={rawData.length === 0 || isLoading}
                >
                  <Upload size={16} className="mr-2" />
                  Valider l'import
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportData;