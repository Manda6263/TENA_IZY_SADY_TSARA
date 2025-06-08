import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, RefreshCw, RotateCcw, Plus } from 'lucide-react';

// Dummy inventory data for demonstration
const inventoryData = [
  { id: 1, product: 'Fanta Orange', category: 'Boissons', subcategory: 'Sodas', initialStock: 100, sold: 52, currentStock: 48, price: 2.50, value: 120.00, threshold: 20 },
  { id: 2, product: 'Coca-Cola', category: 'Boissons', subcategory: 'Sodas', initialStock: 150, sold: 73, currentStock: 77, price: 2.80, value: 215.60, threshold: 30 },
  { id: 3, product: 'Sandwich Jambon', category: 'Alimentation', subcategory: 'Sandwichs', initialStock: 80, sold: 45, currentStock: 35, price: 4.50, value: 157.50, threshold: 15 },
  { id: 4, product: 'Eau Minérale', category: 'Boissons', subcategory: 'Eaux', initialStock: 200, sold: 87, currentStock: 113, price: 1.20, value: 135.60, threshold: 40 },
  { id: 5, product: 'Chips Sel', category: 'Alimentation', subcategory: 'Snacks', initialStock: 120, sold: 68, currentStock: 52, price: 1.80, value: 93.60, threshold: 25 },
];

const Inventory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    stock: ''
  });
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  // Filter data
  const filteredData = inventoryData.filter(item => {
    return (
      (search === '' || 
       item.product.toLowerCase().includes(search.toLowerCase()) ||
       item.category.toLowerCase().includes(search.toLowerCase())) &&
      (filters.category === '' || item.category === filters.category) &&
      (filters.subcategory === '' || item.subcategory === filters.subcategory) &&
      (filters.stock === '' || 
       (filters.stock === 'low' && item.currentStock <= item.threshold) ||
       (filters.stock === 'out' && item.currentStock === 0) ||
       (filters.stock === 'available' && item.currentStock > 0))
    );
  });

  // Get stock status
  const getStockStatus = (item: typeof inventoryData[0]) => {
    if (item.currentStock === 0) {
      return <span className="badge badge-danger">Rupture</span>;
    } else if (item.currentStock <= item.threshold) {
      return <span className="badge badge-warning">Stock bas</span>;
    } else {
      return <span className="badge badge-success">En stock</span>;
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion du Stock</h1>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Filtres
          </button>
          
          <button className="btn btn-primary flex items-center">
            <Plus size={16} className="mr-2" />
            Ajouter
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Catégorie</label>
              <select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="form-input"
              >
                <option value="">Toutes les catégories</option>
                <option value="Boissons">Boissons</option>
                <option value="Alimentation">Alimentation</option>
              </select>
            </div>
            <div>
              <label className="form-label">Sous-catégorie</label>
              <select 
                value={filters.subcategory}
                onChange={(e) => setFilters({...filters, subcategory: e.target.value})}
                className="form-input"
              >
                <option value="">Toutes les sous-catégories</option>
                <option value="Sodas">Sodas</option>
                <option value="Eaux">Eaux</option>
                <option value="Sandwichs">Sandwichs</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
            <div>
              <label className="form-label">État du stock</label>
              <select 
                value={filters.stock}
                onChange={(e) => setFilters({...filters, stock: e.target.value})}
                className="form-input"
              >
                <option value="">Tous les états</option>
                <option value="low">Stock bas</option>
                <option value="out">Rupture</option>
                <option value="available">Disponible</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setFilters({
                category: '',
                subcategory: '',
                stock: ''
              })}
              className="btn btn-secondary mr-2"
            >
              Réinitialiser
            </button>
            <button className="btn btn-primary">Appliquer</button>
          </div>
        </div>
      )}
      
      <div className="flex space-x-4 mb-6">
        <button className="btn btn-secondary flex items-center">
          <RefreshCw size={16} className="mr-2" />
          Recharger
        </button>
        <button className="btn btn-danger flex items-center">
          <RotateCcw size={16} className="mr-2" />
          Réinitialiser
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Sous-catégorie</th>
              <th>Stock initial</th>
              <th>Vendus</th>
              <th>Stock actuel</th>
              <th>Prix unitaire</th>
              <th>Valeur stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id} className={selectedItem === item.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                <td>{item.product}</td>
                <td>{item.category}</td>
                <td>{item.subcategory}</td>
                <td>{item.initialStock}</td>
                <td>{item.sold}</td>
                <td className="font-medium">{item.currentStock}</td>
                <td>{item.price.toFixed(2)} €</td>
                <td>{item.value.toFixed(2)} €</td>
                <td>{getStockStatus(item)}</td>
                <td>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedItem(item.id)}
                      className="p-1 text-blue-600 hover:text-blue-800" 
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="p-1 text-red-600 hover:text-red-800" 
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun produit ne correspond à vos critères de recherche
        </div>
      )}
      
      {filteredData.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <div>
            Affichage de {filteredData.length} produits sur {inventoryData.length}
          </div>
          <div className="font-medium">
            Valeur totale: {filteredData.reduce((sum, item) => sum + item.value, 0).toFixed(2)} €
          </div>
        </div>
      )}
      
      {selectedItem !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Modifier le produit</h2>
            
            {/* Form would go here */}
            <div className="space-y-4">
              <div>
                <label className="form-label">Nom du produit</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue={inventoryData.find(i => i.id === selectedItem)?.product} 
                />
              </div>
              <div>
                <label className="form-label">Prix unitaire</label>
                <input 
                  type="number" 
                  className="form-input" 
                  defaultValue={inventoryData.find(i => i.id === selectedItem)?.price} 
                  step="0.01"
                />
              </div>
              <div>
                <label className="form-label">Stock actuel</label>
                <input 
                  type="number" 
                  className="form-input" 
                  defaultValue={inventoryData.find(i => i.id === selectedItem)?.currentStock} 
                />
              </div>
              <div>
                <label className="form-label">Seuil d'alerte</label>
                <input 
                  type="number" 
                  className="form-input" 
                  defaultValue={inventoryData.find(i => i.id === selectedItem)?.threshold} 
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button 
                onClick={() => setSelectedItem(null)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button className="btn btn-primary">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;