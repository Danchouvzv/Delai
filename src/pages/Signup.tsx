import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useUserContext } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiAlertCircle, FiCheckCircle, FiBriefcase } from 'react-icons/fi';
type UserRole = 'jobseeker' | 'employer';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('jobseeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // Мультиэтапная регистрация
  const navigate = useNavigate();
  const { user } = useUserContext();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Пожалуйста, введите ваше имя');
      return false;
    }
    if (!email.trim()) {
      setError('Пожалуйста, введите ваш email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Пожалуйста, введите корректный email');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (step === 3) {
      try {
        setError('');
    setLoading(true);

        // Регистрация пользователя
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

        // Обновление профиля с именем
      await updateProfile(user, {
        displayName: name
      });

        // Сохранение дополнительных данных в Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role,
        createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          profileCompleted: false
        });
        
        navigate('/dashboard');
      } catch (err: any) {
        let errorMessage = 'Не удалось зарегистрироваться';
        
        if (err.code === 'auth/email-already-in-use') {
          errorMessage = 'Этот email уже используется другим аккаунтом';
        } else if (err.code === 'auth/invalid-email') {
          errorMessage = 'Неверный формат email';
        } else if (err.code === 'auth/weak-password') {
          errorMessage = 'Слишком слабый пароль';
        }
        
        setError(errorMessage);
    } finally {
      setLoading(false);
    }
    } else {
      nextStep();
    }
  };

  // Варианты анимации для контейнера формы
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  // Варианты анимации для элементов формы
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Варианты анимации для кнопки
  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  };

  // Анимированные фоновые элементы
  const bubbles = Array.from({ length: 6 }).map((_, i) => (
    <motion.div
      key={i}
      className={`absolute rounded-full bg-primary-${100 + i * 100} bg-opacity-${10 + i * 5} 
                  w-${20 + i * 10} h-${20 + i * 10} z-0`}
      initial={{ 
        x: Math.random() * 100 - 50, 
        y: Math.random() * 100 - 50, 
        opacity: 0.1 + Math.random() * 0.3 
      }}
      animate={{ 
        x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
        y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
        opacity: [0.1 + Math.random() * 0.3, 0.2 + Math.random() * 0.3]
      }}
      transition={{ 
        duration: 15 + Math.random() * 10, 
        repeat: Infinity, 
        repeatType: 'reverse' 
      }}
    />
  ));

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-white to-blue-50 dark:from-dark-900 dark:to-dark-800 p-4 relative overflow-hidden">
      {/* Декоративные фоновые элементы */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {bubbles}
        <div className="absolute top-0 left-0 w-full h-full bg-mesh-pattern opacity-20 z-0" />
      </div>
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative z-10"
      >
        {/* Логотип */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center mb-6"
        >
          <Link to="/" className="text-3xl font-bold text-primary-500 dark:text-primary-400">
            JumysAl
          </Link>
        </motion.div>
        
        {/* Заголовок и описание */}
        <motion.div 
          variants={itemVariants}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Создайте аккаунт
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Начните свой путь к новым карьерным возможностям
          </p>
        </motion.div>
        
        {/* Индикатор прогресса */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-6 px-2"
        >
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 
                            ${step >= stepNumber 
                              ? 'bg-primary-500 text-white' 
                              : 'bg-gray-200 text-gray-500 dark:bg-dark-border dark:text-gray-400'}`}
              >
                {step > stepNumber ? (
                  <FiCheckCircle size={16} />
                ) : (
                  stepNumber
                )}
              </div>
              <div 
                className={`text-xs mt-1 font-medium transition-colors duration-300
                            ${step >= stepNumber 
                              ? 'text-primary-500 dark:text-primary-400' 
                              : 'text-gray-500 dark:text-gray-400'}`}
              >
                {stepNumber === 1 && 'Личные данные'}
                {stepNumber === 2 && 'Пароль'}
                {stepNumber === 3 && 'Роль'}
              </div>
            </div>
          ))}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-dark-border -z-10">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${(step - 1) * 50}%` }}
            />
          </div>
        </motion.div>
        
        {/* Форма регистрации */}
        <motion.form 
          variants={itemVariants}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-dark-800 rounded-xl shadow-lg dark:shadow-chat-dark p-6 md:p-8"
        >
          {/* Сообщение об ошибке */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400 rounded-md flex items-center"
              >
                <FiAlertCircle className="mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            {/* Шаг 1: Личные данные */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Имя и фамилия
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
              </div>
              <input
                      type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-lighter dark:text-white dark:placeholder-gray-400"
                      placeholder="Иван Иванов"
                required
              />
            </div>
          </div>
          
                <div className="mb-6">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" />
              </div>
              <input
                      type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-lighter dark:text-white dark:placeholder-gray-400"
                      placeholder="your@email.com"
                required
              />
            </div>
          </div>
              </motion.div>
            )}
            
            {/* Шаг 2: Пароль */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Пароль
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
              </div>
              <input
                      type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-lighter dark:text-white dark:placeholder-gray-400"
                      placeholder="Минимум 6 символов"
                required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
            </div>
          </div>
          
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Подтвердите пароль
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-lighter dark:text-white dark:placeholder-gray-400"
                      placeholder="Повторите пароль"
                      required
                    />
                  </div>
              </div>
              </motion.div>
            )}
            
            {/* Шаг 3: Роль */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Выберите тип аккаунта
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                                ${role === 'jobseeker' 
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' 
                                  : 'border-gray-200 dark:border-dark-border'}`}
                      onClick={() => setRole('jobseeker')}
                    >
                      <div 
                        className={`flex items-center justify-center w-12 h-12 rounded-full mb-3 transition-colors duration-200
                                  ${role === 'jobseeker' 
                                    ? 'bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400' 
                                    : 'bg-gray-100 text-gray-500 dark:bg-dark-lighter dark:text-gray-400'}`}
                      >
                        <FiUser size={24} />
                      </div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Соискатель</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Ищу работу или новые возможности
                      </p>
                    </div>
                    
                    <div
                      className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                                ${role === 'employer' 
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' 
                                  : 'border-gray-200 dark:border-dark-border'}`}
                      onClick={() => setRole('employer')}
                    >
                      <div 
                        className={`flex items-center justify-center w-12 h-12 rounded-full mb-3 transition-colors duration-200
                                  ${role === 'employer' 
                                    ? 'bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400' 
                                    : 'bg-gray-100 text-gray-500 dark:bg-dark-lighter dark:text-gray-400'}`}
                      >
                        <FiBriefcase size={24} />
                      </div>
                      <h3 className="font-medium text-gray-800 dark:text-white mb-1">Работодатель</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Ищу сотрудников для компании
                      </p>
              </div>
            </div>
          </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Кнопки навигации */}
          <div className="flex justify-between space-x-3">
            {step > 1 && (
              <motion.button
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                type="button"
                onClick={prevStep}
                className="px-5 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors duration-200"
                disabled={loading}
              >
                Назад
              </motion.button>
            )}
            
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
            type="submit"
            disabled={loading}
              className={`px-5 py-3 bg-gradient-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-70 transition-all duration-200 ${step === 1 ? 'w-full' : 'flex-1'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Загрузка...
              </div>
            ) : (
                step === 3 ? "Зарегистрироваться" : "Продолжить"
              )}
            </motion.button>
          </div>
        </motion.form>
        
        {/* Ссылка на вход */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6"
        >
          <p className="text-gray-600 dark:text-gray-300">
            Уже есть аккаунт?{" "}
            <Link 
              to="/login" 
              className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Войти
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup; 