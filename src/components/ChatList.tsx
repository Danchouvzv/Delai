import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { useChat } from '../context/ChatContext';
import { motion } from 'framer-motion';

const ChatList: React.FC = () => {
  const [user] = useAuthState(auth);
  const { chats, loading, error, refreshChats } = useChat();

  // Debug logging
  useEffect(() => {
    console.log('ChatList rendered with state:', { 
      userExists: !!user, 
      chatsCount: chats.length, 
      isLoading: loading, 
      error 
    });
    
    if (error) {
      console.error('Chat error details:', error);
    }
  }, [user, chats, loading, error]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 mt-16">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="animate-pulse space-y-4"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12 animate-pulse-slow"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse-slow"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse-slow"></div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-4xl p-4 mt-16"
      >
        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8 text-center">
          <div className="text-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshChats}
            className="animated-button inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-lighter hover:to-primary dark:from-accent dark:to-accent-600 dark:hover:from-accent-400 dark:hover:to-accent transition-all duration-300"
          >
            Повторить попытку
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (chats.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-4xl p-4 mt-16"
      >
        <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8 text-center">
          <div className="text-primary dark:text-accent mb-4 animate-bounce-slow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 bg-gradient-diagonal from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 text-transparent bg-clip-text animate-gradient">Нет активных чатов</h2>
          <p className="text-gray-600 dark:text-gray-400">
            У вас пока нет активных чатов. Откликнитесь на вакансию или свяжитесь с кандидатом, чтобы начать общение.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-4xl p-4 mt-16"
    >
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-6 text-gray-900 dark:text-white bg-gradient-diagonal from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 text-transparent bg-clip-text animate-gradient"
      >
        Сообщения
      </motion.h1>
      
      <motion.div 
        className="space-y-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {chats.map((chat) => (
          <motion.div
            key={chat.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
          >
            <Link
              to={`/chat/${chat.id}`}
              className="block bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-xs rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 p-4 bg-mesh-pattern"
            >
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={chat.otherUserData?.photoURL || 'https://via.placeholder.com/40'}
                    alt={chat.otherUserData?.displayName || 'User'}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-primary-100 dark:border-accent-300 object-cover shadow-md"
                  />
                  {chat.otherUserData?.status === 'online' && (
                    <span className="absolute bottom-0 right-4 w-3 h-3 bg-success dark:bg-success-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {chat.otherUserData?.displayName || 'Пользователь'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {chat.updatedAt ? (
                        formatDistanceToNow(
                          typeof chat.updatedAt.toDate === 'function'
                            ? chat.updatedAt.toDate()
                            : new Date()
                          , { addSuffix: true }
                        )
                      ) : 'недавно'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[80%]">
                      {chat.lastMessage}
                    </p>
                    
                    {chat.unreadCount && chat.unreadCount[user?.uid || ''] > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="bg-gradient-to-r from-primary to-primary-dark dark:from-accent dark:to-accent-600 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 shadow-sm animate-pulse-slow"
                      >
                        {chat.unreadCount[user?.uid || '']}
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ChatList; 