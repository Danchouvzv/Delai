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
  Spacer
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaThumbsUp, FaInfoCircle, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
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
  applicationStatus
}) => {
  const navigate = useNavigate();
  
  // Функция для перехода к деталям проекта
  const goToProject = () => {
    navigate(`/project/${projectId}`);
  };
  
  // Цвета для светлой/темной темы
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Цвета для режимов работы
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'remote':
        return 'green';
      case 'onsite':
        return 'blue';
      case 'hybrid':
        return 'purple';
      default:
        return 'gray';
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
      _hover={{ boxShadow: 'md' }}
      role="article"
      aria-labelledby={`project-title-${projectId}`}
    >
      <Box p={5}>
        <Flex align="center" mb={4}>
          <Avatar size="sm" name={ownerName} src={ownerAvatar} mr={2} />
          <Text fontSize="sm" color={mutedColor}>
            {ownerName}
          </Text>
          <Spacer />
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
              colorScheme="orange"
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
            <Badge>
              {teamSize} {teamSize === 1 ? 'участник' : teamSize < 5 ? 'участника' : 'участников'}
            </Badge>
          </HStack>
          
          <Button
            size="xs"
            rightIcon={<FaInfoCircle />}
            variant="ghost"
            colorScheme="blue"
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