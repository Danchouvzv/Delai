import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AIMentor: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Привет! Я твой AI-карьерный ментор. Как я могу помочь тебе в поиске работы или развитии карьеры сегодня?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Примерные карьерные треки для выбора
  const careerTracks = [
    {
      title: 'Разработка',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: 'Дизайн',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      title: 'Маркетинг',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    },
    {
      title: 'Менеджмент',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];
  
  // Примерные подсказки для вопросов
  const suggestedQuestions = [
    'Как мне подготовиться к интервью на позицию Senior Developer?',
    'Что написать в сопроводительном письме для позиции маркетолога?',
    'Какие навыки востребованы в сфере UX/UI дизайна?',
    'Как обсуждать зарплату на собеседовании?'
  ];
  
  // Отправка сообщения
  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Добавляем сообщение пользователя
    setChatMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
    setIsLoading(true);
    
    // Симуляция ответа AI (в реальном приложении тут будет API запрос)
    setTimeout(() => {
      const responses = [
        "Отличный вопрос! Для подготовки к интервью рекомендую сосредоточиться на технических навыках и реальных проектах, которые вы выполняли.",
        "На основе вашей карьерной цели, я бы рекомендовал сфокусироваться на развитии навыков в области технического лидерства и управления проектами.",
        "Согласно последним тенденциям рынка труда, специалисты с вашими навыками особенно востребованы в финтех и медтех секторах.",
        "Для улучшения вашего резюме рекомендую делать акцент на конкретных достижениях, а не просто перечислять обязанности на предыдущих местах работы."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { role: 'ai', content: randomResponse }]);
      setIsLoading(false);
    }, 1000);
    
    setInputMessage('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-24">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <motion.h1 
              className="text-4xl sm:text-5xl font-extrabold mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-slate-800 dark:text-white">AI </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Карьерный Ментор</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Получите персонализированные советы по карьере, подготовке к собеседованиям и развитию профессиональных навыков от нашего ИИ-помощника.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Левая панель с возможностями */}
            <motion.div
              className="lg:col-span-1 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Карьерные треки */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Карьерные направления</h3>
                <div className="space-y-2">
                  {careerTracks.map((track, index) => (
                    <button 
                      key={index}
                      className="w-full flex items-center p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-left transition-colors"
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 mr-3 flex-shrink-0">
                        {track.icon}
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{track.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Информация о возможностях */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                
                <h3 className="text-lg font-bold mb-3 relative z-10">AI-ментор поможет вам:</h3>
                <ul className="space-y-2 relative z-10">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Подготовиться к собеседованию</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Составить резюме и сопроводительное письмо</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Спланировать карьерный рост</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Улучшить профессиональные навыки</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            {/* Главный чат с ментором */}
            <motion.div 
              className="lg:col-span-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/30 overflow-hidden flex flex-col"
              style={{ height: '70vh' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Шапка чата */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/30 flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white mr-4 shadow-lg shadow-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Карьерный Ментор</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Персональный помощник для развития карьеры</p>
                </div>
                <div className="ml-auto flex">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Тело чата */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-700 p-4">
                      <div className="flex space-x-2 items-center">
                        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Подсказки с вопросами */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700/30 bg-slate-50 dark:bg-slate-800 flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="text-xs px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
              
              {/* Форма ввода */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Задайте вопрос о карьере..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentor; 