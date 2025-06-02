import React, { useEffect, useState } from 'react';
import { Box, Card, CardBody, CardHeader, CardFooter, Flex, Heading, Text, Badge, Button, Stack, Skeleton, SkeletonText, Image, useColorModeValue, HStack, VStack, Icon, useToast, SimpleGrid, Avatar, Divider, IconButton, Tooltip } from '@chakra-ui/react';
import { FaStar, FaFire, FaUserFriends, FaGlobe, FaBriefcase, FaMapMarkerAlt, FaLaptopHouse, FaArrowRight, FaThumbsUp, FaRocket, FaBolt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link, useNavigate } from 'react-router-dom';

// Интерфейс для данных рекомендованного проекта
interface RecommendedProject {
  id: string;
  projectId: string;
  score: number;
  reason: string;
  matchType: string;
  createdAt: any;
  
  // Данные проекта
  projectData?: {
    title: string;
    description: string;
    tags: string[];
    skillsNeeded: string[];
    mode: string;
    ownerUid: string;
    ownerName?: string;
    ownerAvatar?: string;
    teamSize: number;
    isOpen: boolean;
  };
}

// Добавляем интерфейс для свойств
interface RecommendedProjectsProps {
  onApply?: (projectId: string) => void;
}

const MotionCard = motion(Card);
const MotionBox = motion(Box);

// Варианты анимации для карточек
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  }),
  hover: {
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.3
    }
  }
};

// Режимы работы с переводом
const modeTranslations = {
  remote: 'Удалённо',
  onsite: 'На месте',
  hybrid: 'Гибридно'
};

// Мокап данные для проектов
const mockProjects = [
  {
    id: 'proj1',
    title: 'Мобильное приложение для изучения языков',
    description: 'Разработка приложения для интерактивного изучения иностранных языков с использованием геймификации и ИИ.',
    tags: ['React Native', 'Mobile', 'AI', 'Education'],
    skillsNeeded: ['React Native', 'TypeScript', 'Firebase', 'UI/UX'],
    mode: 'remote',
    ownerUid: 'user1',
    ownerName: 'Алексей К.',
    ownerAvatar: '/assets/team/alex.jpg',
    teamSize: 4,
    isOpen: true,
    matchScore: 0.87
  },
  {
    id: 'proj2',
    title: 'Платформа для фрилансеров',
    description: 'Создание веб-платформы для соединения фрилансеров с клиентами, с системой безопасных платежей и управления проектами.',
    tags: ['Web', 'Platform', 'Marketplace'],
    skillsNeeded: ['React', 'Node.js', 'MongoDB', 'Payment API'],
    mode: 'hybrid',
    ownerUid: 'user2',
    ownerName: 'Мария С.',
    ownerAvatar: '/assets/team/maria.jpg',
    teamSize: 5,
    isOpen: true,
    matchScore: 0.92
  },
  {
    id: 'proj3',
    title: 'Система умного дома',
    description: 'Разработка системы управления умным домом с интеграцией IoT устройств и голосовым управлением.',
    tags: ['IoT', 'Smart Home', 'Voice Control'],
    skillsNeeded: ['Python', 'Raspberry Pi', 'AWS', 'IoT Protocols'],
    mode: 'remote',
    ownerUid: 'user3',
    ownerName: 'Тимур А.',
    ownerAvatar: '/assets/team/timur.jpg',
    teamSize: 3,
    isOpen: true,
    matchScore: 0.78
  },
  {
    id: 'proj4',
    title: 'E-commerce решение для малого бизнеса',
    description: 'Создание доступного и масштабируемого e-commerce решения для малых предприятий с интеграцией популярных платежных систем.',
    tags: ['E-commerce', 'Business', 'Web'],
    skillsNeeded: ['Shopify', 'JavaScript', 'CSS', 'Marketing'],
    mode: 'onsite',
    ownerUid: 'user4',
    ownerName: 'Анна В.',
    ownerAvatar: '/assets/team/anna.jpg',
    teamSize: 2,
    isOpen: true,
    matchScore: 0.85
  }
];

