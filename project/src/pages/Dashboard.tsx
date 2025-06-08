import React, { useState } from 'react';
import { Calendar, TrendingUp, Package, Users, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MetricCard from '../components/MetricCard';
import DateRangePicker from '../components/DateRangePicker';
import { ShoppingBag } from 'lucide-react';

const COLORS = ['#1E3A8A', '#0F766E', '#B45309', '#4F46E5'];

// Dummy data for demonstration
const salesData = [
  { name: 'Jan', amount: 4000 },
  { name: 'Feb', amount: 3000 },
  { name: 'Mar', amount: 5000 },
  { name: 'Apr', amount: 7000 },
  { name: 'May', amount: 6000 },
  { name: 'Jun', amount: 8000 },
  { name: 'Jul', amount: 9000 },
];

const sellerData = [
  { name: 'Jean', value: 400 },
  { name: 'Sophie', value: 300 },
  { name: 'Thomas', value: 300 },
  { name: 'Marie', value: 200 },
];

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Metrics
  const totalSales = "75,400 €";
  const totalQuantity = "1,283 unités";
  const stockRemaining = "3,742 unités";
  const averageSale = "58.77 €";

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        
        <div className="flex items-center space-x-2">
          <DateRangePicker 
            onChange={(range) => setDateRange(range)}
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Filter size={18} className="mr-1" />
            <span>Filtres</span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Vendeur</label>
              <select className="form-input">
                <option value="">Tous les vendeurs</option>
                <option>Jean</option>
                <option>Sophie</option>
                <option>Thomas</option>
                <option>Marie</option>
              </select>
            </div>
            <div>
              <label className="form-label">Caisse</label>
              <select className="form-input">
                <option value="">Toutes les caisses</option>
                <option>Caisse 1</option>
                <option>Caisse 2</option>
                <option>Caisse 3</option>
              </select>
            </div>
            <div>
              <label className="form-label">Catégorie</label>
              <select className="form-input">
                <option value="">Toutes les catégories</option>
                <option>Boissons</option>
                <option>Alimentation</option>
                <option>Accessoires</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn btn-secondary mr-2">Réinitialiser</button>
            <button className="btn btn-primary">Appliquer</button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Chiffre d'affaires" 
          value={totalSales}
          icon={<TrendingUp className="text-primary-600\" size={24} />}
          change="+12.5%"
          positive={true}
        />
        <MetricCard 
          title="Quantité vendue" 
          value={totalQuantity}
          icon={<ShoppingBag className="text-secondary-600\" size={24} />}
          change="+8.3%"
          positive={true}
        />
        <MetricCard 
          title="Stock restant" 
          value={stockRemaining}
          icon={<Package className="text-accent-600\" size={24} />}
          change="-5.2%"
          positive={false}
        />
        <MetricCard 
          title="Panier moyen" 
          value={averageSale}
          icon={<TrendingUp className="text-primary-600\" size={24} />}
          change="+3.7%"
          positive={true}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Évolution des ventes</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#1E3A8A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Ventes par vendeur</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sellerData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sellerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;