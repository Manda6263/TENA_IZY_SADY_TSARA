import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import SaleForm from '../components/forms/SaleForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { Sale } from '../lib/supabase';

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: string | null;
  direction: SortDirection;
}

const Sales: React.FC = () => {
  const { sales, salesService } = useData();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    seller: '',
    register: ''
  });
  const [sort, setSort] = useState<SortState>({ field: 'date', direction: 'desc' });

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sort.field === field) {
      const direction = sort.direction === 'asc' ? 'desc' : (sort.direction === 'desc' ? null : 'asc');
      setSort({ field: direction ? field : null, direction });
    } else {
      setSort({ field, direction: 'asc' });
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sort.field !== field) return null;
    return sort.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    return sales.sales
      .filter(sale => {
        return (
          (search === '' || 
           sale.product.toLowerCase().includes(search.toLowerCase()) ||
           sale.category.toLowerCase().includes(search.toLowerCase()) ||
           sale.seller.toLowerCase().includes(search.toLowerCase())) &&
          (filters.dateFrom === '' || new Date(sale.date) >= new Date(filters.dateFrom)) &&
          (filters.dateTo === '' || new Date(sale.date) <= new Date(filters.dateTo)) &&
          (filters.category === '' || sale.category === filters.category) &&
          (filters.seller === '' || sale.seller === filters.seller) &&
          (filters.register === '' || sale.register === filters.register)
        );
      })
      .sort((a, b) => {
        if (!sort.field || !sort.direction) return 0;
        
        const fieldA = a[sort.field as keyof Sale];
        const fieldB = b[sort.field as keyof Sale];
        
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sort.direction === 'asc' 
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }
        
        return sort.direction === 'asc'
          ? Number(fieldA) - Number(fieldB)
          : Number(fieldB) - Number(fieldA);
      });
  }, [sales.sales, search, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique values for filters
  const uniqueCategories = [...new Set(sales.sales.map(sale => sale.category))];
  const uniqueSellers = [...new Set(sales.sales.map(sale => sale.seller))];
  const uniqueRegisters = [...new Set(sales.sales.map(sale => sale.register))];

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setShowSaleForm(true);
  };

  const handleDelete = async () => {
    if (!deletingSale) return;
    
    setDeleteLoading(true);
    try {
      await salesService.deleteSale(deletingSale.id);
      setDeletingSale(null);
    } catch (error) {
      console.error('Error deleting sale:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setEditingSale(null);
    setCurrentPage(1); // Reset to first page after adding/editing
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      seller: '',
      register: ''
    });
    setSearch('');
    setCurrentPage(1);
  };

  if (sales.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suivi des Ventes</h1>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
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
            onClick={() => setShowSaleForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Nouvelle vente
          </button>
          
          <button className="btn btn-secondary flex items-center">
            <FileText size={16} className="mr-2" />
            Exporter
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Date Début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters({...filters, dateFrom: e.target.value});
                  setCurrentPage(1);
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Date Fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters({...filters, dateTo: e.target.value});
                  setCurrentPage(1);
                }}
                className="form-input"
              />
            </div>
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
              <label className="form-label">Vendeur</label>
              <select 
                value={filters.seller}
                onChange={(e) => {
                  setFilters({...filters, seller: e.target.value});
                  setCurrentPage(1);
                }}
                className="form-input"
              >
                <option value="">Tous les vendeurs</option>
                {uniqueSellers.map(seller => (
                  <option key={seller} value={seller}>{seller}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Caisse</label>
              <select 
                value={filters.register}
                onChange={(e) => {
                  setFilters({...filters, register: e.target.value});
                  setCurrentPage(1);
                }}
                className="form-input"
              >
                <option value="">Toutes les caisses</option>
                {uniqueRegisters.map(register => (
                  <option key={register} value={register}>{register}</option>
                ))}
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

      <div className="bg-white rounded-lg shadow-sm">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className="cursor-pointer">
                  <div className="flex items-center">
                    Date {getSortIcon('date')}
                  </div>
                </th>
                <th onClick={() => handleSort('product')} className="cursor-pointer">
                  <div className="flex items-center">
                    Produit {getSortIcon('product')}
                  </div>
                </th>
                <th onClick={() => handleSort('category')} className="cursor-pointer">
                  <div className="flex items-center">
                    Catégorie {getSortIcon('category')}
                  </div>
                </th>
                <th onClick={() => handleSort('price')} className="cursor-pointer">
                  <div className="flex items-center">
                    Prix {getSortIcon('price')}
                  </div>
                </th>
                <th onClick={() => handleSort('quantity')} className="cursor-pointer">
                  <div className="flex items-center">
                    Quantité {getSortIcon('quantity')}
                  </div>
                </th>
                <th onClick={() => handleSort('total')} className="cursor-pointer">
                  <div className="flex items-center">
                    Total {getSortIcon('total')}
                  </div>
                </th>
                <th onClick={() => handleSort('seller')} className="cursor-pointer">
                  <div className="flex items-center">
                    Vendeur {getSortIcon('seller')}
                  </div>
                </th>
                <th onClick={() => handleSort('register')} className="cursor-pointer">
                  <div className="flex items-center">
                    Caisse {getSortIcon('register')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{sale.product}</td>
                  <td>{sale.category}</td>
                  <td>{sale.price.toFixed(2)} €</td>
                  <td>{sale.quantity}</td>
                  <td className="font-medium">{sale.total.toFixed(2)} €</td>
                  <td>{sale.seller}</td>
                  <td>{sale.register}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(sale)}
                        className="p-1 text-blue-600 hover:text-blue-800" 
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeletingSale(sale)}
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
            Aucune vente ne correspond à vos critères de recherche
          </div>
        )}
        
        {filteredData.length > 0 && (
          <>
            <div className="px-6 py-3 bg-gray-50 border-t flex justify-between items-center text-sm text-gray-500">
              <div>
                Total: {filteredData.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)} €
              </div>
              <div>
                Quantité totale: {filteredData.reduce((sum, sale) => sum + sale.quantity, 0)} unités
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

      {/* Sale Form Modal */}
      {showSaleForm && (
        <SaleForm
          sale={editingSale}
          onClose={() => {
            setShowSaleForm(false);
            setEditingSale(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSale}
        title="Supprimer la vente"
        message={`Êtes-vous sûr de vouloir supprimer cette vente de ${deletingSale?.product} ? Cette action est irréversible et restaurera le stock.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingSale(null)}
        loading={deleteLoading}
        type="danger"
      />
    </div>
  );
};

export default Sales;