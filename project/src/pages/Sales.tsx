import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, FileText } from 'lucide-react';

// Dummy sales data for demonstration
const salesData = [
  { id: 1, date: '2023-04-10', product: 'Fanta Orange', category: 'Boissons', subcategory: 'Sodas', price: 2.50, quantity: 5, total: 12.50, seller: 'Jean', register: 'Caisse 1' },
  { id: 2, date: '2023-04-10', product: 'Coca-Cola', category: 'Boissons', subcategory: 'Sodas', price: 2.80, quantity: 10, total: 28.00, seller: 'Sophie', register: 'Caisse 2' },
  { id: 3, date: '2023-04-11', product: 'Sandwich Jambon', category: 'Alimentation', subcategory: 'Sandwichs', price: 4.50, quantity: 8, total: 36.00, seller: 'Thomas', register: 'Caisse 1' },
  { id: 4, date: '2023-04-11', product: 'Eau Minérale', category: 'Boissons', subcategory: 'Eaux', price: 1.20, quantity: 15, total: 18.00, seller: 'Marie', register: 'Caisse 3' },
  { id: 5, date: '2023-04-12', product: 'Chips Sel', category: 'Alimentation', subcategory: 'Snacks', price: 1.80, quantity: 12, total: 21.60, seller: 'Jean', register: 'Caisse 2' },
];

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: string | null;
  direction: SortDirection;
}

const Sales: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
      // Toggle direction or reset
      const direction = sort.direction === 'asc' ? 'desc' : (sort.direction === 'desc' ? null : 'asc');
      setSort({ field: direction ? field : null, direction });
    } else {
      // Set new field with asc direction
      setSort({ field, direction: 'asc' });
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sort.field !== field) return null;
    
    return sort.direction === 'asc' ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    );
  };

  // Filter and sort data
  const filteredData = salesData
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
      
      const fieldA = a[sort.field as keyof typeof a];
      const fieldB = b[sort.field as keyof typeof b];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sort.direction === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      return sort.direction === 'asc'
        ? Number(fieldA) - Number(fieldB)
        : Number(fieldB) - Number(fieldA);
    });

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
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Date Fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="form-input"
              />
            </div>
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
              <label className="form-label">Vendeur</label>
              <select 
                value={filters.seller}
                onChange={(e) => setFilters({...filters, seller: e.target.value})}
                className="form-input"
              >
                <option value="">Tous les vendeurs</option>
                <option value="Jean">Jean</option>
                <option value="Sophie">Sophie</option>
                <option value="Thomas">Thomas</option>
                <option value="Marie">Marie</option>
              </select>
            </div>
            <div>
              <label className="form-label">Caisse</label>
              <select 
                value={filters.register}
                onChange={(e) => setFilters({...filters, register: e.target.value})}
                className="form-input"
              >
                <option value="">Toutes les caisses</option>
                <option value="Caisse 1">Caisse 1</option>
                <option value="Caisse 2">Caisse 2</option>
                <option value="Caisse 3">Caisse 3</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setFilters({
                dateFrom: '',
                dateTo: '',
                category: '',
                seller: '',
                register: ''
              })}
              className="btn btn-secondary mr-2"
            >
              Réinitialiser
            </button>
            <button className="btn btn-primary">Appliquer</button>
          </div>
        </div>
      )}

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
              <th onClick={() => handleSort('subcategory')} className="cursor-pointer">
                <div className="flex items-center">
                  Sous-catégorie {getSortIcon('subcategory')}
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
            </tr>
          </thead>
          <tbody>
            {filteredData.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                <td>{sale.date}</td>
                <td>{sale.product}</td>
                <td>{sale.category}</td>
                <td>{sale.subcategory}</td>
                <td>{sale.price.toFixed(2)} €</td>
                <td>{sale.quantity}</td>
                <td className="font-medium">{sale.total.toFixed(2)} €</td>
                <td>{sale.seller}</td>
                <td>{sale.register}</td>
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
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <div>
            Affichage de {filteredData.length} ventes sur {salesData.length}
          </div>
          <div className="font-medium">
            Total: {filteredData.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)} €
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;