import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateText } from '../api/gemini';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiChevronsDown, FiStar, FiBookOpen, FiFileText, FiTrendingUp, FiUser, FiDownload } from 'react-icons/fi';
import { BsLightningCharge, BsStars, BsGear, BsBraces, BsGraphUp, BsPalette } from 'react-icons/bs';

// Types
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

// Add this interface for career progress
interface CareerProgress {
  level: string;
  progress: number;
  skills: {
    name: string;
    level: number;
    color: string;
  }[];
}

const AIMentor: React.FC = () => {
  const { user, userData } = useAuth();
  const [initialMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: `Привет${userData?.displayName ? `, ${userData.displayName}` : ''}! 👋 Я твой AI-карьерный ментор. Я здесь, чтобы помочь тебе:

• Подготовиться к собеседованиям
• Улучшить твое резюме
• Спланировать карьерный рост
• Развить необходимые навыки
• Найти подходящую работу

С чего бы ты хотел(а) начать сегодня?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [careerProgress, setCareerProgress] = useState<CareerProgress>({
    level: 'Junior',
    progress: 65,
    skills: [
      { name: 'JavaScript', level: 80, color: 'bg-yellow-500' },
      { name: 'React', level: 75, color: 'bg-blue-500' },
      { name: 'TypeScript', level: 60, color: 'bg-blue-700' },
      { name: 'CSS/UI', level: 70, color: 'bg-pink-500' },
      { name: 'Node.js', level: 50, color: 'bg-green-600' },
      { name: 'Soft Skills', level: 65, color: 'bg-purple-500' },
    ]
  });

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
        'Какие проекты стоит включить в свое портфолио?',
        'Как отвечать на вопрос о зарплатных ожиданиях?'
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
        'Как составить эффективное сопроводительное письмо?',
        'Какие достижения стоит упомянуть в резюме?'
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
        'Как стать тимлидом и какие навыки для этого нужны?',
        'Что важнее для карьерного роста: глубина знаний или их широта?'
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
        'Как эффективно изучать новые технологии?',
        'Как найти баланс между глубоким изучением технологий и изучением новых?'
      ]
    },
    {
      id: 'jobsearch',
      name: 'Поиск работы',
      icon: <BsGraphUp className="w-5 h-5" />,
      color: 'from-pink-400 to-rose-500',
      questions: [
        'Как эффективно искать работу через LinkedIn?',
        'Какие сайты лучше всего для поиска работы в IT?',
        'Как подготовиться к техническому собеседованию?',
        'Как вести себя на собеседовании с HR?',
        'Как искать работу за рубежом?'
      ]
    },
    {
      id: 'networking',
      name: 'Нетворкинг',
      icon: <BsPalette className="w-5 h-5" />,
      color: 'from-cyan-400 to-teal-500',
      questions: [
        'Как найти ментора в IT?',
        'Какие IT-сообщества стоит посещать?',
        'Как использовать LinkedIn для нетворкинга?',
        'Как подготовиться к встрече с потенциальным ментором?',
        'Как построить свой личный бренд в IT?'
      ]
    }
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll detection for scroll-to-bottom button
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

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle sending a message
  const handleSendMessage = async (e?: React.FormEvent, questionText?: string) => {
    if (e) e.preventDefault();
    
    const messageText = questionText || input;
    if (!messageText.trim() || isLoading) return;

    // Create new message from user
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get user's name and role for personalization
      const userName = user?.displayName || (userData?.displayName ? userData.displayName : 'there');
      const userRole = userData?.role || 'job seeker';
      
      console.log('Отправка запроса к Gemini API:', { messageText, role: 'career advisor' });
      
      // Send to AI and get response
      const response = await generateText(messageText, 'career advisor');
      
      console.log('Получен ответ от Gemini API:', response);
      console.log('Тип ответа:', typeof response);
      console.log('Структура ответа:', JSON.stringify(response, null, 2));
      
      // Ensure we have a string response
      let aiResponseText = 'Извините, я не смог обработать ваш запрос. Пожалуйста, попробуйте еще раз.';
      
      if (response && typeof response === 'object') {
        console.log('Проверяем свойства ответа:', Object.keys(response));
        
        if (response.success && response.text) {
          console.log('Найден текст ответа длиной:', response.text.length);
          aiResponseText = response.text;
        } else if (response.error) {
          console.error('Ошибка от Gemini API:', response.error);
          aiResponseText = `Ошибка: ${response.error}`;
        } else {
          console.warn('Неожиданный формат ответа от Gemini API:', response);
        }
      } else {
        console.warn('Неожиданный тип ответа от Gemini API:', typeof response, response);
      }
      
      console.log('Итоговый текст для отображения:', aiResponseText.substring(0, 100) + '...');
      
      // Create AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
        model: 'gemini-pro',
        isError: !response?.success
      };
      
      // Add AI message to chat
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Ошибка при получении ответа от AI:', error);
      
      // Create error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Произошла ошибка при обработке вашего запроса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Пожалуйста, попробуйте позже.`,
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      
      // Add error message to chat
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp for messages
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', { 
      hour: 'numeric', 
      minute: 'numeric'
    }).format(date);
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.6
      }
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

  // Add this function to save chat history
  const handleSaveChat = () => {
    const chatContent = messages
      .map(m => `[${m.sender === 'user' ? 'Вы' : 'AI Ментор'}]: ${m.content}`)
      .join('\n\n');
    
    // Create a blob and download link
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `AI_Career_Chat_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add this function to clear the chat
  const handleClearChat = () => {
    if (window.confirm('Вы уверены, что хотите очистить историю чата? Это действие нельзя отменить.')) {
      setMessages(initialMessages);
    }
  };

  // Add this function to track career progress
  const handleTrackProgress = () => {
    setShowProgressModal(true);
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

            <motion.button 
              variants={itemVariants}
              onClick={handleTrackProgress}
              className="mt-4 w-full flex items-center p-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-white/20">
                <BsGraphUp className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium block">Карьерный трекер</span>
                <span className="text-xs text-white/80">Отслеживайте свой прогресс</span>
              </div>
            </motion.button>
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
                  onClick={handleSaveChat}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Сохранить чат"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleClearChat}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Очистить чат"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Настройки"
                >
                  <BsGear className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0 mr-3 shadow-lg flex items-center justify-center text-white">
                        <BsStars className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div 
                      className={`max-w-[85%] p-5 shadow-md ${
                        message.sender === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl rounded-tr-none' 
                          : message.isError
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 rounded-2xl rounded-tl-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                        {typeof message.content === 'string' ? (
                          message.content.split('\n').map((text, i) => {
                            console.log(`Обработка строки ${i} сообщения:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
                            if (text.startsWith('•')) {
                              return (
                                <ul key={i} className="list-disc pl-5 mt-2">
                                  <li>{text.substring(1).trim()}</li>
                                </ul>
                              )
                            } else if (text.match(/^\d+\./)) {
                              return (
                                <ol key={i} className="list-decimal pl-5 mt-2">
                                  <li>{text.substring(text.indexOf('.')+1).trim()}</li>
                                </ol>
                              )
                            } else if (text.startsWith('**') && text.endsWith('**')) {
                              return (
                                <p key={i} className={`font-bold ${i > 0 ? 'mt-2' : 'mt-0'}`}>
                                  {text.substring(2, text.length-2)}
                                </p>
                              )
                            } else {
                              return (
                                <p key={i} className={i > 0 ? 'mt-2' : 'mt-0'}>
                                  {text}
                                </p>
                              )
                            }
                          })
                        ) : (
                          <p>{String(message.content)}</p>
                        )}
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center text-xs">
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
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-200/50 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300">
                            Gemini AI
                          </span>
                        )}
                        
                        {message.sender === 'ai' && !message.isError && (
                          <div className="flex space-x-2">
                            <button 
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Копировать"
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                // Could add a toast notification here
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                            <button 
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Сохранить"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {message.sender === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 ml-3 shadow-lg overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="You" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <FiUser className="w-5 h-5" />
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex-shrink-0 mr-3 shadow-lg flex items-center justify-center text-white">
                    <BsStars className="w-5 h-5" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl rounded-tl-none max-w-[85%] shadow-md border border-gray-100 dark:border-gray-700">
                    <div className="flex space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500 opacity-75 animate-bounce"></div>
                      <div className="w-3 h-3 rounded-full bg-purple-500 opacity-75 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-75 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Reference for scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Topic suggestions based on selected category */}
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

            {/* Enhanced message input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Задайте вопрос о карьере, резюме или собеседовании..."
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white pr-10 py-3 px-4 resize-none overflow-hidden max-h-32 shadow-inner"
                    style={{ minHeight: '50px' }}
                    rows={1}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="absolute right-3 bottom-3 text-gray-400 text-xs">
                    Shift + Enter = новая строка
                  </div>
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
              
              <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                AI ментор поможет с карьерным ростом, но всегда проверяйте информацию и консультируйтесь с профессионалами.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll to bottom button */}
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

      {/* Career Progress Modal */}
      <AnimatePresence>
        {showProgressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProgressModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Карьерный прогресс</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowProgressModal(false)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Уровень: {careerProgress.level}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{careerProgress.progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    style={{ width: `${careerProgress.progress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  До следующего уровня: {100 - careerProgress.progress}%
                </p>
              </div>
              
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Навыки</h4>
              <div className="space-y-4">
                {careerProgress.skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill.name}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill.level}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${skill.color} rounded-full`}
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Рекомендации AI-ментора:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white mt-0.5 mr-2 flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Изучите TypeScript более глубоко для улучшения карьерных перспектив</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white mt-0.5 mr-2 flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Развивайте backend-навыки для более полного стека</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white mt-0.5 mr-2 flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Участвуйте в открытых проектах для расширения портфолио</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg text-sm font-medium shadow-md hover:from-blue-700 hover:to-purple-800 transition-colors"
                  onClick={() => setShowProgressModal(false)}
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIMentor; 