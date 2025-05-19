import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiDownload, FiShare2 } from 'react-icons/fi';
import { UserData } from '../types';

interface ResumeAnalysisResultProps {
  analysis: UserData['resume']['analysis'];
  onDownloadPDF?: () => void;
}

/**
 * Component to display resume analysis results
 */
const ResumeAnalysisResult: React.FC<ResumeAnalysisResultProps> = ({ analysis, onDownloadPDF }) => {
  if (!analysis) return null;

  const variants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  // Format timestamp to readable date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });
    } catch (e) {
      return 'Неизвестная дата';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreAdvice = (score: number) => {
    if (score >= 85) return 'Отличное резюме! Вы готовы к отправке.';
    if (score >= 70) return 'Хорошее резюме с небольшими улучшениями.';
    if (score >= 50) return 'Требуются некоторые доработки.';
    return 'Необходимы существенные улучшения.';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Анализ резюме</h2>
          <div className="text-white text-opacity-80 text-sm">
            {analysis.lastAnalyzed && `Проанализировано: ${formatDate(analysis.lastAnalyzed)}`}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Score indicator */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">Общая оценка</h3>
            <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}/100
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getScoreAdvice(analysis.score)}
            </p>
          </div>

          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-[-90deg]">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#e2e8f0" 
                strokeWidth="8"
                className="dark:opacity-30" 
              />
              <motion.circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="url(#scoreGradient)" 
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ 
                  strokeDashoffset: 283 - (283 * analysis.score / 100) 
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {analysis.score}
            </div>
          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div 
            className="bg-green-50 dark:bg-green-900/10 p-5 rounded-xl border border-green-100 dark:border-green-800"
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <h3 className="text-lg font-medium text-green-700 dark:text-green-400 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Сильные стороны
            </h3>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <motion.li 
                  key={index}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  custom={index + 1}
                  className="flex"
                >
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-800"
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <h3 className="text-lg font-medium text-amber-700 dark:text-amber-400 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Области для улучшения
            </h3>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <motion.li 
                  key={index}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  custom={index + 1}
                  className="flex"
                >
                  <span className="text-amber-500 mr-2">!</span>
                  <span className="text-gray-700 dark:text-gray-300">{improvement}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Detailed Feedback */}
        <motion.div 
          className="mb-8"
          variants={variants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Подробный анализ</h3>
          <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {analysis.detailedFeedback}
            </p>
          </div>
        </motion.div>

        {/* Enhanced Content */}
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Улучшенное содержание</h3>
            {onDownloadPDF && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDownloadPDF}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать PDF
              </motion.button>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {analysis.enhancedContent}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeAnalysisResult; 