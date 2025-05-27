import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    draft: 0
  });

  
  useEffect(() => {
    if (!user || !userData || userData.role !== 'admin') {
      navigate('/');
    }
  }, [user, userData, navigate]);

  
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        
        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        setPosts(fetchedPosts);
        
        
        const stats = {
          total: fetchedPosts.length,
          active: fetchedPosts.filter(post => post.status === 'active').length,
          closed: fetchedPosts.filter(post => post.status === 'closed').length,
          draft: fetchedPosts.filter(post => post.status === 'draft').length
        };
        setStats(stats);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Ошибка при загрузке вакансий');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Фильтрация вакансий
  const filteredPosts = posts.filter(post => {
    // Фильтр по статусу
    if (statusFilter !== 'all' && post.status !== statusFilter) {
      return false;
    }
    
    // Поиск по названию, компании или описанию
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.title?.toLowerCase().includes(searchLower) ||
        post.companyName?.toLowerCase().includes(searchLower) ||
        post.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime();
    } else if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'company') {
      return a.companyName.localeCompare(b.companyName);
    }
    return 0;
  });

  
  const handleDelete = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(posts.filter(post => post.id !== postId));
      setSuccessMessage('Вакансия успешно удалена');
      
      // Обновление статистики
      const deletedPost = posts.find(post => post.id === postId);
      if (deletedPost) {
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          [deletedPost.status || 'active']: prev[deletedPost.status as keyof typeof prev] - 1
        }));
      }
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Ошибка при удалении вакансии');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
    setConfirmDelete(null);
  };

  // Изменение статуса вакансии
  const handleStatusChange = async (postId: string, newStatus: 'active' | 'closed' | 'draft' | 'pending' | 'rejected' | 'archived') => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { status: newStatus });
      
      // Обновление локального состояния
      setPosts(posts.map(post => {
        if (post.id === postId) {
          // Обновление статистики
          setStats(prev => ({
            ...prev,
            [post.status || 'active']: prev[post.status as keyof typeof prev] - 1,
            [newStatus]: prev[newStatus as keyof typeof prev] + 1
          }));
          
          return { ...post, status: newStatus };
        }
        return post;
      }));
      
      setSuccessMessage(`Статус вакансии изменен на "${newStatus}"`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating post status:', err);
      setError('Ошибка при изменении статуса вакансии');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  
  const formatDate = (date: any) => {
    if (!date) return 'Неизвестно';
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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
            Панель администратора
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление вакансиями и статистика
          </p>
        </motion.div>

        {/* Статистика */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Всего вакансий</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Активные</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Закрытые</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.closed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Черновики</h3>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.draft}</p>
          </div>
        </motion.div>

        {/* Фильтры и поиск */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию, компании или описанию..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Статус
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="closed">Закрытые</option>
                <option value="draft">Черновики</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сортировка
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="alphabetical">По алфавиту</option>
                <option value="company">По компании</option>
              </select>
            </div>
          </div>
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

        {/* Таблица вакансий */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-300">Загрузка вакансий...</p>
              </div>
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">Вакансии не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Название вакансии
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Компания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Дата публикации
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedPosts.map((post) => (
                    <tr 
                      key={post.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {post.description?.substring(0, 50)}
                          {post.description && post.description.length > 50 ? '...' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {post.companyLogo ? (
                            <img 
                              src={post.companyLogo} 
                              alt={post.companyName} 
                              className="w-8 h-8 rounded-full mr-2 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2">
                              <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">
                                {post.companyName?.charAt(0) || 'C'}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {post.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={post.status || 'active'}
                          onChange={(e) => handleStatusChange(post.id, e.target.value as 'active' | 'closed' | 'draft' | 'pending' | 'rejected' | 'archived')}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            post.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : post.status === 'closed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          } border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          <option value="active">Активная</option>
                          <option value="closed">Закрытая</option>
                          <option value="draft">Черновик</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/posts/${post.id}`)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Просмотр
                          </button>
                          <button
                            onClick={() => navigate(`/posts/edit/${post.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => setConfirmDelete(post.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      <AnimatePresence>
        {confirmDelete && (
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
                Подтверждение удаления
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Вы уверены, что хотите удалить эту вакансию? Это действие нельзя отменить.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => confirmDelete && handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel; 