const RecommendedProjects: React.FC<RecommendedProjectsProps> = ({ onApply }) => {
  const [user] = useAuthState(auth);
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  
  // Новая цветовая схема с более яркими и креативными цветами
  const bgGradient = useColorModeValue(
    'linear(to-br, rgba(255,140,0,0.05), rgba(147,51,234,0.07), rgba(59,130,246,0.05))',
    'linear(to-br, rgba(255,140,0,0.1), rgba(147,51,234,0.1), rgba(59,130,246,0.1))'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('orange.100', 'purple.800');
  const highlightColor = useColorModeValue('orange.100', 'purple.800');
  
  // Обновленные цвета для более креативного стиля
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');
  const tagBg = useColorModeValue('orange.50', 'purple.900');
  const tagColor = useColorModeValue('orange.600', 'purple.200');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');
  
  // Загрузка рекомендованных проектов
  useEffect(() => {
    const fetchRecommendedProjects = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Получаем рекомендации для текущего пользователя
        const matchesRef = collection(db, 'matches', user.uid, 'recommendations');
        const matchesQuery = query(
          matchesRef,
          orderBy('score', 'desc'),
          limit(10)
        );
        
        const matchesSnapshot = await getDocs(matchesQuery);
        
        if (matchesSnapshot.empty) {
          setProjects([]);
          setLoading(false);
          return;
        }
        
        // Собираем данные по проектам
        const projectPromises = matchesSnapshot.docs.map(async (matchDoc) => {
          const matchData = matchDoc.data() as RecommendedProject;
          
          // Получаем данные о проекте
          const projectRef = doc(db, `projects/${matchData.projectId}`);
          const projectSnap = await getDoc(projectRef);
          
          if (!projectSnap.exists()) {
            console.warn(`Project ${matchData.projectId} not found`);
            return null;
          }
          
          const projectData = projectSnap.data();
          
          // Получаем имя владельца проекта
          let ownerName = 'Unknown User';
          let ownerAvatar = '';
          
          if (projectData?.ownerUid) {
            const ownerRef = doc(db, `users/${projectData.ownerUid}`);
            const ownerSnap = await getDoc(ownerRef);
            
            if (ownerSnap.exists()) {
              const ownerData = ownerSnap.data();
              ownerName = ownerData?.displayName || 'Unknown User';
              ownerAvatar = ownerData?.photoURL || '';
            }
          }
          
          return {
            ...matchData,
            id: matchDoc.id, // Используем id документа в качестве id проекта
            projectData: {
              ...projectData,
              ownerName,
              ownerAvatar
            }
          };
        });
        
        const resolvedProjects = await Promise.all(projectPromises);
        const filteredProjects = resolvedProjects.filter(Boolean) as RecommendedProject[];
        
        setProjects(filteredProjects);
      } catch (error) {
        console.error('Error fetching recommended projects:', error);
        toast({
          title: 'Error loading recommendations',
          description: 'Could not load project recommendations. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendedProjects();
  }, [user, toast]);
  
  // Отображение оценки соответствия с обновленным дизайном
  const renderMatchScore = (score: number) => {
    let color;
    let icon;
    let label;
    
    if (score >= 0.85) {
      color = 'orange';
      icon = FaRocket;
      label = 'Идеальное соответствие';
    } else if (score >= 0.75) {
      color = 'purple';
      icon = FaBolt;
      label = 'Хорошее соответствие';
    } else {
      color = 'blue';
      icon = FaStar;
      label = 'Среднее соответствие';
    }
    
    return (
      <Tooltip label={label} placement="top">
        <Badge 
          colorScheme={color} 
          variant="solid" 
          borderRadius="full" 
          px={2} 
          py={1}
          display="flex" 
          alignItems="center" 
          gap={1}
          boxShadow="0px 2px 4px rgba(0,0,0,0.1)"
        >
          <Icon as={icon} boxSize={3} />
          {Math.round(score * 100)}%
        </Badge>
      </Tooltip>
    );
  };

  // Отображение карточки проекта с обновленным дизайном
  const renderProjectCard = (project: RecommendedProject, index: number) => {
    const modeText = modeTranslations[project.projectData?.mode as keyof typeof modeTranslations] || project.projectData?.mode;
    const modeIcon = 
      project.projectData?.mode === 'remote' ? FaGlobe : 
      project.projectData?.mode === 'onsite' ? FaMapMarkerAlt : 
      FaLaptopHouse;
    
    // Определяем цвет для карточки на основе оценки соответствия
    const cardAccentColor = project.score >= 0.85 ? 'orange' : project.score >= 0.75 ? 'purple' : 'blue';
    
    return (
      <MotionCard
        key={project.id}
        custom={index}
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
          bgGradient={`linear(to-r, ${cardAccentColor}.400, ${cardAccentColor === 'orange' ? 'red.400' : cardAccentColor === 'purple' ? 'pink.400' : 'cyan.400'})`}
        />
        
        <CardHeader pb={2}>
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Heading 
              size="md" 
              fontWeight="bold" 
              noOfLines={1} 
              color={textColor}
              _groupHover={{ color: `${cardAccentColor}.500` }}
              transition="color 0.3s"
            >
              {project.projectData?.title || 'Unnamed Project'}
            </Heading>
            {project.score && renderMatchScore(project.score)}
          </Flex>
          
          <Flex mt={3} alignItems="center">
            <Avatar 
              size="sm" 
              name={project.projectData?.ownerName} 
              src={project.projectData?.ownerAvatar} 
              mr={2} 
              border="2px solid"
              borderColor={`${cardAccentColor}.200`}
            />
            <Text fontSize="sm" color={subTextColor}>
              {project.projectData?.ownerName || 'Unknown User'}
            </Text>
          </Flex>
        </CardHeader>
        
        <CardBody pt={0} pb={2}>
          <Text 
            fontSize="sm" 
            color={subTextColor} 
            noOfLines={2} 
            mb={4}
            lineHeight="1.6"
          >
            {project.projectData?.description || 'No description provided'}
          </Text>
          
          <Flex flexWrap="wrap" gap={2} mb={4}>
            {project.projectData?.tags?.slice(0, 3).map((tag, i) => (
              <Badge 
                key={i} 
                bg={tagBg} 
                color={tagColor} 
                fontSize="xs" 
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
            {project.projectData?.tags && project.projectData.tags.length > 3 && (
              <Badge 
                bg={tagBg} 
                color={tagColor} 
                fontSize="xs" 
                borderRadius="full" 
                px={3} 
                py={1}
                boxShadow="0px 1px 2px rgba(0,0,0,0.05)"
              >
                +{project.projectData.tags.length - 3}
              </Badge>
            )}
          </Flex>
        </CardBody>
        
        <Divider borderColor={`${cardAccentColor}.100`} />
        
        <CardFooter pt={3} pb={3}>
          <Flex justifyContent="space-between" alignItems="center" w="full">
            <HStack spacing={4}>
              <Flex align="center">
                <Icon as={modeIcon} color={`${cardAccentColor}.500`} mr={1.5} />
                <Text fontSize="xs" fontWeight="medium">{modeText}</Text>
              </Flex>
              
              <Flex align="center">
                <Icon as={FaUserFriends} color={`${cardAccentColor}.500`} mr={1.5} />
                <Text fontSize="xs" fontWeight="medium">Команда: {project.projectData?.teamSize || 0}</Text>
              </Flex>
            </HStack>
            
            <HStack>
              {onApply && (
                <Tooltip label="Откликнуться на проект">
                  <IconButton
                    aria-label="Откликнуться"
                    icon={<FaThumbsUp />}
                    size="sm"
                    colorScheme={cardAccentColor}
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply(project.id);
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
                colorScheme={cardAccentColor}
                variant="outline"
                rightIcon={<FaArrowRight />}
                onClick={() => navigate(`/project/${project.projectId}`)}
                _groupHover={{ 
                  bg: `${cardAccentColor}.500`, 
                  color: 'white',
                  borderColor: `${cardAccentColor}.500`
                }}
                transition="all 0.3s"
                fontWeight="medium"
                boxShadow="sm"
              >
                Подробнее
              </Button>
            </HStack>
          </Flex>
        </CardFooter>
      </MotionCard>
    );
  };
  
  // Отображение скелетонов во время загрузки с обновленным дизайном
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <Box 
        key={`skeleton-${index}`} 
        p={5} 
        borderWidth="1px" 
        borderRadius="xl" 
        bg={cardBg}
        borderColor={borderColor}
        shadow="lg"
        position="relative"
        overflow="hidden"
      >
        {/* Анимированный градиент для скелетона */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="6px"
          bgGradient="linear(to-r, orange.300, purple.400, blue.300)"
          opacity="0.7"
        />
        
        <Flex justify="space-between" mb={3}>
          <Skeleton height="24px" width="70%" startColor="orange.100" endColor="purple.200" />
          <Skeleton height="24px" width="20%" borderRadius="full" startColor="orange.100" endColor="purple.200" />
        </Flex>
        
        <Flex align="center" mb={3}>
          <Skeleton height="36px" width="36px" borderRadius="full" mr={2} startColor="orange.100" endColor="purple.200" />
          <Skeleton height="18px" width="120px" startColor="orange.100" endColor="purple.200" />
        </Flex>
        
        <SkeletonText mt={2} noOfLines={2} spacing={2} startColor="orange.100" endColor="purple.200" />
        
        <Flex mt={4} mb={3} gap={2}>
          <Skeleton height="20px" width="80px" borderRadius="full" startColor="orange.100" endColor="purple.200" />
          <Skeleton height="20px" width="90px" borderRadius="full" startColor="orange.100" endColor="purple.200" />
          <Skeleton height="20px" width="70px" borderRadius="full" startColor="orange.100" endColor="purple.200" />
        </Flex>
        
        <Divider my={3} />
        
        <Flex justify="space-between" align="center" mt={3}>
          <Skeleton height="20px" width="120px" startColor="orange.100" endColor="purple.200" />
          <Skeleton height="36px" width="100px" borderRadius="md" startColor="orange.100" endColor="purple.200" />
        </Flex>
      </Box>
    ));
  };
  
  return (
    <Box 
      py={10} 
      px={6} 
      bgGradient={bgGradient}
      borderRadius="2xl"
      position="relative"
      overflow="hidden"
    >
      {/* Декоративные элементы фона */}
      <Box
        position="absolute"
        top="-10%"
        right="-5%"
        width="300px"
        height="300px"
        bg="orange.50"
        borderRadius="full"
        filter="blur(70px)"
        opacity="0.4"
        zIndex={0}
        _dark={{ bg: "orange.900", opacity: "0.2" }}
      />
      <Box
        position="absolute"
        bottom="-15%"
        left="-10%"
        width="400px"
        height="400px"
        bg="purple.50"
        borderRadius="full"
        filter="blur(90px)"
        opacity="0.5"
        zIndex={0}
        _dark={{ bg: "purple.900", opacity: "0.2" }}
      />
      
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto" position="relative" zIndex={1}>
        <Flex 
          justifyContent="space-between" 
          alignItems="center" 
          flexDirection={{ base: "column", md: "row" }}
          gap={{ base: 4, md: 0 }}
        >
          <Box>
            <Heading 
              size="lg" 
              mb={2}
              bgGradient="linear(to-r, orange.400, purple.500)"
              bgClip="text"
              display="inline-block"
              position="relative"
              _after={{
                content: '""',
                position: 'absolute',
                bottom: '-6px',
                left: '0',
                width: '40%',
                height: '3px',
                bgGradient: "linear(to-r, orange.400, purple.500)",
                borderRadius: 'full'
              }}
            >
              Рекомендуемые проекты
            </Heading>
            <Text color="gray.600" fontWeight="medium" fontSize="md" _dark={{ color: "gray.300" }}>
              Проекты, соответствующие вашим навыкам и интересам
            </Text>
          </Box>
          <Button 
            colorScheme="orange" 
            size="md" 
            rightIcon={<FaStar />}
            as={Link}
            to="/networking"
            bgGradient="linear(to-r, orange.400, purple.500)"
            color="white"
            _hover={{
              bgGradient: "linear(to-r, orange.500, purple.600)",
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
            boxShadow="md"
            transition="all 0.3s"
            fontWeight="medium"
          >
            Найти больше
          </Button>
        </Flex>
        
        {loading ? (
          <Stack spacing={6} mt={6}>
            {renderSkeletons()}
          </Stack>
        ) : projects.length > 0 ? (
          <Stack spacing={6} mt={6}>
            {projects.map((project, index) => renderProjectCard(project, index))}
          </Stack>
        ) : (
          <Box 
            p={8} 
            textAlign="center" 
            borderWidth="1px" 
            borderRadius="xl" 
            borderColor={borderColor}
            bg={cardBg}
            boxShadow="lg"
            position="relative"
            overflow="hidden"
          >
            {/* Декоративный элемент */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              height="6px"
              bgGradient="linear(to-r, orange.400, purple.500)"
            />
            
            <Heading size="md" mb={4} color="gray.700" _dark={{ color: "gray.200" }}>
              Рекомендации пока отсутствуют
            </Heading>
            <Text mb={6} maxW="600px" mx="auto" color="gray.600" _dark={{ color: "gray.400" }}>
              Мы работаем над подбором идеальных проектов для вас. Проверьте позже или изучите доступные проекты.
            </Text>
            <Button 
              colorScheme="orange" 
              as={Link} 
              to="/projects"
              bgGradient="linear(to-r, orange.400, purple.500)"
              color="white"
              _hover={{
                bgGradient: "linear(to-r, orange.500, purple.600)",
                transform: "translateY(-2px)",
                boxShadow: "lg"
              }}
              boxShadow="md"
              transition="all 0.3s"
              px={6}
              py={6}
              size="lg"
              fontWeight="medium"
            >
              Просмотреть все проекты
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default RecommendedProjects; 