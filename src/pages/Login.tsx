import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { UserContext } from '../contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { GrLinkedin, GrFacebook, GrGoogle } from 'react-icons/gr';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Не удалось войти. Проверьте email и пароль.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Пользователь с таким email не найден';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Неверный пароль';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Неверный формат email';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Слишком много попыток входа. Попробуйте позже';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Фоновые анимированные элементы
  const bubbles = Array.from({ length: 5 }).map((_, i) => (
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
          className="flex justify-center mb-8"
        >
          <Link to="/" className="text-3xl font-bold text-primary-500 dark:text-primary-400">
            JumysAl
          </Link>
        </motion.div>
        
        {/* Заголовок и описание */}
        <motion.div 
          variants={itemVariants}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Добро пожаловать
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Войдите в свой аккаунт
          </p>
        </motion.div>
        
        {/* Форма входа */}
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
          
          {/* Поле Email */}
          <div className="mb-4">
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
          
          {/* Поле Пароль */}
          <div className="mb-6">
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
                placeholder="••••••••"
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
            <div className="flex justify-end mt-1">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Забыли пароль?
              </Link>
            </div>
          </div>
          
          {/* Кнопка входа */}
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-70 transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Вход...
              </div>
            ) : "Войти"}
          </motion.button>
          
          {/* Разделитель для социальных сетей */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-dark-border"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">или</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-dark-border"></div>
          </div>
          
          {/* Кнопки социальных сетей */}
          <div className="grid grid-cols-3 gap-3">
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              type="button"
              className="flex justify-center items-center py-2.5 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors"
            >
              <GrGoogle className="text-lg" />
            </motion.button>
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              type="button"
              className="flex justify-center items-center py-2.5 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors"
            >
              <GrFacebook className="text-lg text-blue-600" />
            </motion.button>
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              type="button"
              className="flex justify-center items-center py-2.5 border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors"
            >
              <GrLinkedin className="text-lg text-blue-700" />
            </motion.button>
          </div>
        </motion.form>
        
        {/* Ссылка на регистрацию */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6"
        >
          <p className="text-gray-600 dark:text-gray-300">
            Еще нет аккаунта?{" "}
            <Link 
              to="/signup" 
              className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Зарегистрироваться
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 