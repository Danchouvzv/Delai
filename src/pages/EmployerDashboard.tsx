import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserData } from '../types';
import { useAuth } from '../context/AuthContext';

interface CareerStats {
  activeJobs: number;
  applications: number;
  viewsCount: number;
  candidatesFound: number;
}

interface Candidate {
  id: string;
  name: string;
  position: string;
  location: string;
  match: number;
  applied: string;
}

const EmployerDashboard: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStats>({
    activeJobs: 0,
    applications: 0,
    viewsCount: 0,
    candidatesFound: 0
  });
  const [topCandidates, setTopCandidates] = useState<Candidate[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    // Перенаправляем студентов на их дашборд
    if (!authLoading && userData?.role) {
      const role = userData.role as string;
      if (role !== 'employer' && role !== 'business') {
        navigate('/student/dashboard');
        return;
      }
    }

    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch employer data
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (!userSnapshot.exists()) {
          setError('Профиль работодателя не найден');
          setLoading(false);
          return;
        }
        
        const userData = userSnapshot.data() as UserData;
        
        // Fetch job postings - simplified query to avoid index requirements
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(
          jobsRef, 
          where('userId', '==', user.uid)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobIds = jobsSnapshot.docs.map(doc => doc.id);
        const activeJobsCount = jobsSnapshot.docs.filter(doc => doc.data().status !== 'expired').length;
        
        // Fetch applications for employer's jobs
        const applicationsRef = collection(db, 'applications');
        let allApplications: any[] = [];
        
        for (const jobId of jobIds) {
          // Simplified query to avoid index requirements
          const applicationsQuery = query(
            applicationsRef, 
            where('jobId', '==', jobId)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          
          const jobApplications = applicationsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              jobId,
              ...data
            };
          });
          
          allApplications = [...allApplications, ...jobApplications];
        }
        
        // Get unique candidate counts
        const uniqueCandidateIds = new Set(allApplications.map(app => app.userId));
        
        // Получить количество просмотров из Firestore
        const viewsCount = await getJobViewsCount(jobIds);
        
        // Set career stats
        setCareerStats({
          activeJobs: activeJobsCount,
          applications: allApplications.length,
          viewsCount,
          candidatesFound: uniqueCandidateIds.size
        });
        
        // Prepare recent applications with candidate info
        const applicationsWithUserInfo = await Promise.all(
          allApplications.slice(0, 5).map(async (app) => {
            if (!app.userId) return app;
            
            try {
              const candidateDocRef = doc(db, 'users', app.userId);
              const candidateSnapshot = await getDoc(candidateDocRef);
              
              if (candidateSnapshot.exists()) {
                const candidateData = candidateSnapshot.data();
                return {
                  ...app,
                  candidateName: candidateData.displayName || candidateData.firstName + ' ' + candidateData.lastName,
                  position: candidateData.position || 'Соискатель',
                  location: candidateData.location || 'Казахстан',
                  skills: candidateData.skills || []
                };
              }
              
              return app;
            } catch (error) {
              console.error('Error fetching candidate data:', error);
              return app;
            }
          })
        );
        
        // Sort by relevance to create "top candidates"
        const candidates = applicationsWithUserInfo
          .filter(app => app.candidateName && app.userId)
          .map(app => {
            // Рассчитываем соответствие на основе навыков
            const matchScore = calculateCandidateMatch(app);
            
            return {
              id: app.userId,
              name: app.candidateName,
              position: app.position,
              location: app.location,
              match: matchScore,
              applied: app.createdAt instanceof Timestamp 
                ? app.createdAt.toDate().toLocaleDateString('ru-RU') 
                : new Date(app.createdAt).toLocaleDateString('ru-RU')
            };
          })
          .sort((a, b) => b.match - a.match)
          .slice(0, 3);
        
        setTopCandidates(candidates);
        setRecentApplications(applicationsWithUserInfo);
        
      } catch (err) {
        console.error('Error fetching employer dashboard data:', err);
        setError('Не удалось загрузить данные дашборда. Пожалуйста, попробуйте снова.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, userData, authLoading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{error}</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Панель работодателя</h1>
          <Link 
            to="/create-post" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Создать вакансию
          </Link>
        </div>

        {/* Career Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Статистика по вакансиям
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              title="Активные вакансии" 
              value={careerStats.activeJobs} 
              icon="jobs"
              color="from-green-500 to-teal-500"
            />
            <Card 
              title="Всего заявок" 
              value={careerStats.applications} 
              icon="applications"
              color="from-blue-500 to-indigo-500"
            />
            <Card 
              title="Просмотры" 
              value={careerStats.viewsCount} 
              icon="views"
              color="from-purple-500 to-violet-500"
            />
            <Card 
              title="Найдено кандидатов" 
              value={careerStats.candidatesFound} 
              icon="candidates"
              color="from-amber-500 to-orange-500"
            />
          </div>
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/jobs')}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center mx-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Просмотреть все вакансии
            </button>
          </div>
        </motion.div>

        {/* Top Candidates */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Рекомендуемые кандидаты
          </h2>
          {topCandidates.length > 0 ? (
            <div className="space-y-4">
              {topCandidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                >
                  <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-300 flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {candidate.position} • {candidate.location}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Откликнулся: {candidate.applied}
                      </p>
                    </div>
                    <div className="flex items-start justify-between md:flex-col md:items-end">
                      <div className={`px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${
                        candidate.match >= 90 ? 'from-green-500 to-teal-500' :
                        candidate.match >= 70 ? 'from-blue-500 to-indigo-500' :
                        candidate.match >= 50 ? 'from-purple-500 to-violet-500' :
                        'from-orange-500 to-red-500'
                      }`}>
                        {candidate.match}% совпадение
                      </div>
                      <div className="hidden md:block mt-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div className="text-center mt-8">
                <button
                  onClick={() => navigate('/candidates')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                >
                  Просмотреть всех кандидатов →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет активных кандидатов
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Размещайте вакансии, чтобы получать отклики от соискателей, и они появятся здесь
              </p>
              <button
                onClick={() => navigate('/create-post')}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Создать новую вакансию
              </button>
            </div>
          )}
        </motion.div>
        
        {/* Recent Applications */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Последние отклики
          </h2>
          {recentApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Кандидат</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Вакансия</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Дата</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app, index) => (
                    <tr key={app.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/20">
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                              {app.candidateName ? app.candidateName.charAt(0) : 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{app.candidateName || 'Неизвестный кандидат'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{app.position || 'Соискатель'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-gray-700 dark:text-gray-300">{app.jobTitle || 'Нет названия'}</td>
                      <td className="py-4 text-gray-500 dark:text-gray-400">
                        {app.createdAt instanceof Timestamp 
                          ? app.createdAt.toDate().toLocaleDateString('ru-RU') 
                          : new Date(app.createdAt).toLocaleDateString('ru-RU')
                        }
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Новый
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/applications')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                >
                  Просмотреть все отклики →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет откликов на ваши вакансии
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Откликов пока нет. Попробуйте улучшить описание вакансий, чтобы привлечь больше кандидатов.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Card component for career stats
interface CardProps { 
  title: string; 
  value: string | number;
  icon: 'jobs' | 'applications' | 'views' | 'candidates';
  color: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, color }) => {
  const getIcon = () => {
    switch (icon) {
      case 'jobs':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'applications':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'views':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'candidates':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)' }}
      className="p-5 bg-white dark:bg-slate-700 rounded-xl shadow-md flex flex-col items-center text-center"
    >
      <div className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center text-white bg-gradient-to-r ${color}`}>
        {getIcon()}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </motion.div>
  );
};

// Получение количества просмотров вакансий
const getJobViewsCount = async (jobIds: string[]): Promise<number> => {
  try {
    // Коллекция для хранения просмотров вакансий
    const viewsRef = collection(db, 'jobViews');
    let totalViews = 0;
    
    // Для каждой вакансии получаем количество просмотров
    for (const jobId of jobIds) {
      const viewsQuery = query(viewsRef, where('jobId', '==', jobId));
      const viewsSnapshot = await getDocs(viewsQuery);
      
      // Суммируем просмотры для всех вакансий
      totalViews += viewsSnapshot.docs.reduce((total, doc) => {
        return total + (doc.data().count || 1);
      }, 0);
    }
    
    return totalViews;
  } catch (error) {
    console.error('Error fetching job views:', error);
    return 0;
  }
};

// Расчет соответствия кандидата
const calculateCandidateMatch = (application: any): number => {
  try {
    // Если у заявки уже есть AI-оценка соответствия, используем её
    if (application.aiMatchScore && typeof application.aiMatchScore === 'number') {
      return Math.min(99, Math.max(60, Math.round(application.aiMatchScore)));
    }
    
    // Если у заявки есть навыки, оцениваем по ним
    const candidateSkills = application.skills || [];
    const requiredSkills = application.jobSkills || [];
    
    if (candidateSkills.length > 0 && requiredSkills.length > 0) {
      // Рассчитываем, сколько навыков кандидата совпадает с требуемыми
      let matchCount = 0;
      
      candidateSkills.forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill.toLowerCase() : 
                         (skill.name ? skill.name.toLowerCase() : '');
        
        if (skillName && requiredSkills.some((req: string) => 
          req.toLowerCase().includes(skillName) || skillName.includes(req.toLowerCase()))) {
          matchCount++;
        }
      });
      
      // Максимум 99%, минимум 60%
      const calculatedMatch = Math.min(99, Math.max(60, 
        Math.round((matchCount / Math.max(requiredSkills.length, 1)) * 100)));
      
      return calculatedMatch;
    }
    
    // Если нет данных для расчёта, возвращаем среднее значение
    return 70;
  } catch (error) {
    console.error('Error calculating candidate match:', error);
    return 70;
  }
};

export default EmployerDashboard; 