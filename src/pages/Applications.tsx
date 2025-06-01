import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: any;
  chatRoomId: string;
  message?: string;
}

interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  status: string;
}

interface Applicant {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
  phoneNumber?: string;
  location?: string;
}

interface EnrichedApplication extends Application {
  job: Job;
  applicant: Applicant;
  timeSince: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  shortlisted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
};

const statusLabels = {
  pending: 'На рассмотрении',
  reviewing: 'Просматривается',
  shortlisted: 'В шортлисте',
  rejected: 'Отклонено',
  accepted: 'Принято'
};

// Helper function to format relative time
const getRelativeTime = (timestamp: any): string => {
  if (!timestamp) return 'Н/Д';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return new Intl.DateTimeFormat('ru-RU', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const Applications: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    jobId: '',
    status: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [jobs, setJobs] = useState<Job[]>([]);
  
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch employer's jobs
        const jobsRef = collection(db, 'posts');
        const jobsQuery = query(jobsRef, where('userId', '==', user.uid));
        const jobsSnapshot = await getDocs(jobsQuery);
        
        if (jobsSnapshot.empty) {
          setError('У вас нет опубликованных вакансий');
          setLoading(false);
          return;
        }
        
        const jobsList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        
        setJobs(jobsList);
        
        // Get all job IDs for query
        const jobIds = jobsList.map(job => job.id);
        
        // Fetch applications for all jobs
        const applicationsRef = collection(db, 'applications');
        const applicationsQuery = query(
          applicationsRef,
          where('jobId', 'in', jobIds),
          orderBy('appliedAt', 'desc')
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        if (applicationsSnapshot.empty) {
          setError('Пока нет заявок на ваши вакансии');
          setLoading(false);
          return;
        }
        
        // Map applications data
        const applicationsList = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Application[];
        
        // Fetch applicants data
        const applicantsPromises = applicationsList.map(async (app) => {
          const userDoc = await getDoc(doc(db, 'users', app.userId));
          
          if (!userDoc.exists()) {
            return { 
              id: app.userId,
              displayName: 'Неизвестный пользователь',
              email: 'Н/Д'
            };
          }
          
          const userData = userDoc.data();
          return {
            id: app.userId,
            displayName: userData.displayName || 'Без имени',
            photoURL: userData.photoURL,
            email: userData.email || 'Н/Д',
            phoneNumber: userData.phoneNumber,
            location: userData.location
          };
        });
        
        const applicants = await Promise.all(applicantsPromises);
        
        // Create enriched applications with job and applicant data
        const enrichedApplications = applicationsList.map(app => {
          const job = jobsList.find(j => j.id === app.jobId) || {
            id: app.jobId,
            title: 'Неизвестная вакансия',
            companyName: 'Н/Д',
            location: 'Н/Д',
            status: 'inactive'
          };
          
          const applicant = applicants.find(a => a.id === app.userId) || {
            id: app.userId,
            displayName: 'Неизвестный пользователь',
            email: 'Н/Д'
          };
          
          return {
            ...app,
            job,
            applicant,
            timeSince: getRelativeTime(app.appliedAt)
          };
        });
        
        setApplications(enrichedApplications);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Ошибка при загрузке заявок. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [user]);
  
  // Filter and sort applications
  const filteredApplications = applications.filter(app => {
    const matchesJob = !filter.jobId || app.jobId === filter.jobId;
    const matchesStatus = !filter.status || app.status === filter.status;
    const matchesSearch = !filter.search || 
                         app.applicant.displayName.toLowerCase().includes(filter.search.toLowerCase()) ||
                         app.message?.toLowerCase().includes(filter.search.toLowerCase());
    
    return matchesJob && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt);
    const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt);
    
    return sortBy === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });
  
  // Update application status
  const updateApplicationStatus = async (applicationId: string, newStatus: Application['status']) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status: newStatus
      });
      
      // Update local state
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Не удалось обновить статус заявки. Пожалуйста, попробуйте позже.');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-accent"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-300">Загрузка заявок...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Заявки на вакансии
          </h1>
          
          {error ? (
            <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-6 text-center">
              <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">{error}</div>
              <Link to="/employer/create-job" className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                Опубликовать вакансию
              </Link>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Вакансия
                    </label>
                    <select
                      value={filter.jobId}
                      onChange={e => setFilter({ ...filter, jobId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Все вакансии</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Статус
                    </label>
                    <select
                      value={filter.status}
                      onChange={e => setFilter({ ...filter, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Все статусы</option>
                      <option value="pending">На рассмотрении</option>
                      <option value="reviewing">Просматривается</option>
                      <option value="shortlisted">В шортлисте</option>
                      <option value="rejected">Отклонено</option>
                      <option value="accepted">Принято</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Сортировка
                    </label>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'newest' | 'oldest')}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="newest">Сначала новые</option>
                      <option value="oldest">Сначала старые</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Поиск
                    </label>
                    <input
                      type="text"
                      value={filter.search}
                      onChange={e => setFilter({ ...filter, search: e.target.value })}
                      placeholder="Искать по имени или сообщению"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Applications List */}
              <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {filteredApplications.length} {filteredApplications.length === 1 ? 'заявка' : 
                     filteredApplications.length >= 2 && filteredApplications.length <= 4 ? 'заявки' : 'заявок'}
                  </h2>
                </div>
                
                {filteredApplications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300">
                      Нет заявок, соответствующих выбранным фильтрам
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApplications.map(app => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                {app.applicant.photoURL ? (
                                  <img 
                                    src={app.applicant.photoURL} 
                                    alt={app.applicant.displayName} 
                                    className="h-full w-full object-cover" 
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                                    {app.applicant.displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <div className="text-lg font-medium text-gray-900 dark:text-white">
                                  {app.applicant.displayName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {app.applicant.email}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Вакансия: <span className="font-medium text-gray-900 dark:text-white">{app.job.title}</span>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Заявка отправлена: <span className="font-medium text-gray-900 dark:text-white">{app.timeSince}</span>
                              </div>
                            </div>
                            
                            {app.message && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Сопроводительное письмо:</div>
                                <div className="text-gray-800 dark:text-gray-200">{app.message}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end space-y-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                              {statusLabels[app.status]}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Link 
                                to={`/chat/${app.chatRoomId}`}
                                className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              >
                                Написать
                              </Link>
                              
                              <div className="relative">
                                <select
                                  value={app.status}
                                  onChange={(e) => updateApplicationStatus(app.id, e.target.value as Application['status'])}
                                  className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-sm font-medium appearance-none pr-8"
                                >
                                  <option value="pending">На рассмотрении</option>
                                  <option value="reviewing">Просматривается</option>
                                  <option value="shortlisted">В шортлисте</option>
                                  <option value="rejected">Отклонено</option>
                                  <option value="accepted">Принято</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Applications; 