import React from 'react';
import { motion } from 'framer-motion';

// Input field component with animation
interface AnimatedInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  multiline = false,
  rows = 3
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
      
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={rows}
          className="w-full bg-white dark:bg-gray-700/70 rounded-lg px-4 py-3 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-inner"
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="w-full bg-white dark:bg-gray-700/70 rounded-lg px-4 py-3 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-inner"
          placeholder={placeholder}
          required={required}
        />
      )}
    </motion.div>
  );
};

export default AnimatedInput; 