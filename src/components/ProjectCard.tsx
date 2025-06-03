import React from 'react';
import { 
  Card, CardBody, CardHeader, CardFooter, 
  Heading, Text, Badge, Button, 
  Flex, HStack, Icon, Avatar, 
  Divider, IconButton, Tooltip, 
  Box, useColorModeValue,
  Skeleton, SkeletonText, SkeletonCircle,
  useToken
} from '@chakra-ui/react';
import { 
  FaGlobe, FaMapMarkerAlt, FaLaptopHouse, 
  FaUserFriends, FaArrowRight, FaThumbsUp 
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Типы для ProjectCard
export interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  mode: 'remote' | 'onsite' | 'hybrid';
  ownerName: string;
  ownerAvatar?: string;
  teamSize: number;
  score?: number;  // процент соответствия 0-1
  projectId: string;
  isLoading?: boolean; // для состояния загрузки
  onApply?: () => void; // коллбэк при отклике
}

// Режимы работы с переводом
const modeTranslations = {
  remote: 'Удалённо',
  onsite: 'На месте',
  hybrid: 'Гибридно'
};

// Варианты анимации для карточек
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  },
  hover: {
    y: -6,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.3
    }
  }
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  tags,
  mode,
  ownerName,
  ownerAvatar,
  teamSize,
  score,
  projectId,
  isLoading = false,
  onApply
}) => {
  const navigate = useNavigate();
  
  // Получаем токены из темы
  const [headingSize, bodySize, tagSize] = useToken(
    'semanticTokens.fontSizes',
    ['heading', 'body', 'tagFontSize']
  );
  
  // Определяем цвета в зависимости от темы
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const tagBg = useColorModeValue('gray.100', 'gray.700');
  const tagColor = useColorModeValue('gray.700', 'gray.300');
  
  // Определяем иконку в зависимости от режима работы
  const modeIcon = 
    mode === 'remote' ? FaGlobe : 
    mode === 'onsite' ? FaMapMarkerAlt : 
    FaLaptopHouse;
  
  // Определяем цвет для карточки на основе оценки соответствия
  const cardAccentColor = 
    score && score >= 0.85 ? 'orange' : 
    score && score >= 0.75 ? 'violet' : 
    'cyan';
  
  // Преобразуем режим работы в текст
  const modeText = modeTranslations[mode] || mode;
  
  // Отображение процента соответствия
  const renderMatchScore = (score: number) => {
    const percentage = Math.round(score * 100);
    return (
      <Badge 
        variant="info" 
        fontSize="xs" 
        px={2} 
        py={0.5} 
        borderRadius="full"
        display="flex"
        alignItems="center"
      >
        <Icon as={FaThumbsUp} mr={1} />
        {percentage}% совпадение
      </Badge>
    );
  };
  
  // Создаем компонент с анимацией
  const MotionCard = motion(Card);
  
  // Если компонент в состоянии загрузки, показываем скелетон
  if (isLoading) {
    return (
      <Card
        bg={cardBg}
        borderWidth="1px"
        borderRadius="xl"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="lg"
        position="relative"
        h="100%"
      >
        <CardHeader pb={2}>
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Skeleton height="24px" width="70%" />
            <Skeleton height="20px" width="20%" borderRadius="full" />
          </Flex>
          
          <Flex mt={3} alignItems="center">
            <SkeletonCircle size="8" mr={2} />
            <Skeleton height="14px" width="30%" />
          </Flex>
        </CardHeader>
        
        <CardBody pt={0} pb={2}>
          <SkeletonText mt={1} noOfLines={2} spacing="2" />
          
          <Flex flexWrap="wrap" gap={2} mb={4} mt={4}>
            <Skeleton height="20px" width="80px" borderRadius="full" />
            <Skeleton height="20px" width="70px" borderRadius="full" />
            <Skeleton height="20px" width="90px" borderRadius="full" />
          </Flex>
        </CardBody>
        
        <Divider borderColor="gray.200" />
        
        <CardFooter pt={3} pb={3}>
          <Flex justifyContent="space-between" alignItems="center" w="full">
            <HStack spacing={4}>
              <Skeleton height="14px" width="60px" />
              <Skeleton height="14px" width="80px" />
            </HStack>
            
            <Skeleton height="32px" width="100px" borderRadius="md" />
          </Flex>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <MotionCard
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      bg={cardBg}
      borderWidth="1px"
      borderRadius="xl"
      borderColor={borderColor}
      overflow="hidden"
      boxShadow="lg"
      position="relative"
      role="group"
      transition="all 0.3s"
      h="100%"
      _hover={{
        transform: "translateY(-8px)",
        boxShadow: "xl",
        borderColor: `${cardAccentColor}.300`
      }}
    >
      {/* Декоративный градиентный верхний бордер */}
      <Box 
        position="absolute" 
        top="0" 
        left="0" 
        right="0" 
        h="6px" 
        bgGradient={`linear(to-r, ${cardAccentColor}.400, ${cardAccentColor === 'orange' ? 'amber.400' : cardAccentColor === 'violet' ? 'indigo.400' : 'sky.400'})`}
      />
      
      <CardHeader pb={2}>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Heading 
            fontSize="fontSizes.heading"
            fontWeight="bold" 
            noOfLines={1} 
            color={textColor}
            _groupHover={{ color: `${cardAccentColor}.500` }}
            transition="color 0.3s"
          >
            {title}
          </Heading>
          {score && renderMatchScore(score)}
        </Flex>
        
        <Flex mt={3} alignItems="center">
          <Avatar 
            size="sm" 
            name={ownerName} 
            src={ownerAvatar} 
            mr={2} 
            border="2px solid"
            borderColor={`${cardAccentColor}.200`}
          />
          <Text fontSize="fontSizes.body" color={subTextColor}>
            {ownerName}
          </Text>
        </Flex>
      </CardHeader>
      
      <CardBody pt={0} pb={2}>
        <Text 
          fontSize="fontSizes.body"
          color={subTextColor} 
          noOfLines={2} 
          mb={4}
          lineHeight="1.6"
        >
          {description}
        </Text>
        
        <Flex flexWrap="wrap" gap="cardGap" mb={4}>
          {tags.slice(0, 3).map((tag, i) => (
            <Badge 
              key={i} 
              variant="accentSubtle"
              fontSize="fontSizes.tagFontSize"
              fontWeight="medium"
              borderRadius="full" 
              px={3} 
              py={1}
              _hover={{ transform: "scale(1.05)" }}
              transition="transform 0.2s"
              boxShadow="0px 1px 2px rgba(0,0,0,0.05)"
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge 
              variant="subtle"
              fontSize="fontSizes.tagFontSize"
              borderRadius="full" 
              px={3} 
              py={1}
              boxShadow="0px 1px 2px rgba(0,0,0,0.05)"
            >
              +{tags.length - 3}
            </Badge>
          )}
        </Flex>
      </CardBody>
      
      <Divider borderColor={`${cardAccentColor}.100`} />
      
      <CardFooter pt={3} pb={3}>
        <Flex justifyContent="space-between" alignItems="center" w="full">
          <HStack spacing="cardGap">
            <Flex align="center">
              <Icon as={modeIcon} color={`${cardAccentColor}.500`} mr={1.5} />
              <Text fontSize="fontSizes.tagFontSize" fontWeight="medium">{modeText}</Text>
            </Flex>
            
            <Flex align="center">
              <Icon as={FaUserFriends} color={`${cardAccentColor}.500`} mr={1.5} />
              <Text fontSize="fontSizes.tagFontSize" fontWeight="medium">Команда: {teamSize}</Text>
            </Flex>
          </HStack>
          
          <HStack>
            {onApply && (
              <Tooltip label="Откликнуться на проект">
                <IconButton
                  aria-label="Откликнуться на проект"
                  icon={<FaThumbsUp />}
                  size="sm"
                  colorScheme={cardAccentColor}
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply();
                  }}
                  _hover={{
                    bg: `${cardAccentColor}.100`,
                    transform: "scale(1.1)"
                  }}
                  transition="all 0.2s"
                />
              </Tooltip>
            )}
            
            <Button
              size="sm"
              variant="gradient"
              rightIcon={<FaArrowRight />}
              onClick={() => navigate(`/project/${projectId}`)}
              _focus={{ boxShadow: '0 0 0 3px var(--chakra-colors-indigo-300)' }}
              aria-label="Перейти к подробной информации о проекте"
            >
              Подробнее
            </Button>
          </HStack>
        </Flex>
      </CardFooter>
    </MotionCard>
  );
};

export default ProjectCard; 