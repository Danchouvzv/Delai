import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChatErrorDisplayProps {
  errorMessage: string;
}

const ChatErrorDisplay: React.FC<ChatErrorDisplayProps> = ({ errorMessage }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-4xl p-4 mt-16"
    >
      <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Ошибка</h2>
        <p className="text-gray-600 dark:text-gray-400">{errorMessage}</p>
        <Link 
          to="/chats"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
        >
          Вернуться к списку чатов
        </Link>
      </div>
    </motion.div>
  );
};

export default ChatErrorDisplay; 