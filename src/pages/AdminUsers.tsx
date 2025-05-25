import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserData } from '../types';

const AdminUsers: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [confirmAction, setConfirmAction] = useState<{userId: string, action: 'block' | 'unblock' | 'makeAdmin' | null}>({userId: '', action: null});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Проверка прав администратора
  useEffect(() => {
    if (!user || !userData || userData.role !== 'admin') {
      navigate('/');
    }
  }, [user, userData, navigate]);

  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(usersQuery);
        const fetchedUsers = querySnapshot.docs.map(doc => ({
          ...doc.data()
        })) as UserData[];
        
        setUsers(fetchedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Ошибка при загрузке пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    // Фильтр по роли
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }
    
    // Поиск по имени, email или компании
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.displayName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.companyName?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Сортировка пользователей
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'name') {
      return a.displayName.localeCompare(b.displayName);
    } else if (sortBy === 'role') {
      return a.role.localeCompare(b.role);
    }
    return 0;
  });

  // Блокировка/разблокировка пользователя
  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        isBlocked: !isBlocked,
        updatedAt: new Date().toISOString()
      });
      
      // Обновление локального состояния
      setUsers(users.map(u => {
        if (u.uid === userId) {
          return { ...u, isBlocked: !isBlocked };
        }
        return u;
      }));
      
      setSuccessMessage(`Пользователь ${!isBlocked ? 'заблокирован' : 'разблокирован'}`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error toggling user block status:', err);
      setError('Ошибка при изменении статуса блокировки пользователя');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
    setConfirmAction({userId: '', action: null});
  };

  // Назначение роли администратора
  const handleMakeAdmin = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        role: 'admin',
        updatedAt: new Date().toISOString()
      });
      
      // Обновление локального состояния
      setUsers(users.map(u => {
        if (u.uid === userId) {
          return { ...u, role: 'admin' };
        }
        return u;
      }));
      
      setSuccessMessage('Пользователю назначена роль администратора');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error making user admin:', err);
      setError('Ошибка при назначении роли администратора');
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
    setConfirmAction({userId: '', action: null});
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Неизвестно';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Отображение статуса роли
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
            Администратор
          </span>
        );
      case 'employer':
      case 'business':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
            Работодатель
          </span>
        );
      case 'student':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
            Студент
          </span>
        );
      case 'professional':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full">
            Профессионал
          </span>
        );
      case 'recruiter':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
            Рекрутер
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
            {role}
          </span>
        );
    }
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
            Управление пользователями
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Просмотр и редактирование данных пользователей
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
                placeholder="Поиск по имени, email или компании..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Роль
              </label>
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              >
                <option value="all">Все роли</option>
                <option value="admin">Администраторы</option>
                <option value="employer">Работодатели</option>
                <option value="business">Бизнес</option>
                <option value="student">Студенты</option>
                <option value="professional">Профессионалы</option>
                <option value="recruiter">Рекрутеры</option>
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
                <option value="name">По имени</option>
                <option value="role">По роли</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Таблица пользователей */}
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
                <p className="text-gray-600 dark:text-gray-300">Загрузка пользователей...</p>
              </div>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">Пользователи не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Дата регистрации
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
                  {sortedUsers.map((userItem) => (
                    <tr 
                      key={userItem.uid} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {userItem.photoURL ? (
                            <img 
                              src={userItem.photoURL} 
                              alt={userItem.displayName} 
                              className="w-10 h-10 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                              <span className="text-gray-600 dark:text-gray-300 text-sm font-bold">
                                {userItem.displayName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {userItem.displayName}
                            </div>
                            {userItem.companyName && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {userItem.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {userItem.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(userItem.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(userItem.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userItem.isBlocked ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Заблокирован
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Активен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/users/${userItem.uid}`)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Просмотр
                          </button>
                          {userItem.role !== 'admin' && (
                            <button
                              onClick={() => setConfirmAction({userId: userItem.uid, action: 'makeAdmin'})}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              Сделать админом
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmAction({
                              userId: userItem.uid, 
                              action: userItem.isBlocked ? 'unblock' : 'block'
                            })}
                            className={`${
                              userItem.isBlocked 
                                ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300' 
                                : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                            }`}
                          >
                            {userItem.isBlocked ? 'Разблокировать' : 'Заблокировать'}
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

      {/* Модальное окно подтверждения действия */}
      <AnimatePresence>
        {confirmAction.action && (
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
                {confirmAction.action === 'block' ? 'Блокировка пользователя' : 
                 confirmAction.action === 'unblock' ? 'Разблокировка пользователя' : 
                 'Назначение роли администратора'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmAction.action === 'block' ? 'Вы уверены, что хотите заблокировать этого пользователя? Он не сможет войти в систему.' : 
                 confirmAction.action === 'unblock' ? 'Вы уверены, что хотите разблокировать этого пользователя?' : 
                 'Вы уверены, что хотите назначить этому пользователю роль администратора? Это предоставит ему полный доступ к админ-панели.'}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmAction({userId: '', action: null})}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.action === 'block' || confirmAction.action === 'unblock') {
                      handleToggleBlock(confirmAction.userId, confirmAction.action === 'unblock');
                    } else if (confirmAction.action === 'makeAdmin') {
                      handleMakeAdmin(confirmAction.userId);
                    }
                  }}
                  className={`px-4 py-2 ${
                    confirmAction.action === 'block' ? 'bg-red-600 hover:bg-red-700' : 
                    confirmAction.action === 'unblock' ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-purple-600 hover:bg-purple-700'
                  } text-white rounded-lg transition-colors`}
                >
                  {confirmAction.action === 'block' ? 'Заблокировать' : 
                   confirmAction.action === 'unblock' ? 'Разблокировать' : 
                   'Назначить администратором'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers; 