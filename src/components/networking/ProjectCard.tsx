import React from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Avatar,
  HStack,
  IconButton,
  Tag,
  TagLabel,
  useColorModeValue,
  Button,
  Tooltip,
  Spacer,
  CircularProgress,
  CircularProgressLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  VStack,
  Divider,
  Grid,
  GridItem,
  Icon
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaThumbsUp, FaInfoCircle, FaCheck, FaTimes, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ApplicationStatus } from '../../hooks/useApplicationStatuses';

const MotionBox = motion(Box);

interface ProjectCardProps {
  projectId: string;
  title: string;
  description: string;
  tags: string[];
  mode: 'remote' | 'onsite' | 'hybrid';
  ownerName: string;
  ownerAvatar?: string;
  teamSize: number;
  onApply?: (projectId: string) => void;
  applicationStatus?: ApplicationStatus;
  matchScore?: number;
  factorScores?: {
    skills: number;
    interests: number;
    experience: number;
    mode: number;
    availability: number;
    teamFit: number;
  };
  reasonTags?: string[];
}

/**
 * Card component for displaying project information
 */
const ProjectCard: React.FC<ProjectCardProps> = ({
  projectId,
  title,
  description,
  tags,
  mode,
  ownerName,
  ownerAvatar,
  teamSize,
  onApply,
  applicationStatus,
  matchScore,
  factorScores,
  reasonTags
}) => {
  const navigate = useNavigate();
  
  // Функция для перехода к деталям проекта
  const goToProject = () => {
    navigate(`/project/${projectId}`);
  };
  
  // Улучшенные цвета для светлой/темной темы
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.750');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const tagBg = useColorModeValue('orange.50', 'orange.900');
  const tagColor = useColorModeValue('orange.600', 'orange.200');
  const scoreColor = useColorModeValue(
    matchScore && matchScore >= 80 ? 'green.500' : 
    matchScore && matchScore >= 60 ? 'yellow.500' : 
    'red.500',
    matchScore && matchScore >= 80 ? 'green.300' : 
    matchScore && matchScore >= 60 ? 'yellow.300' : 
    'red.300'
  );
  
  // Цвета для режимов работы
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'remote':
        return useColorModeValue('green.500', 'green.300');
      case 'onsite':
        return useColorModeValue('blue.500', 'blue.300');
      case 'hybrid':
        return useColorModeValue('purple.500', 'purple.300');
      default:
        return useColorModeValue('gray.500', 'gray.300');
    }
  };
  
  // Отображение режима работы
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'remote':
        return 'Удаленно';
      case 'onsite':
        return 'На месте';
      case 'hybrid':
        return 'Гибридно';
      default:
        return mode;
    }
  };
  
  // Render Connect-6 factor scores if available
  const renderFactorScores = () => {
    if (!factorScores) return null;
    
    const factorLabels = {
      skills: 'Навыки',
      interests: 'Интересы',
      experience: 'Опыт',
      mode: 'Режим работы',
      availability: 'Доступность',
      teamFit: 'Команда'
    };
    
    const getScoreIcon = (score: number) => {
      if (score >= 0.7) return FaCheckCircle;
      if (score <= 0.3) return FaTimesCircle;
      return FaInfoCircle;
    };
    
    const getScoreColor = (score: number) => {
      if (score >= 0.7) return 'green.500';
      if (score <= 0.3) return 'red.500';
      return 'yellow.500';
    };
    
    // Count matched factors (score >= 0.7)
    const matchedFactors = Object.values(factorScores).filter(score => score >= 0.7).length;
    
    return (
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="medium" fontSize="sm">
          {matchedFactors} из 6 факторов совпадают
        </Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          {Object.entries(factorScores).map(([factor, score]) => (
            <GridItem key={factor}>
              <HStack spacing={1}>
                <Icon 
                  as={getScoreIcon(score)} 
                  color={getScoreColor(score)} 
                  boxSize="12px" 
                />
                <Text fontSize="xs">
                  {factorLabels[factor as keyof typeof factorLabels]}
                </Text>
              </HStack>
            </GridItem>
          ))}
        </Grid>
      </VStack>
    );
  };
  
  // Отображение статуса заявки
  const renderApplicationStatus = () => {
    if (!applicationStatus) {
      return (
        <Tooltip label="Откликнуться на проект" aria-label="Откликнуться на проект">
          <IconButton
            aria-label={`Откликнуться на проект ${title}`}
            icon={<FaThumbsUp />}
            size="sm"
            colorScheme="orange"
            onClick={(e) => {
              e.stopPropagation();
              onApply && onApply(projectId);
            }}
          />
        </Tooltip>
      );
    }
    
    let icon, label, colorScheme;
    
    switch (applicationStatus) {
      case 'pending':
        icon = <FaClock />;
        label = 'Ожидает';
        colorScheme = 'yellow';
        break;
      case 'accepted':
        icon = <FaCheck />;
        label = 'Принят';
        colorScheme = 'green';
        break;
      case 'declined':
        icon = <FaTimes />;
        label = 'Отклонен';
        colorScheme = 'red';
        break;
    }
    
    return (
      <Badge 
        colorScheme={colorScheme} 
        display="flex" 
        alignItems="center" 
        px={2} 
        py={1} 
        borderRadius="md"
        role="status"
        aria-label={`Статус заявки: ${label}`}
      >
        {icon}
        <Text ml={1}>{label}</Text>
      </Badge>
    );
  };
  
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      cursor="pointer"
      onClick={goToProject}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={cardBorder}
      overflow="hidden"
      bg={cardBg}
      boxShadow="sm"
      _hover={{ 
        boxShadow: 'md',
        bg: cardHoverBg,
        borderColor: useColorModeValue('gray.300', 'gray.600')
      }}
      role="article"
      aria-labelledby={`project-title-${projectId}`}
      sx={{
        transition: "all 0.2s ease-in-out",
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 'lg'
        }
      }}
    >
      <Box p={5}>
        <Flex align="center" mb={4}>
          <Avatar size="sm" name={ownerName} src={ownerAvatar} mr={2} />
          <Text fontSize="sm" color={mutedColor}>
            {ownerName}
          </Text>
          <Spacer />
          
          {/* Match Score with Popover */}
          {matchScore !== undefined && (
            <Popover placement="top" trigger="hover">
              <PopoverTrigger>
                <Box position="relative" cursor="pointer">
                  <CircularProgress 
                    value={matchScore} 
                    color={scoreColor}
                    size="40px"
                    thickness="8px"
                    mr={3}
                  >
                    <CircularProgressLabel fontSize="xs" fontWeight="bold">
                      {matchScore}%
                    </CircularProgressLabel>
                  </CircularProgress>
                </Box>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader fontWeight="semibold">
                  Совместимость: {matchScore}%
                </PopoverHeader>
                <PopoverBody>
                  {renderFactorScores()}
                  {reasonTags && reasonTags.length > 0 && (
                    <>
                      <Divider my={2} />
                      <Text fontSize="xs" fontWeight="medium" mb={1}>
                        Почему этот проект подходит вам:
                      </Text>
                      <HStack flexWrap="wrap" spacing={1}>
                        {reasonTags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} colorScheme="green" fontSize="2xs" px={1}>
                            {tag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </HStack>
                    </>
                  )}
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
          
          {renderApplicationStatus()}
        </Flex>
        
        <Heading
          as="h3"
          size="md"
          mb={2}
          color={textColor}
          noOfLines={2}
          id={`project-title-${projectId}`}
        >
          {title}
        </Heading>
        
        <Text fontSize="sm" color={mutedColor} mb={4} noOfLines={3}>
          {description}
        </Text>
        
        <HStack spacing={2} mb={4} flexWrap="wrap">
          {tags.slice(0, 3).map((tag) => (
            <Tag
              size="sm"
              key={tag}
              borderRadius="full"
              variant="subtle"
              bg={tagBg}
              color={tagColor}
              mb={2}
            >
              <TagLabel>{tag}</TagLabel>
            </Tag>
          ))}
          {tags.length > 3 && (
            <Tag
              size="sm"
              borderRadius="full"
              variant="subtle"
              colorScheme="gray"
              mb={2}
            >
              <TagLabel>+{tags.length - 3}</TagLabel>
            </Tag>
          )}
        </HStack>
        
        <Flex align="center" justify="space-between" mt={2}>
          <HStack>
            <Badge colorScheme={getModeColor(mode)}>
              {getModeLabel(mode)}
            </Badge>
            <Badge colorScheme={useColorModeValue('gray', 'gray')}>
              {teamSize} {teamSize === 1 ? 'участник' : teamSize < 5 ? 'участника' : 'участников'}
            </Badge>
          </HStack>
          
          <Button
            size="xs"
            rightIcon={<FaInfoCircle />}
            variant="ghost"
            colorScheme="blue"
            _hover={{
              bg: useColorModeValue('blue.50', 'blue.900')
            }}
            onClick={(e) => {
              e.stopPropagation();
              goToProject();
            }}
          >
            Подробнее
          </Button>
        </Flex>
      </Box>
    </MotionBox>
  );
};

export default ProjectCard; 