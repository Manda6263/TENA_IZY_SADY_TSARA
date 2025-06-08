import React, { useState } from 'react';
import { FileDown, Calendar, File as FileZip, FileText, FileSpreadsheet, Check } from 'lucide-react';

const ExportData: React.FC = () => {
  const [exportName, setExportName] = useState('SuiviVente_Export');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportType, setExportType] = useState('all');
  const [exportFormat, setExportFormat] = useState('zip');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      
      // Reset after showing success message
      setTimeout(() => {
        setExportComplete(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exportation des Données</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Paramètres d'exportation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Nom de l'export</label>
              <input
                type="text"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                className="form-input"
                placeholder="Nom de l'export"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le nom du fichier exporté. Par défaut: "SuiviVente_Export"
              </p>
            </div>
            
            <div>
              <label className="form-label">Période</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Début</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fin</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour exporter toutes les données
              </p>
            </div>
            
            <div>
              <label className="form-label">Données à exporter</label>
              <div className="space-y-2 mt-1">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportType"
                    value="all"
                    checked={exportType === 'all'}
                    onChange={() => setExportType('all')}
                    className="mr-2"
                  />
                  Toutes les données
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportType"
                    value="sales"
                    checked={exportType === 'sales'}
                    onChange={() => setExportType('sales')}
                    className="mr-2"
                  />
                  Ventes uniquement
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="exportType"
                    value="inventory"
                    checked={exportType === 'inventory'}
                    onChange={() => setExportType('inventory')}
                    className="mr-2"
                  />
                  Stock uniquement
                </label>
              </div>
            </div>
            
            <div>
              <label className="form-label">Format d'export</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div 
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                    exportFormat === 'zip' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportFormat('zip')}
                >
                  <FileZip size={24} className="mx-auto mb-2 text-primary-600" />
                  <span className="text-sm font-medium block">Archive</span>
                  <span className="text-xs text-gray-500 block">.zip</span>
                </div>
                <div 
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                    exportFormat === 'excel' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportFormat('excel')}
                >
                  <FileSpreadsheet size={24} className="mx-auto mb-2 text-green-600" />
                  <span className="text-sm font-medium block">Excel</span>
                  <span className="text-xs text-gray-500 block">.xlsx</span>
                </div>
                <div 
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                    exportFormat === 'word' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportFormat('word')}
                >
                  <FileText size={24} className="mx-auto mb-2 text-blue-600" />
                  <span className="text-sm font-medium block">Word</span>
                  <span className="text-xs text-gray-500 block">.docx</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportation en cours...
                </>
              ) : (
                <>
                  <FileDown size={18} className="mr-2" />
                  Exporter les données
                </>
              )}
            </button>
            
            {exportComplete && (
              <div className="mt-2 text-center text-green-600 flex items-center justify-center">
                <Check size={16} className="mr-1" />
                Export réussi!
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Aperçu de l'export</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <FileZip size={20} className="text-primary-600 mr-2" />
                <h3 className="font-medium">{exportName}.{exportFormat}</h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-4">
                  Contenu de l'export:
                </p>
                <ul className="space-y-2 text-sm">
                  {exportType === 'all' && (
                    <>
                      <li className="flex items-center">
                        <FileSpreadsheet size={16} className="text-green-600 mr-2" />
                        <span>Ventes_Détaillées.xlsx</span>
                      </li>
                      <li className="flex items-center">
                        <FileSpreadsheet size={16} className="text-green-600 mr-2" />
                        <span>Inventaire_Stock.xlsx</span>
                      </li>
                    </>
                  )}
                  {(exportType === 'all' || exportType === 'sales') && (
                    <li className="flex items-center">
                      <FileSpreadsheet size={16} className="text-green-600 mr-2" />
                      <span>Rapport_Ventes.xlsx</span>
                    </li>
                  )}
                  {(exportType === 'all' || exportType === 'inventory') && (
                    <li className="flex items-center">
                      <FileSpreadsheet size={16} className="text-green-600 mr-2" />
                      <span>Rapport_Stock.xlsx</span>
                    </li>
                  )}
                  <li className="flex items-center">
                    <FileText size={16} className="text-blue-600 mr-2" />
                    <span>README.txt</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Résumé des données</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Période:</p>
                    <p className="font-medium">
                      {dateRange.start && dateRange.end 
                        ? `${dateRange.start} au ${dateRange.end}` 
                        : "Toutes les données"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type:</p>
                    <p className="font-medium">
                      {exportType === 'all' && "Données complètes"}
                      {exportType === 'sales' && "Ventes uniquement"}
                      {exportType === 'inventory' && "Stock uniquement"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ventes:</p>
                    <p className="font-medium">153 enregistrements</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Produits:</p>
                    <p className="font-medium">48 articles</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Format:</p>
                    <p className="font-medium capitalize">{exportFormat}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Taille estimée:</p>
                    <p className="font-medium">1.2 MB</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 text-sm text-blue-700">
              <p>
                <strong>Note:</strong> L'export en lecture seule ne permet pas la modification des données. 
                Pour visualiser les données, utilisez le fichier exécutable inclus dans l'archive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData;