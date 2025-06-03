import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Badge,
  Divider,
  Button,
  useColorModeValue,
  Flex,
  Icon,
  Tooltip,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaDownload, FaClipboard, FaChartLine } from 'react-icons/fa';
import { MdCheckCircle, MdErrorOutline } from 'react-icons/md';
import { ResumeAnalysis } from '../../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface ResumeAnalysisResultProps {
  analysis: ResumeAnalysis;
  onDownloadPdf: () => void;
}

const ResumeAnalysisResult: React.FC<ResumeAnalysisResultProps> = ({ analysis, onDownloadPdf }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('gray.700', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('teal.500', 'teal.300');
  
  const scoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };
  
  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };
  
  // Ensure analysis has all required properties with defaults
  const safeAnalysis = {
    overallScore: analysis.overallScore || 0,
    summary: analysis.summary || '',
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    suggestions: analysis.suggestions || [],
    keywordMatch: analysis.keywordMatch || 0,
    formattingScore: analysis.formattingScore || 0,
    contentScore: analysis.contentScore || 0,
    improvedContent: analysis.improvedContent || '',
  };

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      boxShadow="lg"
      p={6}
      mb={8}
    >
      {/* Header with overall score */}
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" mb={6}>
        <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2}>
          <Heading as="h2" size="lg" color={headingColor}>
            Resume Analysis Results
          </Heading>
          <Text color={textColor}>
            Comprehensive evaluation of your resume's effectiveness
          </Text>
        </VStack>
        
        <MotionFlex
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          direction="column"
          align="center"
          bg={useColorModeValue(`${scoreColor(safeAnalysis.overallScore)}.50`, `${scoreColor(safeAnalysis.overallScore)}.900`)}
          p={4}
          borderRadius="lg"
          mt={{ base: 4, md: 0 }}
        >
          <Text fontWeight="bold" fontSize="sm" color={textColor}>Overall Score</Text>
          <Heading color={`${scoreColor(safeAnalysis.overallScore)}.500`} size="xl">
            {safeAnalysis.overallScore}/100
          </Heading>
          <Badge colorScheme={scoreColor(safeAnalysis.overallScore)} mt={1}>
            {safeAnalysis.overallScore >= 80 ? 'Excellent' : 
             safeAnalysis.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </MotionFlex>
      </Flex>
      
      <Divider mb={6} />
      
      {/* Score breakdown */}
      <Box mb={8}>
        <Heading as="h3" size="md" mb={4} color={headingColor}>
          Score Breakdown
        </Heading>
        
        <HStack spacing={4} mb={2}>
          <Icon as={FaChartLine} color={accentColor} />
          <Text fontWeight="medium" color={headingColor}>Keyword Match</Text>
        </HStack>
        <Flex align="center" mb={4}>
          <Progress 
            value={safeAnalysis.keywordMatch} 
            colorScheme={scoreColor(safeAnalysis.keywordMatch)} 
            size="sm" 
            borderRadius="full" 
            flex="1" 
            mr={3}
          />
          <Text fontWeight="bold">{safeAnalysis.keywordMatch}%</Text>
        </Flex>
        
        <HStack spacing={4} mb={2}>
          <Icon as={FaChartLine} color={accentColor} />
          <Text fontWeight="medium" color={headingColor}>Formatting Quality</Text>
        </HStack>
        <Flex align="center" mb={4}>
          <Progress 
            value={safeAnalysis.formattingScore} 
            colorScheme={scoreColor(safeAnalysis.formattingScore)} 
            size="sm" 
            borderRadius="full" 
            flex="1" 
            mr={3}
          />
          <Text fontWeight="bold">{safeAnalysis.formattingScore}%</Text>
        </Flex>
        
        <HStack spacing={4} mb={2}>
          <Icon as={FaChartLine} color={accentColor} />
          <Text fontWeight="medium" color={headingColor}>Content Quality</Text>
        </HStack>
        <Flex align="center">
          <Progress 
            value={safeAnalysis.contentScore} 
            colorScheme={scoreColor(safeAnalysis.contentScore)} 
            size="sm" 
            borderRadius="full" 
            flex="1" 
            mr={3}
          />
          <Text fontWeight="bold">{safeAnalysis.contentScore}%</Text>
        </Flex>
      </Box>
      
      {/* Summary */}
      <Box mb={6}>
        <HStack mb={3}>
          <Icon as={FaInfoCircle} color={accentColor} />
          <Heading as="h3" size="md" color={headingColor}>
            Summary
          </Heading>
          <Tooltip label={copiedSection === 'summary' ? 'Copied!' : 'Copy to clipboard'}>
            <Button 
              size="xs" 
              variant="ghost" 
              onClick={() => copyToClipboard(safeAnalysis.summary, 'summary')}
              leftIcon={<FaClipboard />}
            >
              {copiedSection === 'summary' ? 'Copied!' : 'Copy'}
            </Button>
          </Tooltip>
        </HStack>
        <Box 
          p={4} 
          bg={useColorModeValue('gray.50', 'gray.700')} 
          borderRadius="md" 
          fontSize="sm"
          color={textColor}
        >
          {safeAnalysis.summary}
        </Box>
      </Box>
      
      {/* Strengths, Weaknesses, Suggestions */}
      <Accordion allowMultiple defaultIndex={[0]} mb={6}>
        <AccordionItem border="none">
          <AccordionButton 
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }} 
            borderRadius="md" 
            p={3}
          >
            <HStack flex="1" textAlign="left">
              <Icon as={FaCheckCircle} color="green.500" />
              <Heading as="h3" size="sm" color={headingColor}>
                Strengths
              </Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <List spacing={2}>
              {safeAnalysis.strengths.map((strength, index) => (
                <ListItem key={index} display="flex" alignItems="flex-start">
                  <ListIcon as={MdCheckCircle} color="green.500" mt={1} />
                  <Text color={textColor}>{strength}</Text>
                </ListItem>
              ))}
            </List>
          </AccordionPanel>
        </AccordionItem>
        
        <AccordionItem border="none">
          <AccordionButton 
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }} 
            borderRadius="md" 
            p={3}
          >
            <HStack flex="1" textAlign="left">
              <Icon as={FaExclamationTriangle} color="orange.500" />
              <Heading as="h3" size="sm" color={headingColor}>
                Areas for Improvement
              </Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <List spacing={2}>
              {safeAnalysis.weaknesses.map((weakness, index) => (
                <ListItem key={index} display="flex" alignItems="flex-start">
                  <ListIcon as={MdErrorOutline} color="orange.500" mt={1} />
                  <Text color={textColor}>{weakness}</Text>
                </ListItem>
              ))}
            </List>
          </AccordionPanel>
        </AccordionItem>
        
        <AccordionItem border="none">
          <AccordionButton 
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }} 
            borderRadius="md" 
            p={3}
          >
            <HStack flex="1" textAlign="left">
              <Icon as={FaInfoCircle} color="blue.500" />
              <Heading as="h3" size="sm" color={headingColor}>
                Actionable Suggestions
              </Heading>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <List spacing={2}>
              {safeAnalysis.suggestions.map((suggestion, index) => (
                <ListItem key={index} display="flex" alignItems="flex-start">
                  <ListIcon as={FaInfoCircle} color="blue.500" mt={1} />
                  <Text color={textColor}>{suggestion}</Text>
                </ListItem>
              ))}
            </List>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      
      {/* Improved Content */}
      {safeAnalysis.improvedContent && (
        <Box mb={6}>
          <HStack mb={3}>
            <Icon as={FaInfoCircle} color={accentColor} />
            <Heading as="h3" size="md" color={headingColor}>
              Improved Resume Content
            </Heading>
            <Tooltip label={copiedSection === 'improved' ? 'Copied!' : 'Copy to clipboard'}>
              <Button 
                size="xs" 
                variant="ghost" 
                onClick={() => copyToClipboard(safeAnalysis.improvedContent, 'improved')}
                leftIcon={<FaClipboard />}
              >
                {copiedSection === 'improved' ? 'Copied!' : 'Copy'}
              </Button>
            </Tooltip>
          </HStack>
          <Box borderRadius="md" overflow="hidden">
            <SyntaxHighlighter
              language="markdown"
              style={vscDarkPlus}
              customStyle={{
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                padding: '1rem',
              }}
            >
              {safeAnalysis.improvedContent}
            </SyntaxHighlighter>
          </Box>
        </Box>
      )}
      
      {/* Actions */}
      <Flex justify="flex-end" mt={6}>
        <Button
          leftIcon={<FaDownload />}
          colorScheme="teal"
          onClick={onDownloadPdf}
          _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
          transition="all 0.2s"
        >
          Download Analysis PDF
        </Button>
      </Flex>
    </MotionBox>
  );
};

export default ResumeAnalysisResult; 