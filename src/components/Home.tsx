import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import CountUp from 'react-countup';
import EnhancedImage from './effects/EnhancedImage';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale,
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

// Helper functions
interface JobPosting {
  id: string;
  title: string;
  status: string;
  createdAt: any;
  [key: string]: any;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  createdAt: any;
  candidateName?: string;
  [key: string]: any;
}

interface ViewData {
  id: string;
  title: string;
  views: number;
  [key: string]: any;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', { 
    day: 'numeric', 
    month: 'short'
  }).format(date);
};

const getRandomColor = (index: number): string => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-indigo-500 to-purple-600',
    'from-purple-500 to-pink-600',
    'from-pink-500 to-rose-600',
    'from-rose-500 to-red-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-green-600',
    'from-cyan-500 to-blue-600',
  ];
  return colors[index % colors.length];
};

// Custom hooks for employer data
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
        // Fetch job postings for this employer
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('employerId', '==', userId));
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
            jobTitle: job.title,
            ...doc.data(),
          })) as Application[];
        });
        
        const applicationsResults = await Promise.all(applicationsPromises);
        setApplications(applicationsResults.flat());
        
        // Fetch views data (simplified simulation for now)
        const viewsData = jobsData.map(job => ({
          id: job.id,
          title: job.title,
          views: Math.floor(Math.random() * 200) + 50, // Simulated view count
          // In a real app, you would track actual view counts in the database
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
  
  // Compute aggregated statistics
  const stats = useMemo(() => {
    const activeJobsCount = jobPostings.filter(job => job.status === 'active').length;
    const totalApplicationsCount = applications.length;
    const totalViewsCount = views.reduce((sum, item) => sum + item.views, 0);
    const candidatesFoundCount = applications.filter(app => app.status === 'shortlisted' || app.status === 'accepted').length;
    
    return {
      activeJobsCount,
      totalApplicationsCount,
      totalViewsCount,
      candidatesFoundCount
    };
  }, [jobPostings, applications, views]);
  
  // Generate chart data
  const chartData = useMemo(() => {
    // Applications by date
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date;
    });
    
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
    
    // Applications by status
    const statusCounts = {
      pending: applications.filter(app => app.status === 'pending').length,
      reviewing: applications.filter(app => app.status === 'reviewing').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      accepted: applications.filter(app => app.status === 'accepted').length
    };
    
    // Popular jobs by applications
    const jobApplicationCounts = jobPostings.map(job => ({
      id: job.id,
      title: job.title,
      count: applications.filter(app => app.jobId === job.id).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return {
      applicationsByDate,
      statusCounts,
      jobApplicationCounts
    };
  }, [applications, jobPostings]);
  
  return {
    jobPostings,
    applications,
    views,
    stats,
    chartData,
    loading,
    error
  };
};

// Типы для компонентов
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

interface IconCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  color?: string;
  delay?: number;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  index: number;
  bgColor: string;
  iconBgColor: string;
}

interface UserData {
  displayName?: string;
  userType?: string;
  email?: string;
  [key: string]: any;
}

interface UserContentProps {
  userData: UserData | null;
}

// Определения анимаций
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const textRevealVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      delay: 0.5
    }
  }
};

// Анимационные стили
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Компонент для анимированных секций
const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Компонент для карточек с иконками
const IconCard: React.FC<IconCardProps> = ({ icon, title, description, link, color = "from-blue-500 to-indigo-600", delay = 0 }) => {
  return (
    <Link 
      to={link}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className="mb-6 flex justify-center">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 text-center mb-4">{description}</p>
      <div className="w-1/3 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full transform origin-center transition-transform duration-300 group-hover:scale-x-125"></div>
    </Link>
  );
};

