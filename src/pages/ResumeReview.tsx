import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateResumeAnalysis, UserContext } from '../api/gemini';
import { UserData } from '../types';
import { 
  FiCheckCircle, FiAlertCircle, FiInfo, FiBookOpen, 
  FiFileText, FiUpload, FiDownload, FiShare2, FiStar,
  FiTrendingUp, FiTarget, FiAward, FiBarChart2, FiCpu
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ResumeUploader from '../components/ResumeUploader';
import ResumeAnalysisResult from '../components/ResumeAnalysisResult';
import html2pdf from 'html2pdf.js';
import { BsFileEarmarkText, BsGraphUp, BsStars, BsAward } from 'react-icons/bs';
import { HiOutlineDocumentText, HiOutlineDocumentSearch, HiOutlineDocumentReport } from 'react-icons/hi';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  enhancedContent: string;
  lastAnalyzed?: string;
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

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  useEffect(() => {
    const steps = 60;
    const increment = value / steps;
    const timePerStep = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps) {
        countRef.current = Math.min(countRef.current + increment, value);
        setCount(Math.round(countRef.current));
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, timePerStep);

    return () => clearInterval(interval);
  }, [value, duration]);

  return <span>{count}</span>;
};

const ResumeReview: React.FC = () => {
  const { user, userData: authUserData } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'tips' | 'history'>('upload');
  const [previousAnalyses, setPreviousAnalyses] = useState<any[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Анимации
  const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  const progressVariants: Variants = {
    initial: { width: '0%' },
    animate: { width: '100%', transition: { duration: 2 } }
  };

  const radarData = {
    labels: ['Технические навыки', 'Soft Skills', 'Опыт работы', 'Образование', 'Соответствие отрасли', 'Общее впечатление'],
    datasets: [
      {
        label: 'Ваше резюме',
        data: analysis ? [
          analysis.technicalScore,
          analysis.softSkillsScore,
          analysis.experienceScore,
          analysis.educationScore,
          analysis.industryFit,
          analysis.overallImpact
        ] : [0, 0, 0, 0, 0, 0],
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

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          if (data?.resume?.analysis) {
            // Создаем полный объект анализа с дефолтными значениями для отсутствующих полей
            const analysisData = data.resume.analysis as any;
            setAnalysis({
              score: analysisData.score || 0,
              strengths: analysisData.strengths || [],
              improvements: analysisData.improvements || [],
              detailedFeedback: analysisData.detailedFeedback || '',
              enhancedContent: analysisData.enhancedContent || '',
              lastAnalyzed: analysisData.lastAnalyzed || new Date().toISOString(),
              skillScores: analysisData.skillScores || {},
              keywordDensity: analysisData.keywordDensity || {},
              readabilityScore: analysisData.readabilityScore || 0,
              industryFit: analysisData.industryFit || 0,
              technicalScore: analysisData.technicalScore || 0,
              softSkillsScore: analysisData.softSkillsScore || 0,
              experienceScore: analysisData.experienceScore || 0,
              educationScore: analysisData.educationScore || 0,
              overallImpact: analysisData.overallImpact || 0
            });
          }
          
          // Создать коллекцию истории, если она не существует
          try {
            const historyRef = doc(db, 'users', user.uid, 'history', 'resumeAnalyses');
            const historyDoc = await getDoc(historyRef);
            
            if (!historyDoc.exists()) {
              await setDoc(historyRef, { analyses: [] });
            } else if (historyDoc.data().analyses) {
              setPreviousAnalyses(historyDoc.data().analyses);
            }
          } catch (historyErr) {
            console.error('Error handling analysis history:', historyErr);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Не удалось загрузить данные пользователя. Пожалуйста, обновите страницу.');
      }
    };
    loadUserData();
  }, [user]);

  const handleFileSelected = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  }, []);

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          resolve(text);
        } else {
          reject(new Error('Не удалось прочитать содержимое файла'));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка при чтении файла'));
      
      if (file.type === 'application/pdf') {
        // Для PDF пока просто выдаем сообщение об ограничении
        reject(new Error('Анализ PDF-файлов временно недоступен. Пожалуйста, загрузите текстовый формат.'));
      } else {
        reader.readAsText(file);
      }
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!user) throw new Error('Пользователь не авторизован');

    // Создаем уникальное имя файла с датой и временем
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `resume_${Date.now()}.${fileExtension}`;
    const fileRef = ref(storage, `resumes/${user.uid}/${uniqueFileName}`);
    
    try {
      // Показываем прогресс-индикатор при обновлении
      const uploadResult = await uploadBytes(fileRef, file);
      console.log('Файл успешно загружен:', uploadResult);
      
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (err) {
      console.error('Ошибка загрузки файла:', err);
      throw new Error('Не удалось загрузить файл резюме');
    }
  };

  const analyzeResume = async () => {
    if (!user || !file || !userData) return;

    setIsAnalyzing(true);
    setError(null);
    setCurrentStep(1);
    setOptimizationProgress(0);

    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Размер файла превышает допустимый предел (10MB)');
      }
      
      // Загружаем файл
      setCurrentStep(2);
      setOptimizationProgress(20);
      const fileUrl = await uploadFile(file);
      
      // Читаем содержимое
      setCurrentStep(3);
      setOptimizationProgress(40);
      const content = await readFileContent(file);
      
      if (content.length < 50) {
        throw new Error('Файл содержит слишком мало текста для анализа');
      }

      // Формируем расширенный профиль пользователя
      setCurrentStep(4);
      setOptimizationProgress(60);
      
      // Преобразуем данные для соответствия типу UserContext
      const userProfile: UserContext = {
        role: userData.role || 'student',
        field: userData.major || userData.industry || 'technology',
        education: userData.education?.map(edu => ({
          degree: edu.degree,
          institution: edu.institution,
          year: edu.endDate || 'present'
        })) || [],
        skills: userData.skills?.map(skill => 
          typeof skill === 'string' ? skill : skill.name
        ) || [],
        experience: userData.experience?.map(exp => ({
          title: exp.title,
          company: exp.company,
          description: exp.description
        })) || [],
        interests: userData.careerGoals?.preferredIndustries || [],
        languages: userData.languages?.map(lang => lang.name) || []
      };
      
      // Запускаем расширенный анализ
      setCurrentStep(5);
      setOptimizationProgress(80);
      const analysisResult = await generateResumeAnalysis(content, userProfile);
      
      // Добавляем дополнительные метрики
      const enhancedAnalysis: AnalysisResult = {
        ...analysisResult,
        lastAnalyzed: new Date().toISOString(),
        skillScores: calculateSkillScores(content, userProfile.skills),
        keywordDensity: analyzeKeywordDensity(content),
        readabilityScore: calculateReadabilityScore(content),
        industryFit: calculateIndustryFit(content, userProfile),
        technicalScore: calculateTechnicalScore(content, userProfile),
        softSkillsScore: calculateSoftSkillsScore(content),
        experienceScore: calculateExperienceScore(content),
        educationScore: calculateEducationScore(content),
        overallImpact: calculateOverallImpact(analysisResult.score)
      };

      setAnalysis(enhancedAnalysis);
      setCurrentStep(6);
      setOptimizationProgress(100);

      // Сохраняем в историю
      const newAnalysisEntry = {
        ...enhancedAnalysis,
        fileName: file.name,
        fileUrl,
        timestamp: new Date().toISOString()
      };
      
      const updatedAnalyses = [newAnalysisEntry, ...previousAnalyses].slice(0, 10);
      setPreviousAnalyses(updatedAnalyses);
      
      await updateDoc(doc(db, 'users', user.uid, 'history', 'resumeAnalyses'), {
        analyses: updatedAnalyses
      });

      // Обновляем данные пользователя
      await updateDoc(doc(db, 'users', user.uid), {
        'resume.analysis': enhancedAnalysis,
        'resume.fileUrl': fileUrl,
        'resume.lastGenerated': new Date().toISOString()
      });
      
      // Генерируем ссылку для шаринга
      const shareToken = btoa(`${user.uid}:${new Date().toISOString()}`);
      setShareUrl(`${window.location.origin}/resume/share/${shareToken}`);
      
      setActiveTab('analysis');

    } catch (err) {
      console.error('Ошибка анализа:', err);
      setError(err instanceof Error ? err.message : 'Не удалось проанализировать резюме');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Вспомогательные функции для анализа
  const calculateSkillScores = (content: string, userSkills: string[]): { [key: string]: number } => {
    const scores: { [key: string]: number } = {};
    userSkills.forEach(skill => {
      const regex = new RegExp(skill, 'gi');
      const matches = content.match(regex);
      const frequency = matches ? matches.length : 0;
      scores[skill] = Math.min(100, frequency * 20);
    });
    return scores;
  };

  const analyzeKeywordDensity = (content: string): { [key: string]: number } => {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const total = words.length;
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = ((frequency[word] || 0) + 1) / total * 100;
    });
    return Object.fromEntries(
      Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    );
  };

  const calculateReadabilityScore = (content: string): number => {
    const words = content.match(/\b\w+\b/g) || [];
    const sentences = content.match(/[.!?]+/g) || [];
    const avgWordsPerSentence = words.length / sentences.length;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 5));
    return Math.round(readabilityScore);
  };

  const calculateIndustryFit = (content: string, userProfile: any): number => {
    const industryKeywords = userProfile.interests;
    let matchCount = 0;
    industryKeywords.forEach((keyword: string) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches) matchCount += matches.length;
    });
    return Math.min(100, matchCount * 10);
  };

  const calculateTechnicalScore = (content: string, userProfile: any): number => {
    const technicalSkills = userProfile.skills.filter((skill: string) => 
      /^(python|java|javascript|react|node|sql|aws|docker|kubernetes|ml|ai)$/i.test(skill)
    );
    let score = 0;
    technicalSkills.forEach((skill: string) => {
      const regex = new RegExp(skill, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length * 5;
    });
    return Math.min(100, score);
  };

  const calculateSoftSkillsScore = (content: string): number => {
    const softSkills = [
      'коммуникация', 'лидерство', 'работа в команде', 'организация',
      'решение проблем', 'креативность', 'адаптивность', 'управление временем'
    ];
    let score = 0;
    softSkills.forEach(skill => {
      const regex = new RegExp(skill, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length * 10;
    });
    return Math.min(100, score);
  };

  const calculateExperienceScore = (content: string): number => {
    const experienceKeywords = ['опыт', 'работал', 'достиг', 'разработал', 'создал', 'улучшил'];
    let score = 0;
    experienceKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length * 8;
    });
    return Math.min(100, score);
  };

  const calculateEducationScore = (content: string): number => {
    const educationKeywords = ['образование', 'университет', 'степень', 'диплом', 'курс'];
    let score = 0;
    educationKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length * 15;
    });
    return Math.min(100, score);
  };

  const calculateOverallImpact = (baseScore: number): number => {
    return Math.round((baseScore + 
      (analysis?.readabilityScore || 0) + 
      (analysis?.industryFit || 0)) / 3);
  };

  // Функция для скачивания PDF
  const downloadAnalysisPDF = useCallback(() => {
    if (!analysisRef.current || !analysis) return;
    
    // Установка параметров для PDF
    const element = analysisRef.current;
    const opt = {
      margin: 10,
      filename: `resume_analysis_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' | 'landscape' }
    };
    
    // Анимация загрузки
    const downloadButton = document.getElementById('download-button');
    if (downloadButton) {
      downloadButton.innerHTML = '<span class="animate-spin mr-2">↻</span> Создание PDF...';
      downloadButton.setAttribute('disabled', 'true');
    }
    
    // Генерируем PDF
    html2pdf().from(element).set(opt).save().then(() => {
      // Возвращаем кнопку в нормальное состояние
      if (downloadButton) {
        downloadButton.innerHTML = '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Скачать PDF';
        downloadButton.removeAttribute('disabled');
      }
    });
  }, [analysis]);
  
  // Функция для копирования ссылки
  const copyShareLink = useCallback(() => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [shareUrl]);
  
  // Функция для шаринга в соцсети
  const shareToSocial = useCallback((platform: 'twitter' | 'linkedin' | 'facebook') => {
    if (!shareUrl) return;
    
    const text = 'Проверьте анализ моего резюме, созданный с помощью ИИ!';
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  }, [shareUrl]);

  const renderTips = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
        <BsStars className="text-yellow-500 mr-3" />
        Советы по улучшению резюме
      </h2>
      
      <div className="space-y-8">
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/20 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
            <HiOutlineDocumentText className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Основные рекомендации
          </h3>
          
          <ul className="space-y-3">
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiCheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Ограничьте резюме до 1-2 страниц</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Рекрутеры тратят в среднем 6-7 секунд на просмотр резюме. Сделайте его лаконичным.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiCheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Используйте четкое форматирование</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Последовательные отступы, маркеры и шрифты делают резюме более читабельным.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiCheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Включите контактную информацию</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Имя, email, телефон, LinkedIn-профиль и город проживания.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiCheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Внимательно проверяйте орфографию</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Грамматические ошибки создают впечатление небрежности.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiCheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Сохраняйте в формате PDF</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">PDF сохраняет форматирование на всех устройствах и ATS-системах.</p>
              </div>
            </li>
          </ul>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/10 dark:to-fuchsia-900/10 p-6 rounded-xl border border-purple-100 dark:border-purple-800/20 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center">
            <HiOutlineDocumentSearch className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" />
            Советы для студентов
          </h3>
          
          <ul className="space-y-3">
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiInfo className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Подчеркивайте учебные достижения</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Включите важные курсы, проекты и академические награды.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiInfo className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Добавьте стажировки и волонтерство</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Опыт вне учебы показывает вашу инициативность и практические навыки.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiInfo className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Квантифицируйте достижения</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Используйте числа и проценты, например: "Увеличил посещаемость мероприятий на 30%".</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiInfo className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Перечислите технические навыки</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Укажите конкретные программы, языки программирования и инструменты.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiInfo className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Включите академические награды</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Стипендии, гранты и другие признания вашего академического успеха.</p>
              </div>
            </li>
          </ul>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-6 rounded-xl border border-amber-100 dark:border-amber-800/20 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-300 mb-4 flex items-center">
            <HiOutlineDocumentReport className="w-6 h-6 mr-2 text-amber-600 dark:text-amber-400" />
            Распространенные ошибки
          </h3>
          
          <ul className="space-y-3">
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Общие цели или резюме</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Избегайте шаблонных фраз без конкретики, адаптируйте под каждую вакансию.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Нерелевантная личная информация</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Не указывайте возраст, семейное положение и другие личные данные.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Непрофессиональный email</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Используйте деловой email, а не личный типа "cool_dude@mail.com".</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Чрезмерное использование модных слов</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Не перегружайте "синергиями" и "инновациями" без конкретики.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start bg-white/50 dark:bg-white/5 p-3 rounded-lg hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
              <FiAlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1 w-5 h-5" />
              <div>
                <span className="text-gray-800 dark:text-gray-200 font-medium">Включение рекомендаций</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Не пишите "Рекомендации предоставляются по запросу" - это очевидно.</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
        <BsGraphUp className="text-green-500 mr-3" />
        История анализов
      </h2>
      
      {previousAnalyses.length > 0 ? (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ваша история анализов резюме. Нажмите на запись, чтобы просмотреть полные результаты анализа.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {previousAnalyses.map((analysisItem, index) => (
              <motion.div 
                key={index} 
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setAnalysis(analysisItem)}
                whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="border-b border-gray-200 dark:border-gray-700 py-3 px-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BsFileEarmarkText className="text-purple-500 dark:text-purple-400 text-lg" />
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px]">
                      {analysisItem.fileName || `Анализ #${index + 1}`}
                    </h3>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      analysisItem.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      analysisItem.score >= 60 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {analysisItem.score}/100
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {new Date(analysisItem.timestamp).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Сильные стороны
                      </h4>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        {analysisItem.strengths.slice(0, 2).map((strength: string, i: number) => (
                          <li key={i} className="truncate">{strength}</li>
                        ))}
                        {analysisItem.strengths.length > 2 && (
                          <li className="text-purple-600 dark:text-purple-400">+{analysisItem.strengths.length - 2} еще...</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                        <svg className="w-3 h-3 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Улучшения
                      </h4>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        {analysisItem.improvements.slice(0, 2).map((improvement: string, i: number) => (
                          <li key={i} className="truncate">{improvement}</li>
                        ))}
                        {analysisItem.improvements.length > 2 && (
                          <li className="text-purple-600 dark:text-purple-400">+{analysisItem.improvements.length - 2} еще...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnalysis(analysisItem);
                        setActiveTab('upload');
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center"
                    >
                      Просмотреть полный анализ
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div 
          className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            История анализов пуста
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Загрузите резюме и проведите анализ, чтобы начать заполнять историю ваших анализов
          </p>
          <button
            onClick={() => setActiveTab('upload')}
            className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Проанализировать резюме
          </button>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white">
            Resume Review & Analysis
          </h1>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get AI-powered insights to improve your resume and stand out to employers
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-t-2xl shadow-xl mb-0">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 py-4 px-6 transition-colors ${
                activeTab === 'upload'
                  ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FiFileText className="w-5 h-5" />
              <span>Analyze Resume</span>
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex items-center gap-2 py-4 px-6 transition-colors ${
                activeTab === 'tips'
                  ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FiInfo className="w-5 h-5" />
              <span>Resume Tips</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 py-4 px-6 transition-colors ${
                activeTab === 'history'
                  ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FiBookOpen className="w-5 h-5" />
              <span>History</span>
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl p-8"
            >
              {/* Upload and Analysis section */}
              <div className="space-y-8">
                <ResumeUploader 
                  onFileSelected={handleFileSelected}
                  onAnalyze={analyzeResume}
                  file={file}
                  error={error}
                  isAnalyzing={isAnalyzing}
                />

                {/* Analysis Button */}
                <div className="flex justify-center">
                  <button
                    onClick={analyzeResume}
                    disabled={!file || isAnalyzing}
                    className={`px-8 py-3 rounded-xl text-white font-medium transition-all flex items-center gap-3 ${
                      !file || isAnalyzing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="w-5 h-5" />
                        Analyze Resume
                      </>
                    )}
                  </button>
                </div>

                {/* Error Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg flex items-center gap-3"
                    >
                      <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Analysis Results */}
                <div ref={analysisRef}>
                  {analysis && (
                    <ResumeAnalysisResult 
                      analysis={analysis} 
                      onDownload={downloadAnalysisPDF}
                      onShare={() => setShowShareOptions(true)}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              key="tips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTips()}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderHistoryTab()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResumeReview; 