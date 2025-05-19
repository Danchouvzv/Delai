import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Subscription: React.FC = () => {
  const { user, userData } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'kzt' | 'usd'>('kzt');
  
  const isLoggedIn = !!user;
  
  // Тарифные планы с более доступными ценами
  const plans = [
    {
      id: 'free',
      name: 'Стартовый',
      description: 'Идеально для начала работы с платформой',
      price: {
        monthly: { kzt: 0, usd: 0 },
        yearly: { kzt: 0, usd: 0 },
      },
      features: [
        '1 активная вакансия',
        'Базовый поиск кандидатов',
        'Доступ к базовым шаблонам',
        'Просмотр до 10 резюме',
        'Поддержка по email'
      ],
      badge: '',
      buttonText: isLoggedIn ? 'Текущий план' : 'Начать бесплатно',
      buttonVariant: 'white',
      isPopular: false,
      isDisabled: isLoggedIn && userData?.subscriptionTier === 'free'
    },
    {
      id: 'basic',
      name: 'Базовый',
      description: 'Для небольших компаний и новых HR-специалистов',
      price: {
        monthly: { kzt: 4900, usd: 9.99 },
        yearly: { kzt: 49000, usd: 99 },
      },
      features: [
        '5 активных вакансий',
        'Расширенный поиск кандидатов',
        'Доступ к продвинутым шаблонам',
        'Просмотр до 50 резюме',
        'ИИ подбор базового уровня',
        'Приоритетное размещение',
        'Чат-поддержка'
      ],
      badge: 'Выгодно',
      buttonText: isLoggedIn ? (userData?.subscriptionTier === 'basic' ? 'Текущий план' : 'Выбрать план') : 'Начать сейчас',
      buttonVariant: 'indigo',
      isPopular: true,
      isDisabled: isLoggedIn && userData?.subscriptionTier === 'basic'
    },
    {
      id: 'pro',
      name: 'Профессиональный',
      description: 'Для растущих компаний с активным наймом',
      price: {
        monthly: { kzt: 9900, usd: 19.99 },
        yearly: { kzt: 99000, usd: 199 },
      },
      features: [
        'Неограниченное количество вакансий',
        'Премиум поиск кандидатов',
        'Полный доступ к шаблонам',
        'Неограниченный просмотр резюме',
        'ИИ подбор продвинутого уровня',
        'Продвижение вакансий',
        'Аналитика и отчёты',
        'Приоритетная поддержка 24/7'
      ],
      badge: 'Всё включено',
      buttonText: isLoggedIn ? (userData?.subscriptionTier === 'pro' ? 'Текущий план' : 'Выбрать план') : 'Начать сейчас',
      buttonVariant: 'gradient',
      isPopular: false,
      isDisabled: isLoggedIn && userData?.subscriptionTier === 'pro'
    }
  ];
  
  // Получаем форматированную цену
  const getFormattedPrice = (price: number) => {
    if (price === 0) return 'Бесплатно';
    
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-24">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl sm:text-5xl font-extrabold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-slate-800 dark:text-white">Выберите подходящий </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">тарифный план</span>
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Доступные планы для любого бюджета. Начните бесплатно и модернизируйте тариф по мере роста вашей компании.
          </motion.p>
        </div>
        
        {/* Переключатели */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-12">
          {/* Переключатель периода оплаты */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-full p-1 inline-flex shadow-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Ежемесячно
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billing === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Ежегодно
            </button>
          </motion.div>
          
          {/* Переключатель валюты */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-full p-1 inline-flex shadow-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button
              onClick={() => setCurrency('kzt')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currency === 'kzt'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              ₸ KZT
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currency === 'usd'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              $ USD
            </button>
          </motion.div>
        </div>
        
        {/* Карточки планов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative rounded-2xl overflow-hidden ${
                plan.isPopular 
                  ? 'bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-500 shadow-xl' 
                  : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-100 dark:border-slate-700/30 shadow-lg hover:shadow-xl'
              } transition-all duration-300`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              {/* Бейдж популярного плана */}
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Популярный выбор
                </div>
              )}
              
              {/* Верхний бейдж */}
              {plan.badge && (
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-sm font-medium text-center py-1.5">
                  {plan.badge}
                </div>
              )}
              
              <div className="p-6 md:p-8">
                {/* Заголовок и описание */}
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{plan.description}</p>
                
                {/* Цена */}
                <div className="mb-8">
                  <div className="flex items-end">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      {getFormattedPrice(plan.price[billing][currency])}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="text-slate-500 dark:text-slate-400 ml-2 pb-1">
                        {billing === 'monthly' ? '/месяц' : '/год'}
                      </span>
                    )}
                  </div>
                  
                  {/* Скидка для годовых планов */}
                  {billing === 'yearly' && plan.id !== 'free' && (
                    <div className="mt-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                      Экономия 20%
                    </div>
                  )}
                </div>
                
                {/* Список функций */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Кнопка */}
                <Link
                  to={isLoggedIn ? `/employer/billing/${plan.id}` : '/auth?redirect=/subscription'}
                  className={`w-full inline-flex justify-center items-center px-6 py-3 rounded-xl text-center font-medium transition-all ${
                    plan.isDisabled
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : plan.buttonVariant === 'white'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-slate-500 shadow-sm hover:shadow'
                        : plan.buttonVariant === 'gradient'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                  }`}
                  onClick={(e) => plan.isDisabled && e.preventDefault()}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscription; 