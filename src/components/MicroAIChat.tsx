import React, { useState, useRef, useEffect } from 'react';
import { MicroMessage } from '../types';
import { motion } from 'framer-motion';

interface MicroAIChatProps {
  microInternshipId: string;
  messages: MicroMessage[];
  onSendMessage: (message: string, senderType?: 'student' | 'employer' | 'ai') => void;
}

const MicroAIChat: React.FC<MicroAIChatProps> = ({ microInternshipId, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo AI responses
  const demoResponses = [
    "Для этой задачи я рекомендую использовать компонентную структуру. Разделите интерфейс на логические части: Header, Features, Testimonials, ContactForm и Footer.",
    "Хороший вопрос! Для валидации формы вы можете использовать библиотеку formik или react-hook-form. Они значительно упрощают процесс валидации и управления состоянием форм.",
    "Чтобы сделать ваш сайт отзывчивым, используйте классы Tailwind, такие как 'md:', 'lg:' и 'xl:' для разных точек останова. Например: 'flex-col md:flex-row'.",
    "Для создания карусели отзывов я предлагаю использовать swiper.js или react-slick. Они предоставляют множество опций настройки и хорошую производительность.",
    "Для анимации можно использовать простые классы Tailwind, например группа hover:transform hover:scale-105 transition-all, или более продвинутые библиотеки как framer-motion для сложных анимаций."
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    onSendMessage(newMessage);
    setNewMessage('');

    // Simulate AI typing
    setIsTyping(true);
    setTimeout(() => {
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      onSendMessage(randomResponse, 'ai');
      setIsTyping(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-dark-lighter rounded-lg shadow-lg overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700"
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary dark:text-accent animate-pulse-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI-ментор
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Задавайте вопросы и получайте подсказки от AI-ментора
        </p>
      </motion.div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar bg-mesh-pattern bg-opacity-5">
        {/* Welcome message */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start"
        >
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center text-white shadow-md">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="ml-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40 rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[80%] shadow-sm message-bubble">
            <p>
              Привет! Я ваш AI-ментор. Я помогу вам с выполнением этой микро-стажировки.
              Вы можете задавать мне вопросы о технических аспектах задания, просить совета
              или объяснения. Чем я могу помочь вам сегодня?
            </p>
          </div>
        </motion.div>
        
        {/* Message history */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {messages.map((message, index) => (
            <motion.div 
              key={index} 
              className={`flex items-start ${message.senderType === 'student' ? 'justify-end' : ''}`}
              variants={{
                hidden: { 
                  opacity: 0, 
                  x: message.senderType === 'student' ? 20 : -20
                },
                visible: { 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }
                }
              }}
            >
              {message.senderType !== 'student' && (
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center text-white shadow-md">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              )}
              <div 
                className={`ml-3 max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm message-bubble ${
                  message.senderType === 'student'
                    ? 'message-sent'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40 text-gray-700 dark:text-gray-300'
                }`}
              >
                <p>{message.text}</p>
                {message.attachmentUrl && (
                  <div className="mt-2">
                    <a 
                      href={message.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Прикрепленный файл
                    </a>
                  </div>
                )}
              </div>
              {message.senderType === 'student' && (
                <div className="ml-3 flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-accent dark:to-accent-600 flex items-center justify-center text-white shadow-md">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
        
        {/* AI typing indicator */}
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-start"
          >
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center text-white shadow-md">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40 rounded-lg px-4 py-3 text-gray-700 dark:text-gray-300 shadow-sm">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-primary/70 dark:bg-accent/70 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-primary/70 dark:bg-accent/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-primary/70 dark:bg-accent/70 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="px-4 py-3 bg-white dark:bg-dark border-t border-gray-200 dark:border-gray-700"
      >
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Задайте вопрос AI-ментору..."
            className="flex-1 px-4 py-2 bg-white dark:bg-dark-lighter border border-gray-300 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent dark:text-white shadow-inner chat-input"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-lighter hover:to-primary dark:from-accent dark:to-accent-600 dark:hover:from-accent-400 dark:hover:to-accent text-white rounded-r-lg animated-button-send shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MicroAIChat; 