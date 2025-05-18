import React, { useEffect, useState, useRef } from 'react';
import { generateText } from '../api/gemini';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  model?: string;
}

const AIMentor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hi there! I\'m your AI Career Mentor. How can I help you with your career journey today?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('gemini-1.5-pro-latest');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions] = useState([
    'How can I improve my resume?',
    'What skills are in demand for frontend developers?',
    'Tips for job interviews',
    'Career growth in data science',
    'How to negotiate salary?'
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent | null, suggestedMessage?: string) => {
    if (e) e.preventDefault();
    
    const userMessage = suggestedMessage || input;
    if (!userMessage.trim()) return;

    // Add user message with unique ID
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Формируем персонализированный запрос
      let prompt = userMessage;
      
      // Если пользователь авторизован, добавляем персонализацию
      if (user) {
        const role = user.displayName ? `${user.displayName}` : 'user';
        prompt = `[Query from ${role}]: ${userMessage}`;
      }
      
      // Формируем контекст из предыдущих сообщений (максимум 5 последних)
      const recentMessages = messages.slice(-5).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n\n');
      
      if (recentMessages) {
        prompt = `Recent conversation:\n${recentMessages}\n\nNew question: ${prompt}`;
      }
      
      // Вызываем Gemini API
      const response = await generateText(prompt);
      
      if (response.success) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          content: response.data,
          sender: 'ai',
          timestamp: new Date(),
          model: currentModel
        };
        
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Обработка ошибки API
        let errorMessage = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
        let shouldRetry = false;
        
        // Обработка ошибки с превышением лимита запросов
        if (response.rateLimited) {
          errorMessage = "I'm sorry, I've hit my rate limit. I'll try to use a simpler model now.";
          setCurrentModel('gemini-1.5-flash');
          shouldRetry = true;
        } else if (response.error) {
          errorMessage = `Sorry, I encountered an error: ${response.error}`;
        }
        
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          content: errorMessage,
          sender: 'ai',
          timestamp: new Date(),
          isError: true
        };
        
        setMessages(prev => [...prev, errorMsg]);
        console.error('Error from Gemini API:', response.error);
        
        // Автоматически попробовать с другой моделью при ошибке лимита
        if (shouldRetry) {
          setTimeout(() => {
            handleSubmit(null, userMessage);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error in AI Mentor:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, something went wrong with my processing capabilities. Please try again later.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    }).format(date);
  };

  // Message animations
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
    exit: (isUser: boolean) => ({
      opacity: 0,
      x: isUser ? 20 : -20,
      transition: {
        duration: 0.2
      }
    })
  };
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
      
      {/* Decorative blobs */}
      <div className="absolute top-40 right-[10%] w-64 h-64 bg-primary/5 rounded-full filter blur-3xl animate-pulse-slow opacity-70 dark:opacity-10"></div>
      <div className="absolute bottom-40 left-[5%] w-64 h-64 bg-accent/5 rounded-full filter blur-3xl animate-pulse-slow opacity-70 dark:opacity-10"></div>
      
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Career Mentor</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get personalized career advice, resume tips, and interview preparation assistance
          </p>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={messageVariants}
                  custom={message.sender === 'user'}
                >
                  {message.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 mr-2 shadow-md flex items-center justify-center">
                      <span className="text-xs font-bold text-white">AI</span>
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[80%] sm:max-w-[70%] p-4 ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl rounded-tr-none shadow-md' 
                        : message.isError
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 rounded-2xl rounded-tl-none'
                          : 'bg-gray-100 dark:bg-gray-700/70 text-gray-900 dark:text-white rounded-2xl rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split('\n').map((text, i) => (
                        <p key={i} className={`${i > 0 ? 'mt-2' : 'mt-0'} mb-0`}>{text}</p>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span 
                        className={
                          message.sender === 'user' 
                            ? 'text-primary-lighter' 
                            : message.isError
                              ? 'text-red-400 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }
                      >
                        {formatTimestamp(message.timestamp)}
                      </span>
                      
                      {message.model && (
                        <span className="text-xs opacity-70 ml-2 px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600">
                          {message.model.includes('flash') ? 'flash' : 'pro'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 ml-2 shadow-md overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                          <span className="text-xs font-bold">You</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 mr-2 shadow-md flex items-center justify-center">
                  <span className="text-xs font-bold text-white">AI</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/70 p-4 rounded-2xl rounded-tl-none max-w-[80%] sm:max-w-[70%] shadow-md">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">AI is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length < 3 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">Try asking about:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubmit(null, suggestion)}
                    disabled={isLoading}
                    className="text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 p-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your career question..."
                className="flex-1 border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary rounded-full px-4 py-3 dark:bg-gray-700 dark:text-white shadow-inner"
                disabled={isLoading}
              />
              <motion.button
                type="submit"
                disabled={isLoading || !input.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-6 py-3 rounded-full disabled:opacity-50 transition-all duration-300 flex items-center shadow-md"
              >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </motion.button>
            </form>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Your AI mentor is here to help with career advice, but results may vary. For critical decisions, consider consulting with a human career counselor.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIMentor; 