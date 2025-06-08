import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { start: string; end: string }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange
}) => {
  return (
    <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-2">
      <Calendar size={16} className="text-gray-500" />
      
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange({ start: e.target.value, end: endDate })}
        className="text-sm border-none outline-none"
      />
      
      <span className="text-gray-500">-</span>
      
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange({ start: startDate, end: e.target.value })}
        className="text-sm border-none outline-none"
      />
    </div>
  );
};

export default DateRangePicker;