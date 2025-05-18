import React from 'react';
import { motion } from 'framer-motion';

// Animation variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15 
    }
  }
};

// Create a component for form sections to improve readability
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const FormSection = ({ title, children, icon }: FormSectionProps): React.ReactElement => {
  return (
    <motion.div 
      variants={itemVariants} 
      className="mb-8 bg-white/90 dark:bg-gray-800/60 rounded-xl p-6 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center text-blue-600 dark:text-blue-400">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
};

export default FormSection; 