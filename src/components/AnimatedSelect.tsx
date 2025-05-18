import React from 'react';
import { motion } from 'framer-motion';

// Select component with animation
interface AnimatedSelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Выберите...",
  required = false
}) => {
  return (
    <motion.div 
      className="relative" 
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-white dark:bg-gray-700/70 rounded-lg px-4 py-3 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-inner appearance-none"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-6">
        <svg className="fill-current h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </motion.div>
  );
};

export default AnimatedSelect; 