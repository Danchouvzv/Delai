import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { triggerCandidateMatching } from '../api/aiRecruit';
import { motion, AnimatePresence } from 'framer-motion';
import FormSection from './FormSection';
import AnimatedInput from './AnimatedInput';
import AnimatedSelect from './AnimatedSelect';
import Sparkles from './Sparkles';

// Animation variants
const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: { 
      duration: 0.4, 
      ease: "easeIn" 
    } 
  }
};

// Define the form data interface
interface PostFormData {
  title: string;
  description: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  format: string;
  experienceLevel: string;
  salary: string;
  skills: string[];
  requirements: string[];
  benefits: string[];
  // AI Matching fields
  aiMatching: boolean;
  skillsRequired: string[];
  minExperience: number;
  otherCriteria: string;
}

const CreatePost = (): React.ReactElement => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postData, setPostData] = useState<PostFormData>({
    title: '',
    description: '',
    companyName: '',
    companyLogo: '',
    location: '',
    employmentType: '',
    format: '',
    experienceLevel: '',
    salary: '',
    skills: [],
    requirements: [],
    benefits: [],
    // Initialize AI Matching fields
    aiMatching: false,
    skillsRequired: [],
    minExperience: 0,
    otherCriteria: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [lastCreatedPostId, setLastCreatedPostId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Предопределенные опции для выбора
  const locationOptions = ['Алматы', 'Астана', 'Шымкент', 'Другой'];
  const employmentTypeOptions = ['Полная занятость', 'Частичная занятость', 'Проектная работа', 'Стажировка'];
  const formatOptions = ['Офис', 'Удаленно', 'Гибрид'];
  const experienceLevelOptions = ['Без опыта', 'Начальный уровень', 'Средний уровень', 'Продвинутый уровень'];
  
  // Universities in Kazakhstan
  const universityOptions = [
    'КазНУ им. аль-Фараби',
    'ЕНУ им. Л.Н. Гумилева',
    'КБТУ',
    'КИМЭП',
    'Назарбаев Университет',
    'AIU',
    'Satbayev University',
    'МУИТ',
    'SDU',
    'Другой'
  ];

  const handleInputChange = (field: keyof PostFormData, value: string | number | boolean) => {
    setPostData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: 'skills' | 'requirements' | 'benefits' | 'skillsRequired', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setPostData(prev => ({ ...prev, [field]: items }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Get user data to verify role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setError('User profile not found');
        return;
      }

      const userData = userDoc.data();
      if (!userData.role || !['employer', 'business'].includes(userData.role)) {
        setError('Only employers can create job posts');
        return;
      }

      // Validate required fields
      if (!postData.title || !postData.description || !postData.companyName || 
          !postData.location || !postData.employmentType || !postData.format || 
          !postData.experienceLevel || !postData.salary) {
        setError('Please fill in all required fields');
        return;
      }

      // Create post object
      const newPostData = {
        ...postData,
        authorId: user.uid,
        createdAt: new Date(),
        postedDate: new Date(),
        status: 'active',
        type: 'job',
        // Add company info from user profile
        companyName: userData.companyName || postData.companyName,
        companyLogo: userData.companyLogo || postData.companyLogo,
        // Add AI matching data if enabled
        aiMatching: postData.aiMatching,
        aiMatchingData: postData.aiMatching ? {
          skillsRequired: postData.skillsRequired,
          minExperience: postData.minExperience,
          otherCriteria: postData.otherCriteria
        } : null
      };

      console.log("Создаем новую вакансию с данными:", {
        title: newPostData.title,
        type: newPostData.type,
        authorId: newPostData.authorId,
        createdAt: newPostData.createdAt
      });

      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), newPostData);

      setLastCreatedPostId(docRef.id);
      console.log("Вакансия успешно создана с ID:", docRef.id, "Тип документа:", newPostData.type);

      // Trigger AI matching if enabled
      if (postData.aiMatching) {
        await triggerCandidateMatching(docRef.id);
      }

      // Show success message
      setSuccess(true);
      setError(null);
      
      // Reset form
      setPostData({
        title: '',
        description: '',
        companyName: '',
        companyLogo: '',
        location: '',
        employmentType: '',
        format: '',
        experienceLevel: '',
        salary: '',
        skills: [],
        requirements: [],
        benefits: [],
        aiMatching: false,
        skillsRequired: [],
        minExperience: 0,
        otherCriteria: ''
      });

      // Navigate to jobs page after delay
      setTimeout(() => {
        navigate('/jobs');
      }, 5000);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred while creating the post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-orange-400 mb-4">Доступ ограничен</h2>
          <p className="text-gray-300 mb-6">Для создания вакансии необходимо авторизоваться.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-300"
          >
            Войти
          </motion.button>
        </div>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="mb-8 flex justify-center">
      {[...Array(totalSteps)].map((_, i) => (
        <div key={i} className="flex items-center">
          <motion.div 
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              i + 1 === currentStep 
                ? 'border-blue-500 bg-blue-500 text-white' 
                : i + 1 < currentStep 
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-600 bg-gray-800 text-gray-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => i + 1 < currentStep && setCurrentStep(i + 1)}
          >
            {i + 1 < currentStep ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </motion.div>
          {i < totalSteps - 1 && (
            <div className={`w-16 h-1 ${
              i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-600'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <FormSection 
              title="Основная информация" 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <AnimatedInput 
                label="Название вакансии"
                value={postData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Frontend Developer"
                required
              />
              
              <AnimatedInput 
                label="Название компании"
                value={postData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="JumysAL"
                required
              />
              
              <AnimatedInput 
                label="Ссылка на логотип компании"
                value={postData.companyLogo || ''}
                onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              
              <AnimatedInput 
                label="Описание"
                value={postData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Подробное описание вакансии..."
                multiline
                rows={5}
                required
              />
            </FormSection>
            
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg flex items-center"
              >
                Далее
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            key="step2"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <FormSection 
              title="Условия работы" 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatedSelect
                  label="Местоположение"
                  value={postData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  options={locationOptions}
                  placeholder="Выберите город"
                  required
                />
                
                <AnimatedSelect
                  label="Тип занятости"
                  value={postData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  options={employmentTypeOptions}
                  placeholder="Выберите тип занятости"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatedSelect
                  label="Формат работы"
                  value={postData.format}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  options={formatOptions}
                  placeholder="Выберите формат"
                  required
                />
                
                <AnimatedSelect
                  label="Уровень опыта"
                  value={postData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  options={experienceLevelOptions}
                  placeholder="Выберите уровень"
                />
              </div>
              
              <AnimatedInput
                label="Зарплата"
                value={postData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                placeholder="20 000 - 80 000 ₸"
              />
            </FormSection>
            
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Назад
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg flex items-center"
              >
                Далее
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            key="step3"
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <FormSection 
              title="Требования и преимущества" 
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            >
              <AnimatedInput
                label="Требуемые навыки (через запятую)"
                value={postData.skills?.join(', ') || ''}
                onChange={(e) => handleArrayInput('skills', e.target.value)}
                placeholder="React, TypeScript, CSS"
              />
              
              <AnimatedInput
                label="Требования (через запятую)"
                value={postData.requirements?.join(', ') || ''}
                onChange={(e) => handleArrayInput('requirements', e.target.value)}
                placeholder="Ответственность, Пунктуальность, Знание английского"
              />
              
              <AnimatedInput
                label="Преимущества (через запятую)"
                value={postData.benefits?.join(', ') || ''}
                onChange={(e) => handleArrayInput('benefits', e.target.value)}
                placeholder="Гибкий график, Наставник, Сертификат"
              />
              
              <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-800/40">
                <div className="flex items-center mb-4">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="mr-2"
                  >
                    <input
                      type="checkbox"
                      id="forSchoolStudents"
                      checked={postData.aiMatching || false}
                      onChange={(e) => handleInputChange('aiMatching', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  </motion.div>
                  <label htmlFor="forSchoolStudents" className="text-sm font-medium text-blue-300 flex items-center">
                    Включить AI-подбор кандидатов
                    <motion.div 
                      whileHover={{ rotate: 15 }}
                      transition={{ duration: 0.3 }}
                      className="ml-2"
                    >
                      🤖
                    </motion.div>
                  </label>
                </div>
                
                <AnimatePresence>
                  {postData.aiMatching && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <p className="text-blue-300 text-sm">
                        AI автоматически подберет наиболее подходящих кандидатов по указанным критериям
                      </p>
                      
                      <AnimatedInput
                        label="Обязательные навыки (через запятую)"
                        value={postData.skillsRequired.join(', ')}
                        onChange={(e) => handleArrayInput('skillsRequired', e.target.value)}
                        placeholder="React, Redux, TypeScript"
                      />
                      
                      <AnimatedSelect
                        label="Минимальный уровень знаний"
                        value={postData.minExperience.toString()}
                        onChange={(e) => handleInputChange('minExperience', parseInt(e.target.value) || 0)}
                        options={["0", "1", "2"]}
                        placeholder="Выберите уровень"
                      />
                      
                      <AnimatedInput
                        label="Дополнительные критерии"
                        value={postData.otherCriteria}
                        onChange={(e) => handleInputChange('otherCriteria', e.target.value)}
                        placeholder="Укажите любые дополнительные требования или предпочтения для AI-подбора"
                        multiline
                        rows={3}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FormSection>
            
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-lg flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Назад
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg flex items-center disabled:opacity-50"
              >
                {isSubmitting ? 'Публикация...' : 'Опубликовать вакансию'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-black text-gray-800 dark:text-white px-4 py-12 pt-32">
      <Sparkles />
      
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-4">
            Создание вакансии
          </h2>
          <p className="text-xl text-center text-blue-700 dark:text-blue-200 mb-8">
            Помогите школьникам сделать первые карьерные шаги
          </p>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "40%" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-8 rounded-full shadow-md"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {success && (
            <motion.div 
              className="mb-8 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 text-green-800 dark:text-white p-6 rounded-lg shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: 0.2
                  }}
                  className="bg-green-500 rounded-full p-2 mr-4 shadow-lg"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">Вакансия успешно создана!</h3>
                  <p className="text-green-600 dark:text-green-300">
                    Вы будете перенаправлены на страницу вакансий через несколько секунд.
                  </p>
                </div>
              </div>
              
              <div className="bg-green-100/70 dark:bg-green-800/30 rounded-lg p-4 mb-4 backdrop-blur-sm">
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">ID вакансии:</p>
                <p className="font-mono bg-green-200/50 dark:bg-green-800/50 p-2 rounded text-green-800 dark:text-green-200">{lastCreatedPostId}</p>
              </div>
              
              <div className="flex justify-center">
                <motion.button 
                  onClick={() => navigate('/jobs')} 
                  className="bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow-md flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Перейти к вакансиям
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              className="mb-8 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-700 dark:text-white p-4 rounded-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-500 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 dark:text-red-200">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {renderStepIndicator()}
            <form onSubmit={(e) => { e.preventDefault(); if (currentStep === totalSteps) handleSubmit(e); }}>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost; 