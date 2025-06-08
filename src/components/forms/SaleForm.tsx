import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Sale } from '../../lib/supabase';

interface SaleFormProps {
  sale?: Sale | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SaleForm: React.FC<SaleFormProps> = ({ sale, onClose, onSuccess }) => {
  const { products, salesService } = useData();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    date: sale?.date || new Date().toISOString().split('T')[0],
    product: sale?.product || '',
    category: sale?.category || '',
    subcategory: sale?.subcategory || '',
    price: sale?.price?.toString() || '',
    quantity: sale?.quantity?.toString() || '1',
    seller: sale?.seller || '',
    register: sale?.register || 'Caisse 1'
  });

  // Update category and subcategory when product changes
  useEffect(() => {
    if (formData.product && !sale) {
      const selectedProduct = products.products.find(p => p.name === formData.product);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          category: selectedProduct.category,
          subcategory: selectedProduct.subcategory,
          price: selectedProduct.price.toString()
        }));
      }
    }
  }, [formData.product, products.products, sale]);

  // Calculate total
  const total = parseFloat(formData.price || '0') * parseInt(formData.quantity || '0');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date requise';
    if (!formData.product) newErrors.product = 'Produit requis';
    if (!formData.seller) newErrors.seller = 'Vendeur requis';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Prix valide requis';
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantité valide requise';
    }

    // Check stock availability for new sales
    if (!sale) {
      const selectedProduct = products.products.find(p => p.name === formData.product);
      if (selectedProduct && selectedProduct.current_stock < parseInt(formData.quantity || '0')) {
        newErrors.quantity = `Stock insuffisant (${selectedProduct.current_stock} disponible)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const saleData = {
        date: formData.date,
        product: formData.product,
        category: formData.category,
        subcategory: formData.subcategory,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        total: total,
        seller: formData.seller,
        register: formData.register
      };

      if (sale) {
        await salesService.updateSale(sale.id, saleData);
      } else {
        await salesService.addSale(saleData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving sale:', error);
      setErrors({ submit: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {sale ? 'Modifier la vente' : 'Nouvelle vente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center">
              <AlertCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700">{errors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`form-input ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="form-label">Produit *</label>
              <select
                value={formData.product}
                onChange={(e) => handleChange('product', e.target.value)}
                className={`form-input ${errors.product ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner un produit</option>
                {products.products.map(product => (
                  <option key={product.id} value={product.name}>
                    {product.name} (Stock: {product.current_stock})
                  </option>
                ))}
              </select>
              {errors.product && <p className="text-red-500 text-sm mt-1">{errors.product}</p>}
            </div>

            <div>
              <label className="form-label">Catégorie</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="form-input"
                readOnly
              />
            </div>

            <div>
              <label className="form-label">Sous-catégorie</label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => handleChange('subcategory', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Prix unitaire (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`form-input ${errors.price ? 'border-red-500' : ''}`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="form-label">Quantité *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                className={`form-input ${errors.quantity ? 'border-red-500' : ''}`}
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="form-label">Vendeur *</label>
              <select
                value={formData.seller}
                onChange={(e) => handleChange('seller', e.target.value)}
                className={`form-input ${errors.seller ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner un vendeur</option>
                <option value="Jean">Jean</option>
                <option value="Sophie">Sophie</option>
                <option value="Thomas">Thomas</option>
                <option value="Marie">Marie</option>
                <option value="Pierre">Pierre</option>
              </select>
              {errors.seller && <p className="text-red-500 text-sm mt-1">{errors.seller}</p>}
            </div>

            <div>
              <label className="form-label">Caisse</label>
              <select
                value={formData.register}
                onChange={(e) => handleChange('register', e.target.value)}
                className="form-input"
              >
                <option value="Caisse 1">Caisse 1</option>
                <option value="Caisse 2">Caisse 2</option>
                <option value="Caisse 3">Caisse 3</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-primary-600">
                {total.toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {sale ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleForm;