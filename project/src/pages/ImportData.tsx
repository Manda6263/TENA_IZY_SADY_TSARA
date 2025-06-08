import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, CheckCircle, FileSpreadsheet, X } from 'lucide-react';

const ImportData: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setPreviewData(null);
    setDuplicates([]);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
      setError('Format de fichier non pris en charge. Utilisez Excel (.xlsx, .xls) ou CSV.');
      return;
    }
    
    setFile(selectedFile);
    setIsLoading(true);
    
    // Simulate file processing
    setTimeout(() => {
      // Mock data preview
      const mockPreview = [
        { id: 1, date: '2023-04-10', product: 'Fanta Orange', quantity: 5, price: 2.50, total: 12.50, seller: 'Jean' },
        { id: 2, date: '2023-04-10', product: 'Coca-Cola', quantity: 10, price: 2.80, total: 28.00, seller: 'Sophie' },
        { id: 3, date: '2023-04-11', product: 'Sandwich Jambon', quantity: 8, price: 4.50, total: 36.00, seller: 'Thomas' },
        // Simulating duplicate
        { id: 4, date: '2023-04-11', product: 'Fanta Orange', quantity: 3, price: 2.50, total: 7.50, seller: 'Jean', isDuplicate: true },
      ];
      
      setPreviewData(mockPreview);
      setDuplicates(mockPreview.filter(item => item.isDuplicate));
      setIsLoading(false);
    }, 1500);
  };

  // Reset the import
  const resetImport = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setSuccess(null);
    setDuplicates([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle import confirmation
  const confirmImport = () => {
    setIsLoading(true);
    
    // Simulate import process
    setTimeout(() => {
      setSuccess('Importation réussie! 3 nouvelles ventes enregistrées.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Import des Données</h1>
      </div>
      
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
          
          <h2 className="text-xl font-semibold mb-2">Importer des données</h2>
          <p className="text-gray-500 mb-4">
            Glissez-déposez un fichier Excel ou CSV, ou cliquez pour sélectionner
          </p>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary px-6"
          >
            Sélectionner un fichier
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Formats pris en charge: Excel (.xlsx, .xls), CSV
          </p>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Traitement du fichier en cours...</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <AlertCircle size={24} className="text-red-500" />
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
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
      
      {/* File Preview */}
      {file && previewData && !success && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <FileSpreadsheet size={24} className="text-primary-600 mr-2" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {previewData.length} enregistrements • {(file.size / 1024).toFixed(2)} KB
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
            
            {duplicates.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                <div className="flex">
                  <AlertCircle size={20} className="text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-yellow-700">
                      {duplicates.length} enregistrement(s) en doublon détecté(s)
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded flex justify-between text-sm text-gray-600">
              <span>Total: {previewData.length} lignes</span>
              <span>CA: {previewData.reduce((sum, item) => sum + item.total, 0).toFixed(2)} €</span>
              <span>Quantité: {previewData.reduce((sum, item) => sum + item.quantity, 0)} unités</span>
            </div>
          </div>
          
          <div className="table-container mb-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Prix</th>
                  <th>Total</th>
                  <th>Vendeur</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((item, index) => (
                  <tr 
                    key={index}
                    className={item.isDuplicate ? 'bg-yellow-50' : 'bg-white'}
                  >
                    <td>{item.date}</td>
                    <td>{item.product}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price.toFixed(2)} €</td>
                    <td>{item.total.toFixed(2)} €</td>
                    <td>{item.seller}</td>
                    <td>
                      {item.isDuplicate ? (
                        <span className="badge badge-warning">Doublon</span>
                      ) : (
                        <span className="badge badge-success">Nouveau</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={resetImport}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            
            <button 
              onClick={confirmImport}
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Importation...' : 'Confirmer l\'import'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportData;