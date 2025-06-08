import React, { useState, useMemo } from 'react';
import { Search, Filter, Edit, Trash2, RefreshCw, RotateCcw, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import ProductForm from '../components/forms/ProductForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { Product } from '../lib/supabase';

const Inventory: React.FC = () => {
  const { products, productsService } = useData();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    stock: ''
  });

  // Filter data
  const filteredData = useMemo(() => {
    return products.products.filter(item => {
      return (
        (search === '' || 
         item.name.toLowerCase().includes(search.toLowerCase()) ||
         item.category.toLowerCase().includes(search.toLowerCase())) &&
        (filters.category === '' || item.category === filters.category) &&
        (filters.subcategory === '' || item.subcategory === filters.subcategory) &&
        (filters.stock === '' || 
         (filters.stock === 'low' && item.current_stock <= item.threshold && item.current_stock > 0) ||
         (filters.stock === 'out' && item.current_stock === 0) ||
         (filters.stock === 'available' && item.current_stock > item.threshold))
      );
    });
  }, [products.products, search, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters
  const uniqueCategories = [...new Set(products.products.map(product => product.category))];
  const uniqueSubcategories = [...new Set(products.products.map(product => product.subcategory))];

  // Get stock status
  const getStockStatus = (item: Product) => {
    if (item.current_stock === 0) {
      return <span className="badge badge-danger">Rupture</span>;
    } else if (item.current_stock <= item.threshold) {
      return <span className="badge badge-warning">Stock bas</span>;
    } else {
      return <span className="badge badge-success">En stock</span>;
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    
    setDeleteLoading(true);
    try {
      await productsService.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetStock = async () => {
    setResetLoading(true);
    try {
      await productsService.resetStock();
    } catch (error) {
      console.error('Error resetting stock:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setEditingProduct(null);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      stock: ''
    });
    setSearch('');
    setCurrentPage(1);
  };

  if (products.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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
          
          <button 
            onClick={() => setShowProductForm(true)}
            className="btn btn-primary flex items-center"
          >
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
                onChange={(e) => {
                  setFilters({...filters, category: e.target.value});
                  setCurrentPage(1);
                }}
                className="form-input"
              >
                <option value="">Toutes les catégories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Sous-catégorie</label>
              <select 
                value={filters.subcategory}
                onChange={(e) => {
                  setFilters({...filters, subcategory: e.target.value});
                  setCurrentPage(1);
                }}
                className="form-input"
              >
                <option value="">Toutes les sous-catégories</option>
                {uniqueSubcategories.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">État du stock</label>
              <select 
                value={filters.stock}
                onChange={(e) => {
                  setFilters({...filters, stock: e.target.value});
                  setCurrentPage(1);
                }}
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
              onClick={resetFilters}
              className="btn btn-secondary mr-2"
            >
              Réinitialiser
            </button>
            <button className="btn btn-primary">Appliquer</button>
          </div>
        </div>
      )}
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => products.refetch()}
          className="btn btn-secondary flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Recharger
        </button>
        <button 
          onClick={handleResetStock}
          className="btn btn-danger flex items-center"
          disabled={resetLoading}
        >
          {resetLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Réinitialisation...
            </>
          ) : (
            <>
              <RotateCcw size={16} className="mr-2" />
              Réinitialiser stock
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Sous-catégorie</th>
                <th>Stock initial</th>
                <th>Stock actuel</th>
                <th>Prix unitaire</th>
                <th>Valeur stock</th>
                <th>Seuil</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="font-medium">{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.subcategory}</td>
                  <td>{item.initial_stock}</td>
                  <td className="font-medium">{item.current_stock}</td>
                  <td>{item.price.toFixed(2)} €</td>
                  <td>{(item.current_stock * item.price).toFixed(2)} €</td>
                  <td>{item.threshold}</td>
                  <td>{getStockStatus(item)}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-600 hover:text-blue-800" 
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingProduct(item)}
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
          <>
            <div className="px-6 py-3 bg-gray-50 border-t flex justify-between items-center text-sm text-gray-500">
              <div>
                {filteredData.length} produit(s) affiché(s)
              </div>
              <div className="font-medium">
                Valeur totale: {filteredData.reduce((sum, item) => sum + (item.current_stock * item.price), 0).toFixed(2)} €
              </div>
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredData.length}
            />
          </>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer le produit "${deletingProduct?.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProduct(null)}
        loading={deleteLoading}
        type="danger"
      />
    </div>
  );
};

export default Inventory;