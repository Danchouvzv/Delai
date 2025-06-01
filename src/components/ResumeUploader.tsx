import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Text, 
  Flex, 
  Icon, 
  useColorModeValue,
  Progress,
  VStack,
  HStack,
  Badge,
  Tooltip,
  Alert,
  AlertIcon,
  CloseButton
} from '@chakra-ui/react';
import { 
  FaFileUpload, 
  FaFilePdf, 
  FaFileWord, 
  FaFileAlt, 
  FaCloudUploadAlt,
  FaExclamationCircle
} from 'react-icons/fa';
import { MdOutlineFileUpload } from 'react-icons/md';
import { IoCloudDone, IoCloudUpload } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeUploaderProps {
  onUpload: (file: File) => Promise<string | null>;
  onAnalyze: (fileUrl: string) => Promise<void>;
  isAnalyzing?: boolean;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ 
  onUpload, 
  onAnalyze,
  isAnalyzing = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('teal.300', 'teal.200');
  const dragBorderColor = useColorModeValue('teal.500', 'teal.300');
  const textColor = useColorModeValue('gray.500', 'gray.300');
  const iconColor = useColorModeValue('teal.500', 'teal.300');
  
  // Симуляция прогресса загрузки
  useEffect(() => {
    if (isUploading && uploadProgress < 95) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => prev + 5);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isUploading, uploadProgress]);
  
  const resetUploader = () => {
    setFile(null);
    setFileUrl(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  
  const processFile = (selectedFile: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError('Пожалуйста, загрузите файл в формате PDF, DOC, DOCX или TXT');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) { // 5 MB
      setUploadError('Размер файла превышает 5 МБ');
      return;
    }
    
    setFile(selectedFile);
    setUploadError(null);
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const url = await onUpload(file);
      if (url) {
        setFileUrl(url);
        setUploadProgress(100);
      } else {
        setUploadError('Ошибка при загрузке файла');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleAnalyze = async () => {
    if (fileUrl) {
      await onAnalyze(fileUrl);
    }
  };
  
  const FileIcon = () => {
    if (!file) return <FaCloudUploadAlt />;
    
    switch (file.type) {
      case 'application/pdf':
        return <FaFilePdf />;
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <FaFileWord />;
      case 'text/plain':
        return <FaFileAlt />;
      default:
        return <FaFileUpload />;
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const MotionBox = motion(Box);
  const MotionFlex = motion(Flex);
  const MotionIcon = motion(Icon);

  return (
    <AnimatePresence mode="wait">
      <VStack spacing={4} w="100%">
        {uploadError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">{uploadError}</Text>
            <CloseButton 
              position="absolute" 
              right="8px" 
              top="8px" 
              onClick={() => setUploadError(null)} 
            />
          </Alert>
        )}
        
        {!file ? (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            w="100%"
          >
            <Box
              p={6}
              borderWidth="2px"
              borderStyle="dashed"
              borderRadius="lg"
              borderColor={isDragging ? dragBorderColor : borderColor}
              bg={bgColor}
              position="relative"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              transition="all 0.3s"
              _hover={{ borderColor: hoverBorderColor }}
              textAlign="center"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.txt"
              />
              
              <MotionFlex
                direction="column"
                align="center"
                justify="center"
                position="relative"
                zIndex="1"
              >
                <MotionIcon
                  as={IoCloudUpload}
                  boxSize="3rem"
                  color={iconColor}
                  mb={3}
                  animate={{ 
                    y: isDragging ? [0, -10, 0] : 0 
                  }}
                  transition={{ 
                    repeat: isDragging ? Infinity : 0, 
                    duration: 1 
                  }}
                />
                
                <Text fontWeight="bold" mb={2}>
                  Перетащите файл резюме или нажмите для выбора
                </Text>
                <Text fontSize="sm" color={textColor}>
                  Поддерживаемые форматы: PDF, DOCX, TXT (макс. 5МБ)
                </Text>
              </MotionFlex>
              
              {isDragging && (
                <MotionBox
                  position="absolute"
                  top="50%"
                  left="50%"
                  borderRadius="50%"
                  w="150px"
                  h="150px"
                  bg={`${iconColor}20`}
                  transform="translate(-50%, -50%)"
                  zIndex="0"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </Box>
            
            <Flex justify="center" mt={4} wrap="wrap" gap={2}>
              <Tooltip label="PDF файлы">
                <Badge colorScheme="red" p={2} borderRadius="md">
                  <HStack spacing={1}>
                    <Icon as={FaFilePdf} />
                    <Text>PDF</Text>
                  </HStack>
                </Badge>
              </Tooltip>
              
              <Tooltip label="Word документы">
                <Badge colorScheme="blue" p={2} borderRadius="md">
                  <HStack spacing={1}>
                    <Icon as={FaFileWord} />
                    <Text>DOCX</Text>
                  </HStack>
                </Badge>
              </Tooltip>
              
              <Tooltip label="Текстовые файлы">
                <Badge colorScheme="gray" p={2} borderRadius="md">
                  <HStack spacing={1}>
                    <Icon as={FaFileAlt} />
                    <Text>TXT</Text>
                  </HStack>
                </Badge>
              </Tooltip>
            </Flex>
          </MotionBox>
        ) : (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            w="100%"
          >
            <Box
              p={5}
              borderWidth="1px"
              borderRadius="lg"
              borderColor={borderColor}
              bg={bgColor}
            >
              <VStack spacing={4} align="stretch">
                <Flex align="center" justify="space-between">
                  <HStack>
                    <Icon as={FileIcon} color={iconColor} boxSize="1.5rem" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                        {file.name}
                      </Text>
                      <Text fontSize="xs" color={textColor}>
                        {formatFileSize(file.size)}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <CloseButton 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUploader();
                    }} 
                  />
                </Flex>
                
                {isUploading && (
                  <Box>
                    <Text fontSize="xs" mb={1}>
                      Загрузка: {uploadProgress}%
                    </Text>
                    <Progress 
                      value={uploadProgress} 
                      size="sm" 
                      colorScheme="teal" 
                      borderRadius="full" 
                    />
                  </Box>
                )}
                
                <Flex gap={2} justify="center">
                  {!fileUrl ? (
                    <Button
                      colorScheme="teal"
                      leftIcon={<Icon as={MdOutlineFileUpload} />}
                      onClick={handleUpload}
                      isLoading={isUploading}
                      loadingText="Загрузка..."
                      w="100%"
                    >
                      Загрузить
                    </Button>
                  ) : (
                    <Button
                      colorScheme="purple"
                      leftIcon={<Icon as={IoCloudDone} />}
                      onClick={handleAnalyze}
                      isLoading={isAnalyzing}
                      loadingText="Анализ..."
                      w="100%"
                    >
                      Анализировать
                    </Button>
                  )}
                </Flex>
              </VStack>
            </Box>
          </MotionBox>
        )}
      </VStack>
    </AnimatePresence>
  );
};

export default ResumeUploader; 