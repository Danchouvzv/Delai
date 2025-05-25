import React from 'react';
import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiDownload,
  FiShare2
} from 'react-icons/fi';
import { UserData } from '../types';

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

/**
 * Component to display resume analysis results
 */
const ResumeAnalysisResult: React.FC<ResumeAnalysisResultProps> = ({
  analysis,
  onDownload,
  onShare
}) => {
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
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="space-y-8">
      {/* Основные показатели */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {analysis.score}%
            </div>
            <div className="text-gray-600">Общий рейтинг</div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {analysis.readabilityScore}%
            </div>
            <div className="text-gray-600">Читаемость</div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {analysis.industryFit}%
            </div>
            <div className="text-gray-600">Соответствие отрасли</div>
          </div>
        </motion.div>
      </div>

      {/* Радар навыков */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Распределение показателей
        </h3>
        <div className="h-80">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </motion.div>

      {/* Сильные стороны и области для улучшения */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiCheckCircle className="text-green-500 mr-2" />
            Сильные стороны
          </h3>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start"
              >
                <FiCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <span>{strength}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiAlertCircle className="text-amber-500 mr-2" />
            Области для улучшения
          </h3>
          <ul className="space-y-3">
            {analysis.improvements.map((improvement, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start"
              >
                <FiAlertCircle className="text-amber-500 mt-1 mr-2 flex-shrink-0" />
                <span>{improvement}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Ключевые навыки */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <FiBarChart2 className="text-blue-500 mr-2" />
          Анализ ключевых навыков
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analysis.skillScores).map(([skill, score], index) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{skill}</span>
                <span className="text-sm text-gray-500">{score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1 }}
                  className="bg-blue-500 h-2 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Действия */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.7 }}
        className="flex flex-wrap gap-4 justify-center"
      >
        <button
          onClick={onDownload}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiDownload />
          <span>Скачать отчет</span>
        </button>
        
        <button
          onClick={onShare}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiShare2 />
          <span>Поделиться</span>
        </button>
      </motion.div>
    </div>
  );
};

export default ResumeAnalysisResult; 