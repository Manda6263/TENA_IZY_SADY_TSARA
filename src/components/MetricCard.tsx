import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: string;
  positive?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  positive = true 
}) => {
  return (
    <div className="card hover:translate-y-[-4px] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm text-gray-500 font-medium mb-1">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          
          {change && (
            <div className={`flex items-center mt-2 text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
              {positive ? (
                <TrendingUp size={16} className="mr-1" />
              ) : (
                <TrendingDown size={16} className="mr-1" />
              )}
              <span>{change} depuis la dernière période</span>
            </div>
          )}
        </div>
        
        <div className="p-2 rounded-full bg-gray-100">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;