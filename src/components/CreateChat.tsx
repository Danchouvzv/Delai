import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

interface CreateChatProps {
  recipientId: string;
  postId?: string;
  postTitle?: string;
  initiateButtonText?: string;
  onChatCreated?: (chatId: string) => void;
  buttonClassName?: string;
}

const CreateChat: React.FC<CreateChatProps> = ({
  recipientId,
  postId,
  postTitle,
  initiateButtonText = 'Начать чат',
  onChatCreated,
  buttonClassName = "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-accent"
}) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState('');

  const handleCreateChat = async () => {
    if (!messageText.trim() || !recipientId || !user) {
      setError('Пожалуйста, выберите получателя и введите сообщение');
      return;
    }

    if (user.uid === recipientId) {
      setError('Вы не можете создать чат с самим собой');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Creating chat with recipient:", recipientId);

      // Получаем данные о получателе
      const recipientDoc = await getDoc(doc(db, 'users', recipientId));
      if (!recipientDoc.exists()) {
        console.error("Recipient not found:", recipientId);
        throw new Error('Пользователь не найден');
      }
      const recipientData = recipientDoc.data();
      
      // Получаем данные текущего пользователя
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (!currentUserDoc.exists()) {
        console.error("Current user data not found");
        throw new Error('Ошибка получения данных пользователя');
      }
      const currentUserData = currentUserDoc.data();
      
      // Проверяем, существует ли уже чат между этими пользователями
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatId = null;
      
      querySnapshot.forEach(doc => {
        const chatData = doc.data();
        if (chatData.participants && chatData.participants.includes(recipientId)) {
          existingChatId = doc.id;
        }
      });
      
      let chatId;
      
      if (existingChatId) {
        // Используем существующий чат
        chatId = existingChatId;
        
        // Добавляем новое сообщение
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: messageText,
          senderId: user.uid,
          senderName: currentUserData.displayName || `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'Пользователь',
          createdAt: serverTimestamp(),
          status: 'sent',
          type: 'text'
        });
        
        // Обновляем информацию о чате
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: messageText,
          lastMessageAt: serverTimestamp(),
          unreadCount: increment(1),
          unreadBy: arrayUnion(recipientId)
        });
        
      } else {
        // Создаем новый чат
        const chatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, recipientId],
          createdAt: serverTimestamp(),
          lastMessage: messageText,
          lastMessageAt: serverTimestamp(),
          unreadCount: 1,
          unreadBy: [recipientId],
          // Добавляем имена для удобства отображения
          participantNames: {
            [user.uid]: currentUserData.displayName || `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'Пользователь',
            [recipientId]: recipientData.displayName || `${recipientData.firstName || ''} ${recipientData.lastName || ''}`.trim() || 'Получатель'
          }
        });
        
        chatId = chatRef.id;
        
        // Добавляем первое сообщение
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: messageText,
          senderId: user.uid,
          senderName: currentUserData.displayName || `${currentUserData.firstName || ''} ${currentUserData.lastName || ''}`.trim() || 'Пользователь',
          createdAt: serverTimestamp(),
          status: 'sent',
          type: 'text'
        });
      }
      
      // Перенаправляем пользователя в чат
      navigate(`/chat/${chatId}`);
      
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Произошла ошибка при создании чата');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleCreateChat}
        disabled={loading}
        className={buttonClassName}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Создание...
          </>
        ) : (
          initiateButtonText
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <textarea
        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        rows={4}
        placeholder="Введите ваше сообщение..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      />
    </>
  );
};

export default CreateChat; 