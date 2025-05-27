import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiFileText, FiBriefcase, FiHelpCircle, FiTrendingUp, FiCode, FiCpu, FiStar } from 'react-icons/fi';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface FAQCategoriesProps {
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

const FAQCategories: React.FC<FAQCategoriesProps> = ({ activeCategory, setActiveCategory }) => {
  // Список категорий с иконками и цветами
  const categories: Category[] = [
    { 
      id: 'all', 
      name: 'Все вопросы',
      icon: <FiStar />,
      color: 'from-purple-600 to-blue-500'
    },
    { 
      id: 'profile', 
      name: 'Профиль',
      icon: <FiUser />,
      color: 'from-purple-600 to-pink-500'
    },
    { 
      id: 'resume', 
      name: 'Резюме',
      icon: <FiFileText />,
      color: 'from-blue-600 to-cyan-500'
    },
    { 
      id: 'job', 
      name: 'Поиск работы',
      icon: <FiBriefcase />,
      color: 'from-green-600 to-emerald-500'
    },
    { 
      id: 'career', 
      name: 'Карьера',
      icon: <FiTrendingUp />,
      color: 'from-orange-500 to-amber-500'
    },
    { 
      id: 'technical', 
      name: 'Техническое',
      icon: <FiCode />,
      color: 'from-cyan-600 to-blue-500'
    },
    { 
      id: 'ai', 
      name: 'ИИ и технологии',
      icon: <FiCpu />,
      color: 'from-violet-600 to-purple-500'
    },
    { 
      id: 'general', 
      name: 'Общие вопросы',
      icon: <FiHelpCircle />,
      color: 'from-gray-600 to-gray-500'
    }
  ];
  
  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 md:px-0 md:mx-0 snap-x">
      <div className="flex space-x-2 min-w-max">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 snap-start flex items-center gap-2 ${
              activeCategory === category.id
                ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category.icon}
            {category.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FAQCategories; 