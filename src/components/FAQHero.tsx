import React from 'react';
import { motion } from 'framer-motion';
import { FiHelpCircle, FiUsers } from 'react-icons/fi';

const FAQHero: React.FC = () => {
  return (
    <motion.div 
      className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-r from-violet-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Декоративные элементы */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-r from-purple-300 to-blue-300 dark:from-purple-600/30 dark:to-blue-600/30 rounded-full filter blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, 10, 0],
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-600/30 dark:to-purple-600/30 rounded-full filter blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, -10, 0],
            y: [0, 15, 0],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg text-white">
              <FiHelpCircle className="w-8 h-8" />
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500"
          >
            Часто задаваемые вопросы
          </motion.h1>
          
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-8"
          >
            Все, что вам нужно знать для эффективного использования платформы
          </motion.p>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mb-12"
          >
            <div className="flex items-center bg-white dark:bg-gray-800 py-2 px-4 rounded-full shadow-md">
              <FiUsers className="mr-2 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Уже помогли 50,000+ пользователям
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default FAQHero; 