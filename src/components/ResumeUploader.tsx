import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFile, FiX, FiCheck } from 'react-icons/fi';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          `}
        >
          <input {...getInputProps()} />
          
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <FiUpload
                className={`w-12 h-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл резюме сюда'}
              </h3>
              <p className="text-sm text-gray-500">
                или нажмите для выбора файла
              </p>
            </div>
            
            <div className="text-xs text-gray-400">
              Поддерживаемые форматы: PDF, DOC, DOCX, TXT
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FiFile className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelected(null as any);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAnalyze}
                className="mt-6 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiCheck className="w-5 h-5 mr-2" />
                Начать анализ
              </motion.button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50 rounded-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiX className="h-5 w-5 text-red-400" />
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
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: <FiUpload className="w-6 h-6" />,
            title: 'Быстрая загрузка',
            description: 'Поддержка основных форматов файлов'
          },
          {
            icon: <FiCheck className="w-6 h-6" />,
            title: 'AI Анализ',
            description: 'Мгновенная оценка и рекомендации'
          },
          {
            icon: <FiFile className="w-6 h-6" />,
            title: 'Детальный отчет',
            description: 'Получите подробный анализ вашего резюме'
          }
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-blue-500 mb-4">
              {feature.icon}
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ResumeUploader; 