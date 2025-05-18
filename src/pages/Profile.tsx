import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';

const Profile: React.FC = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setError(null);
        // Определяем, чей профиль нужно загрузить
        const profileUserId = userId || (user ? user.uid : null);
        
        // Проверяем, является ли просматриваемый профиль профилем текущего пользователя
        const isCurrentUserProfile = !!user && user.uid === profileUserId;
        setIsCurrentUser(isCurrentUserProfile);
        
        if (!profileUserId) {
          navigate('/login');
          return;
        }
        
        const userDoc = await getDoc(doc(db, 'users', profileUserId));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          
          // Если это профиль текущего пользователя, инициализируем форму данными
          if (isCurrentUserProfile) {
          setFormData({
            displayName: data.displayName,
            interests: data.interests,
            skills: data.skills,
            education: data.education,
            experience: data.experience,
            // Add these properties only if they exist in the data
            ...(data.age !== undefined && { age: data.age }),
            ...(data.field !== undefined && { field: data.field })
          });
        }
        } else {
          setError('Профиль пользователя не найден');
        }
      } catch (fetchError) {
        console.error('Ошибка при загрузке профиля:', fetchError);
        setError('Не удалось загрузить профиль пользователя');
      }
    };
    
    fetchUserData();
  }, [user, userId, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'interests' || name === 'skills') {
      setFormData({
        ...formData,
        [name]: value.split(',').map(item => item.trim())
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSave = async () => {
    if (!user || !isCurrentUser) return;
    
    setSaveLoading(true);
    setSaveSuccess(false);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date()
      });
      
      setUserData({
        ...userData!,
        ...formData
      });
      
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const startChat = async () => {
    if (!user || !userId || userId === user.uid) return;
    
    try {
      // Проверить, существует ли уже чат между пользователями
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef, 
        where('participants', 'array-contains', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatId = null;
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(userId)) {
          existingChatId = doc.id;
        }
      });
      
      if (existingChatId) {
        // Если чат существует, перейти к нему
        navigate(`/chat/${existingChatId}`);
      } else {
        // Создать новый чат
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, userId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: '',
          unreadCount: {
            [user.uid]: 0,
            [userId]: 0
          }
        });
        
        navigate(`/chat/${newChatRef.id}`);
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
    }
  };

  // Функция для экспорта резюме в PDF
  const exportResumeToPDF = () => {
    if (!resumeRef.current || !userData) return;
    
    const element = resumeRef.current;
    const opt = {
      margin: 1,
      filename: `${userData.displayName || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    setResumeLoading(true);
    
    html2pdf().set(opt).from(element).save().then(() => {
      setResumeLoading(false);
    }).catch(error => {
      console.error('Ошибка экспорта резюме:', error);
      setResumeLoading(false);
    });
  };

  // Функция для добавления кандидата в избранное
  const addToFavorites = async () => {
    if (!user || !userId) return;
    
    try {
      // Проверить, существует ли уже в избранном
      const favoritesRef = collection(db, 'favoritesCandidates');
      const q = query(
        favoritesRef, 
        where('employerId', '==', user.uid),
        where('candidateId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Добавить в избранное, если еще не добавлен
        await addDoc(collection(db, 'favoritesCandidates'), {
          employerId: user.uid,
          candidateId: userId,
          createdAt: serverTimestamp(),
          candidateName: userData?.displayName || '',
          candidatePhoto: userData?.photoURL || '',
        });
        
        alert('Кандидат добавлен в избранное!');
      } else {
        alert('Этот кандидат уже в избранном');
      }
    } catch (error) {
      console.error('Ошибка при добавлении в избранное:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!user && !userId) {
    navigate('/login');
    return null;
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="bg-white/10 p-8 rounded-xl shadow-lg max-w-lg w-full">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 rounded-xl shadow-lg overflow-hidden"
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-700 overflow-hidden"
                >
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
                  ) : (
                    userData?.displayName?.charAt(0) || (userData?.email?.charAt(0) || '?')
                  )}
                </motion.div>
              <div className="ml-6">
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold"
                  >
                  {userData?.displayName || 'Пользователь'}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-300"
                  >
                    {userData?.email}
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2 flex items-center"
                  >
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {userData?.role === 'student' ? 'Студент' : userData?.role === 'school' ? 'Учебное заведение' : 'Работодатель'}
                  </span>
                  {userData?.premium && (
                    <span className="ml-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                  </motion.div>
                </div>
              </div>
              
              {/* Действия для профиля другого пользователя */}
              {!isCurrentUser && user && userData?.role === 'student' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startChat}
                    className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    Начать чат
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addToFavorites}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                    </svg>
                    В избранное
                  </motion.button>
                  
                  {userData?.resumeData && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowResume(!showResume)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      {showResume ? 'Скрыть резюме' : 'Показать резюме'}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {saveSuccess && (
              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
                Профиль успешно обновлен!
              </div>
            )}

            {isEditing && isCurrentUser ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="displayName">
                    Имя
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                  />
                </div>

                {userData?.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="age">
                        Возраст
                      </label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="interests">
                        Интересы (через запятую)
                      </label>
                      <input
                        id="interests"
                        name="interests"
                        type="text"
                        value={formData.interests?.join(', ') || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="skills">
                        Навыки (через запятую)
                      </label>
                      <input
                        id="skills"
                        name="skills"
                        type="text"
                        value={formData.skills?.join(', ') || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="field">
                        Предпочитаемая сфера
                      </label>
                      <input
                        id="field"
                        name="field"
                        type="text"
                        value={formData.field || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="education">
                        Образование
                      </label>
                      <input
                        id="education"
                        name="education"
                        type="text"
                        value={formData.education || ''}
                        onChange={handleInputChange}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 mb-2" htmlFor="experience">
                        Опыт работы
                      </label>
                      <textarea
                        id="experience"
                        name="experience"
                        value={formData.experience || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded text-white"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark ${
                      saveLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {saveLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Информация о пользователе - отображается для всех */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-lg bg-white/5"
                >
                  <h2 className="text-xl font-semibold text-primary mb-3">Информация</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userData?.age && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Возраст</h3>
                        <p className="text-white">{userData.age} лет</p>
                      </div>
                    )}
                    
                    {userData?.field && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Сфера деятельности</h3>
                        <p className="text-white">{userData.field}</p>
                      </div>
                    )}
                    
                    {userData?.location && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Местоположение</h3>
                        <p className="text-white">{userData.location}</p>
                      </div>
                    )}
                    
                    {userData?.company && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Компания</h3>
                        <p className="text-white">{userData.company}</p>
                      </div>
                    )}
                    
                    {userData?.position && (
                      <div>
                        <h3 className="text-gray-400 text-sm">Должность</h3>
                        <p className="text-white">{userData.position}</p>
                      </div>
                    )}
                      </div>
                </motion.div>
                
                {userData?.skills && userData.skills.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-lg bg-white/5"
                  >
                    <h2 className="text-xl font-semibold text-primary mb-3">Навыки</h2>
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-900/40 rounded-full text-sm text-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {userData?.education && userData.education.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 rounded-lg bg-white/5"
                  >
                    <h2 className="text-xl font-semibold text-primary mb-3">Образование</h2>
                    <ul className="list-disc list-inside space-y-2">
                      {Array.isArray(userData.education) ? (
                        userData.education.map((edu, index) => (
                          <li key={index} className="text-white">{edu}</li>
                        ))
                      ) : (
                        <li className="text-white">{userData.education}</li>
                      )}
                    </ul>
                  </motion.div>
                )}
                
                {userData?.experience && userData.experience.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="p-4 rounded-lg bg-white/5"
                  >
                    <h2 className="text-xl font-semibold text-primary mb-3">Опыт работы</h2>
                    <div className="space-y-3">
                      {Array.isArray(userData.experience) ? (
                        userData.experience.map((exp, index) => (
                          <div key={index} className="text-white border-l-2 border-primary pl-3 py-1">
                            {exp}
                          </div>
                        ))
                      ) : (
                        <div className="text-white">{userData.experience}</div>
                      )}
                    </div>
                  </motion.div>
                )}
                
                {userData?.interests && userData.interests.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-4 rounded-lg bg-white/5"
                  >
                    <h2 className="text-xl font-semibold text-primary mb-3">Интересы</h2>
                    <div className="flex flex-wrap gap-2">
                      {userData.interests.map((interest, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-purple-900/40 rounded-full text-sm text-purple-200"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {isCurrentUser && (
                  <div className="mt-8 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg shadow-md flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Редактировать профиль
                    </motion.button>
                  </div>
                )}

                {/* Добавляем отображение резюме */}
                <AnimatePresence>
                  {showResume && userData?.role === 'student' && userData?.resumeData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-primary">Резюме кандидата</h2>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={exportResumeToPDF}
                          disabled={resumeLoading}
                          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          {resumeLoading ? 'Скачивание...' : 'Скачать PDF'}
                        </motion.button>
                      </div>
                      
                      <div 
                        ref={resumeRef}
                        className="bg-white text-gray-800 p-8 rounded-lg shadow-md"
                      >
                        <div className="mb-6 text-center">
                          <h1 className="text-3xl font-bold text-gray-900">{userData.displayName || 'Кандидат'}</h1>
                          {userData.position && <p className="text-xl text-gray-600 mt-1">{userData.position}</p>}
                          {userData.location && <p className="text-gray-500 mt-1">{userData.location}</p>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="col-span-2">
                            {userData.resumeData.education && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Образование</h2>
                                <p className="text-gray-700 whitespace-pre-line">{userData.resumeData.education}</p>
                              </div>
                            )}
                            
                            {userData.resumeData.experience && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Опыт работы</h2>
                                <p className="text-gray-700 whitespace-pre-line">{userData.resumeData.experience}</p>
                              </div>
                            )}
                            
                            {userData.resumeData.achievements && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Достижения</h2>
                                <p className="text-gray-700 whitespace-pre-line">{userData.resumeData.achievements}</p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            {userData.resumeData.skills && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Навыки</h2>
                                <p className="text-gray-700 whitespace-pre-line">{userData.resumeData.skills}</p>
                              </div>
                            )}
                            
                            {userData.resumeData.languages && userData.resumeData.languages.length > 0 && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Языки</h2>
                                <ul className="list-disc list-inside text-gray-700">
                                  {userData.resumeData.languages.map((lang, index) => (
                                    <li key={index}>{lang}</li>
                                  ))}
                                </ul>
                </div>
                            )}
                            
                            {userData.resumeData.portfolio && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Портфолио</h2>
                                <p className="text-gray-700 whitespace-pre-line">{userData.resumeData.portfolio}</p>
              </div>
            )}

                            {userData.email && (
                              <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-3">Контакты</h2>
                                <div className="flex items-center text-gray-700 mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                  </svg>
                                  {userData.email}
                                </div>
                                {userData.phoneNumber && (
                                  <div className="flex items-center text-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                    {userData.phoneNumber}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {resumeError && (
                        <div className="mt-4 text-red-400 text-sm">{resumeError}</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {isCurrentUser && (
                  <div className="mt-8 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg shadow-md flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Редактировать профиль
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Панель быстрого доступа для работодателя */}
        {!isCurrentUser && user && userData?.role === 'student' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="fixed bottom-8 right-8 flex flex-col space-y-3"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full shadow-lg cursor-pointer"
              onClick={startChat}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg cursor-pointer"
              onClick={() => setShowResume(!showResume)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile; 