import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiCpu, FiMail, FiPhone, FiVideo, FiBook } from 'react-icons/fi';

const FAQSupportSection: React.FC = () => {
  const [isFormActive, setIsFormActive] = useState(false);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Имитация отправки формы
    setTimeout(() => {
      setFormSubmitted(true);
      setEmail('');
      setQuestion('');
    }, 1000);
  };
  
  return (
    <div className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Не нашли ответ на свой вопрос?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            У нас есть несколько способов получить помощь в любое время
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 text-center shadow-md"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
              <FiCpu className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Ментор</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Получите мгновенные ответы на свои вопросы от нашего интеллектуального ассистента, доступного 24/7
            </p>
            <button className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              Спросить AI Ментора
            </button>
          </motion.div>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 text-center shadow-md"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white">
              <FiMessageCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Служба поддержки</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Наша команда поддержки ответит на ваши вопросы и поможет решить любые проблемы
            </p>
            <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              Связаться с поддержкой
            </button>
          </motion.div>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ y: -5 }}
            className="bg-gradient-to-b from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-6 text-center shadow-md"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white">
              <FiBook className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">База знаний</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Изучите нашу расширенную документацию с подробными руководствами и обучающими материалами
            </p>
            <button className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              Перейти в базу знаний
            </button>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"></div>
          
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Задайте вопрос напрямую
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Мы ответим на ваш запрос в течение 24 часов
            </p>
            
            {formSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-green-800 dark:text-green-300 mb-1">
                  Запрос отправлен!
                </h4>
                <p className="text-green-700 dark:text-green-400">
                  Мы скоро свяжемся с вами по указанному email.
                </p>
                <button 
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => setFormSubmitted(false)}
                >
                  Отправить новый запрос
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ваш Email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 dark:bg-gray-700 dark:text-white"
                    placeholder="example@mail.com"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ваш вопрос
                  </label>
                  <textarea 
                    id="question" 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 dark:bg-gray-700 dark:text-white"
                    placeholder="Опишите свой вопрос подробно..."
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Отправить вопрос
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-3">
              <FiMail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Email</h4>
              <p className="text-gray-600 dark:text-gray-400">support@jumysal.com</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
              <FiPhone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Телефон</h4>
              <p className="text-gray-600 dark:text-gray-400">+7 (777) 123-45-67</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mr-3">
              <FiVideo className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Видеоконсультация</h4>
              <p className="text-gray-600 dark:text-gray-400">Пн-Пт, 09:00 - 18:00</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FAQSupportSection; 