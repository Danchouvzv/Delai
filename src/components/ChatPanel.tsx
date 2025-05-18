import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { UserData } from '../types';
import { motion } from 'framer-motion';

interface Chat {
  id: string;
  lastMessage: {
    text: string;
    timestamp: any;
  };
  unreadCount: {
    [key: string]: number;
  };
  otherUser: UserData;
}

const ChatPanel: React.FC = () => {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      try {
        // Get all chats where the current user is a participant
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid),
          orderBy('lastMessage.timestamp', 'desc')
        );

        const chatsSnapshot = await getDocs(chatsQuery);
        const chatsData: Chat[] = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            // Get the other user's data
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUserData = otherUserDoc.data() as UserData;

            chatsData.push({
              id: chatDoc.id,
              lastMessage: chatData.lastMessage,
              unreadCount: chatData.unreadCount || {},
              otherUser: otherUserData
            });
          }
        }

        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin-slow rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
          <div className="mt-4 text-gray-700 dark:text-gray-300 animate-pulse-slow">Загрузка чатов...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-4"
    >
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-6 text-gray-900 dark:text-white bg-gradient-diagonal from-primary-500 to-primary-700 dark:from-accent-400 dark:to-accent-600 text-transparent bg-clip-text animate-gradient"
      >
        Сообщения
      </motion.h1>
      
      {chats.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center my-8 p-6 rounded-xl bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm shadow-md"
        >
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-primary dark:text-accent-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Нет сообщений. Начните беседу!</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Отправьте первое сообщение, чтобы начать общение</p>
        </motion.div>
      ) : (
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
                className="block p-4 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-xs rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 bg-mesh-pattern"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={chat.otherUser.photoURL || 'https://via.placeholder.com/40'}
                        alt={chat.otherUser.displayName}
                        className="w-10 h-10 rounded-full border-2 border-primary-100 dark:border-accent-300 object-cover shadow-md"
                      />
                      {chat.otherUser.status === 'online' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success dark:bg-success-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-gray-800 dark:text-white font-medium">{chat.otherUser.displayName}</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {chat.lastMessage?.text || 'Нет сообщений'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {chat.lastMessage?.timestamp && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })}
                      </p>
                    )}
                    {chat.unreadCount[user?.uid || ''] > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-primary to-primary-dark dark:from-accent dark:to-accent-600 text-white rounded-full shadow-sm animate-pulse-slow"
                      >
                        {chat.unreadCount[user?.uid || '']}
                      </motion.span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatPanel; 