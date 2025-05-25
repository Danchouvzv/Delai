import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getPostsStats } from '../services/jobs';
import { Post } from '../types';

// Компонент для отображения карточки статистики
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700`}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">{value}</p>
      </div>
    </div>
  </motion.div>
);

// Компонент для отображения топ вакансий
interface TopPostsCardProps {
  title: string;
  posts: Post[];
  metric: string;
  delay?: number;
}

const TopPostsCard: React.FC<TopPostsCardProps> = ({ title, posts, metric, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
  >
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {posts.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {posts.map((post, index) => (
            <li key={post.id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-6 text-center font-medium">
                    {index + 1}
                  </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {metric === 'views' ? post.views || 0 : post.applicationCount || 0} {metric === 'views' ? 'просмотров' : 'откликов'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">Нет данных для отображения</p>
      )}
    </div>
  </motion.div>
);

const AdminStats: React.FC = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  // Проверка прав администратора
  useEffect(() => {
    if (!user || !userData || userData.role !== 'admin') {
      navigate('/');
    }
  }, [user, userData, navigate]);

  // Загрузка статистики
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const statsData = await getPostsStats();
        setStats(statsData);
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Ошибка при загрузке статистики');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-20 pb-12 px-4 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-20 pb-12 px-4 flex justify-center items-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md max-w-md">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

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
            Статистика вакансий
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Аналитика и метрики по вакансиям на платформе
          </p>
        </motion.div>

        {/* Переключатель временного диапазона */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 flex justify-end"
        >
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                timeRange === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border border-gray-300 dark:border-gray-600`}
            >
              Все время
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border-t border-b border-gray-300 dark:border-gray-600`}
            >
              Неделя
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                timeRange === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } border border-gray-300 dark:border-gray-600`}
            >
              Месяц
            </button>
          </div>
        </motion.div>

        {/* Карточки с основной статистикой */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Всего вакансий"
            value={stats?.total || 0}
            icon={
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="bg-blue-100 dark:bg-blue-900/30"
            delay={0.1}
          />
          <StatsCard
            title="Активные"
            value={stats?.active || 0}
            icon={
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-green-100 dark:bg-green-900/30"
            delay={0.2}
          />
          <StatsCard
            title="На модерации"
            value={stats?.pending || 0}
            icon={
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-yellow-100 dark:bg-yellow-900/30"
            delay={0.3}
          />
          <StatsCard
            title="Закрытые"
            value={stats?.closed || 0}
            icon={
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-red-100 dark:bg-red-900/30"
            delay={0.4}
          />
        </div>

        {/* Дополнительная статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="За последние 7 дней"
            value={stats?.lastWeek || 0}
            icon={
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="bg-indigo-100 dark:bg-indigo-900/30"
            delay={0.5}
          />
          <StatsCard
            title="Черновики"
            value={stats?.draft || 0}
            icon={
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            color="bg-gray-100 dark:bg-gray-700/50"
            delay={0.6}
          />
          <StatsCard
            title="Отклоненные"
            value={stats?.rejected || 0}
            icon={
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
            color="bg-orange-100 dark:bg-orange-900/30"
            delay={0.7}
          />
        </div>

        {/* Топ вакансий по просмотрам и откликам */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TopPostsCard
            title="Топ вакансий по просмотрам"
            posts={stats?.topViewed || []}
            metric="views"
            delay={0.8}
          />
          <TopPostsCard
            title="Топ вакансий по откликам"
            posts={stats?.topApplied || []}
            metric="applications"
            delay={0.9}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminStats; 