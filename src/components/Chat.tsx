import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  writeBatch,
  deleteDoc,
  arrayRemove,
  setDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { Message, UserData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

import ChatErrorDisplay from './ChatErrorDisplay';

// Анимации
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
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

// Типы для расширенных функций
interface Reaction {
  emoji: string;
  userId: string;
  timestamp: any;
}

interface AudioRecording {
  isRecording: boolean;
  audioURL: string | null;
  recordingTime: number;
  audioBlob: Blob | null;
}

interface ExtendedMessage extends Message {
  reactions?: Reaction[];
  isPinned?: boolean;
  isDeleted?: boolean;
  editedAt?: any;
  replyTo?: string;
  deliveryStatus?: 'sent' | 'delivered' | 'read';
}

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Расширенные состояния
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [audioRecording, setAudioRecording] = useState<AudioRecording>({
    isRecording: false,
    audioURL: null,
    recordingTime: 0,
    audioBlob: null
  });
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ExtendedMessage | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => 
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );
  const [currentView, setCurrentView] = useState<'chat' | 'media' | 'links' | 'files'>('chat');
  const [mediaFiles, setMediaFiles] = useState<Message[]>([]);
  const [linkMessages, setLinkMessages] = useState<Message[]>([]);
  const [fileMessages, setFileMessages] = useState<Message[]>([]);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // В начале компонента Chat добавить обработку ошибок
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

  
  useEffect(() => {
    if (!id || !user) return;

    const fetchChatData = async () => {
      if (!user) return;
      
        setLoading(true);
      setChatError(null);
        
      try {
        const chatDocRef = doc(db, 'chats', id);
        const chatDoc = await getDoc(chatDocRef);
        
        if (!chatDoc.exists()) {
          setChatError('Чат не найден. Возможно, он был удален.');
          setLoading(false);
          return;
        }

        const chatData = chatDoc.data();
        
        
        if (!chatData || !chatData.participants || !Array.isArray(chatData.participants)) {
          setChatError('Неверный формат данных чата. Пожалуйста, обратитесь в службу поддержки.');
          setLoading(false);
          return;
        }

        // Проверяем, что пользователь является участником чата
        if (!chatData.participants.includes(user.uid)) {
          setChatError('У вас нет доступа к этому чату.');
          setLoading(false);
          return;
        }
        
        setOtherUser(chatData);
        
        // Получаем сообщения чата
        const messagesRef = collection(db, 'chats', id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
                id: doc.id,
            ...doc.data()
          }));
          setMessages(messages);
            setLoading(false);
        }, (error) => {
          console.error('Error fetching messages:', error);
          setLoadError('Ошибка при загрузке сообщений. Пожалуйста, попробуйте позже.');
          setLoading(false);
        });

        // Обновляем статус прочтения
        if (chatData.unreadBy && chatData.unreadBy.includes(user.uid)) {
          await updateDoc(chatDocRef, {
            unreadBy: chatData.unreadBy.filter((uid: string) => uid !== user.uid),
            unreadCount: chatData.unreadCount > 0 ? chatData.unreadCount - 1 : 0
          });
        }
        
        return unsubscribe;
      } catch (error) {
        console.error('Error fetching chat:', error);
        setChatError('Произошла ошибка при загрузке чата. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [id, user]);

  // Handle typing indicator
  useEffect(() => {
    if (!id || !user || newMessage.length === 0) return;

    const updateTypingStatus = async () => {
      try {
        const typingRef = doc(db, `chats/${id}/typing/${user.uid}`);
        await updateDoc(typingRef, {
          isTyping: true,
          updatedAt: serverTimestamp()
        });

        
        const timeout = setTimeout(async () => {
          await updateDoc(typingRef, {
            isTyping: false,
            updatedAt: serverTimestamp()
          });
        }, 5000);

        return () => clearTimeout(timeout);
      } catch (error) {
        console.error('Error updating typing status:', error);
      }
    };

    updateTypingStatus();
  }, [id, user, newMessage]);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        attachMenuRef.current && 
        !attachMenuRef.current.contains(event.target as Node)
      ) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  useEffect(() => {
    if (audioRecording.isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setAudioRecording(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1
        }));
      }, 1000);
    } else if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [audioRecording.isRecording]);

  
  const updateUnreadMessages = async () => {
    if (!id || !user) return;

    try {
      
      const chatRef = doc(db, 'chats', id);
      await updateDoc(chatRef, {
        [`unreadCount.${user.uid}`]: 0
      });
    } catch (error) {
      console.error('Error updating unread messages:', error);
    }
  };

  
  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!id || !user || messageIds.length === 0) return;

    try {
      const batch = writeBatch(db);
      
      messageIds.forEach(msgId => {
        const msgRef = doc(db, `chats/${id}/messages/${msgId}`);
        batch.update(msgRef, { status: 'read' });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Format time as mm:ss
  const formatAudioTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioRecording({
          isRecording: false,
          audioURL: audioUrl,
          recordingTime: 0,
          audioBlob
        });
        
        
        stream.getAudioTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      
      setAudioRecording({
        isRecording: true,
        audioURL: null,
        recordingTime: 0,
        audioBlob: null
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Не удалось получить доступ к микрофону. Пожалуйста, проверьте разрешения.');
    }
  };

  
  const stopRecording = () => {
    if (mediaRecorderRef.current && audioRecording.isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && audioRecording.isRecording) {
      mediaRecorderRef.current.stop();
      setAudioRecording({
        isRecording: false,
        audioURL: null,
        recordingTime: 0,
        audioBlob: null
      });
    } else if (audioRecording.audioURL) {
      URL.revokeObjectURL(audioRecording.audioURL);
      setAudioRecording({
        isRecording: false,
        audioURL: null,
        recordingTime: 0,
        audioBlob: null
      });
    }
  };

  
  const sendAudioMessage = async () => {
    if (!audioRecording.audioBlob || !user || !id) return;
    
    try {
      setIsUploading(true);
      
      const storageRef = ref(storage, `chat_audio/${id}/${Date.now()}_audio.mp3`);
      const uploadTask = uploadBytesResumable(storageRef, audioRecording.audioBlob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading audio:', error);
          setIsUploading(false);
        },
        async () => {
          const audioUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessageToFirestore(audioUrl, 'audio/mpeg', 'Аудиосообщение', 0);
          
          setAudioRecording({
            isRecording: false,
            audioURL: null,
            recordingTime: 0,
            audioBlob: null
          });
          
          setUploadProgress(0);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error('Error sending audio message:', error);
    }
  };

  
  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user || !id) return;
    
    try {
      const messageRef = doc(db, `chats/${id}/messages/${messageId}`);
      
      
      const messageDoc = await getDoc(messageRef);
      const messageData = messageDoc.data();
      const reactions = messageData?.reactions || [];
      
      const existingReaction = reactions.find(
        (r: Reaction) => r.userId === user.uid && r.emoji === emoji
      );
      
      if (existingReaction) {
        
        await updateDoc(messageRef, {
          reactions: reactions.filter(
            (r: Reaction) => !(r.userId === user.uid && r.emoji === emoji)
          )
        });
      } else {
        
        await updateDoc(messageRef, {
          reactions: arrayUnion({
            emoji,
            userId: user.uid,
            timestamp: serverTimestamp()
          })
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  
  const togglePinMessage = async (messageId: string, isPinned: boolean) => {
    if (!user || !id) return;
    
    try {
      const messageRef = doc(db, `chats/${id}/messages/${messageId}`);
      await updateDoc(messageRef, { isPinned: !isPinned });
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!user || !id) return;
    
    try {
      const messageRef = doc(db, `chats/${id}/messages/${messageId}`);
      await updateDoc(messageRef, { 
        isDeleted: true,
        text: "Сообщение удалено"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Edit message
  const updateMessageText = async (messageId: string, newText: string) => {
    if (!user || !id || !newText.trim()) return;
    
    try {
      const messageRef = doc(db, `chats/${id}/messages/${messageId}`);
      await updateDoc(messageRef, { 
        text: newText,
        editedAt: serverTimestamp()
      });
      setEditingMessage(null);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMessage) {
      // Update existing message if in edit mode
      await updateMessageText(editingMessage.id, newMessage);
      setNewMessage('');
      return;
    }
    
    if (audioRecording.audioURL) {
      
      await sendAudioMessage();
      return;
    }
    
    if ((!newMessage.trim() && !file) || !user || !id) return;

    try {
      let fileUrl = '';
      let fileType = '';
      let fileName = '';
      let fileSize = 0;

      
      if (file) {
        setIsUploading(true);
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        
        const storageRef = ref(storage, `chat_files/${id}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Error uploading file:', error);
            setIsUploading(false);
          },
          async () => {
            fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await sendMessageToFirestore(fileUrl, fileType, fileName, fileSize);
            setFile(null);
            setUploadProgress(0);
            setIsUploading(false);
          }
        );
      } else {
        await sendMessageToFirestore();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add message to Firestore
  const sendMessageToFirestore = async (
    fileUrl: string = '',
    fileType: string = '',
    fileName: string = '',
    fileSize: number = 0
  ) => {
    if (!user || !id) return;

    const otherUserId = otherUser?.uid;
    const now = serverTimestamp();
    const messageType = fileUrl ? (fileType.startsWith('audio') ? 'audio' : 'file') : 'text';
    
    // Create message object
    const messageData: any = {
      text: newMessage.trim(),
      senderId: user.uid,
      createdAt: now,
      status: 'sent',
      type: messageType,
    };

    if (replyingTo) {
      messageData.replyTo = replyingTo.id;
    }

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
      messageData.meta = {
        fileName,
        fileSize,
        fileType
      };
    }

    // Add message to subcollection
    await addDoc(
      collection(db, 'chats', id, 'messages'),
      messageData
    );

    // Update the chat document with last message info
    await updateDoc(doc(db, 'chats', id), {
      lastMessage: fileUrl ? (fileType.startsWith('audio') ? 'Аудиосообщение' : 'Файл: ' + fileName) : newMessage.trim(),
      updatedAt: now,
      // Increment unread count for the other user
      [`unreadCount.${otherUserId}`]: arrayUnion(1)
    });

    setNewMessage('');
    setReplyingTo(null);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Generate URL preview from message text
  const extractUrlPreview = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  // Функция для перехода к профилю пользователя
  const navigateToUserProfile = useCallback((userId: string) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin-slow rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
          <div className="mt-4 text-gray-700 dark:text-gray-300 animate-pulse-slow">Загрузка чата...</div>
        </div>
      </div>
    );
  }

  if (chatError) {
    return <ChatErrorDisplay errorMessage={chatError} />;
  }

    return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="container mx-auto max-w-5xl p-2 sm:p-4 mt-12 sm:mt-16"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-chat dark:shadow-chat-dark h-[85vh] flex flex-col overflow-hidden relative">
        {/* Фоновые элементы для атмосферы */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none z-0"></div>
        <div className="absolute top-40 right-[10%] w-64 h-64 bg-primary/5 rounded-full filter blur-3xl animate-pulse-slow opacity-30 dark:opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-40 left-[5%] w-64 h-64 bg-accent/5 rounded-full filter blur-3xl animate-pulse-slow opacity-30 dark:opacity-10 pointer-events-none"></div>
        
        {/* Закрепленные сообщения панель */}
        <AnimatePresence>
          {messages.filter(msg => msg.isPinned).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 border-b border-amber-200 dark:border-amber-700/30 px-4 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center text-amber-700 dark:text-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
                  <span className="text-xs font-medium">Закрепленное сообщение</span>
          </div>
                <span className="text-xs text-amber-700 dark:text-amber-400 cursor-pointer hover:underline">
                  {messages.filter(msg => msg.isPinned).length > 1 ? 'Показать все' : 'Скрыть'}
                </span>
        </div>
              
              <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                {messages.find(msg => msg.isPinned)?.text}
      </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between px-4 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10"
        >
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => navigate('/chats')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            
            <div className="flex items-center">
              <div 
                className="relative cursor-pointer group"
                onClick={() => otherUser?.uid && navigateToUserProfile(otherUser.uid)}
              >
                <motion.img
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05, borderColor: '#6366f1' }} 
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName || 'User'}&background=random`}
                  alt={otherUser?.displayName || 'Пользователь'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md group-hover:shadow-lg transition-all duration-300 cursor-pointer"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -bottom-1 -right-1 bg-primary dark:bg-accent rounded-full p-0.5 shadow-md hidden group-hover:block"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
            {otherUser?.status === 'online' && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                  />
            )}
          </div>
              
              <div className="ml-3">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-medium text-gray-900 dark:text-white flex items-center cursor-pointer relative group/name"
                  onClick={() => otherUser?.uid && navigateToUserProfile(otherUser.uid)}
                >
                  <span className="hover:text-primary dark:hover:text-accent transition-colors group-hover/name:text-primary dark:group-hover/name:text-accent">
                    {otherUser?.displayName || 'Пользователь'}
                  </span>
                  {otherUser?.role === 'business' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-primary dark:text-accent" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    whileHover={{ width: '100%', opacity: 0.3 }}
                    className="absolute bottom-0 left-0 h-0.5 bg-primary dark:bg-accent"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {otherUser?.status === 'online' 
                    ? 'В сети' 
                    : 'Был(-а) в сети недавно'
                  }
                </motion.div>
              </div>
          </div>
        </div>

          <div className="flex items-center space-x-1">
            {/* Кнопки навигации по разным представлениям */}
            <div className="hidden sm:flex p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('chat')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentView === 'chat'
                    ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-accent'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Чат
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('media')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentView === 'media'
                    ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-accent'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Медиа
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('files')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentView === 'files'
                    ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-accent'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Файлы
              </motion.button>
            </div>
            
            {/* Меню действий */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDarkTheme ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </motion.button>
          </div>
        </motion.div>
        
        {/* Основная область контента с разными представлениями */}
        <AnimatePresence mode="wait">
          {currentView === 'chat' && (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Сообщения чата */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
          {messages.length === 0 ? (
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
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                      <motion.div 
                key={message.id}
                        initial={{ opacity: 0, x: message.senderId === user?.uid ? 20 : -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: initialized ? 0 : index * 0.05,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'} group`}
                      >
                        {/* Отображение аватара для сообщений собеседника */}
                        {message.senderId !== user?.uid && !messages[index-1]?.senderId !== user?.uid && (
                          <div 
                            className="w-8 h-8 rounded-full overflow-hidden mt-auto mr-2 cursor-pointer hover:ring-2 hover:ring-primary dark:hover:ring-accent transition-all relative group"
                            onClick={() => message.senderId !== user?.uid && navigateToUserProfile(message.senderId)}
                          >
                            <motion.img 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName || 'User'}&background=random`} 
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
                        
                        <div className="relative max-w-[75%]">
                          {/* Индикатор ответа на сообщение */}
                          {message.replyTo && (
                            <div className="mb-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg border-l-2 border-primary dark:border-accent text-xs text-gray-600 dark:text-gray-300 max-h-10 overflow-hidden truncate">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-primary dark:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="truncate">
                                  {messages.find(m => m.id === message.replyTo)?.text || 'Ответ на сообщение'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div
                            className={`rounded-xl p-3 shadow-sm ${
                    message.senderId === user?.uid
                                ? 'bg-gradient-to-r from-primary to-primary-dark text-white message-sent'
                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white message-received'
                            } ${message.isDeleted ? 'opacity-60' : ''}`}
                          >
                            {/* Содержимое сообщения */}
                            {message.isDeleted ? (
                              <div className="flex items-center italic text-opacity-75">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Сообщение удалено</span>
                              </div>
                            ) : (
                              <>
                                {/* Аудио */}
                                {message.fileUrl && message.fileType?.startsWith('audio/') && (
                    <div className="mb-2">
                                    <audio controls className="w-full max-w-[200px] h-10 rounded-lg">
                                      <source src={message.fileUrl} type="audio/mpeg" />
                                      Ваш браузер не поддерживает аудио
                                    </audio>
                                  </div>
                                )}
                                
                                {/* Изображение */}
                                {message.fileUrl && message.fileType?.startsWith('image/') && (
                                  <div className="mb-2">
                        <img
                          src={message.fileUrl}
                          alt="Image"
                                      className="max-w-full rounded-lg transition-all duration-200 hover:scale-105 shadow-sm cursor-pointer"
                                    />
                                  </div>
                                )}
                                
                                {/* Файл */}
                                {message.fileUrl && !message.fileType?.startsWith('image/') && !message.fileType?.startsWith('audio/') && (
                                  <div className="mb-2">
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                                      className="flex items-center bg-white/20 dark:bg-gray-600/30 p-2 rounded-lg transition-all duration-200 hover:bg-white/30 dark:hover:bg-gray-600/40"
                        >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                                      <span className="truncate max-w-[150px]">Скачать файл</span>
                        </a>
                                  </div>
                      )}
                                
                                {/* Текст сообщения */}
                                {message.text && (
                                  <div className={message.fileUrl ? 'mt-2' : ''}>
                                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                                )}
                              </>
                  )}
                  
                            {/* Метаинформация */}
                            <div className={`flex items-center justify-between mt-1 text-xs ${
                    message.senderId === user?.uid
                      ? 'text-blue-100 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                              <span>
                                {message.createdAt && typeof message.createdAt === 'object' && 'toDate' in message.createdAt
                                  ? new Date(message.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                  : 'сейчас'
                                }
                                {message.editedAt && <span className="ml-1">(ред.)</span>}
                              </span>
                              
                    {message.senderId === user?.uid && (
                                <div className="flex items-center space-x-1">
                                  {message.deliveryStatus === 'read' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary-lighter dark:text-accent-300" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  ) : message.deliveryStatus === 'delivered' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                                </div>
                    )}
                  </div>
                </div>
                          
                          {/* Реакции */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className={`absolute ${message.senderId === user?.uid ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} bottom-0 translate-y-1/3 flex -space-x-1 bg-white dark:bg-gray-800 shadow-md rounded-full px-1.5 py-1`}>
                              {Object.entries(
                                message.reactions.reduce((acc: {[key: string]: number}, reaction) => {
                                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                                  return acc;
                                }, {})
                              ).map(([emoji, count]) => (
                                <div key={emoji} className="flex items-center">
                                  <span className="text-sm">{emoji}</span>
                                  {count > 1 && <span className="text-xs ml-0.5">{count}</span>}
              </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Кнопки действий с сообщением */}
                          <div className={`absolute ${message.senderId === user?.uid ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full mr-2'} top-0 flex flex-col items-center space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                            {/* Кнопка "Ответить" */}
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                            
                            {/* Дополнительные действия для своих сообщений */}
                            {message.senderId === user?.uid && !message.isDeleted && (
                              <>
                                <button
                                  onClick={() => setEditingMessage(message)}
                                  className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-red-500 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                            
                            {/* Кнопка закрепить */}
                            <button
                              onClick={() => togglePinMessage(message.id, message.isPinned || false)}
                              className={`p-1.5 rounded-full shadow-md transition-colors ${
                                message.isPinned 
                                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-700 dark:hover:bg-amber-600 text-amber-700 dark:text-amber-300' 
                                  : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Отображение аватара для своих сообщений */}
                        {message.senderId === user?.uid && !messages[index-1]?.senderId === user?.uid && (
                          <div className="w-8 h-8 rounded-full overflow-hidden mt-auto ml-2">
                            <img 
                              src={user?.photoURL || 'https://ui-avatars.com/api/?name=Me&background=random'} 
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Индикатор набора текста */}
          {isTyping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-start"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden mt-auto mr-2">
                          <img 
                            src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName || 'User'}&background=random`} 
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                </div>
                        <div className="bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm">
                          <div className="flex space-x-1 items-center">
                            <div className="w-2 h-2 rounded-full bg-primary/60 dark:bg-accent/60 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-primary/60 dark:bg-accent/60 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-primary/60 dark:bg-accent/60 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
          )}
          
          <div ref={messagesEndRef} />
        </div>
            </motion.div>
          )}
          
          {currentView === 'media' && (
            <motion.div
              key="media-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            >
              {mediaFiles.length > 0 ? (
                mediaFiles.map((media) => (
                  <motion.div
                    key={media.id}
                    whileHover={{ scale: 1.05, zIndex: 5 }}
                    className="relative aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer group"
                  >
                    <img 
                      src={media.fileUrl || ''} 
                      alt="Media" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                      <span className="text-white text-xs truncate w-full">{new Date(media.timestamp?.toDate() || new Date()).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center h-60 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Нет медиафайлов</p>
                </div>
              )}
            </motion.div>
          )}
          
          {currentView === 'files' && (
            <motion.div
              key="files-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-4"
            >
              {fileMessages.length > 0 ? (
                <div className="space-y-3">
                  {fileMessages.map((file) => (
                    <motion.div
                      key={file.id}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm flex items-center space-x-3 group"
                    >
                      <div className="p-2 bg-primary/10 dark:bg-accent/20 rounded-lg text-primary dark:text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file?.fileType?.startsWith('audio/') ? 'Аудиосообщение' : file.text || 'Файл'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {new Date(file.timestamp?.toDate() || new Date()).toLocaleString()}
                        </p>
                      </div>
                      <a 
                        href={file.fileUrl || ''} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary dark:text-accent transition-transform group-hover:scale-110"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Нет файлов</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Область ввода и панель инструментов будут добавлены далее */}

        {/* Upload Progress */}
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary-dark dark:from-accent dark:to-accent-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              </div>
              <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Загрузка файла...
            </p>
          </motion.div>
        )}

        {/* Область ответа на сообщение */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary dark:text-accent mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-medium mr-1">
                      {replyingTo.senderId === user?.uid ? 'Вы' : otherUser?.displayName || 'Собеседник'}:
                    </span>
                    <span className="truncate text-gray-600 dark:text-gray-400">
                      {replyingTo.fileUrl && !replyingTo.text ? (
                        <span className="italic">{replyingTo.fileType?.startsWith('image/') 
                          ? 'Изображение' 
                          : replyingTo.fileType?.startsWith('audio/') 
                          ? 'Аудиосообщение' 
                          : 'Файл'}</span>
                      ) : replyingTo.text}
                    </span>
          </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Область предварительного просмотра файла */}
        <AnimatePresence>
        {file && !isUploading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                  {file.type.startsWith('image/') ? (
                    <div className="h-10 w-10 mr-3 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 mr-3 rounded flex items-center justify-center bg-primary/10 dark:bg-accent/20 text-primary dark:text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
              </div>
              <button
                onClick={() => setFile(null)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Область записи аудио */}
        <AnimatePresence>
          {audioRecording.isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Запись аудио: {formatAudioTime(audioRecording.recordingTime)}</span>
          </div>
                <div className="flex space-x-2">
                  <button
                    onClick={cancelRecording}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Область предварительного прослушивания аудио */}
        <AnimatePresence>
          {audioRecording.audioURL && !audioRecording.isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <audio controls className="w-full">
                    <source src={audioRecording.audioURL} type="audio/mpeg" />
                    Ваш браузер не поддерживает аудио
                  </audio>
                </div>
                <div className="flex space-x-2">
            <button
                    onClick={cancelRecording}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={sendAudioMessage}
                    className="p-2 rounded-full bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-600 text-white shadow-md disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Панель инструментов */}
        <AnimatePresence>
          {showAttachMenu && (
            <motion.div
              ref={attachMenuRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-center p-2 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
            >
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
              onClick={triggerFileInput}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs mt-1">Фото</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={triggerFileInput}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs mt-1">Файл</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={startRecording}
                  disabled={audioRecording.isRecording}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-xs mt-1">Аудио</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EmojiPicker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
            >
              <div className="grid grid-cols-8 gap-2 max-h-[150px] overflow-y-auto">
                {['😊', '😂', '😍', '🥰', '😎', '😇', '🤔', '😳', '😱', '😭', '😅', '😴', '🤗', '🤫', 
                  '👍', '👎', '👏', '🙏', '🔥', '❤️', '🎉', '🎂', '🎁', '��', '✅', '❌', '⭐', '🌟', 
                  '💯', '🤝', '👀', '🙄', '🤷‍♂️', '🤦‍♀️', '💪', '👋', '🚀'].map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Поле ввода сообщения */}
        <motion.form 
          variants={itemVariants}
          onSubmit={handleSendMessage}
          className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10 relative"
        >
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 mr-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </motion.button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
                placeholder={editingMessage ? "Редактирование сообщения..." : "Сообщение..."}
                disabled={audioRecording.isRecording || isUploading}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-accent/50 focus:border-primary dark:focus:border-accent text-gray-800 dark:text-white shadow-inner"
              />
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-amber-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.button>
            </div>
            
            {newMessage.trim() || file || audioRecording.audioURL ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={isUploading || (audioRecording.isRecording && !audioRecording.audioURL)}
                className="p-2 ml-1 rounded-full bg-gradient-to-r from-primary to-primary-dark dark:from-accent dark:to-accent-dark hover:from-primary-dark hover:to-primary dark:hover:from-accent-dark dark:hover:to-accent text-white shadow-md disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={startRecording}
                disabled={audioRecording.isRecording}
                className="p-2 ml-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-md disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </motion.button>
            )}
          </div>
          
          
          {editingMessage && (
            <div className="flex justify-between items-center mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Редактирование сообщения</span>
      </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null);
                  setNewMessage('');
                }}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
              >
                Отмена
              </button>
    </div>
          )}
        </motion.form>
      </div>
    </motion.div>
  );
};

export default Chat;
