import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: {
    content: string;
    senderId: string;
    senderName?: string;
    senderPhoto?: string;
    timestamp?: any;
  };
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const navigate = useNavigate();

  const navigateToUserProfile = (userId: string) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwnMessage && (
        <div 
          className="w-8 h-8 rounded-full overflow-hidden mt-auto mr-2 cursor-pointer hover:ring-2 hover:ring-primary dark:hover:ring-accent transition-all relative group"
          onClick={() => navigateToUserProfile(message.senderId)}
        >
          <motion.img 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            src={message.senderPhoto || `https://ui-avatars.com/api/?name=${message.senderName || 'User'}&background=random`} 
            alt="Avatar"
            className="w-full h-full object-cover"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-primary/20 dark:bg-accent/20 rounded-full flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        </div>
      )}
      
      <div className="flex flex-col">
        {!isOwnMessage && (
          <span 
            className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-1 cursor-pointer hover:text-primary dark:hover:text-accent transition-colors"
            onClick={() => navigateToUserProfile(message.senderId)}
          >
            {message.senderName || 'Пользователь'}
          </span>
        )}
        <div 
          className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-2 rounded-xl ${
            isOwnMessage 
              ? 'bg-primary text-white rounded-tr-none' 
              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-tl-none'
          } shadow-sm`}
        >
          {message.content}
        </div>
        {message.timestamp && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 mx-1">
            {message.timestamp.toDate ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        )}
      </div>
      
      {isOwnMessage && (
        <div className="w-8 h-8 rounded-full overflow-hidden mt-auto ml-2 invisible">
          {/* Placeholder to maintain symmetry */}
        </div>
      )}
    </div>
  );
};

export default MessageBubble; 