import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Input,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Progress,
  Button,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import {
  FaFileUpload,
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { BiTrash } from 'react-icons/bi';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface ResumeUploaderProps {
  onFileUpload: (file: File) => void;
  isAnalyzing?: boolean;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onFileUpload, isAnalyzing = false }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const circleAnimation = useAnimation();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBorderColor = useColorModeValue('teal.400', 'teal.300');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('teal.500', 'teal.300');
  
  // File types
  const acceptedFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  
  const fileTypeIcons: Record<string, any> = {
    'application/pdf': FaFilePdf,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FaFileWord,
    'text/plain': FaFileAlt,
  };
  
  // Simulate upload progress for UI demonstration
  useEffect(() => {
    if (selectedFile && !isAnalyzing) {
      const timer = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      return () => clearInterval(timer);
    } else if (!selectedFile) {
      setUploadProgress(0);
    }
  }, [selectedFile, isAnalyzing]);
  
  // Animate circle when dragging
  useEffect(() => {
    if (dragActive) {
      circleAnimation.start({
        scale: [1, 1.05, 1],
        opacity: [0.5, 0.8, 0.5],
        transition: { 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut" 
        }
      });
    } else {
      circleAnimation.stop();
    }
  }, [dragActive, circleAnimation]);
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };
  
  const handleFiles = (file: File) => {
    setUploadError(null);
    
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload PDF, DOCX, or TXT files only.');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 5MB.');
      return;
    }
    
    setSelectedFile(file);
    setUploadProgress(0);
    onFileUpload(file);
  };
  
  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileTypeLabel = (file: File): string => {
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (file.type === 'text/plain') return 'TXT';
    return 'Unknown';
  };
  
  return (
    <VStack spacing={4} align="stretch">
      <AnimatePresence>
        {!selectedFile && (
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            position="relative"
            overflow="hidden"
          >
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              borderWidth={2}
              borderStyle="dashed"
              borderColor={dragActive ? activeBorderColor : borderColor}
              borderRadius="lg"
              p={6}
              bg={dragActive ? useColorModeValue('gray.50', 'gray.700') : 'transparent'}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: activeBorderColor }}
              onClick={handleButtonClick}
              position="relative"
              zIndex={2}
            >
              <Input
                ref={inputRef}
                type="file"
                height="100%"
                width="100%"
                position="absolute"
                top="0"
                left="0"
                opacity="0"
                aria-hidden="true"
                accept=".pdf,.docx,.txt"
                onChange={handleChange}
                disabled={isAnalyzing}
              />
              
              <VStack spacing={3} py={6}>
                <MotionBox
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <Icon as={FaFileUpload} boxSize={12} color={iconColor} />
                </MotionBox>
                
                <Text fontWeight="bold" color={textColor}>
                  {dragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                </Text>
                
                <Text fontSize="sm" color={textColor}>
                  or click to browse
                </Text>
                
                <HStack spacing={2} mt={2}>
                  <Badge colorScheme="red">PDF</Badge>
                  <Badge colorScheme="blue">DOCX</Badge>
                  <Badge colorScheme="gray">TXT</Badge>
                </HStack>
              </VStack>
            </Box>
            
            {/* Animated background circle */}
            <MotionBox
              position="absolute"
              top="50%"
              left="50%"
              width="150px"
              height="150px"
              borderRadius="full"
              bg={useColorModeValue('teal.50', 'teal.900')}
              zIndex={1}
              initial={{ x: "-50%", y: "-50%", scale: 1, opacity: 0.3 }}
              animate={circleAnimation}
            />
          </MotionBox>
        )}
        
        {selectedFile && (
          <MotionFlex
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            direction="column"
            borderWidth={1}
            borderRadius="lg"
            borderColor={borderColor}
            p={4}
            bg={bgColor}
          >
            <HStack spacing={4} mb={3}>
              <Box 
                bg={useColorModeValue('teal.50', 'teal.900')}
                p={2}
                borderRadius="md"
              >
                <Icon 
                  as={fileTypeIcons[selectedFile.type] || FaFileAlt} 
                  boxSize={6} 
                  color={iconColor} 
                />
              </Box>
              
              <VStack align="flex-start" spacing={0} flex={1}>
                <Text fontWeight="medium" noOfLines={1}>
                  {selectedFile.name}
                </Text>
                <HStack>
                  <Badge>{getFileTypeLabel(selectedFile)}</Badge>
                  <Text fontSize="xs" color={textColor}>
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </HStack>
              </VStack>
              
              {!isAnalyzing && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={clearFile}
                  leftIcon={<BiTrash />}
                >
                  Remove
                </Button>
              )}
            </HStack>
            
            {uploadProgress < 100 && !isAnalyzing ? (
              <Box>
                <Progress 
                  value={uploadProgress} 
                  size="xs" 
                  colorScheme="teal" 
                  borderRadius="full" 
                  mb={1}
                />
                <Text fontSize="xs" color={textColor}>
                  Uploading: {uploadProgress}%
                </Text>
              </Box>
            ) : !isAnalyzing ? (
              <HStack color="green.500">
                <Icon as={FaCheck} />
                <Text fontSize="sm">Upload complete</Text>
              </HStack>
            ) : null}
          </MotionFlex>
        )}
      </AnimatePresence>
      
      {uploadError && (
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          bg={useColorModeValue('red.50', 'red.900')}
          color={useColorModeValue('red.500', 'red.200')}
          p={3}
          borderRadius="md"
          mt={2}
        >
          <HStack>
            <Icon as={FaExclamationTriangle} />
            <Text fontSize="sm">{uploadError}</Text>
          </HStack>
        </MotionBox>
      )}
    </VStack>
  );
};

export default ResumeUploader; 