// Компонент для студентов
const StudentContent: React.FC<UserContentProps> = ({ userData }) => {
  return (
    <motion.div 
      key="student-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16 pb-24 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-400/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <AnimatedSection className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
                <motion.span 
                  className="relative inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="text-slate-800 dark:text-white font-normal mb-2">Нет опыта?</div>
                  <GradientText className="animate-gradient text-4xl sm:text-5xl font-extrabold">
                    Оплата через <CountUp end={48} duration={1.5} /> часов
                  </GradientText>
                  <motion.span 
                    className="absolute -bottom-2 left-0 w-full h-3 bg-blue-200/30 dark:bg-blue-900/30 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  ></motion.span>
                </motion.span>
                <br />
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-slate-800 dark:text-white relative overflow-hidden inline-block text-3xl sm:text-4xl"
                >
                  Мы превращаем твои навыки в 
                  <span className="relative">
                    деньги
                    <motion.div 
                      className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500/30"
                      variants={textRevealVariants}
                      initial="hidden"
                      animate="visible"
                    />
            </span>
                  — даже если кейсов ноль
                </motion.span>
          </h1>
                
              <motion.p 
                variants={itemVariants}
                className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 mb-10"
              >
                <span className="badge badge-gray">
                  <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Оплата ≤ 48 часов
                </span>
              </motion.p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { text: '₸2,5 млн выплачено ученикам', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { text: 'Отклик 1 клик — без HR-тестов', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
                  { text: '85% получают оффер ≤ 30 дн.', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                  { text: 'HR закрывает вкладку за 6 сек', icon: 'M6 18L18 6M6 6l12 12' },
                  { text: 'JumysAL = кейс за 1 день', icon: 'M5 13l4 4L19 7' }
                ].map((chip, index) => (
                  <span 
                    key={index}
                    className="badge badge-gray"
                    aria-label={chip.text}
                  >
                    <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={chip.icon} />
                    </svg>
                    {chip.text}
                  </span>
                ))}
              </div>
                
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/signup"
                  className="relative overflow-hidden rounded-xl group px-6 py-3 text-lg font-medium text-white shadow-xl transition-all duration-300 hover:scale-105 will-change-transform"
                  style={{ boxShadow: "0 10px 30px rgba(59,130,246,.4)" }}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600"></span>
                  <span className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0"></span>
                  <motion.span 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20"
                    animate={{ 
                      background: [
                        "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)"
                      ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  />
                  <span className="relative z-10 flex items-center">
                    Забрать первую задачу сейчас →₸
                    <motion.svg 
                      className="w-5 h-5 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </span>
                </Link>
                
                <Link
                  to="/jobs"
                  className="text-lg font-medium text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-all duration-300 group px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  Смотреть все 500+ активных задач
                  <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
            </div>
            <div>
            <Link
                to="/jobs"
                className="flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Найти вакансии</span>
            </Link>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Карьерный прогресс */}
        <AnimatedSection delay={0.1} className="mb-12">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ваш карьерный прогресс</h2>
            <Link
                to="/profile"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
                Обновить профиль
            </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Профиль заполнен</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">75%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
          </div>
        </div>

              <div className="bg-indigo-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Отправлено заявок</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">8</p>
              </div>
                  <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
          </div>
        </div>

              <div className="bg-purple-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Приглашений</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">3</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
              </div>
              
              <div className="bg-green-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Рейтинг резюме</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">4.7/5</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    </div>
                  </div>
                </div>
          </div>
            
            {/* Рекомендованные вакансии */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Рекомендованные вакансии</h3>
              <div className="space-y-4">
                {[
                  { id: 1, title: 'Junior Frontend Developer', company: 'TechSolutions', location: 'Алматы', matched: 92 },
                  { id: 2, title: 'Marketing Assistant', company: 'CreativeMinds', location: 'Удаленно', matched: 85 },
                  { id: 3, title: 'Data Entry Specialist', company: 'DataCorp', location: 'Астана', matched: 78 }
                ].map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">{job.title}</h4>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{job.company}</span>
                        <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{job.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300 mr-4">
                        {job.matched}% соответствие
                      </span>
                      <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
                      </Link>
            </div>
          </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Инструменты для успеха */}
        <AnimatedSection delay={0.2}>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            Инструменты для успеха
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="ИИ Генератор резюме"
              description="Создайте профессиональное резюме в один клик"
              link="/resume-generator"
              color="from-blue-500 to-indigo-600"
              delay={0}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
              }
              title="Карьерный ментор"
              description="Получите персонализированные советы и подготовку к собеседованиям"
              link="/ai-mentor"
              color="from-indigo-500 to-purple-600"
              delay={0.1}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
              }
              title="Поиск вакансий"
              description="Просмотр и фильтрация вакансий по вашим предпочтениям"
              link="/jobs"
              color="from-green-500 to-teal-600"
              delay={0.2}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
              }
              title="Отслеживание заявок"
              description="Управляйте статусами ваших заявок на одной странице"
              link="/applications"
              color="from-orange-500 to-pink-600"
              delay={0.3}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
              }
              title="Сохраненные вакансии"
              description="Быстрый доступ к вакансиям, которые вас заинтересовали"
              link="/saved-jobs"
              color="from-pink-500 to-purple-600"
              delay={0.4}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="Образовательный центр"
              description="Статьи, видео и курсы для развития ваших навыков"
              link="/education"
              color="from-teal-500 to-blue-600"
              delay={0.5}
            />
                    </div>
        </AnimatedSection>
                  </div>
    </motion.div>
  );
};

// Компонент для работодателей
const EmployerContent: React.FC<UserContentProps> = ({ userData }) => {
  const { user } = useAuth();
  const dashboardData = useEmployerDashboardData(user?.uid);
  const [activeTab, setActiveTab] = useState('overview');
  
  // References for animations
  const statsRef = useRef(null);
  const chartsRef = useRef(null);
  
  const { 
    jobPostings, 
    applications, 
    views, 
    stats, 
    chartData, 
    loading, 
    error 
  } = dashboardData;
  
  // Filter most popular job postings
  const popularJobPostings = useMemo(() => {
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
  
  // Recent applications
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
  
  // Chart configuration for applications over time
  const applicationsChartData = {
    labels: chartData.applicationsByDate.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Заявки',
        data: chartData.applicationsByDate.map(item => item.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
  
  const applicationsChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13
        },
        borderColor: 'rgba(200, 200, 200, 0.3)',
        borderWidth: 1,
        displayColors: false
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.3)'
        }
      }
    }
  };
  
  // Chart configuration for application statuses
  const statusChartData = {
    labels: [
      'На рассмотрении', 
      'Просмотрено', 
      'В шортлисте', 
      'Отклонено', 
      'Принято'
    ],
    datasets: [
      {
        data: [
          chartData.statusCounts.pending,
          chartData.statusCounts.reviewing,
          chartData.statusCounts.shortlisted,
          chartData.statusCounts.rejected,
          chartData.statusCounts.accepted
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',   // Indigo
          'rgba(168, 85, 247, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(34, 197, 94, 0.8)'     // Green
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(239, 68, 68)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13
        },
        borderWidth: 1
      }
    }
  };
  
  return (
    <motion.div 
      key="employer-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16 pb-24 overflow-hidden relative"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl"></div>
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-pink-400/5 dark:bg-pink-400/3 blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header section */}
        <AnimatedSection className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-extrabold mb-2">
                <span className="text-slate-800 dark:text-white">Добро пожаловать, </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {userData?.displayName || 'Работодатель'}
                </span>
                <span className="text-purple-500 animate-pulse ml-1">!</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Управляйте вакансиями и найдите талантливых студентов
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Просмотр кандидатов</span>
              </Link>
                </div>
          </div>
          
          {/* Dashboard tabs */}
          <div className="flex space-x-2 mt-8 border-b border-slate-200 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'jobs' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Вакансии
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Заявки
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Аналитика
            </button>
          </div>
        </AnimatedSection>
        
        {/* Statistics Cards */}
        <AnimatedSection delay={0.1} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" ref={statsRef}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                  Вакансии
                </span>
              </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.activeJobsCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>12%</span>
          </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Активных вакансий</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  Заявки
                </span>
              </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.totalApplicationsCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>18%</span>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Всего заявок</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
            </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  Просмотры
                </span>
          </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.totalViewsCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>24%</span>
              </div>
              </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Всего просмотров</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
            </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  Кандидаты
                </span>
                  </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.candidatesFoundCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>8%</span>
              </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Найдено кандидатов</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
        
        {/* Charts & Analytics */}
        <AnimatedSection delay={0.2} className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" ref={chartsRef}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Динамика заявок</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Последние 14 дней</span>
                  <button className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="h-64">
                <Line data={applicationsChartData} options={applicationsChartOptions} />
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/30">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Всего за период</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {chartData.applicationsByDate.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Среднее в день</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {(chartData.applicationsByDate.reduce((sum, item) => sum + item.count, 0) / 14).toFixed(1)}
                  </p>
          </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Конверсия</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.totalViewsCount ? ((stats.totalApplicationsCount / stats.totalViewsCount) * 100).toFixed(1) : 0}%
                  </p>
      </div>
    </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Статусы заявок</h3>
                <button className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              
              <div className="h-64">
                <Doughnut data={statusChartData} options={statusChartOptions} />
              </div>
              
              <div className="flex justify-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/30">
            <Link
                  to="/employer/applications"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
            >
                  <span>Просмотреть все заявки</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
        </div>
            </motion.div>
          </div>
        </AnimatedSection>
        
        {/* Popular Jobs & Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Popular Jobs */}
          <AnimatedSection delay={0.3} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Популярные вакансии</h3>
            <Link 
                to="/employer/manage-jobs"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Все вакансии
              </Link>
            </div>
            
            {popularJobPostings.length > 0 ? (
              <div className="space-y-4">
                {popularJobPostings.map((job, index) => (
                  <motion.div 
                    key={job.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">{job.title}</h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                          {applications.filter(app => app.jobId === job.id).length} заявок
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {views.find(v => v.id === job.id)?.views || 0} просмотров
                        </span>
                </div>
              </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mr-4">
                        Активна
                      </span>
                      <Link to={`/employer/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Нет активных вакансий</h4>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-4">
                  Создайте свою первую вакансию, чтобы начать поиск талантливых студентов
                </p>
                <Link
                  to="/create-post"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                  <span>Создать вакансию</span>
                </Link>
              </div>
            )}
            
            {popularJobPostings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/30">
                <Link
                  to="/create-post"
                  className="flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Создать новую вакансию</span>
            </Link>
              </div>
            )}
          </AnimatedSection>

          {/* Recent Applications */}
          <AnimatedSection delay={0.4} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Последние заявки</h3>
                  <Link
                to="/employer/applications"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Все заявки
              </Link>
            </div>
            
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app, index) => (
                  <motion.div 
                    key={app.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">
                          {app.candidateName || 'Кандидат'}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {app.jobTitle || 'Вакансия'}
                        </p>
              </div>
                    </div>
                    <div className="flex items-center">
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Новая
                        </span>
                      )}
                      {app.status === 'reviewing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          На рассмотрении
                        </span>
                      )}
                      {app.status === 'shortlisted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          В шортлисте
                        </span>
                      )}
                      {app.status === 'accepted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Принята
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Отклонена
                        </span>
                      )}
                      <Link to={`/employer/applications/${app.id}`} className="ml-3 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Нет заявок</h4>
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  Пока нет заявок на ваши вакансии
                </p>
              </div>
            )}
          </AnimatedSection>
        </div>
        
        {/* AI Assistant */}
        <AnimatedSection delay={0.5} className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-12 -mr-12 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -mb-8 -ml-8 blur-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Помощник для работодателей</h3>
                    <p className="text-indigo-100">Автоматизируйте процесс найма с помощью ИИ</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-white/90 mb-6">
                      Используйте возможности искусственного интеллекта, чтобы оптимизировать процесс поиска, скрининга и оценки кандидатов. Наш ИИ-помощник поможет вам автоматически находить студентов, чьи навыки лучше всего соответствуют вашим требованиям.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {['Автоматический отбор кандидатов', 'ИИ-скрининг резюме', 'Рекомендации по текстам вакансий', 'Анализ рынка талантов'].map((feature, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/employer/ai-tools"
                        className="inline-flex items-center px-5 py-2.5 bg-white text-indigo-700 font-medium rounded-xl hover:shadow-lg hover:bg-indigo-50 transition-all duration-300"
                      >
                        Исследовать ИИ-инструменты
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                  </Link>
                      <Link
                        to="/employer/resource-center"
                        className="text-white hover:text-indigo-100 font-medium transition-colors duration-300"
                      >
                        Узнать больше
                      </Link>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-lg font-bold text-white mb-4">Рекомендации ИИ</h4>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">Оптимизируйте заголовок вакансии</p>
                          <p className="text-indigo-100 text-sm">Добавьте ключевые навыки в заголовок для увеличения релевантности</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">5 новых подходящих кандидатов</p>
                          <p className="text-indigo-100 text-sm">ИИ нашел новых кандидатов с высоким соответствием вашим требованиям</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">Улучшите описание вакансии</p>
                          <p className="text-indigo-100 text-sm">Добавьте информацию о возможностях роста для привлечения лучших кандидатов</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Quick Actions */}
        <AnimatedSection delay={0.6} className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Быстрые действия</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Link
              to="/employer/profile"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Профиль компании</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Обновите информацию о вашей компании</p>
              </div>
            </Link>
            
            <Link
              to="/employer/manage-jobs"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Управление вакансиями</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Редактируйте и архивируйте ваши вакансии</p>
              </div>
                  </Link>
            
            <Link
              to="/employer/analytics"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
          </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Расширенная аналитика</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Подробная статистика по вашим вакансиям</p>
        </div>
            </Link>

                  <Link
              to="/employer/messages"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Сообщения</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Общайтесь с кандидатами</p>
            </div>
            </Link>
            
            <Link
              to="/employer/billing"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Подписка и оплата</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Управление тарифным планом</p>
            </div>
                  </Link>

                  <Link
              to="/contact"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Поддержка</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Свяжитесь с нашей командой</p>
            </div>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </motion.div>
  );
};
// Компонент для неавторизованных пользователей
const UnauthorizedContent = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroImageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  
  // Обработчик движения мыши для создания эффекта следящей тени
  const handleMouseMove = (e: MouseEvent) => {
    if (reducedMotion) return;
    
    // Общий обработчик движения мыши
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const xMovement = (clientX - centerX) / 40;
    const yMovement = (clientY - centerY) / 40;
    
    setMousePosition({ x: xMovement, y: yMovement });
    
    // Обработчик для тени под изображением
    if (heroImageRef.current) {
      const container = heroImageRef.current;
      const rect = container.getBoundingClientRect();
      
      // Рассчитываем позицию мыши относительно контейнера изображения
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      
      // Обновляем CSS переменные для тени
      const shadow = container.querySelector('.hero-image-shadow') as HTMLElement;
      if (shadow) {
        shadow.style.setProperty('--x', x.toFixed(2));
        shadow.style.setProperty('--y', y.toFixed(2));
      }
    }
  };
  
  useEffect(() => {
    if (reducedMotion) return;
    
    // Добавляем обработчик движения мыши
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion]);
  
  // Аналитика для отслеживания кликов по CTA
  const trackCTAClick = useCallback(() => {
    // Проверка наличия gtag
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'cta_click', { label: 'first_task' });
    }
  }, []);
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Фоновые элементы */}
      <FloatingElement 
        className="absolute top-1/4 left-10 w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-md border border-white/20 dark:border-white/5 hidden lg:block"
        xMovement={reducedMotion ? 0 : 30}
        yMovement={reducedMotion ? 0 : 20}
        duration={12}
      ></FloatingElement>
      <FloatingElement 
        className="absolute top-1/3 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 dark:border-white/5 hidden lg:block"
        xMovement={reducedMotion ? 0 : -20}
        yMovement={reducedMotion ? 0 : 30}
        duration={15}
        delay={2}
      ></FloatingElement>
      <FloatingElement 
        className="absolute bottom-1/4 left-1/4 w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-white/20 dark:border-white/5 hidden lg:block"
        xMovement={reducedMotion ? 0 : 25}
        yMovement={reducedMotion ? 0 : -15}
        duration={10}
        delay={1}
      ></FloatingElement>
      
      {/* Декоративные линии */}
      <div className="absolute top-1/4 right-1/6 w-24 h-1 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full hidden lg:block"></div>
      <div className="absolute bottom-1/3 left-1/6 w-24 h-1 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full hidden lg:block"></div>
      
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Hero секция */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
        >
          {/* Левая колонка с текстом */}
          <motion.div 
            variants={itemVariants}
            className="lg:w-1/2"
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
                <motion.span 
                  className="relative inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="text-slate-800 dark:text-white font-normal mb-2">Нет опыта?</div>
                  <GradientText className="animate-gradient text-4xl sm:text-5xl font-extrabold">
                    Превращаем навыки в деньги
                  </GradientText>
                </motion.span>
                <br />
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-slate-800 dark:text-white relative overflow-hidden inline-block text-3xl sm:text-4xl"
                >
                  Даже если кейсов ноль
                </motion.span>
              </h1>
              
              <motion.p 
                variants={itemVariants}
                className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 mb-10"
              >
                <span className="badge badge-gray">
                  <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <div className="max-w-5xl mx-auto mb-20" ref={heroImageRef}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
          >
            {/* Левая колонка с текстом */}
            <div className="lg:w-1/2 lg:pr-10 mb-10 lg:mb-0">
              <motion.div variants={itemVariants}>
                <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
                  <motion.span 
                    className="relative inline-block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <div className="text-slate-800 dark:text-white font-normal mb-2">Нет опыта?</div>
                    <GradientText className="animate-gradient text-4xl sm:text-5xl font-extrabold">
                      Превращаем навыки в деньги
                    </GradientText>
                  </motion.span>
                  <br />
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-slate-800 dark:text-white relative overflow-hidden inline-block text-3xl sm:text-4xl"
                  >
                    Даже если кейсов ноль
                  </motion.span>
                </h1>
                
                <motion.p 
                  variants={itemVariants}
                  className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 mb-10"
                >
                  <span className="badge badge-gray">
                    <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Оплата ≤ 48 часов
                  </span>
                </motion.p>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { text: '₸2,5 млн выплачено ученикам', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { text: 'Отклик 1 клик — без HR-тестов', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
                    { text: '85% получают оффер ≤ 30 дн.', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                    { text: 'HR закрывает вкладку за 6 сек', icon: 'M6 18L18 6M6 6l12 12' },
                    { text: 'JumysAL = кейс за 1 день', icon: 'M5 13l4 4L19 7' }
                  ].map((chip, index) => (
                    <span 
                      key={index}
                      className="badge badge-gray"
                      aria-label={chip.text}
                    >
                      <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={chip.icon} />
                      </svg>
                      {chip.text}
                    </span>
                  ))}
                </div>
                
                <motion.div 
                  variants={itemVariants}
                  className="flex flex-wrap items-center gap-4"
                >
                  <Link
                    to="/signup"
                    className="relative overflow-hidden rounded-xl group w-full sm:w-auto px-6 py-4 text-lg md:text-xl font-medium text-white shadow-xl transition-all duration-300 hover:scale-105 will-change-transform"
                    style={{ boxShadow: "0 10px 30px rgba(59,130,246,.4)" }}
                    onClick={trackCTAClick}
                    aria-label="Зарегистрироваться и получить первую задачу"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600"></span>
                    <span className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0"></span>
                    <motion.span 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20"
                      animate={{ 
                        background: [
                          "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                          "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                          "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)"
                        ]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                    <span className="relative z-10 flex items-center justify-center">
                      Забрать первую задачу сейчас
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Правая колонка с изображением */}
            <motion.div 
              variants={itemVariants}
              className="lg:w-1/2 relative"
            >
              {/* Карточка поверх фото - добавляем тень и непрозрачный фон */}
              <div className="absolute z-10 bottom-10 -left-5 md:left-5 p-4 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-lg max-w-[280px] backdrop-blur-sm border border-white/50 dark:border-slate-700/50">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Верифицированные задания</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Все проекты проверены нашей командой</p>
                  </div>
                </div>
              </div>
              
              <EnhancedImage 
                src="/assets/hero-image.jpg" 
                alt="Студенты обсуждают проект в современном коворкинге" 
                width={600}
                height={450}
                loading="eager"
                decoding="async"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </motion.div>
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import CountUp from 'react-countup';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale,
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

// Helper functions
interface JobPosting {
  id: string;
  title: string;
  status: string;
  createdAt: any;
  [key: string]: any;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  status: string;
  createdAt: any;
  candidateName?: string;
  [key: string]: any;
}

interface ViewData {
  id: string;
  title: string;
  views: number;
  [key: string]: any;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', { 
    day: 'numeric', 
    month: 'short'
  }).format(date);
};

const getRandomColor = (index: number): string => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-indigo-500 to-purple-600',
    'from-purple-500 to-pink-600',
    'from-pink-500 to-rose-600',
    'from-rose-500 to-red-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-green-600',
    'from-cyan-500 to-blue-600',
  ];
  return colors[index % colors.length];
};

// Custom hooks for employer data
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
        // Fetch job postings for this employer
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('employerId', '==', userId));
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
            jobTitle: job.title,
            ...doc.data(),
          })) as Application[];
        });
        
        const applicationsResults = await Promise.all(applicationsPromises);
        setApplications(applicationsResults.flat());
        
        // Fetch views data (simplified simulation for now)
        const viewsData = jobsData.map(job => ({
          id: job.id,
          title: job.title,
          views: Math.floor(Math.random() * 200) + 50, // Simulated view count
          // In a real app, you would track actual view counts in the database
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
  
  // Compute aggregated statistics
  const stats = useMemo(() => {
    const activeJobsCount = jobPostings.filter(job => job.status === 'active').length;
    const totalApplicationsCount = applications.length;
    const totalViewsCount = views.reduce((sum, item) => sum + item.views, 0);
    const candidatesFoundCount = applications.filter(app => app.status === 'shortlisted' || app.status === 'accepted').length;
    
    return {
      activeJobsCount,
      totalApplicationsCount,
      totalViewsCount,
      candidatesFoundCount
    };
  }, [jobPostings, applications, views]);
  
  // Generate chart data
  const chartData = useMemo(() => {
    // Applications by date
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      return date;
    });
    
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
    
    // Applications by status
    const statusCounts = {
      pending: applications.filter(app => app.status === 'pending').length,
      reviewing: applications.filter(app => app.status === 'reviewing').length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      accepted: applications.filter(app => app.status === 'accepted').length
    };
    
    // Popular jobs by applications
    const jobApplicationCounts = jobPostings.map(job => ({
      id: job.id,
      title: job.title,
      count: applications.filter(app => app.jobId === job.id).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    return {
      applicationsByDate,
      statusCounts,
      jobApplicationCounts
    };
  }, [applications, jobPostings]);
  
  return {
    jobPostings,
    applications,
    views,
    stats,
    chartData,
    loading,
    error
  };
};

// Типы для компонентов
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

interface IconCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  color?: string;
  delay?: number;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  index: number;
  bgColor: string;
  iconBgColor: string;
}

interface UserData {
  displayName?: string;
  userType?: string;
  email?: string;
  [key: string]: any;
}

interface UserContentProps {
  userData: UserData | null;
}

// Определения анимаций
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const textRevealVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      delay: 0.5
    }
  }
};

// Анимационные стили
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Компонент для анимированных секций
const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Компонент для карточек с иконками
const IconCard: React.FC<IconCardProps> = ({ icon, title, description, link, color = "from-blue-500 to-indigo-600", delay = 0 }) => {
  return (
    <Link 
      to={link}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className="mb-6 flex justify-center">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-center text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-slate-600 dark:text-slate-300 text-center mb-4">{description}</p>
      <div className="w-1/3 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full transform origin-center transition-transform duration-300 group-hover:scale-x-125"></div>
    </Link>
  );
};

// Компонент для студентов
const StudentContent: React.FC<UserContentProps> = ({ userData }) => {
  return (
    <motion.div 
      key="student-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16 pb-24 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-400/10 dark:bg-blue-400/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <AnimatedSection className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
                <motion.span 
                  className="relative inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="text-slate-800 dark:text-white font-normal mb-2">Нет опыта?</div>
                  <GradientText className="animate-gradient text-4xl sm:text-5xl font-extrabold">
                    Оплата через <CountUp end={48} duration={1.5} /> часов
                  </GradientText>
                  <motion.span 
                    className="absolute -bottom-2 left-0 w-full h-3 bg-blue-200/30 dark:bg-blue-900/30 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  ></motion.span>
                </motion.span>
                <br />
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-slate-800 dark:text-white relative overflow-hidden inline-block text-3xl sm:text-4xl"
                >
                  Мы превращаем твои навыки в 
                  <span className="relative">
                    деньги
                    <motion.div 
                      className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500/30"
                      variants={textRevealVariants}
                      initial="hidden"
                      animate="visible"
                    />
            </span>
                  — даже если кейсов ноль
                </motion.span>
          </h1>
                
              <motion.p 
                variants={itemVariants}
                className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 mb-10"
              >
                <span className="badge badge-gray">
                  <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Оплата ≤ 48 часов
                </span>
              </motion.p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { text: '₸2,5 млн выплачено ученикам', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { text: 'Отклик 1 клик — без HR-тестов', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
                  { text: '85% получают оффер ≤ 30 дн.', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                  { text: 'HR закрывает вкладку за 6 сек', icon: 'M6 18L18 6M6 6l12 12' },
                  { text: 'JumysAL = кейс за 1 день', icon: 'M5 13l4 4L19 7' }
                ].map((chip, index) => (
                  <span 
                    key={index}
                    className="badge badge-gray"
                    aria-label={chip.text}
                  >
                    <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={chip.icon} />
                    </svg>
                    {chip.text}
                  </span>
                ))}
              </div>
                
              <motion.div 
                variants={itemVariants}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/signup"
                  className="relative overflow-hidden rounded-xl group px-6 py-3 text-lg font-medium text-white shadow-xl transition-all duration-300 hover:scale-105 will-change-transform"
                  style={{ boxShadow: "0 10px 30px rgba(59,130,246,.4)" }}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600"></span>
                  <span className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0"></span>
                  <motion.span 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20"
                    animate={{ 
                      background: [
                        "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                        "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)"
                      ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  />
                  <span className="relative z-10 flex items-center">
                    Забрать первую задачу сейчас →₸
                    <motion.svg 
                      className="w-5 h-5 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </span>
                </Link>
                
                <Link
                  to="/jobs"
                  className="text-lg font-medium text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-all duration-300 group px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  Смотреть все 500+ активных задач
                  <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>
            </div>
            <div>
            <Link
                to="/jobs"
                className="flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Найти вакансии</span>
            </Link>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Карьерный прогресс */}
        <AnimatedSection delay={0.1} className="mb-12">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ваш карьерный прогресс</h2>
            <Link
                to="/profile"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
            >
                Обновить профиль
            </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Профиль заполнен</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">75%</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
          </div>
        </div>

              <div className="bg-indigo-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Отправлено заявок</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">8</p>
              </div>
                  <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
          </div>
        </div>

              <div className="bg-purple-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Приглашений</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">3</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
              </div>
              
              <div className="bg-green-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Рейтинг резюме</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">4.7/5</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    </div>
                  </div>
                </div>
          </div>
            
            {/* Рекомендованные вакансии */}
            <div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Рекомендованные вакансии</h3>
              <div className="space-y-4">
                {[
                  { id: 1, title: 'Junior Frontend Developer', company: 'TechSolutions', location: 'Алматы', matched: 92 },
                  { id: 2, title: 'Marketing Assistant', company: 'CreativeMinds', location: 'Удаленно', matched: 85 },
                  { id: 3, title: 'Data Entry Specialist', company: 'DataCorp', location: 'Астана', matched: 78 }
                ].map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">{job.title}</h4>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{job.company}</span>
                        <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{job.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300 mr-4">
                        {job.matched}% соответствие
                      </span>
                      <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
                      </Link>
            </div>
          </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Инструменты для успеха */}
        <AnimatedSection delay={0.2}>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            Инструменты для успеха
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="ИИ Генератор резюме"
              description="Создайте профессиональное резюме в один клик"
              link="/resume-generator"
              color="from-blue-500 to-indigo-600"
              delay={0}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
              }
              title="Карьерный ментор"
              description="Получите персонализированные советы и подготовку к собеседованиям"
              link="/ai-mentor"
              color="from-indigo-500 to-purple-600"
              delay={0.1}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
              }
              title="Поиск вакансий"
              description="Просмотр и фильтрация вакансий по вашим предпочтениям"
              link="/jobs"
              color="from-green-500 to-teal-600"
              delay={0.2}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
              }
              title="Отслеживание заявок"
              description="Управляйте статусами ваших заявок на одной странице"
              link="/applications"
              color="from-orange-500 to-pink-600"
              delay={0.3}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
              }
              title="Сохраненные вакансии"
              description="Быстрый доступ к вакансиям, которые вас заинтересовали"
              link="/saved-jobs"
              color="from-pink-500 to-purple-600"
              delay={0.4}
            />
            
            <IconCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              title="Образовательный центр"
              description="Статьи, видео и курсы для развития ваших навыков"
              link="/education"
              color="from-teal-500 to-blue-600"
              delay={0.5}
            />
                    </div>
        </AnimatedSection>
                  </div>
    </motion.div>
  );
};

// Компонент для работодателей
const EmployerContent: React.FC<UserContentProps> = ({ userData }) => {
  const { user } = useAuth();
  const dashboardData = useEmployerDashboardData(user?.uid);
  const [activeTab, setActiveTab] = useState('overview');
  
  // References for animations
  const statsRef = useRef(null);
  const chartsRef = useRef(null);
  
  const { 
    jobPostings, 
    applications, 
    views, 
    stats, 
    chartData, 
    loading, 
    error 
  } = dashboardData;
  
  // Filter most popular job postings
  const popularJobPostings = useMemo(() => {
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
  
  // Recent applications
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
  
  // Chart configuration for applications over time
  const applicationsChartData = {
    labels: chartData.applicationsByDate.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Заявки',
        data: chartData.applicationsByDate.map(item => item.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
  
  const applicationsChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13
        },
        borderColor: 'rgba(200, 200, 200, 0.3)',
        borderWidth: 1,
        displayColors: false
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.3)'
        }
      }
    }
  };
  
  // Chart configuration for application statuses
  const statusChartData = {
    labels: [
      'На рассмотрении', 
      'Просмотрено', 
      'В шортлисте', 
      'Отклонено', 
      'Принято'
    ],
    datasets: [
      {
        data: [
          chartData.statusCounts.pending,
          chartData.statusCounts.reviewing,
          chartData.statusCounts.shortlisted,
          chartData.statusCounts.rejected,
          chartData.statusCounts.accepted
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',   // Indigo
          'rgba(168, 85, 247, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(34, 197, 94, 0.8)'     // Green
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(239, 68, 68)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13
        },
        borderWidth: 1
      }
    }
  };
  
  return (
    <motion.div 
      key="employer-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-16 pb-24 overflow-hidden relative"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10"></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-400/10 dark:bg-indigo-400/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl"></div>
      <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-pink-400/5 dark:bg-pink-400/3 blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header section */}
        <AnimatedSection className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-extrabold mb-2">
                <span className="text-slate-800 dark:text-white">Добро пожаловать, </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {userData?.displayName || 'Работодатель'}
                </span>
                <span className="text-purple-500 animate-pulse ml-1">!</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Управляйте вакансиями и найдите талантливых студентов
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Просмотр кандидатов</span>
              </Link>
                </div>
          </div>
          
          {/* Dashboard tabs */}
          <div className="flex space-x-2 mt-8 border-b border-slate-200 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'jobs' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Вакансии
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Заявки
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t border-l border-r border-slate-200 dark:border-slate-700/50 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Аналитика
            </button>
          </div>
        </AnimatedSection>
        
        {/* Statistics Cards */}
        <AnimatedSection delay={0.1} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" ref={statsRef}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                  Вакансии
                </span>
              </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.activeJobsCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>12%</span>
          </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Активных вакансий</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  Заявки
                </span>
              </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.totalApplicationsCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>18%</span>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Всего заявок</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
            </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  Просмотры
                </span>
          </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.totalViewsCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>24%</span>
              </div>
              </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Всего просмотров</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
            </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  Кандидаты
                </span>
                  </div>
              
              <div className="mb-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {stats.candidatesFoundCount}
                  </h3>
                  <div className="flex items-center text-emerald-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>8%</span>
              </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Найдено кандидатов</p>
              </div>
              
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                <div className="h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
        
        {/* Charts & Analytics */}
        <AnimatedSection delay={0.2} className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" ref={chartsRef}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Динамика заявок</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Последние 14 дней</span>
                  <button className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="h-64">
                <Line data={applicationsChartData} options={applicationsChartOptions} />
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/30">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Всего за период</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {chartData.applicationsByDate.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Среднее в день</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">
                    {(chartData.applicationsByDate.reduce((sum, item) => sum + item.count, 0) / 14).toFixed(1)}
                  </p>
          </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Конверсия</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.totalViewsCount ? ((stats.totalApplicationsCount / stats.totalViewsCount) * 100).toFixed(1) : 0}%
                  </p>
      </div>
    </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Статусы заявок</h3>
                <button className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              
              <div className="h-64">
                <Doughnut data={statusChartData} options={statusChartOptions} />
              </div>
              
              <div className="flex justify-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/30">
            <Link
                  to="/employer/applications"
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center transition-colors"
            >
                  <span>Просмотреть все заявки</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
        </div>
            </motion.div>
          </div>
        </AnimatedSection>
        
        {/* Popular Jobs & Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          {/* Popular Jobs */}
          <AnimatedSection delay={0.3} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Популярные вакансии</h3>
            <Link 
                to="/employer/manage-jobs"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Все вакансии
              </Link>
            </div>
            
            {popularJobPostings.length > 0 ? (
              <div className="space-y-4">
                {popularJobPostings.map((job, index) => (
                  <motion.div 
                    key={job.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">{job.title}</h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                          {applications.filter(app => app.jobId === job.id).length} заявок
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {views.find(v => v.id === job.id)?.views || 0} просмотров
                        </span>
                </div>
              </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mr-4">
                        Активна
                      </span>
                      <Link to={`/employer/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Нет активных вакансий</h4>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-4">
                  Создайте свою первую вакансию, чтобы начать поиск талантливых студентов
                </p>
                <Link
                  to="/create-post"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                  <span>Создать вакансию</span>
                </Link>
              </div>
            )}
            
            {popularJobPostings.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/30">
                <Link
                  to="/create-post"
                  className="flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Создать новую вакансию</span>
            </Link>
              </div>
            )}
          </AnimatedSection>

          {/* Recent Applications */}
          <AnimatedSection delay={0.4} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Последние заявки</h3>
                  <Link
                to="/employer/applications"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Все заявки
              </Link>
            </div>
            
            {recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app, index) => (
                  <motion.div 
                    key={app.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">
                          {app.candidateName || 'Кандидат'}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {app.jobTitle || 'Вакансия'}
                        </p>
              </div>
                    </div>
                    <div className="flex items-center">
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Новая
                        </span>
                      )}
                      {app.status === 'reviewing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          На рассмотрении
                        </span>
                      )}
                      {app.status === 'shortlisted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          В шортлисте
                        </span>
                      )}
                      {app.status === 'accepted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Принята
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Отклонена
                        </span>
                      )}
                      <Link to={`/employer/applications/${app.id}`} className="ml-3 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-2">Нет заявок</h4>
                <p className="text-slate-500 dark:text-slate-400 text-center">
                  Пока нет заявок на ваши вакансии
                </p>
              </div>
            )}
          </AnimatedSection>
        </div>
        
        {/* AI Assistant */}
        <AnimatedSection delay={0.5} className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mt-12 -mr-12 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -mb-8 -ml-8 blur-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Помощник для работодателей</h3>
                    <p className="text-indigo-100">Автоматизируйте процесс найма с помощью ИИ</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-white/90 mb-6">
                      Используйте возможности искусственного интеллекта, чтобы оптимизировать процесс поиска, скрининга и оценки кандидатов. Наш ИИ-помощник поможет вам автоматически находить студентов, чьи навыки лучше всего соответствуют вашим требованиям.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {['Автоматический отбор кандидатов', 'ИИ-скрининг резюме', 'Рекомендации по текстам вакансий', 'Анализ рынка талантов'].map((feature, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/employer/ai-tools"
                        className="inline-flex items-center px-5 py-2.5 bg-white text-indigo-700 font-medium rounded-xl hover:shadow-lg hover:bg-indigo-50 transition-all duration-300"
                      >
                        Исследовать ИИ-инструменты
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                  </Link>
                      <Link
                        to="/employer/resource-center"
                        className="text-white hover:text-indigo-100 font-medium transition-colors duration-300"
                      >
                        Узнать больше
                      </Link>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h4 className="text-lg font-bold text-white mb-4">Рекомендации ИИ</h4>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">Оптимизируйте заголовок вакансии</p>
                          <p className="text-indigo-100 text-sm">Добавьте ключевые навыки в заголовок для увеличения релевантности</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">5 новых подходящих кандидатов</p>
                          <p className="text-indigo-100 text-sm">ИИ нашел новых кандидатов с высоким соответствием вашим требованиям</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium mb-1">Улучшите описание вакансии</p>
                          <p className="text-indigo-100 text-sm">Добавьте информацию о возможностях роста для привлечения лучших кандидатов</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        {/* Quick Actions */}
        <AnimatedSection delay={0.6} className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Быстрые действия</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Link
              to="/employer/profile"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Профиль компании</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Обновите информацию о вашей компании</p>
              </div>
            </Link>
            
            <Link
              to="/employer/manage-jobs"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Управление вакансиями</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Редактируйте и архивируйте ваши вакансии</p>
              </div>
                  </Link>
            
            <Link
              to="/employer/analytics"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
          </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Расширенная аналитика</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Подробная статистика по вашим вакансиям</p>
        </div>
            </Link>

                  <Link
              to="/employer/messages"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Сообщения</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Общайтесь с кандидатами</p>
            </div>
            </Link>
            
            <Link
              to="/employer/billing"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Подписка и оплата</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Управление тарифным планом</p>
            </div>
                  </Link>

                  <Link
              to="/contact"
              className="flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-100 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Поддержка</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Свяжитесь с нашей командой</p>
            </div>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </motion.div>
  );
};
// Компонент для неавторизованных пользователей
const UnauthorizedContent = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroImageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  
  // Обработчик движения мыши для создания эффекта следящей тени
  const handleMouseMove = (e: MouseEvent) => {
    if (reducedMotion) return;
    
    // Общий обработчик движения мыши
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const xMovement = (clientX - centerX) / 40;
    const yMovement = (clientY - centerY) / 40;
    
    setMousePosition({ x: xMovement, y: yMovement });
    
    // Обработчик для тени под изображением
    if (heroImageRef.current) {
      const container = heroImageRef.current;
      const rect = container.getBoundingClientRect();
      
      // Рассчитываем позицию мыши относительно контейнера изображения
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      
      // Обновляем CSS переменные для тени
      const shadow = container.querySelector('.hero-image-shadow') as HTMLElement;
      if (shadow) {
        shadow.style.setProperty('--x', x.toFixed(2));
        shadow.style.setProperty('--y', y.toFixed(2));
      }
    }
  };
  
  useEffect(() => {
    if (reducedMotion) return;
    
    // Добавляем обработчик движения мыши
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion]);
  
  // Аналитика для отслеживания кликов по CTA
  const trackCTAClick = useCallback(() => {
    // Проверка наличия gtag
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // @ts-ignore
      window.gtag('event', 'cta_click', { label: 'first_task' });
    }
  }, []);
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Фоновые элементы */}
      <FloatingElement 
        className="absolute top-1/4 left-10 w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-md border border-white/20 dark:border-white/5 hidden lg:block"
        xMovement={reducedMotion ? 0 : 30}
        yMovement={reducedMotion ? 0 : 20}
        duration={12}
      ></FloatingElement>
      <FloatingElement 
        className="absolute top-1/3 right-10 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 dark:border-white/5 hidden lg:block"
        xMovement={reducedMotion ? 0 : -20}
        yMovement={reducedMotion ? 0 : 30}
        duration={15}
        delay={2}
      ></FloatingElement>
      <FloatingElement 
        className="absolute bottom-1/4 left-1/4 w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-white/20 dark:border-white/5 hidden lg:block"
        xMovement={reducedMotion ? 0 : 25}
        yMovement={reducedMotion ? 0 : -15}
        duration={10}
        delay={1}
      ></FloatingElement>
      
      {/* Декоративные линии */}
      <div className="absolute top-1/4 right-1/6 w-24 h-1 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full hidden lg:block"></div>
      <div className="absolute bottom-1/3 left-1/6 w-24 h-1 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full hidden lg:block"></div>
      
      <div className="container mx-auto px-4 py-12 lg:py-20">
        {/* Hero секция */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
        >
          {/* Левая колонка с текстом */}
          <motion.div 
            variants={itemVariants}
            className="lg:w-1/2"
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
                <motion.span 
                  className="relative inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="text-slate-800 dark:text-white font-normal mb-2">Нет опыта?</div>
                  <GradientText className="animate-gradient text-4xl sm:text-5xl font-extrabold">
                    Превращаем навыки в деньги
                  </GradientText>
                </motion.span>
                <br />
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-slate-800 dark:text-white relative overflow-hidden inline-block text-3xl sm:text-4xl"
                >
                  Даже если кейсов ноль
                </motion.span>
              </h1>
              
              <motion.p 
                variants={itemVariants}
                className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 mb-10"
              >
                <span className="badge badge-gray">
                  <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <div className="max-w-5xl mx-auto mb-20" ref={heroImageRef}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20"
          >
            {/* Левая колонка с текстом */}
            <div className="lg:w-1/2 lg:pr-10 mb-10 lg:mb-0">
              <motion.div variants={itemVariants}>
                <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
                  <motion.span 
                    className="relative inline-block"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <div className="text-slate-800 dark:text-white font-normal mb-2">Нет опыта?</div>
                    <GradientText className="animate-gradient text-4xl sm:text-5xl font-extrabold">
                      Превращаем навыки в деньги
                    </GradientText>
                  </motion.span>
                  <br />
                  <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-slate-800 dark:text-white relative overflow-hidden inline-block text-3xl sm:text-4xl"
                  >
                    Даже если кейсов ноль
                  </motion.span>
                </h1>
                
                <motion.p 
                  variants={itemVariants}
                  className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 mb-10"
                >
                  <span className="badge badge-gray">
                    <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Оплата ≤ 48 часов
                  </span>
                </motion.p>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { text: '₸2,5 млн выплачено ученикам', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { text: 'Отклик 1 клик — без HR-тестов', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
                    { text: '85% получают оффер ≤ 30 дн.', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                    { text: 'HR закрывает вкладку за 6 сек', icon: 'M6 18L18 6M6 6l12 12' },
                    { text: 'JumysAL = кейс за 1 день', icon: 'M5 13l4 4L19 7' }
                  ].map((chip, index) => (
                    <span 
                      key={index}
                      className="badge badge-gray"
                      aria-label={chip.text}
                    >
                      <svg className="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={chip.icon} />
                      </svg>
                      {chip.text}
                    </span>
                  ))}
                </div>
                
                <motion.div 
                  variants={itemVariants}
                  className="flex flex-wrap items-center gap-4"
                >
                  <Link
                    to="/signup"
                    className="relative overflow-hidden rounded-xl group w-full sm:w-auto px-6 py-4 text-lg md:text-xl font-medium text-white shadow-xl transition-all duration-300 hover:scale-105 will-change-transform"
                    style={{ boxShadow: "0 10px 30px rgba(59,130,246,.4)" }}
                    onClick={trackCTAClick}
                    aria-label="Зарегистрироваться и получить первую задачу"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600"></span>
                    <span className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0"></span>
                    <motion.span 
                      className="absolute inset-0 opacity-0 group-hover:opacity-20"
                      animate={{ 
                        background: [
                          "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                          "radial-gradient(circle at 0% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                          "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)"
                        ]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                    />
                    <span className="relative z-10 flex items-center justify-center">
                      Забрать первую задачу сейчас
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Правая колонка с изображением */}
            <motion.div 
              variants={itemVariants}
              className="lg:w-1/2 relative group"
              ref={heroImageRef}
            >
              {/* Фоновое свечение позади изображения */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 blur-3xl rounded-full transform scale-95 -translate-y-5"></div>
              
              {/* Карточка поверх фото - добавляем тень и непрозрачный фон */}
              <div className="absolute z-10 bottom-10 -left-5 md:left-5 p-4 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-lg max-w-[280px] backdrop-blur-sm border border-white/50 dark:border-slate-700/50">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Верифицированные задания</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Все проекты проверены нашей командой</p>
                  </div>
                </div>
              </div>
              
              {/* Динамическая тень, реагирующая на движение мыши */}
              <div className="hero-image-shadow"></div>
              
              {/* Добавляем элемент акцентной тени, который появляется за изображением */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-purple-500/10 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 scale-105"></div>
              
              {/* Декоративные элементы свечения вокруг изображения */}
              <div className="glow-blob glow-blob-blue"></div>
              <div className="glow-blob glow-blob-purple"></div>
              
              <div className="relative rounded-2xl overflow-hidden enhanced-shadow glow-corners hero-image-container z-0">
                {/* Слой блика, который анимируется при наведении */}
                <div className="shine-effect"></div>
                
                {/* Внутренняя рамка с градиентом */}
                <div className="inner-glow-border"></div>
                
                {/* Основное изображение */}
                <EnhancedImage 
                  src="/assets/hero-image.jpg" 
                  alt="Студенты обсуждают проект в современном коворкинге" 
                  className="w-full h-auto object-cover zoom-on-hover image-outline" 
                  width="600"
                  height="450"
                  loading="eager"
                  decoding="async"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                
                {/* Оверлей с градиентом поверх изображения */}
                <div className="gradient-overlay"></div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Статистика с анимированными счетчиками и эффектом появления */}
        <div className="mb-24">
          <div className="flex justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
                { value: '500+', label: 'Активных вакансий', icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { value: '200+', label: 'Компаний', icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { value: '2,000+', label: 'Студентов', icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
                { value: '85%', label: 'Успешное трудоустройство', icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center" 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                >
                  <HoverCard className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-xl border border-slate-100 dark:border-slate-700/30">
                    <motion.div 
                      className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"
                      whileHover={{ rotate: 5 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                      </svg>
                    </motion.div>
                    <motion.div 
                      className="text-3xl font-bold text-blue-600 dark:text-blue-400"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 200, 
                        damping: 10,
                        delay: index * 0.1 + 0.5 
                      }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{stat.label}</div>
                  </HoverCard>
                </motion.div>
            ))}
          </div>
        </div>
        </div>
        
        {/* Ключевые особенности */}
        <AnimatedSection delay={0.2} className="mb-24">
          <div className="relative mb-12 text-center">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
            <h2 className="text-3xl font-bold mb-6 pt-6 dark:text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">3 инструмента</span> для первой зарплаты в 10-м классе
          </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Мы не просто сайт вакансий. Мы — твой личный карьерный ускоритель с гарантией первого заработка.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
              }
              title="Задачи с 95% гарантией оплаты"
              description="AI фильтрует вакансии по твоим навыкам и рекомендует только те, где оплата гарантирована."
              link="/jobs"
              index={0}
              bgColor="bg-gradient-to-br from-blue-600 to-indigo-700"
              iconBgColor="bg-blue-500/30 backdrop-blur-sm"
            />
            
            <FeatureCard
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
              }
              title="PDF-резюме за 12 секунд"
              description="Нажми кнопку — AI мгновенно сгенерирует резюме под конкретную вакансию. HR точно заметит."
              link="/resume-generator"
              index={1}
              bgColor="bg-gradient-to-br from-indigo-600 to-purple-700"
              iconBgColor="bg-indigo-500/30 backdrop-blur-sm"
            />
            
            <FeatureCard
              icon={
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
              }
              title="AI-ментор доступен 24/7"
              description="Спроси: «Как пройти собеседование?» — получи готовый план действий через 3 секунды."
              link="/ai-mentor"
              index={2}
              bgColor="bg-gradient-to-br from-purple-600 to-pink-700"
              iconBgColor="bg-purple-500/30 backdrop-blur-sm"
            />
          </div>
        </AnimatedSection>
        
        {/* Как это работает */}
        <AnimatedSection delay={0.3} className="mb-24">
          <div className="relative mb-12 text-center">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
            <h2 className="text-3xl font-bold mb-6 pt-6 dark:text-white">
              4 шага до <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">первой зарплаты</span>
          </h2>
          </div>
          
          <div className="relative">
            {/* Линия соединения */}
            <div className="absolute left-[50%] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-500/40 to-indigo-500/40 hidden md:block"></div>
            
            <div className="space-y-12 relative">
              {[
                {
                  step: '01',
                  title: 'Регистрация за 60 секунд 🔑',
                  description: 'Быстрее, чем приготовить доширак! Email → Google-аккаунт → выбери 3 навыка → готово.',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )
                },
                {
                  step: '02',
                  title: 'Моментальный подбор задач 🎯',
                  description: 'Получи бесплатно 5+ идеальных вакансий с процентом совпадения. Листай как в Tinder — только здесь всегда матч!',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  step: '03',
                  title: 'Один клик = отправленное резюме ⚡',
                  description: 'Наш AI сам генерирует идеальное резюме под вакансию и отправляет работодателю. Экономия: 45 минут на каждой заявке.',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  step: '04',
                  title: 'Гарантированная оплата на Kaspi 💸',
                  description: 'Выполнил задачу — получил деньги, 5★ отзыв в профиль и +50 баллов к рейтингу. Каждый кейс = +30% к будущей зарплате.',
                  icon: (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905 0 .905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  )
                }
              ].map((step, index) => (
                <div key={index} className={`md:flex items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-10 md:text-right' : 'md:pl-10'}`}>
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700/30">
                      <div className="mb-4 flex md:justify-end items-center">
                        <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                          {step.step}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex justify-center md:w-16">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      {step.icon}
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
        
        {/* CTA */}
        <AnimatedSection delay={0.4} className="mb-24">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Фоновый градиент */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
            
            {/* Фоновый паттерн */}
            <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] bg-center opacity-10"></div>
            
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            
            {/* Плавающие элементы */}
            <motion.div 
              className="absolute top-10 right-10 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hidden lg:block"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            ></motion.div>
            
            <motion.div 
              className="absolute bottom-10 left-1/4 w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hidden lg:block"
              animate={{ 
                y: [0, 20, 0],
                rotate: [0, -10, 0]
              }}
              transition={{ 
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            ></motion.div>
            
            {/* Основной контент */}
            <div className="relative px-8 py-20 text-center text-white z-10">
              <motion.h2 
                className="text-4xl md:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                Первая работа <span className="relative inline-block">
                  уже ждёт тебя
                  <motion.span 
                    className="absolute -bottom-2 left-0 w-full h-2 bg-white/30 rounded-full"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  ></motion.span>
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-xl text-blue-100 max-w-3xl mx-auto mb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.7 }}
              >
              Секрет успеха прост: пока другие ищут идеальную стажировку месяцами, ты получишь реальный опыт и деньги уже сегодня. 
              85% наших пользователей закрывают первую задачу за 48 часов.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap justify-center gap-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.7 }}
              >
              <Link
                to="/signup"
                  className="relative overflow-hidden group px-8 py-4 rounded-xl font-medium shadow-lg shadow-blue-700/30 hover:shadow-blue-700/50 transition-all duration-300"
              >
                  <span className="absolute inset-0 bg-white"></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 text-blue-600 group-hover:text-white transition-colors duration-300 flex items-center">
                    Начать зарабатывать за 5 минут
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
              </Link>
                
              <Link
                to="/login"
                  className="px-8 py-4 rounded-xl bg-transparent text-white font-medium border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Войти в аккаунт
              </Link>
              </motion.div>
              
              <p className="text-sm text-blue-100/70 mt-4">
                Регистрация займёт 60 секунд — и ни слова учителю 😉
              </p>
              
              {/* Счетчики */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.7 }}
              >
                {[
                  { value: '500+', label: 'Активных задач' },
                  { value: '₸ 2.5 млн', label: 'Выплачено за 90 дней' },
                  { value: '2,000+', label: 'Школьников на платформе' },
                  { value: '85%', label: 'Получают оффер ≤ 30 дней' },
                ].map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  >
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-blue-100/80">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
                  </div>
                </div>
        </AnimatedSection>
        
        {/* Секция для компаний */}
        <AnimatedSection delay={0.5} className="mb-24">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-sm rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-700/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-20 -mb-20"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
              <div>
                <span className="inline-block text-indigo-600 dark:text-indigo-400 font-semibold mb-2">ДЛЯ КОМПАНИЙ</span>
                <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">
                  Нужны <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">результаты вчера</span>? Получите готового исполнителя за 24 часа
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                  Забудьте о долгом поиске и неоправданных рисках. У нас уже есть пул мотивированных студентов, готовых закрыть ваши задачи с гарантией качества.
                </p>
                <Link
                  to="/company"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
                >
                  Опубликовать задачу за 3 мин ▶︎
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                Первая публикация бесплатно. Оплата только за результат.
              </p>
              </div>
              <div className="relative">
                <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-xl p-6 border border-slate-100 dark:border-slate-600/30">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Почему выбирают нас</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      '⚡ Экономия 90% HR-времени — AI сам находит идеальных кандидатов',
                      '💰 До 50% дешевле фриланс-бирж + оплата только за результат',
                      '📊 Полная прозрачность: дашборд с реальным статусом задач в реальном времени',
                      '🎓 Доступ к эксклюзивному пулу из 2000+ талантливых NIS-студентов'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200">{item}</p>
                      </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-600/30">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-3">
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700" src="https://randomuser.me/api/portraits/women/1.jpg" alt="Пользователь" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700" src="https://randomuser.me/api/portraits/men/1.jpg" alt="Пользователь" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700" src="https://randomuser.me/api/portraits/women/2.jpg" alt="Пользователь" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">37 компаний</span> опубликовали задачи за последние 7 дней
              </p>
            </div>
          </div>
        </div>
      </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </motion.div>
  );
};

// Компонент для интерактивных карточек функций
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, link, index, bgColor, iconBgColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -10 }}
      className={`relative overflow-hidden rounded-2xl ${bgColor} p-8 shadow-xl border border-white/10`}
    >
      {/* Декоративный фоновый паттерн */}
      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute -left-12 -top-12 w-40 h-40 rounded-full bg-white/5 blur-xl"></div>
      
      {/* Иконка */}
      <div className="relative z-10 mb-6">
        <div className={`w-16 h-16 rounded-2xl ${iconBgColor} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
      </div>
      
      {/* Контент */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-white/80 mb-6">{description}</p>
        
        <Link to={link} className="inline-flex items-center text-white font-medium group">
          <span>Подробнее</span>
          <svg 
            className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
};

// Часть 1: Компоненты для продвинутых анимаций
// Эти компоненты будут использоваться для создания креативных визуальных эффектов
interface FloatingElementProps {
  children?: React.ReactNode;
  className?: string;
  xMovement?: number;
  yMovement?: number;
  duration?: number;
  delay?: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ 
  children, 
  className = "", 
  xMovement = 20, 
  yMovement = 20, 
  duration = 8, 
  delay = 0 
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        x: [0, xMovement, 0, -xMovement, 0],
        y: [0, -yMovement, 0, yMovement, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxElementProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  initialOffset?: number;
}

const ParallaxElement: React.FC<ParallaxElementProps> = ({ children, className = "", speed = 0.5, initialOffset = 0 }) => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const yOffset = initialOffset + scrollY * speed;
  
  return (
    <div 
      className={className} 
      style={{ transform: `translateY(${yOffset}px)` }}
    >
      {children}
    </div>
  );
};

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
}

const GradientText: React.FC<GradientTextProps> = ({ children, className = "", from = "blue-600", to = "indigo-600" }) => {
  return (
    <span className={`bg-clip-text text-transparent bg-gradient-to-r from-${from} to-${to} ${className}`}>
      {children}
    </span>
  );
};

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
}

const HoverCard: React.FC<HoverCardProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`transition-all duration-300 ${className}`}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setUserData(data);
            setUserType(data.userType || 'student'); // По умолчанию - студент
          }
        } catch (error) {
          console.error("Ошибка при получении данных пользователя:", error);
        }
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, [user]);
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex justify-center items-center">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (!user) {
      return <UnauthorizedContent />;
    }
    
    if (userType === 'employer') {
      return <EmployerContent userData={userData} />;
    }
    
    return <StudentContent userData={userData} />;
  };
  
  return (
    <AnimatePresence mode="wait">
      {renderContent()}
    </AnimatePresence>
  );
};

export default Home;
