import React, { useEffect, useState } from 'react';
import { Box, Card, CardBody, CardHeader, Flex, Heading, Text, Badge, Button, Stack, Skeleton, Image, useColorModeValue, HStack, VStack, Icon, useToast, SimpleGrid, Avatar, Divider, IconButton, Tooltip, SkeletonText } from '@chakra-ui/react';
import { FaStar, FaFire, FaUserFriends, FaGlobe, FaBriefcase, FaMapMarkerAlt, FaLaptopHouse, FaArrowRight, FaThumbsUp } from 'react-icons/fa';
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
  
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.50, teal.50)',
    'linear(to-r, blue.900, teal.900)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('teal.100', 'teal.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const tagBg = useColorModeValue('purple.50', 'purple.900');
  const tagColor = useColorModeValue('purple.600', 'purple.200');
  const sectionBg = useColorModeValue('purple.50', 'gray.900');
  
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
  
  // Отображение оценки соответствия
  const renderMatchScore = (score: number) => {
    let color = 'green';
    let label = 'Идеальное соответствие';
    
    if (score < 0.85) {
      color = 'blue';
      label = 'Хорошее соответствие';
    }
    if (score < 0.75) {
      color = 'orange';
      label = 'Среднее соответствие';
    }
    
    return (
      <Tooltip label={label} placement="top">
        <Badge 
          colorScheme={color} 
          variant="solid" 
          borderRadius="full" 
          px={2} 
          display="flex" 
          alignItems="center" 
          gap={1}
        >
          <Icon as={FaFire} boxSize={3} />
          {Math.round(score * 100)}%
        </Badge>
      </Tooltip>
    );
  };

  // Отображение карточки проекта
  const renderProjectCard = (project: RecommendedProject, index: number) => {
    const modeText = modeTranslations[project.projectData?.mode as keyof typeof modeTranslations] || project.projectData?.mode;
    const modeIcon = 
      project.projectData?.mode === 'remote' ? FaGlobe : 
      project.projectData?.mode === 'onsite' ? FaMapMarkerAlt : 
      FaLaptopHouse;
    
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
        boxShadow="md"
        position="relative"
        role="group"
        transition="all 0.3s"
        h="100%"
      >
        {/* Декоративный верхний бордер */}
        <Box 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          h="5px" 
          bgGradient="linear(to-r, purple.400, blue.500)" 
        />
        
        <CardHeader pb={2}>
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Heading size="md" fontWeight="bold" noOfLines={1} color={textColor}>
              {project.projectData?.title || 'Unnamed Project'}
            </Heading>
            {project.score && renderMatchScore(project.score)}
          </Flex>
          
          <Flex mt={2} alignItems="center">
            <Avatar 
              size="xs" 
              name={project.projectData?.ownerName} 
              src={project.projectData?.ownerAvatar} 
              mr={2} 
              border="1px solid"
              borderColor={borderColor}
            />
            <Text fontSize="sm" color={subTextColor}>
              {project.projectData?.ownerName || 'Unknown User'}
            </Text>
          </Flex>
        </CardHeader>
        
        <CardBody pt={0} pb={2}>
          <Text fontSize="sm" color={subTextColor} noOfLines={2} mb={3}>
            {project.projectData?.description || 'No description provided'}
          </Text>
          
          <Flex flexWrap="wrap" gap={2} mb={3}>
            {project.projectData?.tags?.slice(0, 3).map((tag, i) => (
              <Badge 
                key={i} 
                bg={tagBg} 
                color={tagColor} 
                fontSize="xs" 
                borderRadius="full" 
                px={2} 
                py={0.5}
              >
                {tag}
              </Badge>
            ))}
            {project.projectData?.tags && project.projectData.tags.length > 3 && (
              <Badge bg={tagBg} color={tagColor} fontSize="xs" borderRadius="full" px={2} py={0.5}>
                +{project.projectData.tags.length - 3}
              </Badge>
            )}
          </Flex>
        </CardBody>
        
        <Divider />
        
        <CardFooter pt={2} pb={3}>
          <Flex justifyContent="space-between" alignItems="center" w="full">
            <HStack spacing={3}>
              <Flex align="center">
                <Icon as={modeIcon} color="blue.400" mr={1} />
                <Text fontSize="xs">{modeText}</Text>
              </Flex>
              
              <Flex align="center">
                <Icon as={FaUserFriends} color="purple.400" mr={1} />
                <Text fontSize="xs">Команда: {project.projectData?.teamSize || 0}</Text>
              </Flex>
            </HStack>
            
            <HStack>
              {onApply && (
                <Tooltip label="Откликнуться на проект">
                  <IconButton
                    aria-label="Откликнуться"
                    icon={<FaThumbsUp />}
                    size="sm"
                    colorScheme="purple"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply(project.id);
                    }}
                  />
                </Tooltip>
              )}
              
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                rightIcon={<FaArrowRight />}
                onClick={() => navigate(`/project/${project.projectId}`)}
                _groupHover={{ bg: 'purple.500', color: 'white' }}
                transition="all 0.3s"
              >
                Подробнее
              </Button>
            </HStack>
          </Flex>
        </CardFooter>
      </MotionCard>
    );
  };
  
  // Отображение скелетонов во время загрузки
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <Box 
        key={`skeleton-${index}`} 
        p={5} 
        borderWidth="1px" 
        borderRadius="lg" 
        bg={cardBg}
        borderColor={borderColor}
        shadow="sm"
      >
        <Flex justify="space-between" mb={3}>
          <Skeleton height="24px" width="70%" />
          <Skeleton height="24px" width="20%" borderRadius="full" />
        </Flex>
        <SkeletonText mt={2} noOfLines={2} spacing={2} />
        <Flex mt={4} mb={3} gap={2}>
          <Skeleton height="20px" width="80px" borderRadius="full" />
          <Skeleton height="20px" width="90px" borderRadius="full" />
        </Flex>
        <Divider my={3} />
        <Flex justify="space-between" align="center" mt={3}>
          <Skeleton height="20px" width="120px" />
          <Skeleton height="36px" width="100px" borderRadius="md" />
        </Flex>
      </Box>
    ));
  };
  
  return (
    <Box
      bg={sectionBg}
      borderRadius="2xl"
      p={6}
      boxShadow="md"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '150px',
        height: '150px',
        bg: 'purple.100',
        borderRadius: 'full',
        opacity: 0.4,
        filter: 'blur(30px)',
        _dark: { bg: 'purple.900', opacity: 0.2 }
      }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: '-50px',
        left: '-50px',
        width: '120px',
        height: '120px',
        bg: 'blue.100',
        borderRadius: 'full',
        opacity: 0.3,
        filter: 'blur(25px)',
        _dark: { bg: 'blue.900', opacity: 0.2 }
      }}
    >
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'start', md: 'center' }} 
        mb={6}
        position="relative"
        zIndex={1}
      >
        <Box>
          <Heading size="lg" mb={1} color={textColor}>
            Рекомендуемые проекты
          </Heading>
          <Text color={subTextColor}>
            Проекты, подобранные специально для вас на основе вашего профиля и интересов
          </Text>
        </Box>
        
        <Button
          colorScheme="purple"
          variant="outline"
          rightIcon={<FaArrowRight />}
          onClick={() => navigate('/networking/projects')}
          mt={{ base: 4, md: 0 }}
          _hover={{
            transform: "translateX(4px)",
            transition: "transform 0.3s"
          }}
        >
          Все проекты
        </Button>
      </Flex>
      
      <Box position="relative" zIndex={1}>
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {renderSkeletons()}
          </SimpleGrid>
        ) : projects.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {projects.map((project, index) => renderProjectCard(project, index))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" p={6} bg={highlightColor} borderRadius="lg">
            <Icon as={FaBriefcase} boxSize={12} color="purple.300" mb={4} />
            <Heading size="md" mb={2}>Рекомендации появятся скоро</Heading>
            <Text mb={4}>Завершите свой профиль, чтобы получать персонализированные рекомендации проектов</Text>
            <Button 
              colorScheme="purple" 
              onClick={() => navigate('/networking/projects')}
            >
              Просмотреть все проекты
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RecommendedProjects; 