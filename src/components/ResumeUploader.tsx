import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFile, FiX, FiCheck, FiCpu, FiAward, FiLayout } from 'react-icons/fi';
import { AiOutlineFileSearch, AiOutlineRobot } from 'react-icons/ai';
import { BsFiletypePdf, BsFiletypeDocx, BsFiletypeTxt, BsStars } from 'react-icons/bs';

interface ResumeUploaderProps {
  onFileSelected: (file: File) => void;
  onAnalyze: () => void;
  file: File | null;
  error: string | null;
  isAnalyzing?: boolean;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onFileSelected,
  onAnalyze,
  file,
  error,
  isAnalyzing = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Имитация прогресса загрузки для улучшения UX
  useEffect(() => {
    if (file && uploadProgress < 100) {
      const timer = setTimeout(() => {
        setUploadProgress(Math.min(uploadProgress + 25, 100));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [file, uploadProgress]);

  // Сбрасываем прогресс при выборе нового файла
  useEffect(() => {
    if (file) {
      setUploadProgress(0);
    }
  }, [file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <BsFiletypePdf className="w-8 h-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <BsFiletypeDocx className="w-8 h-8 text-blue-600" />;
      case 'txt':
        return <BsFiletypeTxt className="w-8 h-8 text-gray-600" />;
      default:
        return <FiFile className="w-8 h-8 text-blue-500" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto"
    >
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-8 border border-blue-100"
      >
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden
            border-3 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}
          `}
        >
          <input {...getInputProps()} />
          
          {/* Пульсирующий круг на заднем плане */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: isDragActive ? [1, 1.1, 1] : [1, 1.05, 1],
                opacity: isDragActive ? [0.1, 0.2, 0.1] : [0.05, 0.1, 0.05],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-64 h-64 rounded-full bg-blue-400"
            />
          </div>
          
          <motion.div
            initial={{ scale: 1 }}
            animate={{ 
              scale: isDragActive ? 1.05 : 1,
              y: isDragActive ? -5 : 0
            }}
            className="space-y-6 relative z-10"
          >
            <motion.div 
              className="flex justify-center"
              animate={{ 
                y: isDragActive ? [0, -10, 0] : 0 
              }}
              transition={{ 
                duration: 1.5,
                repeat: isDragActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-5 bg-white rounded-full shadow-md"
              >
                <AiOutlineFileSearch
                  className={`w-12 h-12 ${isDragActive ? 'text-blue-600' : 'text-blue-500'}`}
                />
              </motion.div>
            </motion.div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">
                {isDragActive ? 'Отпустите файл для загрузки' : 'Перетащите файл резюме сюда'}
              </h3>
              <p className="text-md text-gray-600">
                или <span className="text-blue-600 font-medium">нажмите для выбора файла</span>
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <motion.div whileHover={{ scale: 1.1 }} className="flex flex-col items-center">
                <BsFiletypePdf className="w-8 h-8 text-red-500 mb-2" />
                <span className="text-xs text-gray-500">PDF</span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} className="flex flex-col items-center">
                <BsFiletypeDocx className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-xs text-gray-500">DOCX</span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} className="flex flex-col items-center">
                <BsFiletypeTxt className="w-8 h-8 text-gray-600 mb-2" />
                <span className="text-xs text-gray-500">TXT</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mt-6"
            >
              <div className="flex items-center p-5 bg-white rounded-xl shadow-md border border-blue-100">
                <div className="mr-4">
                  {getFileIcon(file.name)}
                </div>
                <div className="flex-grow">
                  <div className="text-md font-medium text-gray-900 mb-1">
                    {file.name}
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {uploadProgress === 100 ? 'Готов к анализу' : 'Загрузка...'}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelected(null as any);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: uploadProgress === 100 ? 1 : 0.7, y: 0 }}
                whileHover={{ scale: uploadProgress === 100 ? 1.03 : 1 }}
                whileTap={{ scale: uploadProgress === 100 ? 0.98 : 1 }}
                onClick={onAnalyze}
                disabled={uploadProgress < 100 || isAnalyzing}
                className={`mt-6 w-full flex items-center justify-center px-6 py-4 text-base font-bold rounded-xl
                  ${uploadProgress === 100 && !isAnalyzing
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700"
                    : "bg-gray-100 text-gray-400"
                  } 
                  transition-all duration-300 ease-in-out`}
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mr-3"
                    >
                      <AiOutlineRobot className="w-6 h-6" />
                    </motion.div>
                    Анализируем ваше резюме...
                  </>
                ) : (
                  <>
                    <BsStars className="w-6 h-6 mr-3" />
                    Начать AI-анализ резюме
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-5 bg-red-50 rounded-xl border border-red-100"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiX className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Ошибка загрузки
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
      >
        {[
          {
            icon: <AiOutlineRobot className="w-8 h-8" />,
            title: 'AI-анализ',
            description: 'Мгновенная оценка вашего резюме с помощью искусственного интеллекта',
            color: 'from-blue-500 to-blue-600',
            delay: 0.1
          },
          {
            icon: <FiLayout className="w-8 h-8" />,
            title: 'Улучшение структуры',
            description: 'Рекомендации по оптимизации структуры и содержания',
            color: 'from-purple-500 to-purple-600',
            delay: 0.2
          },
          {
            icon: <FiAward className="w-8 h-8" />,
            title: 'Конкурентное преимущество',
            description: 'Выделитесь среди других кандидатов с идеальным резюме',
            color: 'from-green-500 to-green-600',
            delay: 0.3
          }
        ].map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative p-6 rounded-xl shadow-lg overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-90`}></div>
            
            <div className="relative z-10">
              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg inline-block mb-4">
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white text-opacity-80">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ResumeUploader; 