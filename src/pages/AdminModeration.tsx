import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { fetchPendingPosts, approvePost, rejectPost } from '../services/jobs';

const AdminModeration: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  
  useEffect(() => {
    if (!user || !userData || userData.role !== 'admin') {
      navigate('/');
    }
  }, [user, userData, navigate]);

  
  useEffect(() => {
    const loadPendingPosts = async () => {
      setLoading(true);
      try {
        const posts = await fetchPendingPosts();
        setPendingPosts(posts);
      } catch (err) {
        console.error('Error loading pending posts:', err);
        setError('Ошибка при загрузке вакансий на модерацию');
      } finally {
        setLoading(false);
      }
    };

    loadPendingPosts();
  }, []);

  
  const handleApprovePost = async (post: Post) => {
    try {
      await approvePost(post.id);
      setPendingPosts(pendingPosts.filter(p => p.id !== post.id));
      setSuccessMessage(`Вакансия "${post.title}" успешно одобрена`);
      
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error approving post:', err);
      setError('Ошибка при одобрении вакансии');
      
      // Скрываем сообщение об ошибке через 3 секунды
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Открытие модального окна для отклонения вакансии
  const openRejectModal = (post: Post) => {
    setSelectedPost(post);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Обработчик отклонения вакансии
  const handleRejectPost = async () => {
    if (!selectedPost) return;
    
    try {
      await rejectPost(selectedPost.id, rejectReason);
      setPendingPosts(pendingPosts.filter(p => p.id !== selectedPost.id));
      setSuccessMessage(`Вакансия "${selectedPost.title}" отклонена`);
      setShowRejectModal(false);
      setSelectedPost(null);
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting post:', err);
      setError('Ошибка при отклонении вакансии');
      
      // Скрываем сообщение об ошибке через 3 секунды
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Функция форматирования даты
  const formatDate = (date: any) => {
    if (!date) return 'Неизвестно';
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Модерация вакансий
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Проверка и утверждение новых вакансий перед публикацией
          </p>
        </motion.div>

        {/* Уведомления */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md"
            >
              <p>{successMessage}</p>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"
            >
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Панель с количеством вакансий на модерации */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {loading ? 'Загрузка...' : `${pendingPosts.length} вакансий ожидают модерации`}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {pendingPosts.length === 0 && !loading ? 'Нет вакансий для модерации' : 'Проверьте и утвердите вакансии'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Список вакансий на модерации */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : pendingPosts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center border border-gray-200 dark:border-gray-700"
          >
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Все вакансии проверены</h2>
            <p className="text-gray-600 dark:text-gray-400">
              В данный момент нет вакансий, требующих модерации
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {pendingPosts.map((post, index) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex items-center mb-4 md:mb-0">
                      {post.companyLogo ? (
                        <img 
                          src={post.companyLogo} 
                          alt={post.companyName} 
                          className="w-12 h-12 rounded-md object-cover mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                          <span className="text-gray-600 dark:text-gray-300 text-lg font-bold">
                            {post.companyName?.charAt(0) || 'C'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{post.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                        Ожидает модерации
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {post.employmentType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Описание вакансии:</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                      {post.description?.length > 300 
                        ? `${post.description.substring(0, 300)}...` 
                        : post.description}
                    </p>
                    {post.description?.length > 300 && (
                      <button 
                        onClick={() => navigate(`/posts/${post.id}`)}
                        className="text-sm text-primary dark:text-primary-light hover:underline mt-2"
                      >
                        Читать полностью
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Информация о вакансии:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Локация: {post.location}
                        </li>
                        {post.salary && (
                          <li className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Зарплата: {post.salary}
                          </li>
                        )}
                        {post.experienceLevel && (
                          <li className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Опыт: {post.experienceLevel}
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Требуемые навыки:</h4>
                      {post.skills && post.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {post.skills.slice(0, 6).map((skill, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                          {post.skills.length > 6 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md">
                              +{post.skills.length - 6}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Навыки не указаны</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Добавлена: {formatDate(post.createdAt)}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openRejectModal(post)}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Отклонить
                      </button>
                      <button
                        onClick={() => handleApprovePost(post)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow hover:from-green-600 hover:to-green-700 transition-all"
                      >
                        Одобрить
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно для отклонения вакансии */}
      <AnimatePresence>
        {showRejectModal && selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Отклонение вакансии
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Укажите причину отклонения вакансии "{selectedPost.title}"
              </p>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Опишите причину отклонения вакансии..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 mb-4"
                rows={4}
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRejectPost}
                  disabled={!rejectReason.trim()}
                  className={`px-4 py-2 ${
                    rejectReason.trim() 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-red-400 cursor-not-allowed'
                  } text-white rounded-lg transition-colors`}
                >
                  Отклонить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminModeration; 