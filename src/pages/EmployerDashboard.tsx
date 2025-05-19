import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Title, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

// Типы данных
interface JobPosting {
  id: string;
  title: string;
  status: 'active' | 'inactive' | 'draft' | 'expired';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  companyId: string;
  location?: string;
  description?: string;
}

interface Application {
  id: string;
  jobId: string;
  userId: string;
  candidateName?: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected' | string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

interface ViewData {
  id: string;
  jobId: string;
  timestamp: Timestamp | Date;
  userId?: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

interface DashboardStats {
  activeJobsCount: number;
  totalApplicationsCount: number;
  totalViewsCount: number;
  candidatesFoundCount: number;
  conversionRate: number;
  increases: {
    activeJobs: number;
    applications: number;
    views: number;
    candidates: number;
  };
}

interface DashboardChartData {
  applicationsTimeSeries: ChartDataPoint[];
  applicationStatusCounts: {
    new: number;
    reviewing: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
    [key: string]: number;
  };
}

interface EmployerDashboardData {
  jobPostings: JobPosting[];
  applications: Application[];
  views: ViewData[];
  stats: DashboardStats;
  chartData: DashboardChartData;
  loading: boolean;
  error: string | null;
}

// Хук для получения данных дашборда
const useEmployerDashboardData = (userId: string | undefined) => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [views, setViews] = useState<ViewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch job postings
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('companyId', '==', userId));
        const jobsSnapshot = await getDocs(jobsQuery);
        
        const jobsData = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as JobPosting[];
        setJobPostings(jobsData);
        
        // Fetch applications
        const applicationsPromises = jobsData.map(async (job) => {
          const applicationsRef = collection(db, 'applications');
          const appQuery = query(applicationsRef, where('jobId', '==', job.id));
          const appSnapshot = await getDocs(appQuery);
          
          return appSnapshot.docs.map(doc => ({
            id: doc.id,
            jobId: job.id,
            ...doc.data(),
          })) as Application[];
        });
        
        const applicationsResults = await Promise.all(applicationsPromises);
        setApplications(applicationsResults.flat());
        
        // Fetch views data (simplified simulation for now)
        const viewsData = jobsData.map(job => ({
          id: job.id,
          jobId: job.id,
          timestamp: new Timestamp(new Date(), 0), // Simulating current timestamp
        })) as ViewData[];
        setViews(viewsData);
        
      } catch (err: any) {
        console.error('Error fetching employer dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  // Вычисляем статистику
  const stats = useMemo(() => {
    const activeJobsCount = jobPostings.filter(job => job.status === 'active').length;
    const totalApplicationsCount = applications.length;
    const totalViewsCount = views.length;
    const candidatesFoundCount = new Set(applications.map(app => app.userId)).size;
    
    // Коэффициент конверсии (просмотры в заявки)
    const conversionRate = totalViewsCount > 0 
      ? Math.round((totalApplicationsCount / totalViewsCount) * 100) 
      : 0;
    
    return {
      activeJobsCount,
      totalApplicationsCount,
      totalViewsCount,
      candidatesFoundCount,
      conversionRate,
      // Расчет процентного увеличения (в реальном приложении сравнивали бы с предыдущим периодом)
      increases: {
        activeJobs: 12.5,
        applications: 23.7,
        views: 18.2,
        candidates: 15.4
      }
    };
  }, [jobPostings, applications, views]);

  // Форматирование даты
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', { 
      day: 'numeric', 
      month: 'short'
    }).format(date);
  };

  // Генерируем данные для графиков
  const chartData = useMemo(() => {
    // Последние 14 дней для графика заявок
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date;
    });

    // Заявки по датам
    const applicationsByDate = last14Days.map(date => {
      const dateString = date.toISOString().split('T')[0];
      return {
        date,
        count: applications.filter(app => {
          const appDate = app.createdAt instanceof Timestamp 
            ? app.createdAt.toDate() 
            : new Date(app.createdAt);
          return appDate.toISOString().split('T')[0] === dateString;
        }).length
      };
    });

    // Статусы заявок
    const statusCounts = {
      pending: applications.filter(app => app.status === 'pending').length,
      reviewing: applications.filter(app => app.status === 'reviewing').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      accepted: applications.filter(app => app.status === 'accepted').length
    };
    
    // Популярные вакансии по заявкам
    const jobApplicationCounts = jobPostings.map(job => ({
      id: job.id,
      title: job.title,
      count: applications.filter(app => app.jobId === job.id).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return {
      applicationsByDate,
      statusCounts,
      jobApplicationCounts,
      formattedDates: applicationsByDate.map(item => formatDate(item.date))
    };
  }, [applications, jobPostings]);

  return {
    jobPostings,
    applications,
    views,
    loading,
    error,
    stats,
    chartData
  };
};

