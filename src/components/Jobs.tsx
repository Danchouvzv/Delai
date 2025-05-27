import React, { useState, useEffect, useCallback, Component, ErrorInfo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, Firestore, limit, updateDoc, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import CreateChat from './CreateChat';
import { motion } from 'framer-motion';

// Custom icon components to replace MUI dependency
const BookmarkIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
  </svg>
);

const BookmarkBorderIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
  </svg>
);

const LocationOnIcon = () => (
  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

// Demo employer ID that will be used for all demo jobs
const DEMO_EMPLOYER_ID = 'demo-employer-official';

// Function to ensure demo employer exists in Firebase
const ensureDemoEmployerExists = async () => {
  try {
    const demoEmployerRef = doc(db, 'users', DEMO_EMPLOYER_ID);
    const demoEmployerDoc = await getDoc(demoEmployerRef);
    
    if (!demoEmployerDoc.exists()) {
      console.log("Creating demo employer account");
      await setDoc(demoEmployerRef, {
        displayName: "Demo Employer",
        email: "demo@jumys.al",
        photoURL: "/images/default-avatar.jpg",
        role: "employer",
        createdAt: new Date(),
        isVerified: true
      });
      console.log("Demo employer created successfully");
    } else {
      console.log("Demo employer already exists");
    }
    
    return DEMO_EMPLOYER_ID;
  } catch (error) {
    console.error("Error ensuring demo employer exists:", error);
    return null;
  }
};

// Simple hardcoded demo data to ensure we always have something to display
const DEMO_JOBS = [
  {
    id: 'demo-job-1',
    title: 'Frontend Developer',
    description: 'We are looking for a frontend developer with React experience',
    companyName: 'TechCorp',
    location: 'Алматы',
    employmentType: 'Полная занятость',
    experience: '1-3 года',
    salary: '150,000 - 300,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-2',
    title: 'Backend Developer',
    description: 'Required Node.js developer with experience in building RESTful APIs',
    companyName: 'Digital Solutions',
    location: 'Астана',
    employmentType: 'Полная занятость',
    experience: '2-5 лет',
    salary: '200,000 - 350,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-3',
    title: 'UX/UI Designer',
    description: 'Creative designer to work on our mobile application',
    companyName: 'CreativeMinds',
    location: 'Удаленно',
    employmentType: 'Частичная занятость',
    experience: '1-3 года',
    salary: '180,000 - 250,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-4',
    title: 'DevOps Engineer',
    description: 'Setting up and maintaining CI/CD pipelines for our products',
    companyName: 'CloudTech',
    location: 'Алматы',
    employmentType: 'Полная занятость',
    experience: '3-5 лет',
    salary: '300,000 - 450,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  },
  {
    id: 'demo-job-5',
    title: 'Product Manager',
    description: 'Lead the development of our new fintech product',
    companyName: 'FinInnovate',
    location: 'Астана',
    employmentType: 'Полная занятость',
    experience: '5+ лет',
    salary: '400,000 - 600,000 ₸',
    createdAt: new Date(),
    type: 'job',
    userId: DEMO_EMPLOYER_ID
  }
];

// Simple failsafe fallback component
const JobFallback = () => (
  <div className="relative min-h-screen bg-gray-50 dark:bg-dark overflow-hidden pt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-card p-6 text-center">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Не удалось загрузить вакансии
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Произошла ошибка при загрузке данных. Пожалуйста, перезагрузите страницу или попробуйте позже.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Перезагрузить страницу
        </button>
      </div>
    </div>
  </div>
);

// Error boundary to catch runtime errors
class JobsErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, errorMessage: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Можно добавить логирование ошибок на сервер здесь
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">Произошла ошибка</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Не удалось загрузить страницу вакансий.
            </p>
            {this.state.errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg mb-4 text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Детали ошибки:</p>
                <p className="mt-1">{this.state.errorMessage}</p>
              </div>
            )}
            <div className="flex justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple function to check Firebase connectivity
const checkFirebaseConnection = async () => {
  console.log("Checking Firebase connection...");
  try {
    // Try to access a small collection or document that should always exist
    const testQuery = query(collection(db, "posts"), limit(1));
    console.log("Created test query for posts collection");
    
    try {
      const querySnapshot = await getDocs(testQuery);
      console.log("Firebase connection check result:", { 
        connected: true, 
        docs: querySnapshot.size,
        empty: querySnapshot.empty
      });
      return true;
    } catch (queryError) {
      console.error("Firebase query execution failed:", queryError);
      return false;
    }
  } catch (error) {
    console.error("Firebase connection check failed with error:", error);
    // Try to provide more specific error information
    if (error instanceof Error) {
      console.error("Error name:", error.name, "Error message:", error.message);
    }
    return false;
  }
};

// At the very beginning of the file, right after the imports
console.log("📂 Jobs.tsx module loading");

// Add this function to create an absolute minimal component
const createMinimalJobsList = () => {
  console.log("Creating minimal jobs fallback");
  return (
    <div className="p-4 m-4 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl mb-4">Вакансии</h1>
      <p className="text-lg mb-4">Демо-данные для отладки:</p>
      <ul className="list-disc pl-5">
        {DEMO_JOBS.map(job => (
          <li key={job.id} className="mb-2">
            <strong>{job.title}</strong> - {job.companyName} ({job.location})
          </li>
        ))}
      </ul>
      <p className="mt-4 text-red-500">Страница отображается в аварийном режиме</p>
    </div>
  );
};

// Fallback function to fetch jobs directly using Firebase REST API
const fetchJobsDirectly = async (): Promise<Post[] | null> => {
  try {
    console.log("Attempting to fetch jobs via direct REST API call...");
    const projectId = "jumysal-a5ce4"; // Your Firebase project ID
    const apiKey = "AIzaSyBFrDVlsCR8dDChhNr1bly5qvxC-tnzEhU"; // Your Firebase API key
    
    // Construct the Firebase REST API URL for querying the collection
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts?key=${apiKey}`;
    
    console.log("Sending REST API request to Firebase...");
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Firebase REST API request failed:", response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log("Firebase REST API response received:", data);
    
    if (!data.documents || !data.documents.length) {
      console.log("No documents found in REST API response");
      return null;
    }
    
    // Transform Firestore REST API response format to our Post format
    const jobs = data.documents
      .map((doc: any) => {
        // Extract the document ID from the name path
        const id = doc.name.split('/').pop();
        
        // Extract fields and convert from Firestore value format
        const fields: any = {};
        Object.entries(doc.fields || {}).forEach(([key, value]: [string, any]) => {
          // Handle different Firestore value types
          if (value.stringValue !== undefined) fields[key] = value.stringValue;
          else if (value.booleanValue !== undefined) fields[key] = value.booleanValue;
          else if (value.integerValue !== undefined) fields[key] = parseInt(value.integerValue);
          else if (value.doubleValue !== undefined) fields[key] = value.doubleValue;
          else if (value.timestampValue !== undefined) fields[key] = new Date(value.timestampValue);
          else if (value.arrayValue !== undefined) {
            fields[key] = value.arrayValue.values?.map((v: any) => {
              return v.stringValue || v.integerValue || v.booleanValue || v.doubleValue;
            }) || [];
          }
          // Add more type handling as needed
        });
        
        return { id, ...fields } as Post;
      })
      .filter((post: any) => post.type === 'job'); // Filter to only include job posts
    
    console.log("Successfully parsed jobs from REST API:", jobs.length);
    return jobs.length > 0 ? jobs : null;
  } catch (error) {
    console.error("Error in direct jobs fetch:", error);
    return null;
  }
};

// Функция для преобразования типа
const ensurePostType = (post: any): Post => {
  return {
    id: post.id,
    title: post.title || 'Без названия',
    description: post.description || '',
    companyName: post.companyName || 'Неизвестная компания',
    location: post.location || 'Не указано',
    employmentType: post.employmentType || post.employment || 'Не указано',
    experience: post.experience || post.experienceLevel || 'Не указано',
    salary: post.salary || 'Не указано',
    createdAt: post.createdAt || new Date(),
    type: post.type || 'job', // Default to job type
    userId: post.authorId || post.userId || DEMO_EMPLOYER_ID, // Ensure userId is set
    ...post // Preserve all other properties
  };
};

// Update the Job component design and layout
const Job = ({
  job,
  isSaved,
  onSave,
  onApply,
  onContact
}: {
  job: Post;
  isSaved: boolean;
  onSave: (job: Post) => void;
  onApply: (job: Post) => void;
  onContact: (job: Post) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <Link 
              to={`/jobs/${job.id}`} 
              className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {job.title}
            </Link>
          </div>
          <button
            onClick={() => onSave(job)}
            className={`ml-2 p-2 rounded-full transition-colors ${
              isSaved 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={isSaved ? "Удалить из сохраненных" : "Сохранить вакансию"}
          >
            {isSaved ? (
              <BookmarkIcon />
            ) : (
              <BookmarkBorderIcon />
            )}
          </button>
        </div>
        
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full mr-3 overflow-hidden flex-shrink-0">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={`${job.companyName} logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 dark:text-blue-300 font-bold">
                {(job.companyName || 'C').charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{job.companyName || 'Компания'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <LocationOnIcon />
              {job.location}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 rounded-full">
            {job.employmentType}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
            {job.experience || 'Опыт не указан'}
          </span>
          {job.salary && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">
              {job.salary}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {job.description}
        </p>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
          <Link 
            to={`/jobs/${job.id}`} 
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Подробнее
          </Link>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onContact(job)}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Связаться
            </button>
            <button
              onClick={() => onApply(job)}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Откликнуться
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Create a modern filter component
const FilterSection = ({ filter, setFilter, locations, employmentTypes, experienceLevels, onApplyFilters }: {
  filter: {
    search?: string;
    location: string;
    employmentType: string;
    experience: string;
  },
  setFilter: (filter: {
    search?: string;
    location: string;
    employmentType: string;
    experience: string;
  }) => void,
  locations: string[],
  employmentTypes: string[],
  experienceLevels: string[],
  onApplyFilters: () => void
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 mb-6"
    >
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary dark:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Фильтры поиска
        </h3>
        <input
          type="text"
          placeholder="Поиск по должности или компании..."
          value={filter.search || ''}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Локация</label>
          <select
            value={filter.location || ''}
            onChange={e => setFilter({ ...filter, location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Все локации</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип занятости</label>
          <select
            value={filter.employmentType || ''}
            onChange={e => setFilter({ ...filter, employmentType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Все типы</option>
            {employmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Опыт</label>
          <select
            value={filter.experience || ''}
            onChange={e => setFilter({ ...filter, experience: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">Любой опыт</option>
            {experienceLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => setFilter({ search: '', location: '', employmentType: '', experience: '' })}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg mr-2 text-sm transition-colors"
        >
          Сбросить
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onApplyFilters}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark shadow-sm transition-colors"
        >
          Применить фильтры
        </motion.button>
      </div>
    </motion.div>
  );
};

const Jobs: React.FC = () => {
  // Удаляем console.log
  
  // Error safety mechanism to catch all rendering errors
  const [hasFatalError, setHasFatalError] = useState(false);
  
  // If something catastrophic happens during rendering
  if (hasFatalError) {
    return <JobFallback />;
  }
  
  try {
    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [jobs, setJobs] = useState<Post[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Post[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<{
      search?: string;
      location: string;
      employmentType: string;
      experience: string;
    }>({
      search: '',
      location: '',
      employmentType: '',
      experience: ''
    });
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const { user } = useAuth();
    const navigate = useNavigate();

    // Add these at the appropriate location in the Jobs component
    const [showContactModal, setShowContactModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Post | null>(null);

    // Функция для принудительного обновления
    const forceUpdate = useCallback(() => {
      console.log("Forcing update of Jobs component");
      setLastUpdate(new Date());
      fetchJobs();
    }, []);

    // Упрощаем функцию fetchJobs
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
        try {
          const jobsCollection = collection(db, 'posts');
          const q = query(jobsCollection, orderBy('createdAt', 'desc'));
          
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
          setJobs([]);
          setFilteredJobs([]);
          setError("В данный момент нет активных вакансий.");
            } else {
          const allPosts = querySnapshot.docs.map(doc => ({
                  id: doc.id, 
            ...doc.data()
          }));
          
          // Фильтруем посты, чтобы получить только вакансии
              const jobsData = allPosts.filter(post => {
            const postType = (post as any).type;
                return postType === 'job' || postType === undefined || postType === null;
          }).map(post => ensurePostType(post));
              
                setJobs(jobsData as Post[]);
                setFilteredJobs(jobsData as Post[]);
        }
        
        // Get saved jobs if user is logged in
        if (user) {
            const savedJobsQuery = query(
              collection(db, 'savedPosts'),
              where('userId', '==', user.uid)
            );
            
            const savedJobsSnapshot = await getDocs(savedJobsQuery);
            const savedIds = savedJobsSnapshot.docs.map(doc => doc.data().postId);
            setSavedJobIds(savedIds);
        }
      } catch (err) {
        setError("Произошла ошибка при загрузке вакансий. Пожалуйста, попробуйте позже.");
      } finally {
        setLoading(false);
      }
    };
    
    // Manual retry function
    const handleRetryFetch = () => {
      console.log("Manual retry of job fetching initiated by user");
      forceUpdate();
    };

    // Fetch jobs on component mount and when URL params change
    useEffect(() => {
      console.log("Jobs useEffect triggered, lastUpdate:", lastUpdate);
      fetchJobs();
      
      // Add event listener for page visibility to refresh when user returns to the page
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log("Page became visible, refreshing jobs...");
          fetchJobs();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up event listener
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [user, lastUpdate]);

    // Apply filters when search or filter changes
    useEffect(() => {
      console.log("Applying filters to jobs:", jobs?.length);
      if (!jobs || jobs.length === 0) {
        console.log("No jobs to filter, using demo data");
        setJobs(DEMO_JOBS as unknown as Post[]);
        setFilteredJobs(DEMO_JOBS as unknown as Post[]);
        return;
      }
      
      try {
        const filtered = jobs.filter(job => {
          // Handle potential undefined properties safely
          const jobTitle = job?.title?.toLowerCase?.() || '';
          const jobCompany = job?.companyName?.toLowerCase?.() || '';
          const searchTerm = search.toLowerCase();
          
          const matchSearch = !search || jobTitle.includes(searchTerm) || jobCompany.includes(searchTerm);
          const matchLocation = !filter.location || job?.location === filter.location;
          const matchType = !filter.employmentType || job?.employmentType === filter.employmentType;
          const matchExperience = !filter.experience || 
                                job?.experience === filter.experience;

          return matchSearch && matchLocation && matchType && matchExperience;
        });

        setFilteredJobs(filtered);
      } catch (err) {
        console.error("Error applying filters:", err);
        // On error, show all jobs
        setFilteredJobs(jobs);
      }
    }, [search, filter, jobs]);

    // Save/Unsave job functionality
    const toggleSaveJob = async (jobId: string) => {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      
      try {
        const savedJobRef = doc(db, 'savedPosts', `${user.uid}_${jobId}`);
        const savedJobDoc = await getDoc(savedJobRef);
        
        if (savedJobDoc.exists()) {
          await deleteDoc(savedJobRef);
          setSavedJobIds(prev => prev.filter(id => id !== jobId));
        } else {
          await setDoc(savedJobRef, {
            userId: user.uid,
            postId: jobId,
            savedAt: new Date()
          });
          setSavedJobIds(prev => [...prev, jobId]);
        }
      } catch (error) {
        console.error('Error toggling saved job:', error);
        setError('Unable to save job. Please try again.');
      }
    };

    // Handle contact employer action
    const handleContactEmployer = (job: Post) => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setSelectedJob(job);
      setShowContactModal(true);
    };

    // Add these functions within the Jobs component
    const handleSaveJob = (job: Post) => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (savedJobIds.includes(job.id)) {
        setSavedJobIds(savedJobIds.filter(id => id !== job.id));
      } else {
        setSavedJobIds([...savedJobIds, job.id]);
      }
    };
    
    const handleApplyForJob = (job: Post) => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setSelectedJob(job);
      setShowChatModal(true);
    };

    // The main render
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-12">
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
        <div className="absolute top-40 right-[10%] w-64 h-64 bg-purple-300/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-[5%] w-64 h-64 bg-blue-300/10 rounded-full filter blur-3xl animate-pulse"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-block mb-4 p-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm rounded-full">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
          </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Найдите свою идеальную работу
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Просматривайте последние вакансии от ведущих компаний и фильтруйте их согласно вашим предпочтениям
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <FilterSection 
                  filter={filter}
                  setFilter={setFilter}
                  locations={Array.from(new Set(jobs?.map(job => job.location) || []))}
                  employmentTypes={Array.from(new Set(jobs?.map(job => job.employmentType) || []))}
                  experienceLevels={Array.from(new Set(jobs?.map(job => job.experience || job.experienceLevel || '')
                    .filter(Boolean)))
                  }
                  onApplyFilters={() => {
                    console.log("Applying filters:", filter);
                    // The actual filtering happens in the useEffect
                  }}
                />
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white shadow-xl relative overflow-hidden"
                >
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full"></div>
                  
                  <h3 className="text-lg font-bold mb-4 relative">Не нашли подходящую вакансию?</h3>
                  <p className="text-white/90 text-sm mb-4 relative">
                    Загрузите свое резюме, и мы поможем вам найти идеальную работу.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium shadow-lg relative"
                  >
                    Загрузить резюме
                  </motion.button>
                </motion.div>
                </div>
              </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="loader">
                    <div className="relative w-24 h-24">
                      <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                      <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-primary dark:border-t-accent animate-spin"></div>
                          </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Загрузка вакансий...</p>
                        </div>
                </div>
              ) : error ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                          <button
                    onClick={handleRetryFetch}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Попробовать снова
                  </button>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Вакансии не найдены</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    К сожалению, по вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или сбросить фильтры.
                  </p>
                  <button
                    onClick={() => setFilter({ search: '', location: '', employmentType: '', experience: '' })}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Сбросить фильтры
                          </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Найдено {filteredJobs.length} вакансий
                    </h2>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Сортировать по:</span>
                      <select
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        onChange={(e) => {
                          // Here we would implement sorting logic
                          console.log("Sort by:", e.target.value);
                        }}
                      >
                        <option value="newest">Новые</option>
                        <option value="relevance">По релевантности</option>
                        <option value="salaryDesc">Зарплата (выс-низ)</option>
                        <option value="salaryAsc">Зарплата (низ-выс)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    {filteredJobs.map((job) => (
                      <Job 
                        key={job.id} 
                        job={job} 
                        isSaved={savedJobIds.includes(job.id)}
                        onSave={handleSaveJob}
                        onApply={handleApplyForJob}
                        onContact={handleContactEmployer}
                      />
                    ))}
                  </div>
                </>
                          )}
                        </div>
                      </div>
                    </div>
        
        {showContactModal && selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Связаться с {selectedJob.companyName}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Вы собираетесь откликнуться на вакансию "{selectedJob.title}". 
                Вы хотите отправить сообщение работодателю?
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Отмена
                </button>
                      <button
                        onClick={() => {
                    setShowContactModal(false);
                    setShowChatModal(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Отправить сообщение
                      </button>
                    </div>
            </motion.div>
                  </div>
                )}
        
        {showChatModal && selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Отправить сообщение</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Вакансия: {selectedJob.title}
                </p>
              </div>
              
              <CreateChat 
                recipientId={selectedJob.userId || ''}
              />
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setShowChatModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Закрыть
                </button>
            </div>
            </motion.div>
          </div>
        )}
        
        {/* Contact and Application Modals */}
        <ContactEmployerModal 
          isOpen={showContactModal} 
          onClose={() => setShowContactModal(false)} 
          job={selectedJob} 
        />
        <CreateChatModal 
          isOpen={showChatModal} 
          onClose={() => setShowChatModal(false)} 
          job={selectedJob} 
        />
      </div>
    );
  } catch (error) {
    console.error("Fatal error in Jobs component:", error);
    return <JobFallback />;
  }
};

// At the bottom of the file, modify the export
export default function JobsWithErrorBoundary() {
  console.log("JobsWithErrorBoundary rendering");
  
  // Absolute fallback in case the ErrorBoundary itself fails
  try {
    return (
      <JobsErrorBoundary>
        <Jobs />
      </JobsErrorBoundary>
    );
  } catch (criticalError) {
    console.error("Critical error in Jobs error boundary:", criticalError);
    // Return an absolute minimal component
    return createMinimalJobsList();
  }
};

// Add these components below the Jobs component

const ContactEmployerModal = ({ 
  isOpen, 
  onClose, 
  job 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  job: Post | null;
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleSend = () => {
    if (!message.trim() || !job) return;
    
    setSending(true);
    // Simulate sending - replace with actual API call
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        onClose();
        setMessage('');
        setSent(false);
      }, 1500);
    }, 1000);
  };
  
  if (!isOpen || !job) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Связаться с работодателем</h3>
        <p className="mb-2 text-gray-700 dark:text-gray-300">Вакансия: {job.title}</p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">Компания: {job.companyName}</p>
        
        {sent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 mb-4 p-3 bg-green-50 dark:bg-green-900 dark:text-green-300 rounded-md"
          >
            Сообщение успешно отправлено!
          </motion.div>
        ) : (
          <textarea
            className="w-full p-3 mb-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={4}
            placeholder="Введите ваше сообщение для работодателя..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={onClose}
            disabled={sending}
          >
            Отмена
          </button>
          {!sent && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const CreateChatModal = ({ 
  isOpen, 
  onClose, 
  job 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  job: Post | null;
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleSend = () => {
    if (!message.trim() || !job) return;
    
    setSending(true);
    // Simulate sending - replace with actual API call
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        onClose();
        setMessage('');
        setSent(false);
      }, 1500);
    }, 1000);
  };
  
  if (!isOpen || !job) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Откликнуться на вакансию</h3>
        <p className="mb-2 text-gray-700 dark:text-gray-300">Вакансия: {job.title}</p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">Компания: {job.companyName}</p>
        
        {sent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 mb-4 p-3 bg-green-50 dark:bg-green-900 dark:text-green-300 rounded-md"
          >
            Отклик успешно отправлен! Работодатель свяжется с вами в ближайшее время.
          </motion.div>
        ) : (
          <textarea
            className="w-full p-3 mb-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={4}
            placeholder="Почему вы подходите на эту должность? (Сопроводительное письмо)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={onClose}
            disabled={sending}
          >
            Отмена
          </button>
          {!sent && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? 'Отправка...' : 'Отправить отклик'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}; 