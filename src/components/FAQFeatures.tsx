import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiUserCheck, 
  FiStar, 
  FiBriefcase, 
  FiActivity, 
  FiCpu, 
  FiGlobe,
  FiCalendar,
  FiTrendingUp
} from 'react-icons/fi';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient, delay }) => {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-r ${gradient}`}>
        <span className="text-white text-xl">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </motion.div>
  );
};

const FAQFeatures: React.FC = () => {
  const features = [
    {
      icon: <FiUserCheck />,
      title: 'Умный подбор',
      description: 'Интеллектуальные алгоритмы подбирают вакансии и стажировки, идеально соответствующие вашим навыкам и целям',
      gradient: 'from-purple-600 to-indigo-600',
      delay: 0.1
    },
    {
      icon: <FiStar />,
      title: 'AI-ментор',
      description: 'Персональный ИИ-ассистент, который помогает улучшить резюме, подготовиться к собеседованиям и дает карьерные советы',
      gradient: 'from-blue-600 to-cyan-600',
      delay: 0.2
    },
    {
      icon: <FiBriefcase />,
      title: 'Эксклюзивные стажировки',
      description: 'Доступ к уникальным предложениям стажировок от ведущих компаний, которые не публикуются на других ресурсах',
      gradient: 'from-green-600 to-emerald-600',
      delay: 0.3
    },
    {
      icon: <FiActivity />,
      title: 'Трекинг прогресса',
      description: 'Отслеживайте свой карьерный рост, улучшение навыков и активность по поиску работы с помощью наглядных метрик',
      gradient: 'from-orange-600 to-amber-600',
      delay: 0.4
    },
    {
      icon: <FiCpu />,
      title: 'Технический тренажёр',
      description: 'Интерактивные тесты и задания для оценки и улучшения ваших технических навыков с персонализированной обратной связью',
      gradient: 'from-cyan-600 to-blue-600',
      delay: 0.5
    },
    {
      icon: <FiGlobe />,
      title: 'Международные возможности',
      description: 'Подробные гиды и инструменты для поиска работы за рубежом, включая помощь с релокацией и оформлением документов',
      gradient: 'from-violet-600 to-purple-600',
      delay: 0.6
    },
    {
      icon: <FiCalendar />,
      title: 'Карьерные события',
      description: 'Календарь профессиональных мероприятий, ярмарок вакансий и нетворкинг-сессий с возможностью онлайн-участия',
      gradient: 'from-pink-600 to-rose-600',
      delay: 0.7
    },
    {
      icon: <FiTrendingUp />,
      title: 'Анализ рынка труда',
      description: 'Актуальные данные о трендах, востребованных навыках и зарплатных ожиданиях в различных отраслях',
      gradient: 'from-yellow-600 to-amber-600',
      delay: 0.8
    }
  ];
  
  return (
    <div className="py-16 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Возможности платформы JumysAl
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Инновационные инструменты и функции, которые помогут вам построить успешную карьеру
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={feature.delay}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQFeatures; 