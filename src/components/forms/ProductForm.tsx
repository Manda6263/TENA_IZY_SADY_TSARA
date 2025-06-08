import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Product } from '../../lib/supabase';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSuccess }) => {
  const { productsService } = useData();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    initial_stock: product?.initial_stock?.toString() || '0',
    current_stock: product?.current_stock?.toString() || '0',
    price: product?.price?.toString() || '',
    threshold: product?.threshold?.toString() || '10'
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.category.trim()) newErrors.category = 'Catégorie requise';
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Prix valide requis';
    }
    if (parseInt(formData.initial_stock) < 0) {
      newErrors.initial_stock = 'Stock initial ne peut pas être négatif';
    }
    if (parseInt(formData.current_stock) < 0) {
      newErrors.current_stock = 'Stock actuel ne peut pas être négatif';
    }
    if (parseInt(formData.threshold) < 0) {
      newErrors.threshold = 'Seuil ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim(),
        initial_stock: parseInt(formData.initial_stock),
        current_stock: parseInt(formData.current_stock),
        price: parseFloat(formData.price),
        threshold: parseInt(formData.threshold)
      };

      if (product) {
        await productsService.updateProduct(product.id, productData);
      } else {
        await productsService.addProduct(productData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
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

  const categories = [
    'Boissons',
    'Alimentation',
    'Snacks',
    'Viennoiseries',
    'Produits frais',
    'Épicerie',
    'Hygiène',
    'Autres'
  ];

  const subcategories: Record<string, string[]> = {
    'Boissons': ['Sodas', 'Eaux', 'Jus', 'Café', 'Thé', 'Alcools'],
    'Alimentation': ['Sandwichs', 'Salades', 'Plats chauds', 'Desserts'],
    'Snacks': ['Chips', 'Biscuits', 'Chocolats', 'Bonbons'],
    'Viennoiseries': ['Croissants', 'Pains', 'Brioches'],
    'Produits frais': ['Fruits', 'Légumes', 'Laitages'],
    'Épicerie': ['Conserves', 'Pâtes', 'Riz', 'Céréales'],
    'Hygiène': ['Savons', 'Dentifrice', 'Shampoing'],
    'Autres': ['Divers']
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
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
            <div className="md:col-span-2">
              <label className="form-label">Nom du produit *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Ex: Coca-Cola 33cl"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="form-label">Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`form-input ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="form-label">Sous-catégorie</label>
              <select
                value={formData.subcategory}
                onChange={(e) => handleChange('subcategory', e.target.value)}
                className="form-input"
                disabled={!formData.category}
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {formData.category && subcategories[formData.category]?.map(subcat => (
                  <option key={subcat} value={subcat}>{subcat}</option>
                ))}
              </select>
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
              <label className="form-label">Seuil d'alerte</label>
              <input
                type="number"
                min="0"
                value={formData.threshold}
                onChange={(e) => handleChange('threshold', e.target.value)}
                className={`form-input ${errors.threshold ? 'border-red-500' : ''}`}
              />
              {errors.threshold && <p className="text-red-500 text-sm mt-1">{errors.threshold}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Alerte quand le stock descend en dessous de cette valeur
              </p>
            </div>

            <div>
              <label className="form-label">Stock initial</label>
              <input
                type="number"
                min="0"
                value={formData.initial_stock}
                onChange={(e) => handleChange('initial_stock', e.target.value)}
                className={`form-input ${errors.initial_stock ? 'border-red-500' : ''}`}
              />
              {errors.initial_stock && <p className="text-red-500 text-sm mt-1">{errors.initial_stock}</p>}
            </div>

            <div>
              <label className="form-label">Stock actuel</label>
              <input
                type="number"
                min="0"
                value={formData.current_stock}
                onChange={(e) => handleChange('current_stock', e.target.value)}
                className={`form-input ${errors.current_stock ? 'border-red-500' : ''}`}
              />
              {errors.current_stock && <p className="text-red-500 text-sm mt-1">{errors.current_stock}</p>}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Aperçu</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Valeur stock actuel:</span>
                <span className="ml-2 font-medium">
                  {(parseFloat(formData.price || '0') * parseInt(formData.current_stock || '0')).toFixed(2)} €
                </span>
              </div>
              <div>
                <span className="text-gray-500">Statut:</span>
                <span className={`ml-2 font-medium ${
                  parseInt(formData.current_stock || '0') === 0 ? 'text-red-600' :
                  parseInt(formData.current_stock || '0') <= parseInt(formData.threshold || '0') ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {parseInt(formData.current_stock || '0') === 0 ? 'Rupture' :
                   parseInt(formData.current_stock || '0') <= parseInt(formData.threshold || '0') ? 'Stock bas' :
                   'En stock'}
                </span>
              </div>
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
                  {product ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;