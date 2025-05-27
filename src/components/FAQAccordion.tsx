import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiThumbsUp, FiBookmark, FiShare2 } from 'react-icons/fi';

// Интерфейс для FAQ элемента
export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'profile' | 'resume' | 'job' | 'general' | 'career' | 'technical' | 'ai';
  helpfulCount?: number;
  isBookmarked?: boolean;
}

interface FAQAccordionProps {
  items: FAQItem[];
  activeCategory: string;
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ items, activeCategory }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [helpfulItems, setHelpfulItems] = useState<Record<number, boolean>>({});
  const [bookmarkedItems, setBookmarkedItems] = useState<Record<number, boolean>>({});
  
  // Переключение открытого вопроса
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  // Отметить как полезное
  const markAsHelpful = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulItems({
      ...helpfulItems,
      [id]: !helpfulItems[id]
    });
  };
  
  // Добавить в закладки
  const toggleBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedItems({
      ...bookmarkedItems,
      [id]: !bookmarkedItems[id]
    });
  };
  
  // Поделиться
  const shareItem = (id: number, question: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: 'JumysAl FAQ',
        text: question,
        url: window.location.href + '#faq-' + id
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href + '#faq-' + id)
        .then(() => alert('Ссылка скопирована в буфер обмена'))
        .catch(console.error);
    }
  };
  
  // Анимации для элементов
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300 }
    }
  };
  
  return (
    <motion.div 
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            id={`faq-${item.id}`}
            key={item.id}
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
            whileHover={{ scale: 1.01, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}
          >
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
              onClick={() => toggleExpand(item.id)}
            >
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-purple-500"
              >
                <FiChevronDown />
              </motion.span>
            </button>
            
            <AnimatePresence>
              {expandedId === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700">
                    <p className="pt-4 leading-relaxed">{item.answer}</p>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.category === 'profile' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        item.category === 'resume' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        item.category === 'job' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        item.category === 'career' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        item.category === 'technical' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' :
                        item.category === 'ai' ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {item.category === 'profile' ? 'Профиль' :
                         item.category === 'resume' ? 'Резюме' :
                         item.category === 'job' ? 'Поиск работы' :
                         item.category === 'career' ? 'Карьера' :
                         item.category === 'technical' ? 'Техническое' :
                         item.category === 'ai' ? 'ИИ' : 
                         'Общие вопросы'}
                      </span>
                      
                      <div className="flex items-center space-x-4">
                        <button 
                          className={`flex items-center gap-1 transition-colors ${
                            helpfulItems[item.id] 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                          }`}
                          onClick={(e) => markAsHelpful(item.id, e)}
                        >
                          <FiThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{helpfulItems[item.id] ? 'Полезно' : 'Отметить как полезное'}</span>
                        </button>
                        
                        <button 
                          className={`flex items-center gap-1 transition-colors ${
                            bookmarkedItems[item.id] 
                              ? 'text-purple-600 dark:text-purple-400' 
                              : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                          }`}
                          onClick={(e) => toggleBookmark(item.id, e)}
                        >
                          <FiBookmark className="w-4 h-4" />
                        </button>
                        
                        <button 
                          className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition-colors"
                          onClick={(e) => shareItem(item.id, item.question, e)}
                        >
                          <FiShare2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQAccordion; 