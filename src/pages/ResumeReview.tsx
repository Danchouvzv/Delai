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
import { BsFileEarmarkText, BsGraphUp, BsStars, BsAward, BsRobot } from 'react-icons/bs';
import { HiOutlineDocumentText, HiOutlineDocumentSearch, HiOutlineDocumentReport } from 'react-icons/hi';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Badge,
  Icon,
  Grid,
  GridItem,
  Progress,
  useToast,
  Card,
  CardBody,
  List,
  ListItem,
  ListIcon,
  SimpleGrid,
  useDisclosure,
  IconButton
} from '@chakra-ui/react';
import { FaCheckCircle, FaExclamationTriangle, FaFilePdf, FaLightbulb, FaMagic } from 'react-icons/fa';
import { IoAnalytics, IoDocumentText, IoSparkles } from 'react-icons/io5';
import { AiFillRocket } from 'react-icons/ai';

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

  const toast = useToast();
  const bgGradient = useColorModeValue(
    'linear(to-b, gray.50, white)',
    'linear(to-b, gray.900, gray.800)'
  );
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
            const analysisData = data.resume.analysis;
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
            
            setActiveTab('analysis');
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
        field: userData.field || userData.major || userData.industry || 'technology',
        education: userData.education?.map(edu => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          year: edu.endDate || 'present'
        })) || [],
        skills: userData.skills?.map(skill => 
          typeof skill === 'string' ? skill : skill.name
        ) || [],
        experience: userData.experience?.map(exp => ({
          title: exp.title || '',
          company: exp.company || '',
          description: exp.description || ''
        })) || [],
        interests: userData.careerGoals?.preferredIndustries || [],
        languages: userData.languages?.map(lang => lang.name) || []
      };
      
      // Запускаем расширенный анализ
      setCurrentStep(5);
      setOptimizationProgress(80);
      const analysisResult = await generateResumeAnalysis(content, userProfile);
      
      // Создаем полный объект анализа
      const enhancedAnalysis: AnalysisResult = {
        ...analysisResult,
        lastAnalyzed: new Date().toISOString(),
        skillScores: analysisResult.skillScores || {},
        keywordDensity: analysisResult.keywordDensity || {},
        readabilityScore: analysisResult.readabilityScore || 0,
        industryFit: analysisResult.industryFit || 0,
        technicalScore: analysisResult.technicalScore || 0,
        softSkillsScore: analysisResult.softSkillsScore || 0,
        experienceScore: analysisResult.experienceScore || 0,
        educationScore: analysisResult.educationScore || 0,
        overallImpact: analysisResult.overallImpact || 0
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

  const downloadAnalysisReport = () => {
    if (!analysis || !analysisRef.current) return;
    
    const downloadPDFOptions = {
      margin: 10,
      filename: 'резюме_анализ.pdf',
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 2 
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const
      }
    };
    
    html2pdf().set(downloadPDFOptions).from(analysisRef.current).save();
  };
  
  const shareAnalysis = () => {
    setShowShareOptions(!showShareOptions);
    // Создание временной ссылки для шаринга
    setShareUrl(`https://example.com/shared-analysis?id=${Math.random().toString(36).substring(2, 12)}`);
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <motion.div
            key="upload"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-[80vh] flex flex-col"
          >
            <div className="mb-12 text-center">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 inline-block text-transparent bg-clip-text"
              >
                AI-анализ вашего резюме
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Улучшите своё резюме с помощью искусственного интеллекта. Получите подробный анализ и рекомендации для повышения шансов на успешное трудоустройство.
              </motion.p>
            </div>
            
            <ResumeUploader
              onFileSelected={handleFileSelected}
              onAnalyze={analyzeResume}
              file={file}
              error={error}
              isAnalyzing={isAnalyzing}
            />
          </motion.div>
        );
        
      case 'analysis':
        return analysis ? (
          <motion.div
            key="analysis"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            ref={analysisRef}
            className="min-h-[80vh]"
          >
            <ResumeAnalysisResult
              analysis={analysis}
              onDownload={downloadAnalysisReport}
              onShare={shareAnalysis}
            />
            
            <AnimatePresence>
              {showShareOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-10 right-10 bg-white p-4 rounded-lg shadow-lg z-50"
                >
                  <div className="flex flex-col space-y-3">
                    <div className="text-sm font-medium text-gray-600">Поделиться отчетом:</div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="text-sm border rounded px-2 py-1 flex-grow"
                      />
                      <button
                        onClick={copyShareLink}
                        className="p-2 bg-blue-100 rounded-md hover:bg-blue-200"
                      >
                        {isCopied ? <FiCheckCircle className="text-green-600" /> : <FiShare2 />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="no-analysis"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-[80vh] flex flex-col items-center justify-center text-center p-8"
          >
            <div className="bg-blue-50 rounded-full p-6 mb-6">
              <HiOutlineDocumentSearch className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Анализ еще не выполнен</h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Загрузите ваше резюме, чтобы получить подробный AI-анализ и рекомендации по улучшению
            </p>
            <button
              onClick={() => setActiveTab('upload')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Загрузить резюме
            </button>
          </motion.div>
        );
        
      case 'tips':
        return renderTips();
        
      case 'history':
        return renderHistoryTab();
        
      default:
        return null;
    }
  };

  return (
    <Box bgGradient={bgGradient} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Heading as="h1" size="xl" mb={3} color={useColorModeValue('teal.600', 'teal.300')}>
                AI-анализ резюме
              </Heading>
              <Text 
                fontSize="lg" 
                color={useColorModeValue('gray.600', 'gray.300')}
                maxW="800px"
                mx="auto"
              >
                Наш AI-помощник проанализирует ваше резюме и предоставит конкретные рекомендации для улучшения. 
                Получите оценку содержания, форматирования и ATS-совместимости, чтобы увеличить шансы на собеседование.
              </Text>
            </motion.div>
          </Box>
          
          <Flex 
            direction={{ base: "column", lg: "row" }} 
            gap={8} 
            align="stretch"
          >
            <Box 
              w={{ base: "100%", lg: "40%" }} 
              p={6}
              bg={useColorModeValue('white', 'gray.800')}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
            >
              <VStack spacing={6} align="stretch">
                <Heading size="md" color={useColorModeValue('teal.600', 'teal.300')}>
                  Загрузите ваше резюме
                </Heading>
                
                <ResumeUploader 
                  onUpload={handleFileSelected} 
                  onAnalyze={analyzeResume}
                  isAnalyzing={isAnalyzing}
                />
                
                <Divider my={2} />
                
                <VStack align="start" spacing={3}>
                  <Heading size="sm" color={useColorModeValue('gray.700', 'gray.300')}>
                    Что мы анализируем:
                  </Heading>
                  
                  <HStack align="start" spacing={2}>
                    <Icon as={FaCheckCircle} color="green.500" mt={1} />
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Содержание и ключевые навыки
                    </Text>
                  </HStack>
                  
                  <HStack align="start" spacing={2}>
                    <Icon as={FaCheckCircle} color="green.500" mt={1} />
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Форматирование и читаемость
                    </Text>
                  </HStack>
                  
                  <HStack align="start" spacing={2}>
                    <Icon as={FaCheckCircle} color="green.500" mt={1} />
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      ATS-совместимость
                    </Text>
                  </HStack>
                  
                  <HStack align="start" spacing={2}>
                    <Icon as={FaCheckCircle} color="green.500" mt={1} />
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Соответствие вашему профилю и желаемой должности
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
            
            <Box 
              w={{ base: "100%", lg: "60%" }}
              p={{ base: 4, md: 6 }}
            >
              {analysis ? (
                <ResumeAnalysisResult 
                  analysis={analysis} 
                  downloadPDF={downloadAnalysisReport} 
                />
              ) : (
                <Flex 
                  direction="column" 
                  align="center" 
                  justify="center" 
                  h="100%" 
                  p={8}
                  bg={useColorModeValue('white', 'gray.800')}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="md"
                  textAlign="center"
                >
                  <Icon as={IoSparkles} boxSize="4rem" color="teal.400" mb={4} />
                  <Heading size="md" mb={3} color={useColorModeValue('gray.700', 'gray.300')}>
                    Готовы улучшить ваше резюме?
                  </Heading>
                  <Text color={useColorModeValue('gray.600', 'gray.400')} mb={6}>
                    Загрузите ваше резюме, чтобы получить персонализированный анализ и конкретные рекомендации по улучшению.
                  </Text>
                  <Flex wrap="wrap" justify="center" gap={3}>
                    <Badge colorScheme="teal" p={2} borderRadius="full">Анализ содержания</Badge>
                    <Badge colorScheme="purple" p={2} borderRadius="full">Оценка структуры</Badge>
                    <Badge colorScheme="blue" p={2} borderRadius="full">ATS-оптимизация</Badge>
                    <Badge colorScheme="green" p={2} borderRadius="full">Ключевые слова</Badge>
                    <Badge colorScheme="orange" p={2} borderRadius="full">Рекомендации</Badge>
                  </Flex>
                </Flex>
              )}
            </Box>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default ResumeReview; 