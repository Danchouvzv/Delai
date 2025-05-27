import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiDownload,
  FiShare2,
  FiArrowRight,
  FiTrendingUp,
  FiEye,
  FiEdit3,
  FiPieChart
} from 'react-icons/fi';
import { 
  BsLightningChargeFill, 
  BsGraphUp, 
  BsStars, 
  BsAward,
  BsArrowRightCircleFill,
  BsShieldCheck,
  BsGem
} from 'react-icons/bs';
import { UserData } from '../types';
import { useThemeContext } from '../contexts/ThemeContext';

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  enhancedContent: string;
  skillScores: {
    [key: string]: number;
  };
  keywordDensity: {
    [key: string]: number;
  };
  readabilityScore: number;
  industryFit: number;
  technicalScore: number;
  softSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  overallImpact: number;
}

interface ResumeAnalysisResultProps {
  analysis: AnalysisResult;
  onDownload: () => void;
  onShare: () => void;
}


const ResumeAnalysisResult: React.FC<ResumeAnalysisResultProps> = ({
  analysis,
  onDownload,
  onShare
}) => {
  const [selectedSection, setSelectedSection] = useState<'overview' | 'skills' | 'improvements'>('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const { isDark } = useThemeContext();

  const radarData = {
    labels: [
      'Технические навыки',
      'Soft Skills',
      'Опыт работы',
      'Образование',
      'Соответствие отрасли',
      'Общее впечатление'
    ],
    datasets: [
      {
        label: 'Ваше резюме',
        data: [
          analysis.technicalScore,
          analysis.softSkillsScore,
          analysis.experienceScore,
          analysis.educationScore,
          analysis.industryFit,
          analysis.overallImpact
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: isDark ? '#1f2937' : 'white',
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        cornerRadius: 8,
        usePointStyle: true
      }
    },
    elements: {
      line: {
        tension: 0.2
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const ScoreCircle = ({ score, label, icon, color }: { score: number, label: string, icon: React.ReactNode, color: string }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative p-4 text-center"
    >
      <div className={`absolute inset-0 m-auto w-32 h-32 ${color} rounded-full opacity-10`}></div>
      <div className="relative flex flex-col items-center justify-center">
        <div className={`p-3 ${color} rounded-full mb-3 bg-opacity-20`}>
          {icon}
        </div>
        <div className="text-3xl font-bold">{score}%</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-sm uppercase tracking-wider font-semibold opacity-80">Оценка вашего резюме</h2>
            <div className="flex items-center mt-1">
              <span className="text-4xl md:text-5xl font-extrabold">{analysis.score}%</span>
              {analysis.score >= 70 ? (
                <BsShieldCheck className="ml-3 w-8 h-8 text-green-300" />
              ) : analysis.score >= 50 ? (
                <BsStars className="ml-3 w-8 h-8 text-yellow-300" />
              ) : (
                <FiEdit3 className="ml-3 w-8 h-8 text-red-300" />
              )}
            </div>
            <p className="mt-2 opacity-90 max-w-md">
              {analysis.score >= 70 
                ? 'Отличное резюме! Оно произведет впечатление на работодателей.' 
                : analysis.score >= 50 
                ? 'Хорошее начало. Следуйте рекомендациям, чтобы улучшить ваше резюме.' 
                : 'Ваше резюме нуждается в доработке. Воспользуйтесь нашими рекомендациями.'
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDownload}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-3 flex items-center font-medium backdrop-blur-sm"
            >
              <FiDownload className="mr-2" />
              Скачать отчет
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-3 flex items-center font-medium backdrop-blur-sm"
            >
              <FiShare2 className="mr-2" />
              Поделиться
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Навигация по разделам */}
      <motion.div variants={itemVariants} className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Обзор', icon: <FiPieChart className="mr-2" /> },
          { id: 'skills', label: 'Навыки', icon: <FiBarChart2 className="mr-2" /> },
          { id: 'improvements', label: 'Рекомендации', icon: <FiEdit3 className="mr-2" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSection(tab.id as any)}
            className={`flex items-center px-6 py-3 font-medium text-sm ${
              selectedSection === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Основные показатели */}
      <AnimatePresence mode="wait">
        {selectedSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ScoreCircle 
                score={analysis.readabilityScore} 
                label="Читаемость" 
                icon={<FiEye className="w-6 h-6 text-green-600" />}
                color="bg-green-100 text-green-600"
              />
              <ScoreCircle 
                score={analysis.industryFit} 
                label="Соответствие отрасли" 
                icon={<BsGraphUp className="w-6 h-6 text-purple-600" />}
                color="bg-purple-100 text-purple-600"
              />
              <ScoreCircle 
                score={analysis.overallImpact} 
                label="Общее впечатление" 
                icon={<BsStars className="w-6 h-6 text-blue-600" />}
                color="bg-blue-100 text-blue-600"
              />
            </div>

            {/* Радар навыков */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FiPieChart className="text-indigo-500 mr-2" />
                Распределение показателей
              </h3>
              <div className="h-80">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </motion.div>
            
            
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 opacity-50 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <BsLightningChargeFill className="text-amber-500 mr-2" />
                  Подробный отзыв
                </h3>
                <div className={`prose prose-indigo max-w-none ${!isExpanded && 'line-clamp-6'}`}>
                  <p>{analysis.detailedFeedback}</p>
                </div>
                {analysis.detailedFeedback.length > 300 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 text-indigo-600 font-medium flex items-center hover:text-indigo-700"
                  >
                    {isExpanded ? 'Свернуть' : 'Читать полностью'}
                    <BsArrowRightCircleFill className="ml-1" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedSection === 'skills' && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Ключевые навыки */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FiBarChart2 className="text-indigo-500 mr-2" />
                Анализ ключевых навыков
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysis.skillScores).map(([skill, score], index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    }}
                    onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
                    className={`bg-white rounded-lg p-4 border transition-all cursor-pointer
                      ${activeSkill === skill 
                        ? 'border-indigo-300 bg-indigo-50 shadow-md' 
                        : 'border-gray-200 hover:border-indigo-200'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{skill}</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                        score >= 80 ? 'bg-green-100 text-green-800' :
                        score >= 60 ? 'bg-blue-100 text-blue-800' :
                        score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-2.5 rounded-full ${
                          score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                          score >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                          score >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {activeSkill === skill && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 text-sm text-gray-600"
                        >
                          {score >= 80 ? (
                            <p>Отличный уровень владения навыком. Продолжайте его демонстрировать.</p>
                          ) : score >= 60 ? (
                            <p>Хороший уровень. Подчеркните практический опыт использования.</p>
                          ) : score >= 40 ? (
                            <p>Средний уровень. Добавьте примеры достижений с использованием этого навыка.</p>
                          ) : (
                            <p>Требуется развитие. Приведите конкретные примеры или уберите из резюме.</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <BsGem className="text-amber-500 mr-2" />
                Ключевые слова в резюме
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(analysis.keywordDensity)
                  .sort((a, b) => b[1] - a[1])
                  .map(([keyword, density], index) => (
                    <motion.div
                      key={keyword}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * index }}
                      className={`px-4 py-2 rounded-full font-medium text-sm
                        ${density > 0.05 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : density > 0.02 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      style={{ fontSize: `${Math.min(Math.max(density * 500, 0.8), 1.2)}rem` }}
                    >
                      {keyword}
                    </motion.div>
                  ))}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Размер ключевых слов отражает их относительную плотность в вашем резюме. Больший размер означает большую частоту упоминания.</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedSection === 'improvements' && (
          <motion.div
            key="improvements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg p-6 border border-green-100"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  Сильные стороны
                </h3>
                <ul className="space-y-4">
                  {analysis.strengths.map((strength, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start p-3 bg-white rounded-lg shadow-sm"
                    >
                      <FiCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-800">{strength}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-lg p-6 border border-amber-100"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <FiAlertCircle className="text-amber-500 mr-2" />
                  Области для улучшения
                </h3>
                <ul className="space-y-4">
                  {analysis.improvements.map((improvement, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start p-3 bg-white rounded-lg shadow-sm"
                    >
                      <FiAlertCircle className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-800">{improvement}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
            
            {/* Улучшенное содержание */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 border border-blue-100"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FiTrendingUp className="text-blue-500 mr-2" />
                Улучшенная версия
              </h3>
              <div className="bg-white p-5 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-800">
                {analysis.enhancedContent}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDownload}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Скачать улучшенную версию
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResumeAnalysisResult; 