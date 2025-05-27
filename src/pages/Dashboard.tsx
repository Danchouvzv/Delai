import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserData } from '../types';
import { useAuth } from '../context/AuthContext';

interface CareerStats {
  profileCompletion: number;
  applicationsSent: number;
  invitationsReceived: number;
  resumeRating: number;
}

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  match: number;
  description: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { userData: authUserData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStats>({
    profileCompletion: 0,
    applicationsSent: 0,
    invitationsReceived: 0,
    resumeRating: 0
  });
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user data
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (!userSnapshot.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }
        
        const userData = userSnapshot.data() as UserData;
        setUserData(userData);
        
        // Calculate profile completion
        const requiredFields = [
          'firstName', 'lastName', 'email', 'phoneNumber', 'location',
          'bio', 'position', 'education', 'skills', 'experience'
        ];
        
        let filledFields = 0;
        let fieldWeights = {
          firstName: 5,
          lastName: 5,
          email: 5,
          phoneNumber: 5,
          location: 5,
          bio: 10,
          position: 5,
          education: 20,
          skills: 20,
          experience: 20
        };
        
        let totalWeight = 0;
        let completedWeight = 0;
        
        for (const [field, weight] of Object.entries(fieldWeights)) {
          totalWeight += weight;
          const value = userData[field as keyof UserData];
          
          if (value) {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                completedWeight += weight;
                filledFields++;
              }
            } else if (typeof value === 'string' && value.trim() !== '') {
              completedWeight += weight;
              filledFields++;
            } else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
              completedWeight += weight;
              filledFields++;
            }
          }
        }
        
        const profileCompletion = Math.floor((completedWeight / totalWeight) * 100);
        
        // Fetch applications stats with real data
        const applicationsRef = collection(db, 'applications');
        const sentQuery = query(
          applicationsRef, 
          where('userId', '==', user.uid)
        );
        
        const applicationsSnapshot = await getDocs(sentQuery);
        
        const applications = applicationsSnapshot.docs.map(doc => doc.data());
        const applicationsSent = applications.length;
        
        // Count invitations (status == 'invited' or similar)
        const invitationsReceived = applications.filter(app => 
          app.status === 'invited' || 
          app.status === 'interview' || 
          app.status === 'shortlisted'
        ).length;
        
        // Get resume rating from user data or calculate if available
        let resumeRating = 0;
        if (userData.resume?.analysis?.score) {
          resumeRating = Math.min(5, Math.round(userData.resume.analysis.score / 20)); // Convert 0-100 to 0-5
        } else if (userData.resume?.lastGenerated) {
          // If resume exists but no analysis, give partial rating
          resumeRating = 3;
        }
        
        setCareerStats({
          profileCompletion,
          applicationsSent,
          invitationsReceived,
          resumeRating
        });
        
        // Fetch recommended jobs with real matching algorithm
        const jobsRef = collection(db, 'jobs');
        // Get active jobs only - simplified query to avoid index requirements
        const jobsQuery = query(
          jobsRef, 
          where('status', '!=', 'expired'),
          limit(50)  // Get more to filter for best matches
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        
        // Extract user skills properly
        const userSkillNames = getUserSkillNames(userData);
        
        // Match jobs to user profile
        const matchedJobs = await matchJobsToUserProfile(jobsSnapshot.docs, userData, userSkillNames);
        
        // Sort by match and take top 3
        matchedJobs.sort((a, b) => b.match - a.match);
        setRecommendedJobs(matchedJobs.slice(0, 3));
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

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
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Что-то пошло не так</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0"
          >
            Привет, {userData?.firstName || userData?.displayName || 'друг'}!
          </motion.h1>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/jobs')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Найти вакансии
          </motion.button>
        </div>

        {/* Career Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Ваш карьерный прогресс
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              title="Профиль заполнен" 
              value={`${careerStats.profileCompletion}%`} 
              icon="profile"
              color="from-green-500 to-teal-500"
            />
            <Card 
              title="Отправлено заявок" 
              value={careerStats.applicationsSent} 
              icon="send"
              color="from-blue-500 to-indigo-500"
            />
            <Card 
              title="Приглашений" 
              value={careerStats.invitationsReceived} 
              icon="invite"
              color="from-purple-500 to-violet-500"
            />
            <Card 
              title="Рейтинг резюме" 
              value={`${careerStats.resumeRating}/5`} 
              icon="rating"
              color="from-amber-500 to-orange-500"
            />
          </div>
          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/profile/edit')}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center mx-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Обновить профиль
            </button>
          </div>
        </motion.div>

        {/* Recommended Jobs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Рекомендованные вакансии
          </h2>
          {recommendedJobs.length > 0 ? (
            <div className="space-y-4">
              {recommendedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="p-5 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-300 flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {job.company} • {job.location}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex items-start justify-between md:flex-col md:items-end">
                      <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getMatchColor(job.match)}`}>
                        {job.match}% соответствие
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
                  onClick={() => navigate('/jobs')}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                >
                  Посмотреть все вакансии →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет рекомендуемых вакансий
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Заполните свой профиль и добавьте навыки, чтобы мы могли рекомендовать вам подходящие вакансии
              </p>
              <button
                onClick={() => navigate('/jobs')}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Просмотреть доступные вакансии
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Helper function to determine color for match percentage
const getMatchColor = (match: number): string => {
  if (match >= 90) return 'bg-gradient-to-r from-green-500 to-teal-500';
  if (match >= 70) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  if (match >= 50) return 'bg-gradient-to-r from-purple-500 to-violet-500';
  return 'bg-gradient-to-r from-orange-500 to-red-500';
};

// Card component for career stats
interface CardProps { 
  title: string; 
  value: string | number;
  icon: 'profile' | 'send' | 'invite' | 'rating';
  color: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, color }) => {
  const getIcon = () => {
    switch (icon) {
      case 'profile':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'send':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'invite':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        );
      case 'rating':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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

// Функция для правильного извлечения навыков пользователя
const getUserSkillNames = (userData: UserData): string[] => {
  let skills: string[] = [];
  
  if (userData.skills) {
    if (Array.isArray(userData.skills)) {
      skills = userData.skills.map((skill: any) => {
        if (typeof skill === 'string') {
          return skill.toLowerCase();
        } else if (skill && typeof skill === 'object') {
          return (skill.name || '').toLowerCase();
        }
        return '';
      }).filter(Boolean);
    }
  }
  
  // Дополнительно извлекаем навыки из опыта работы
  if (userData.experience && Array.isArray(userData.experience)) {
    userData.experience.forEach((exp: any) => {
      if (exp.technologies && Array.isArray(exp.technologies)) {
        skills = [...skills, ...exp.technologies.map((tech: string) => tech.toLowerCase())];
      }
    });
  }
  
  // Дополнительно извлекаем навыки из проектов
  if (userData.projects && Array.isArray(userData.projects)) {
    userData.projects.forEach((project: any) => {
      if (project.technologies && Array.isArray(project.technologies)) {
        skills = [...skills, ...project.technologies.map((tech: string) => tech.toLowerCase())];
      }
    });
  }
  
  // Удаляем дубликаты
  return [...new Set(skills)];
};

// Функция для сопоставления вакансий с профилем пользователя
const matchJobsToUserProfile = async (
  jobDocs: any[], 
  userData: UserData, 
  userSkills: string[]
): Promise<RecommendedJob[]> => {
  const matchedJobs: RecommendedJob[] = [];
  
  // Основные данные пользователя для сопоставления
  const userLocation = (userData.location || '').toLowerCase();
  const userIndustry = userData.careerGoals?.preferredIndustries || [];
  const userWorkTypes = userData.workPreferences?.employmentTypes || [];
  
  for (const jobDoc of jobDocs) {
    const jobData = jobDoc.data();
    
    // Базовая информация о вакансии
    const job: RecommendedJob = {
      id: jobDoc.id,
      title: jobData.title || 'Unnamed Position',
      company: jobData.companyName || jobData.company || 'Company',
      location: jobData.location || 'Remote',
      match: 0,
      description: jobData.description || ''
    };
    
    // Извлекаем навыки из вакансии
    const jobSkills = [
      ...(jobData.skills || []), 
      ...(jobData.skillsRequired || [])
    ].map((s: string) => s.toLowerCase());
    
    // Извлекаем другие критерии из вакансии
    const jobLocation = (jobData.location || '').toLowerCase();
    const jobEmploymentType = (jobData.employmentType || '').toLowerCase();
    
    // Расчет соответствия по навыкам (60% от общего веса)
    let skillMatchScore = 0;
    if (userSkills.length > 0 && jobSkills.length > 0) {
      let matchingSkills = 0;
      
      for (const skill of userSkills) {
        if (jobSkills.some(jobSkill => 
          jobSkill.includes(skill) || skill.includes(jobSkill))) {
          matchingSkills++;
        }
      }
      
      skillMatchScore = Math.min(60, (matchingSkills / Math.max(1, jobSkills.length)) * 60);
    }
    
    // Соответствие по местоположению (20% от общего веса)
    let locationScore = 0;
    if (userLocation && jobLocation) {
      if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation)) {
        locationScore = 20;
      } else if (jobData.format === 'remote' || jobData.remote === true) {
        locationScore = 15; // Если удаленная работа, тоже хорошее соответствие
      }
    } else if (jobData.format === 'remote' || jobData.remote === true) {
      locationScore = 15;
    }
    
    // Соответствие по типу занятости (10% от общего веса)
    let employmentTypeScore = 0;
    if (userWorkTypes.length > 0 && jobEmploymentType) {
      const normalizedType = jobEmploymentType.toLowerCase();
      
      if (userWorkTypes.some((type: string) => normalizedType.includes(type.toLowerCase()))) {
        employmentTypeScore = 10;
      }
    } else {
      employmentTypeScore = 5; // Если нет предпочтений, даем небольшой балл
    }
    
    // Добавляем базовый скор для всех вакансий (10% от общего веса)
    const baseScore = 10;
    
    // Финальный скор соответствия
    job.match = Math.round(skillMatchScore + locationScore + employmentTypeScore + baseScore);
    
    // Если соответствие больше 30%, добавляем в результат
    if (job.match > 30) {
      matchedJobs.push(job);
    }
  }
  
  return matchedJobs;
};

export default Dashboard; 