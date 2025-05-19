import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { UserData } from '../types';

interface ProfileHeroProps {
  userData: UserData | null;
}

const ProfileHero: React.FC<ProfileHeroProps> = ({ userData }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.3]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);
  
  if (!userData) return null;

  return (
    <motion.div 
      className="relative h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden" 
      style={{ 
        y,
        opacity
      }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 opacity-90"></div>
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-pattern-dots opacity-10 mix-blend-overlay"></div>
      
      {/* Animated circles */}
      <motion.div 
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"
        animate={{ 
          x: [0, 10, 0], 
          y: [0, 15, 0],
          scale: [1, 1.1, 1] 
        }} 
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      <motion.div 
        className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
        animate={{ 
          x: [0, -15, 0], 
          y: [0, 10, 0],
          scale: [1, 1.2, 1] 
        }} 
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      {/* User Information */}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <motion.div
          style={{ scale }}
          className="flex items-end gap-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="h-28 w-28 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-2xl"
          >
            {userData.photoURL ? (
              <img src={userData.photoURL} alt={userData.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              userData?.displayName?.charAt(0) || (userData?.email?.charAt(0) || '?')
            )}
          </motion.div>
          
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-bold"
            >
              {userData.displayName || 'Anonymous User'}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center flex-wrap gap-3 mt-3"
            >
              <span className="bg-white/20 backdrop-blur-md rounded-full py-1 px-3 text-sm">
                {userData.position || 'No position'}
              </span>
              
              {userData.location && (
                <span className="flex items-center gap-1 text-white/80 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {userData.location}
                </span>
              )}
              
              <span className="bg-gradient-to-r from-purple-500/30 to-blue-500/30 backdrop-blur-md rounded-full py-1 px-3 text-sm border border-white/10">
                {userData.role === 'school' ? 'Студент' : userData.role === 'employer' ? 'Работодатель' : 'Компания'}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileHero; 