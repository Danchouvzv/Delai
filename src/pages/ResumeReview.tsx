import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  Button,
  useToast,
  Flex,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaRobot, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import { UserContext } from '../contexts/UserContext';
import { generateText } from '../api/gemini';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import ResumeUploader from '../components/resume/ResumeUploader';
import ResumeAnalysisResult from '../components/resume/ResumeAnalysisResult';
import AnimatedCounter from '../components/common/AnimatedCounter';
import { ResumeAnalysis } from '../types';
import { FiFileText } from 'react-icons/fi';
import EmptyStateCard from '../components/networking/EmptyStateCard';

const MotionBox = motion(Box);

const ResumeReview: React.FC = () => {
  const { user, userData, setUserData } = useContext(UserContext);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(
    userData?.resume?.analysis || null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resumeText, setResumeText] = useState<string>('');
  
  const toast = useToast();
  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    // If user already has resume analysis, set it
    if (userData?.resume?.analysis) {
      setAnalysis(userData.resume.analysis);
    }
  }, [userData]);
  
  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
    
    if (!user?.uid) {
      setError('You must be logged in to analyze your resume.');
      return;
    }
    
    // Read file content for text extraction
    try {
      const text = await readFileAsText(uploadedFile);
      setResumeText(text);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Could not read file content. Please try a different file format.');
    }
  };
  
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result.toString());
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  };
  
  const uploadResumeToFirebase = async (file: File): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    const fileRef = ref(storage, `resumes/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };
  
  const generateResumeAnalysis = async (resumeText: string) => {
    try {
      // Extract user profile data for context
      const userProfile = {
        name: userData?.displayName || '',
        education: userData?.education?.map((edu: any) => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          field: edu.field || '',
          startDate: edu.startDate || '',
          endDate: edu.endDate || ''
        })) || [],
        experience: userData?.experience?.map((exp: any) => ({
          title: exp.title || '',
          company: exp.company || '',
          description: exp.description || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || ''
        })) || [],
        skills: userData?.skills || []
      };
      
      // Prompt for Gemini
      const prompt = `
        You are a professional resume reviewer and career coach. Analyze the following resume text and provide detailed feedback.
        
        USER PROFILE CONTEXT:
        ${JSON.stringify(userProfile, null, 2)}
        
        RESUME TEXT:
        ${resumeText}
        
        Provide a comprehensive analysis in the following JSON format:
        {
          "overallScore": <number between 0-100>,
          "summary": "<brief summary of the resume's strengths and weaknesses>",
          "strengths": ["<strength 1>", "<strength 2>", ...],
          "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
          "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
          "keywordMatch": <number between 0-100 representing ATS keyword matching score>,
          "formattingScore": <number between 0-100 representing formatting quality>,
          "contentScore": <number between 0-100 representing content quality>,
          "improvedContent": "<improved version of the resume content>"
        }
        
        Make sure the response is valid JSON that can be parsed. Focus on providing actionable feedback that will help the user improve their resume.
      `;
      
      const response = await generateText(prompt);
      
      // Parse the JSON response
      try {
        let jsonStr = '';
        
        // Check if response is an object with a text property or a string
        if (typeof response === 'string') {
          // Find JSON content in the response (in case there's additional text)
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No valid JSON found in the response');
          jsonStr = jsonMatch[0];
        } else if (response && typeof response === 'object' && 'text' in response) {
          // It's an object with a text property
          const responseText = response.text;
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No valid JSON found in the response');
          jsonStr = jsonMatch[0];
        } else {
          throw new Error('Unexpected response format from Gemini API');
        }
        
        // Parse the JSON string into an object
        const analysisResult = JSON.parse(jsonStr) as ResumeAnalysis;
        return analysisResult;
      } catch (parseError) {
        console.error('Error parsing analysis result:', parseError);
        throw new Error('Failed to parse analysis result');
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      throw error;
    }
  };
  
  const handleAnalyzeResume = async () => {
    if (!file || !resumeText || !user?.uid) {
      setError('Please upload a resume file first.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Upload file to Firebase Storage
      const downloadURL = await uploadResumeToFirebase(file);
      
      // Generate analysis using Gemini
      const analysisResult = await generateResumeAnalysis(resumeText);
      
      // Update user data in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          'resume.url': downloadURL,
          'resume.fileName': file.name,
          'resume.uploadDate': new Date().toISOString(),
          'resume.analysis': analysisResult
        });
        
        // Update local state
        setAnalysis(analysisResult);
        
        // Update context
        if (userData) {
          setUserData({
            ...userData,
            resume: {
              url: downloadURL,
              fileName: file.name,
              uploadDate: new Date().toISOString(),
              analysis: analysisResult
            }
          });
        }
        
        toast({
          title: 'Resume analyzed successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error('Error analyzing resume:', err);
      setError(err.message || 'An error occurred while analyzing your resume.');
      
      toast({
        title: 'Analysis failed',
        description: err.message || 'An error occurred while analyzing your resume.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleDownloadPdf = () => {
    if (!analysis) return;
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait' as const,
        unit: 'mm',
        format: 'a4',
      });
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(0, 128, 128);
      doc.text('Resume Analysis Report', 105, 20, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 27, { align: 'center' });
      
      // Add overall score
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Overall Score: ${analysis.overallScore}/100`, 20, 40);
      
      // Add summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 50);
      doc.setFontSize(10);
      
      // Split long text into lines
      const splitSummary = doc.splitTextToSize(analysis.summary, 170);
      doc.text(splitSummary, 20, 55);
      
      let yPosition = 55 + splitSummary.length * 5;
      
      // Add strengths
      doc.setFontSize(14);
      doc.text('Strengths', 20, yPosition + 10);
      doc.setFontSize(10);
      
      yPosition += 15;
      analysis.strengths.forEach((strength, index) => {
        const text = `• ${strength}`;
        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 5;
      });
      
      // Add weaknesses
      doc.setFontSize(14);
      doc.text('Areas for Improvement', 20, yPosition + 10);
      doc.setFontSize(10);
      
      yPosition += 15;
      analysis.weaknesses.forEach((weakness, index) => {
        const text = `• ${weakness}`;
        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 5;
      });
      
      // Add suggestions
      doc.setFontSize(14);
      doc.text('Suggestions', 20, yPosition + 10);
      doc.setFontSize(10);
      
      yPosition += 15;
      analysis.suggestions.forEach((suggestion, index) => {
        const text = `• ${suggestion}`;
        const splitText = doc.splitTextToSize(text, 170);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 5;
      });
      
      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by JumysAl Resume Review', 105, 285, { align: 'center' });
      
      // Save the PDF
      doc.save('resume-analysis.pdf');
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your resume analysis has been downloaded as a PDF.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: 'Download failed',
        description: 'Failed to generate PDF. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Container maxW="container.xl" py={10}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        mb={10}
      >
        <HStack spacing={3} mb={2}>
          <Icon as={FaRobot} boxSize={6} color="teal.500" />
          <Heading as="h1" size="xl" color={textColor}>
            AI Resume Review
          </Heading>
        </HStack>
        <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
          Get professional feedback on your resume with our AI-powered analysis tool
        </Text>
      </MotionBox>
      
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Flex 
        direction={{ base: 'column', lg: 'row' }} 
        gap={8} 
        align="flex-start"
      >
        <VStack 
          spacing={6} 
          align="stretch" 
          flex={{ base: '1', lg: '0.4' }}
          position="sticky"
          top="100px"
        >
          <Box
            bg={bgColor}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            p={6}
            boxShadow="sm"
          >
            <VStack spacing={4} align="stretch">
              <HStack>
                <Icon as={FaFileAlt} color="teal.500" />
                <Heading size="md" color={textColor}>Upload Your Resume</Heading>
              </HStack>
              
              <ResumeUploader 
                onFileUpload={handleFileUpload} 
                isAnalyzing={isAnalyzing}
              />
              
              {file && (
                <VStack align="stretch" spacing={4} mt={4}>
                  <Divider />
                  
                  <Button
                    colorScheme="teal"
                    size="lg"
                    leftIcon={<FaChartLine />}
                    onClick={handleAnalyzeResume}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing..."
                    isDisabled={!file || isAnalyzing}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                    transition="all 0.2s"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                  </Button>
                  
                  {isAnalyzing && (
                    <VStack spacing={2}>
                      <Text fontSize="sm" color={textColor}>
                        Our AI is analyzing your resume...
                      </Text>
                      <HStack spacing={4} justify="center">
                        <Box textAlign="center">
                          <AnimatedCounter 
                            from={0} 
                            to={100} 
                            duration={8} 
                            formatter={(val) => `${val}%`}
                            fontWeight="bold"
                            color="teal.500"
                          />
                          <Text fontSize="xs" color="gray.500">Processing</Text>
                        </Box>
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              )}
            </VStack>
          </Box>
          
          <Box
            bg={bgColor}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            p={6}
            boxShadow="sm"
          >
            <VStack spacing={4} align="stretch">
              <HStack>
                <Icon as={FaInfoCircle} color="blue.500" />
                <Heading size="md" color={textColor}>How It Works</Heading>
              </HStack>
              
              <VStack align="stretch" spacing={4}>
                <HStack align="flex-start">
                  <Box
                    bg="blue.50"
                    color="blue.500"
                    borderRadius="full"
                    w="24px"
                    h="24px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    mt={0.5}
                  >
                    1
                  </Box>
                  <Text color={textColor}>
                    Upload your resume in PDF, DOCX, or TXT format
                  </Text>
                </HStack>
                
                <HStack align="flex-start">
                  <Box
                    bg="blue.50"
                    color="blue.500"
                    borderRadius="full"
                    w="24px"
                    h="24px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    mt={0.5}
                  >
                    2
                  </Box>
                  <Text color={textColor}>
                    Our AI analyzes your resume for content, format, and ATS compatibility
                  </Text>
                </HStack>
                
                <HStack align="flex-start">
                  <Box
                    bg="blue.50"
                    color="blue.500"
                    borderRadius="full"
                    w="24px"
                    h="24px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    mt={0.5}
                  >
                    3
                  </Box>
                  <Text color={textColor}>
                    Receive detailed feedback and suggestions for improvement
                  </Text>
                </HStack>
                
                <HStack align="flex-start">
                  <Box
                    bg="blue.50"
                    color="blue.500"
                    borderRadius="full"
                    w="24px"
                    h="24px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="sm"
                    flexShrink={0}
                    mt={0.5}
                  >
                    4
                  </Box>
                  <Text color={textColor}>
                    Download a PDF report or copy improved content to enhance your resume
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Box>
        </VStack>
        
        <Box flex={{ base: '1', lg: '0.6' }}>
          {isAnalyzing ? (
            <Flex 
              direction="column" 
              align="center" 
              justify="center" 
              bg={bgColor}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={10}
              minH="400px"
            >
              <Spinner size="xl" color="teal.500" thickness="4px" speed="0.65s" mb={6} />
              <Heading size="md" mb={3} textAlign="center">
                Analyzing Your Resume
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')} textAlign="center">
                Our AI is carefully reviewing your resume. This may take a minute or two.
              </Text>
            </Flex>
          ) : analysis ? (
            <ResumeAnalysisResult 
              analysis={analysis} 
              onDownloadPdf={handleDownloadPdf} 
            />
          ) : (
            <EmptyStateCard
              icon={FiFileText}
              title="No Resume Analysis Yet"
              description="Upload your resume and click 'Analyze Resume' to get detailed feedback and suggestions for improvement."
              colorScheme="teal"
            />
          )}
        </Box>
      </Flex>
    </Container>
  );
};

export default ResumeReview; 