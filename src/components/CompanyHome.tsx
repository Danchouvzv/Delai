import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Компонент домашней страницы для компаний
const CompanyHome: React.FC = () => {
  const [activeTab, setActiveTab] = useState('about');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16 pb-24"
    >
      {/* Фоновые элементы */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              JumysAL для бизнеса
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Находите талантливых студентов, создавайте вакансии и развивайте свою команду
          </p>
        </div>
        
        {/* Навигационные табы */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-slate-100 dark:border-slate-700/30 flex">
            {[
              { id: 'about', label: 'О платформе' },
              { id: 'features', label: 'Возможности' },
              { id: 'pricing', label: 'Тарифы' },
              { id: 'testimonials', label: 'Отзывы' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Основной контент */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">
                Найдите идеальных кандидатов для вашей компании
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                JumysAL соединяет компании с талантливыми студентами и выпускниками, готовыми начать свою карьеру. 
                Наша платформа помогает вам находить мотивированных кандидатов, экономить время на подборе и 
                развивать молодые таланты.
              </p>
              <div className="space-y-4">
                {[
                  'Доступ к базе данных талантливых студентов',
                  'ИИ-подбор кандидатов по вашим критериям',
                  'Инструменты для эффективного найма',
                  'Аналитика и отчеты по вашим вакансиям'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700/30">
                <div className="p-8">
                  <img 
                    src="/assets/company-dashboard-preview.jpg" 
                    alt="Панель управления компании" 
                    className="rounded-xl shadow-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400?text=Панель+управления+компании';
                    }}
                  />
                  <div className="mt-6 text-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                      Мощная панель управления
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Управляйте вакансиями, кандидатами и аналитикой в одном месте
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'features' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">
                Возможности для работодателей
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Наша платформа предоставляет все необходимые инструменты для эффективного поиска и найма талантов
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'ИИ-подбор кандидатов',
                  description: 'Наш искусственный интеллект автоматически находит и ранжирует кандидатов, соответствующих вашим требованиям',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )
                },
                {
                  title: 'Управление вакансиями',
                  description: 'Создавайте, редактируйте и отслеживайте вакансии. Получайте уведомления о новых заявках',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )
                },
                {
                  title: 'Расширенная аналитика',
                  description: 'Получайте детальные отчеты о просмотрах вакансий, конверсии и эффективности найма',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                {
                  title: 'Профили компании',
                  description: 'Создайте привлекательный профиль компании, чтобы привлекать лучших кандидатов',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )
                },
                {
                  title: 'Сообщения с кандидатами',
                  description: 'Общайтесь с потенциальными кандидатами напрямую через встроенную систему сообщений',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )
                },
                {
                  title: 'Автоматизация процессов',
                  description: 'Автоматизируйте рутинные задачи найма с помощью шаблонов и автоматических ответов',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'pricing' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">
                Тарифные планы
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Выберите план, который подходит для ваших потребностей найма
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Стартап',
                  price: '9 900 ₸',
                  period: 'в месяц',
                  description: 'Идеально для небольших компаний и стартапов',
                  features: [
                    'До 3 активных вакансий',
                    'Базовый доступ к базе кандидатов',
                    'Стандартные шаблоны вакансий',
                    'Email поддержка'
                  ],
                  cta: 'Начать бесплатный период',
                  popular: false
                },
                {
                  name: 'Бизнес',
                  price: '24 900 ₸',
                  period: 'в месяц',
                  description: 'Оптимально для растущих компаний',
                  features: [
                    'До 10 активных вакансий',
                    'Полный доступ к базе кандидатов',
                    'ИИ-подбор кандидатов',
                    'Расширенная аналитика',
                    'Приоритетная поддержка'
                  ],
                  cta: 'Выбрать план',
                  popular: true
                },
                {
                  name: 'Корпоративный',
                  price: '59 900 ₸',
                  period: 'в месяц',
                  description: 'Для крупных компаний с большим объемом найма',
                  features: [
                    'Неограниченное количество вакансий',
                    'VIP доступ к базе кандидатов',
                    'Расширенный ИИ-подбор',
                    'Персональный менеджер',
                    'API интеграция',
                    'Брендированные страницы вакансий'
                  ],
                  cta: 'Связаться с отделом продаж',
                  popular: false
                }
              ].map((plan, index) => (
                <div 
                  key={index} 
                  className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border ${
                    plan.popular 
                      ? 'border-indigo-500 dark:border-indigo-400' 
                      : 'border-slate-100 dark:border-slate-700/30'
                  } overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Популярный выбор
                      </div>
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{plan.price}</span>
                      <span className="text-slate-500 dark:text-slate-400"> {plan.period}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{plan.description}</p>
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      className={`w-full py-3 rounded-xl font-medium ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                      } transition-all duration-300`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'testimonials' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">
                Отзывы наших клиентов
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Узнайте, что говорят компании, использующие нашу платформу для поиска талантов
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  quote: "JumysAL помог нам найти талантливых студентов, которые внесли свежие идеи в нашу компанию. Процесс найма стал намного эффективнее.",
                  author: "Алия Нурланова",
                  position: "HR-директор, TechKazakhstan",
                  image: "https://randomuser.me/api/portraits/women/32.jpg"
                },
                {
                  quote: "Благодаря ИИ-подбору кандидатов мы смогли быстро найти подходящих стажеров для нашего проекта. Очень довольны результатами!",
                  author: "Арман Сериков",
                  position: "CEO, Digital Solutions",
                  image: "https://randomuser.me/api/portraits/men/46.jpg"
                },
                {
                  quote: "Интуитивный интерфейс и мощные инструменты аналитики делают JumysAL незаменимым для нашей HR-команды. Рекомендую всем работодателям.",
                  author: "Гульнара Ахметова",
                  position: "Руководитель отдела найма, AlmaBank",
                  image: "https://randomuser.me/api/portraits/women/65.jpg"
                },
                {
                  quote: "Мы нашли трех постоянных сотрудников через JumysAL, которые начинали как стажеры. Платформа помогает выявлять настоящие таланты!",
                  author: "Бахыт Касымов",
                  position: "Основатель, StartupHub",
                  image: "https://randomuser.me/api/portraits/men/22.jpg"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/30">
                  <div className="flex items-start mb-4">
                    <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="text-slate-600 dark:text-slate-300 italic">{testimonial.quote}</p>
                  </div>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.author} 
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{testimonial.author}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.position}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* CTA секция */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl px-8 py-16 text-center text-white overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:30px_30px]"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Готовы начать нанимать таланты?</h2>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto mb-10 relative z-10">
            Присоединяйтесь к сотням компаний, которые уже нашли идеальных кандидатов с помощью JumysAL.
            Создайте аккаунт работодателя, чтобы получить доступ ко всем возможностям платформы.
          </p>
          <div className="flex flex-wrap justify-center gap-6 relative z-10">
            <Link
              to="/signup?type=employer"
              className="px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl shadow-lg shadow-indigo-700/30 hover:shadow-indigo-700/50 transition-all duration-300 hover:scale-105"
            >
              Создать аккаунт работодателя
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-transparent text-white font-medium rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyHome; 