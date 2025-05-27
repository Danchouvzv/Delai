import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import FAQHero from '../components/FAQHero';
import FAQAccordion from '../components/FAQAccordion';
import FAQCategories from '../components/FAQCategories';
import FAQSearch from '../components/FAQSearch';
import FAQFeatures from '../components/FAQFeatures';
import FAQSupportSection from '../components/FAQSupportSection';
import { faqItems, popularSearches } from '../components/FAQData';
import { FiTrendingUp, FiSearch } from 'react-icons/fi';

const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(faqItems);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Фильтрация элементов по категории и поисковому запросу
  useEffect(() => {
    // Фильтрация сначала по категории
    let filtered = activeCategory === 'all' 
      ? faqItems
      : faqItems.filter(item => item.category === activeCategory);
    
    // Затем по поисковому запросу, если он есть
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(query) || 
        item.answer.toLowerCase().includes(query)
      );
    }
    
    setFilteredItems(filtered);
    // Обновление ключа анимации для перезапуска анимации
    setAnimationKey(prev => prev + 1);
  }, [activeCategory, searchQuery]);
  
  // Обработчик поиска
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Обработчик клика по популярному запросу
  const handlePopularSearch = (query: string) => {
    setSearchQuery(query);
    setActiveCategory('all'); // Сбрасываем категорию при выборе популярного запроса
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Navbar добавляется только один раз */}
      <Navbar />
      
      {/* Hero секция */}
      <FAQHero />
      
      {/* Основной контент */}
      <div className="container mx-auto px-4 py-12">
        {/* Поиск */}
        <FAQSearch onSearch={handleSearch} />
        
        {/* Популярные запросы */}
        {!filteredItems.length && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              По запросу <span className="font-semibold">"{searchQuery}"</span> ничего не найдено
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              Очистить поиск
            </button>
          </motion.div>
        )}
        
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <FiTrendingUp className="mr-2 text-purple-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">Популярные запросы</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((query, index) => (
              <motion.button
                key={index}
                onClick={() => handlePopularSearch(query)}
                className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 ${
                  searchQuery === query
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {query}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Категории */}
        <div className="mb-8">
          <FAQCategories 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
        </div>
        
        {/* Список вопросов */}
        {filteredItems.length > 0 ? (
          <motion.div
            key={animationKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <FAQAccordion 
              items={filteredItems} 
              activeCategory={activeCategory} 
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FiSearch className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Вопросы не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Попробуйте изменить запрос или выбрать другую категорию
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Сбросить фильтры
            </button>
          </motion.div>
        )}
      </div>
      
      {/* Секция с возможностями платформы */}
      <FAQFeatures />
      
      {/* Секция поддержки */}
      <FAQSupportSection />
      
      {/* Футер */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} JumysAl. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default FAQPage; 