// Компонент анимированной секции
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = "", 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Основной компонент дашборда работодателя
const EmployerDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const dashboardData = useEmployerDashboardData(user?.uid);
  
  // Упрощенная навигация: всего 2 режима - "Обзор" и "Аналитика"
  const [activeView, setActiveView] = useState<'overview' | 'analytics'>('overview');
  
  const { 
    jobPostings, 
    applications, 
    views, 
    stats, 
    chartData, 
    loading, 
    error 
  } = dashboardData;

  // Находим популярные вакансии
  const popularJobs = useMemo(() => {
    if (!jobPostings.length) return [];
    
    return [...jobPostings]
      .filter(job => job.status === 'active')
      .sort((a, b) => {
        const aCount = applications.filter(app => app.jobId === a.id).length;
        const bCount = applications.filter(app => app.jobId === b.id).length;
        return bCount - aCount;
      })
      .slice(0, 3);
  }, [jobPostings, applications]);
  
  // Последние заявки
  const recentApplications = useMemo(() => {
    if (!applications.length) return [];
    
    return [...applications]
      .sort((a, b) => {
        const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [applications]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-indigo-600 border-r-transparent border-b-indigo-600 border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">Загрузка данных панели управления...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Ошибка загрузки данных</h3>
          <p className="text-slate-600 dark:text-slate-300 text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-24">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Шапка с приветствием и кнопками действий */}
        <AnimatedSection className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                <span className="text-slate-800 dark:text-white">Добро пожаловать, </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {userData?.companyName || userData?.displayName || 'Работодатель'}
                </span>
                <span className="text-purple-500 animate-pulse ml-1">!</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Управляйте вакансиями, анализируйте отклики и находите лучших кандидатов
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/create-post"
                className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Создать вакансию</span>
              </Link>
              <Link
                to="/employer/candidates"
                className="flex items-center px-5 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30 hover:shadow-slate-200/70 dark:hover:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Кандидаты</span>
              </Link>
            </div>
          </div>
          
          {/* Переключатель представлений (очень лаконичный) */}
          <div className="flex space-x-2 mt-8 border-b border-slate-200 dark:border-slate-700/50">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeView === 'overview' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Обзор
              </span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeView === 'analytics' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Аналитика
              </span>
            </button>
          </div>
        </AnimatedSection>
        
        {/* Содержимое в зависимости от активного представления */}
        {activeView === 'overview' ? (
          <>
            {/* Метрики */}
            <AnimatedSection delay={0.1} className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Карточка: Активные вакансии */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative group hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                      Вакансии
                    </span>
                  </div>
                  
                  <div className="mb-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {stats.activeJobsCount}
                      </h3>
                      <div className="flex items-center text-emerald-500 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>{stats.increases.activeJobs}%</span>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Активных вакансий</p>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                </motion.div>
                
                {/* Карточка: Заявки */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative group hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                      Заявки
                    </span>
                  </div>
                  
                  <div className="mb-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {stats.totalApplicationsCount}
                      </h3>
                      <div className="flex items-center text-emerald-500 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>{stats.increases.applications}%</span>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Всего заявок</p>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                  </div>
                </motion.div>
                
                {/* Карточка: Просмотры */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative group hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                      Просмотры
                    </span>
                  </div>
                  
                  <div className="mb-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {stats.totalViewsCount}
                      </h3>
                      <div className="flex items-center text-emerald-500 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>{stats.increases.views}%</span>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Всего просмотров</p>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{ width: '85%' }}></div>
                  </div>
                </motion.div>
                
                {/* Карточка: Кандидаты */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative group hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-500"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      Кандидаты
                    </span>
                  </div>
                  
                  <div className="mb-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {stats.candidatesFoundCount}
                      </h3>
                      <div className="flex items-center text-emerald-500 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>{stats.increases.candidates}%</span>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Подходящих кандидатов</p>
                  </div>
                  
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                    <div className="h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse" style={{ width: '45%' }}></div>
                  </div>
                </motion.div>
              </div>
            </AnimatedSection>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Популярные вакансии */}
              <AnimatedSection delay={0.2} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Популярные вакансии
                  </h2>
                  <Link 
                    to="/employer/jobs"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    Управление вакансиями →
                  </Link>
                </div>
                
                {popularJobs.length > 0 ? (
                  <div className="space-y-4">
                    {popularJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow duration-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-white mb-0.5">{job.title}</h3>
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center mr-4">
                                <svg className="w-4 h-4 mr-1 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {applications.filter(app => app.jobId === job.id).length} заявок
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {views.filter(view => view.jobId === job.id).length} просмотров
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center ${
                            job.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              job.status === 'active' ? 'bg-green-500 dark:bg-green-400' : 'bg-slate-500 dark:bg-slate-400'
                            }`}></span>
                            {job.status === 'active' ? 'Активная' : 'Неактивная'}
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <Link
                            to={`/jobs/${job.id}/applicants`}
                            className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                          >
                            Просмотреть кандидатов
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                      У вас пока нет активных вакансий
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Создайте новую вакансию и начните поиск талантов
                    </p>
                    <Link
                      to="/create-post"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Создать вакансию
                    </Link>
                  </div>
                )}
              </AnimatedSection>
              
              {/* Последние заявки */}
              <AnimatedSection delay={0.3} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Последние заявки
                  </h2>
                  <Link 
                    to="/employer/applications"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    Все заявки →
                  </Link>
                </div>
                
                {recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {recentApplications.map((application) => {
                      const job = jobPostings.find(j => j.id === application.jobId);
                      
                      return (
                        <div key={application.id} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-shadow duration-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-slate-900 dark:text-white mb-0.5">
                                {application.candidateName || 'Кандидат'}
                              </h3>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                На вакансию: {job?.title || 'Неизвестная вакансия'}
                              </div>
                            </div>
                            
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              application.status === 'new' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : application.status === 'reviewing' 
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                : application.status === 'shortlisted' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : application.status === 'accepted' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : application.status === 'rejected' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {application.status === 'new' ? 'Новая' :
                               application.status === 'reviewing' ? 'На рассмотрении' :
                               application.status === 'shortlisted' ? 'В шортлисте' :
                               application.status === 'accepted' ? 'Принята' :
                               application.status === 'rejected' ? 'Отклонена' :
                               'Неизвестен'}
                            </span>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {application.createdAt instanceof Timestamp 
                                ? new Date(application.createdAt.toDate()).toLocaleDateString() 
                                : new Date(application.createdAt).toLocaleDateString()}
                            </div>
                            <Link
                              to={`/applications/${application.id}/view`}
                              className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                            >
                              Подробнее
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-1">
                      У вас пока нет заявок
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Заявки на ваши вакансии появятся здесь
                    </p>
                    <Link
                      to="/employer/promote"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      Продвигать вакансии
                    </Link>
                  </div>
                )}
              </AnimatedSection>
            </div>
            
            {/* Графики и аналитика */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Тренд заявок */}
              <AnimatedSection delay={0.4} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Тренд заявок
                  </h2>
                  <div className="flex items-center space-x-2">
                    <select 
                      className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="14">За 14 дней</option>
                      <option value="30">За 30 дней</option>
                      <option value="90">За 90 дней</option>
                    </select>
                  </div>
                </div>
                
                <div className="h-72 w-full">
                  {chartData.applicationsTimeSeries.length > 0 ? (
                    <Line
                      data={{
                        labels: chartData.applicationsTimeSeries.map(item => item.label),
                        datasets: [
                          {
                            label: 'Заявки',
                            data: chartData.applicationsTimeSeries.map(item => item.value),
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            labels: {
                              font: {
                                size: 12,
                              },
                              color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                            }
                          },
                          tooltip: {
                            backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            titleColor: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                            bodyColor: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            borderColor: document.documentElement.classList.contains('dark') ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false,
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              display: false,
                              color: document.documentElement.classList.contains('dark') ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)',
                            },
                            ticks: {
                              font: {
                                size: 10,
                              },
                              color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                            }
                          },
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: document.documentElement.classList.contains('dark') ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)',
                            },
                            ticks: {
                              precision: 0,
                              font: {
                                size: 12,
                              },
                              color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-slate-500 dark:text-slate-400 text-center">
                        Недостаточно данных для отображения графика
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Всего заявок</h3>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {stats.totalApplicationsCount}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Ср. заявок в день</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round((stats.totalApplicationsCount / 14) * 10) / 10}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
              
              {/* Статус заявок */}
              <AnimatedSection delay={0.5} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    Статусы заявок
                  </h2>
                  <Link 
                    to="/employer/applications"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    Все заявки →
                  </Link>
                </div>
                
                <div className="h-64 w-full">
                  {applications.length > 0 ? (
                    <div className="flex justify-center">
                      <div style={{ width: '220px', height: '220px' }}>
                        <Doughnut
                          data={{
                            labels: [
                              'Новые',
                              'На рассмотрении',
                              'В шортлисте',
                              'Приняты',
                              'Отклонены'
                            ],
                            datasets: [
                              {
                                data: [
                                  chartData.applicationStatusCounts.new || 0,
                                  chartData.applicationStatusCounts.reviewing || 0,
                                  chartData.applicationStatusCounts.shortlisted || 0,
                                  chartData.applicationStatusCounts.accepted || 0,
                                  chartData.applicationStatusCounts.rejected || 0,
                                ],
                                backgroundColor: [
                                  'rgba(59, 130, 246, 0.8)',   // blue
                                  'rgba(249, 115, 22, 0.8)',   // orange
                                  'rgba(147, 51, 234, 0.8)',   // purple
                                  'rgba(34, 197, 94, 0.8)',    // green
                                  'rgba(239, 68, 68, 0.8)',    // red
                                ],
                                borderColor: document.documentElement.classList.contains('dark') 
                                  ? 'rgba(15, 23, 42, 0.9)' 
                                  : 'rgba(255, 255, 255, 0.9)',
                                borderWidth: 2,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '70%',
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  padding: 15,
                                  usePointStyle: true,
                                  font: {
                                    size: 11,
                                  },
                                  color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                                }
                              },
                              tooltip: {
                                backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                titleColor: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                                bodyColor: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                borderColor: document.documentElement.classList.contains('dark') ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: true,
                                callbacks: {
                                  label: function(context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            },
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-slate-500 dark:text-slate-400 text-center">
                        Недостаточно данных для отображения графика
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 mr-1">
                      Коэффициент конверсии:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {stats.conversionRate}%
                    </span>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </>
        ) : (
          // Содержимое вкладки аналитики
          <AnimatedSection className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Аналитика</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Подробные отчеты и аналитика по вашим вакансиям
            </p>
          </AnimatedSection>
        )}

        {/* Быстрые действия */}
        <AnimatedSection delay={0.7} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 h-full">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center mb-6">
            <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Быстрые действия
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/subscription"
              className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-1">Тарифные планы</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Обновить подписку</p>
            </Link>
            
            <Link
              to="/ai-mentor"
              className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 hover:scale-105 group"
            >
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-1">AI Ментор</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Карьерные консультации</p>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default EmployerDashboard; 