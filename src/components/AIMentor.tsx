import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateText } from '../api/gemini';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiChevronsDown, FiStar, FiBookOpen, FiFileText, FiTrendingUp, FiUser, FiDownload } from 'react-icons/fi';
import { BsLightningCharge, BsStars, BsGear, BsBraces, BsGraphUp, BsPalette } from 'react-icons/bs';


interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  model?: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  questions: string[];
}

const AIMentor = () => {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Привет! Я твой AI-карьерный ментор. Как я могу помочь тебе в поиске работы, развитии карьеры или подготовке к собеседованиям?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const categories: Category[] = [
    {
      id: 'interview',
      name: 'Подготовка к собеседованию',
      icon: <FiUser className="w-5 h-5" />,
      color: 'from-teal-400 to-emerald-500',
      questions: [
        'Какие вопросы часто задают на интервью для позиции Frontend разработчика?',
        'Как подготовиться к поведенческим вопросам?',
        'Как рассказать о своих слабых сторонах на собеседовании?',
        'Какие проекты стоит включить в свое портфолио?'
      ]
    },
    {
      id: 'resume',
      name: 'Улучшение резюме',
      icon: <FiFileText className="w-5 h-5" />,
      color: 'from-blue-400 to-indigo-500',
      questions: [
        'Как улучшить мое резюме для позиции в IT?',
        'Какие ключевые навыки включить в резюме разработчика?',
        'Как оформить опыт работы, если у меня мало опыта?',
        'Как составить эффективное сопроводительное письмо?'
      ]
    },
    {
      id: 'career',
      name: 'Карьерный рост',
      icon: <FiTrendingUp className="w-5 h-5" />,
      color: 'from-purple-400 to-violet-500',
      questions: [
        'Как перейти с Junior на Middle-позицию?',
        'Какие навыки будут востребованы в IT через 5 лет?',
        'Стоит ли сменить специализацию с Frontend на Backend?',
        'Как стать тимлидом и какие навыки для этого нужны?'
      ]
    },
    {
      id: 'skills',
      name: 'Развитие навыков',
      icon: <BsStars className="w-5 h-5" />,
      color: 'from-amber-400 to-orange-500',
      questions: [
        'Какие soft skills важны для IT-специалиста?',
        'Как развить навыки управления проектами?',
        'Какие онлайн-курсы рекомендуете для полного стека?',
        'Как эффективно изучать новые технологии?'
      ]
    }
  ];


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollButton(!isNearBottom);
    };

    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  
  const handleSendMessage = async (e?: React.FormEvent, questionText?: string) => {
    if (e) e.preventDefault();
    
    const messageText = questionText || input;
    if (!messageText.trim() || isLoading) return;

    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
     
      const userName = user?.displayName || userData?.firstName || 'there';
      const userRole = userData?.role || 'job seeker';
      
      
      const context = `The user's name is ${userName}. They are a ${userRole}.`;
      
      
      const response = await generateText(messageText, context);
      
      
      let aiResponseText = 'Извините, я не смог обработать ваш запрос. Пожалуйста, попробуйте еще раз.';
      
      if (typeof response === 'string') {
        aiResponseText = response;
      } else if (response && typeof response === 'object') {
        if (response.success && response.data) {
          aiResponseText = String(response.data);
        } else if (response.error) {
          aiResponseText = `Ошибка: ${response.error}`;
        }
      }
      
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
          sender: 'ai',
        timestamp: new Date(),
        model: 'gemini-pro'
      };
      
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Произошла ошибка при получении ответа. Пожалуйста, попробуйте позже.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', { 
      hour: 'numeric', 
      minute: 'numeric'
    }).format(date);
  };

  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const messageVariants = {
    hidden: (isUser: boolean) => ({
      opacity: 0,
      x: isUser ? 20 : -20,
      scale: 0.95,
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-12">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
      <div className="absolute top-40 right-[10%] w-64 h-64 bg-purple-300/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-[5%] w-64 h-64 bg-blue-300/10 rounded-full filter blur-3xl animate-pulse"></div>
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-block mb-4 p-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm rounded-full">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full">
              <BsStars className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span>AI </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">Карьерный Ментор</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Получите персонализированные советы по развитию карьеры, подготовке к собеседованиям и улучшению резюме
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <motion.div 
            className="lg:col-span-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/30 p-6 mb-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <BsLightningCharge className="mr-2 text-amber-500" />
                Популярные темы
              </h3>
              
              <div className="space-y-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )}
                    className={`w-full flex items-center p-3 rounded-xl text-left transition-all ${
                      selectedCategory === category.id
                        ? `bg-gradient-to-r ${category.color} text-white`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      selectedCategory === category.id
                        ? 'bg-white/20'
                        : `bg-gradient-to-r ${category.color} text-white`
                    }`}>
                      {category.icon}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </motion.button>
                ))}
        </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full"></div>
              
              <h3 className="text-lg font-bold mb-4 relative">Учитесь, развивайтесь, растите!</h3>
              <p className="text-white/80 text-sm mb-4 relative">
                Искусственный интеллект поможет вам развить карьеру и достичь профессиональных целей.
              </p>
              
              <ul className="space-y-3 relative">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2 mt-0.5">
                    <FiStar className="w-3 h-3" />
                  </div>
                  <span className="text-sm">Персонализированные советы</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2 mt-0.5">
                    <FiBookOpen className="w-3 h-3" />
                  </div>
                  <span className="text-sm">Помощь с резюме и собеседованиями</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2 mt-0.5">
                    <BsGraphUp className="w-3 h-3" />
                  </div>
                  <span className="text-sm">Стратегии карьерного роста</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Main chat area */}
          <motion.div 
            className="lg:col-span-3 flex flex-col rounded-2xl shadow-xl overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/30"
            style={{ height: '70vh' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg mr-3">
                <BsStars className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">AI Карьерный Ментор</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Онлайн • Отвечает мгновенно</p>
              </div>
              <div className="ml-auto flex space-x-2">
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Настройки"
                >
                  <BsGear className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            >
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    custom={message.sender === 'user'}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {message.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0 mr-2 shadow-md flex items-center justify-center text-white">
                        <BsStars className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div 
                      className={`max-w-[85%] p-4 shadow-sm ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl rounded-tr-none' 
                          : message.isError
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 rounded-2xl rounded-tl-none'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-none'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                        {typeof message.content === 'string' ? 
                          message.content.split('\n').map((text, i) => (
                            <p key={i} className={i > 0 ? 'mt-2' : 'mt-0'}>
                              {text}
                            </p>
                          ))
                          :
                          <p>
                            {String(message.content)}
                          </p>
                        }
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center text-xs">
                        <span className={
                          message.sender === 'user' 
                            ? 'text-blue-100' 
                            : message.isError 
                              ? 'text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }>
                      {formatTimestamp(message.timestamp)}
                        </span>
                        
                        {message.model && (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-gray-200/50 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300">
                            Gemini
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 ml-2 shadow-md overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="You" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <FiUser className="w-4 h-4" />
                  </div>
                        )}
                </div>
                    )}
                  </motion.div>
              ))}
              </AnimatePresence>
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0 mr-2 shadow-md flex items-center justify-center text-white">
                    <BsStars className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 opacity-75 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500 opacity-75 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-75 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              
              <div ref={messagesEndRef} />
          </div>

            
            <AnimatePresence>
              {selectedCategory && (
                <motion.div 
                  className="max-h-40 overflow-y-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm p-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Возможные вопросы:</p>
              <div className="flex flex-wrap gap-2">
                    {categories.find(cat => cat.id === selectedCategory)?.questions.map((question, index) => (
                      <motion.button
                    key={index}
                        onClick={() => {
                          handleSendMessage(undefined, question);
                          setSelectedCategory(null);
                        }}
                        className="text-sm px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    disabled={isLoading}
                  >
                        {question}
                      </motion.button>
                ))}
              </div>
                </motion.div>
              )}
            </AnimatePresence>

            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                    placeholder="Задайте вопрос о карьере, резюме или собеседовании..."
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white pr-10 py-3 px-4 resize-none overflow-hidden max-h-32 shadow-inner"
                    style={{ minHeight: '44px' }}
                    rows={1}
                disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                
                <motion.button
                type="submit"
                  className={`rounded-xl p-3 ${
                    !input.trim() || isLoading
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-md'
                  } flex-shrink-0`}
                  disabled={!input.trim() || isLoading}
                  whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                  whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                >
                  <FiSend className="w-5 h-5" />
                </motion.button>
            </form>
              
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                AI ментор поможет с карьерным ростом, но всегда проверяйте информацию и консультируйтесь с профессионалами.
            </p>
          </div>
          </motion.div>
        </div>
      </div>

      
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            className="fixed right-8 bottom-8 p-3 rounded-full bg-blue-600 text-white shadow-lg z-20"
            onClick={scrollToBottom}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiChevronsDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIMentor; 