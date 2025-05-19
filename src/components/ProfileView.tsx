import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { UserData } from '../types';
import { Link } from 'react-router-dom';

interface ProfileViewProps {
  userData: UserData | null;
  isCurrentUser: boolean;
  onEdit: () => void;
  onChat?: () => void;
  onAddToFavorites?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  userData, 
  isCurrentUser, 
  onEdit,
  onChat,
  onAddToFavorites
}) => {
  const [activeSection, setActiveSection] = useState<'about' | 'skills' | 'experience'>('about');

  // Spring animations
  const profileCardSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 170, friction: 26 }
  });

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (!userData) return null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative space-y-8"
    >
      {/* декоративные фоновые фигуры */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-gradient-to-br from-purple-300 to-indigo-400 rounded-full filter blur-2xl opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-10 w-24 h-24 bg-gradient-to-r from-pink-300 to-red-300 rounded-full filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-tr from-blue-300 to-teal-300 rounded-full filter blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-40 left-10 w-32 h-32 bg-gradient-to-bl from-yellow-200 to-orange-300 rounded-full filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2.2s' }}></div>
      
      {/* Декоративные элементы */}
      <motion.div 
        className="absolute -top-5 right-10 w-20 h-20 opacity-20 pointer-events-none"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0L61 39H100L69 63L80 100L50 75L20 100L31 63L0 39H39L50 0Z" fill="url(#grad1)"/>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-10 left-5 w-16 h-16 opacity-20 pointer-events-none"
        initial={{ rotate: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 0L100 50L50 100L0 50L50 0Z" fill="url(#grad2)"/>
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4 group">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 ring-4 ring-offset-4 ring-offset-white dark:ring-offset-gray-800 ring-purple-500 shadow-lg">
            {userData.photoURL ? (
              <img 
                src={userData.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500 mb-1">
          {userData.displayName || 'Anonymous User'}
        </h3>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          {userData.position || 'No position specified'}
        </p>
        <div className="flex items-center gap-3 mt-2 justify-center">
          <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full text-sm font-medium text-purple-800 dark:text-purple-300">
            {userData.role === 'student' ? 'Студент' : 'Работодатель'}
          </span>
          {userData.location && (
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {userData.location}
            </span>
          )}
        </div>
        
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isCurrentUser ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEdit}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Редактировать профиль</span>
              </motion.button>
              <Link to="/resume-generator" className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-300 to-teal-300 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-5 py-2.5 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 group-hover:from-green-500 group-hover:to-teal-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>AI Генератор резюме</span>
                  <motion.div 
                    className="absolute -top-3 -right-3 bg-yellow-400 text-xs px-2 py-1 rounded-full text-gray-800 font-semibold z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                  >
                    NEW
                  </motion.div>
                </motion.button>
              </Link>
            </>
          ) : (
            <>
              {onChat && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onChat}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Сообщение</span>
                </motion.button>
              )}
              {onAddToFavorites && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAddToFavorites}
                  className="px-5 py-2.5 border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400 bg-white dark:bg-transparent rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>В избранное</span>
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('about')}
          className={`px-6 py-3 font-medium text-sm ${
            activeSection === 'about'
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          } transition-colors duration-300`}
        >
          О себе
        </button>
        <button
          onClick={() => setActiveSection('skills')}
          className={`px-6 py-3 font-medium text-sm ${
            activeSection === 'skills'
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          } transition-colors duration-300`}
        >
          Навыки
        </button>
        <button
          onClick={() => setActiveSection('experience')}
          className={`px-6 py-3 font-medium text-sm ${
            activeSection === 'experience'
              ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          } transition-colors duration-300`}
        >
          Опыт работы
        </button>
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'about' && (
          <motion.div 
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 backdrop-blur-sm border border-white/50 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              О себе
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {userData.bio || 'Информация не добавлена'}
            </p>
            
            {userData.education && (
              <div className="mt-6">
                <h5 className="text-md font-medium text-purple-600 dark:text-purple-300 mb-2">Образование</h5>
                <p className="text-gray-700 dark:text-gray-300">
                  {Array.isArray(userData.education)
                    ? userData.education.join(', ')
                    : userData.education}
                </p>
              </div>
            )}
            
            {userData.interests && userData.interests.length > 0 && (
              <div className="mt-6">
                <h5 className="text-md font-medium text-purple-600 dark:text-purple-300 mb-2">Интересы</h5>
                <div className="flex flex-wrap gap-2">
                  {userData.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 shadow-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {activeSection === 'skills' && (
          <motion.div 
            key="skills"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 backdrop-blur-sm border border-white/50 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Навыки
            </h4>
            {userData.skills && userData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userData.skills.map((skill, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Навыки не добавлены</p>
            )}
          </motion.div>
        )}
        
        {activeSection === 'experience' && (
          <motion.div 
            key="experience"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 backdrop-blur-sm border border-white/50 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300"
            whileHover={{ y: -5 }}
          >
            <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Опыт работы
            </h4>
            {userData.experience && (
              <div className="mt-6">
                <h5 className="text-md font-medium text-purple-600 dark:text-purple-300 mb-2">Опыт работы</h5>
                {Array.isArray(userData.experience)
                  ? userData.experience.map((exp, idx) => (
                      <p key={idx} className="text-gray-700 dark:text-gray-300 mb-2">
                        {typeof exp === 'string' ? exp : `${exp.title} в ${exp.company}, ${exp.location}`}
                      </p>
                    ))
                  : <p className="text-gray-700 dark:text-gray-300">{userData.experience}</p>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileView; 