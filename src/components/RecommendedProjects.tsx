import React, { useEffect, useState } from 'react';
import { Box, Card, CardBody, CardHeader, Flex, Heading, Text, Badge, Button, Stack, Skeleton, Image, useColorModeValue, HStack, VStack, Icon, useToast } from '@chakra-ui/react';
import { FaStar, FaFire, FaUserFriends, FaGlobe, FaBriefcase, FaMapMarkerAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';

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
  };
}

const MotionCard = motion(Card);

const RecommendedProjects: React.FC = () => {
  const [user] = useAuthState(auth);
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.50, teal.50)',
    'linear(to-r, blue.900, teal.900)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('teal.100', 'teal.800');
  
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
  
  // Визуализация оценки соответствия
  const renderMatchScore = (score: number) => {
    let color = 'green';
    let label = 'Excellent Match';
    
    if (score < 0.5) {
      color = 'orange';
      label = 'Good Match';
    }
    if (score < 0.4) {
      color = 'yellow';
      label = 'Potential Match';
    }
    
    return (
      <HStack spacing={1}>
        <Badge colorScheme={color} fontSize="sm" px={2} py={1} borderRadius="full">
          {Math.round(score * 100)}% Match
        </Badge>
        <Text fontSize="xs" color="gray.500">
          {label}
        </Text>
      </HStack>
    );
  };

  // Отображение карточки проекта
  const renderProjectCard = (project: RecommendedProject, index: number) => {
    return (
      <MotionCard
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
        boxShadow="md"
        _hover={{ boxShadow: 'lg', borderColor: 'teal.300' }}
        cursor="pointer"
        as={Link}
        to={`/project/${project.projectId}`}
      >
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Heading size="md" fontWeight="bold" noOfLines={1}>
              {project.projectData?.title || 'Unnamed Project'}
            </Heading>
            {renderMatchScore(project.score)}
          </Flex>
        </CardHeader>
        
        <CardBody pt={0}>
          <Text fontSize="sm" color="gray.500" mb={3} noOfLines={2}>
            {project.projectData?.description || 'No description provided'}
          </Text>
          
          <Box mb={3} maxHeight="80px" overflow="hidden">
            <Flex flexWrap="wrap" gap={2}>
              {project.projectData?.tags?.slice(0, 5).map((tag, i) => (
                <Badge key={i} colorScheme="teal" fontSize="xs" px={2} py={1} borderRadius="full">
                  {tag}
                </Badge>
              ))}
              {project.projectData?.tags && project.projectData.tags.length > 5 && (
                <Badge colorScheme="gray" fontSize="xs" px={2} py={1} borderRadius="full">
                  +{project.projectData.tags.length - 5} more
                </Badge>
              )}
            </Flex>
          </Box>
          
          <HStack mb={3} spacing={4}>
            <Flex align="center">
              <Icon as={FaGlobe} color="blue.400" mr={1} />
              <Text fontSize="xs">{project.projectData?.mode || 'Remote'}</Text>
            </Flex>
            
            <Flex align="center">
              <Icon as={FaBriefcase} color="purple.400" mr={1} />
              <Text fontSize="xs">{project.projectData?.skillsNeeded?.length || 0} skills needed</Text>
            </Flex>
            
            <Flex align="center">
              <Icon as={FaFire} color="orange.400" mr={1} />
              <Text fontSize="xs">AI Recommended</Text>
            </Flex>
          </HStack>
          
          <Box 
            bg={highlightColor} 
            p={2} 
            borderRadius="md" 
            fontSize="sm"
            fontStyle="italic"
          >
            <Text noOfLines={2}>{project.reason || 'Recommended by JumysAL AI'}</Text>
          </Box>
          
          <Flex mt={4} justify="space-between" align="center">
            <HStack>
              {project.projectData?.ownerAvatar ? (
                <Image 
                  src={project.projectData.ownerAvatar}
                  alt={project.projectData.ownerName}
                  borderRadius="full"
                  boxSize="24px"
                />
              ) : (
                <Icon as={FaUserFriends} color="gray.400" boxSize="24px" />
              )}
              <Text fontSize="xs" color="gray.500">
                By {project.projectData?.ownerName || 'Unknown User'}
              </Text>
            </HStack>
            
            <Button 
              size="sm" 
              colorScheme="teal" 
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                // Дополнительное действие при клике на кнопку
              }}
            >
              View Details
            </Button>
          </Flex>
        </CardBody>
      </MotionCard>
    );
  };
  
  // Отображение скелетонов во время загрузки
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <Card key={index} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md">
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Skeleton height="24px" width="200px" />
            <Skeleton height="20px" width="80px" />
          </Flex>
        </CardHeader>
        
        <CardBody pt={0}>
          <Skeleton height="40px" mb={3} />
          
          <Flex mb={3} gap={2}>
            <Skeleton height="20px" width="60px" borderRadius="full" />
            <Skeleton height="20px" width="70px" borderRadius="full" />
            <Skeleton height="20px" width="80px" borderRadius="full" />
          </Flex>
          
          <Skeleton height="20px" mb={3} />
          
          <Skeleton height="60px" mb={4} />
          
          <Flex justify="space-between" align="center">
            <Skeleton height="24px" width="120px" />
            <Skeleton height="32px" width="100px" />
          </Flex>
        </CardBody>
      </Card>
    ));
  };
  
  return (
    <Box py={8} px={4} bgGradient={bgGradient}>
      <VStack spacing={6} align="stretch" maxW="1200px" mx="auto">
        <Flex justifyContent="space-between" alignItems="center">
          <Box>
            <Heading size="lg" mb={1}>Recommended Projects</Heading>
            <Text color="gray.500">Projects that match your skills and interests</Text>
          </Box>
          <Button 
            colorScheme="teal" 
            size="sm" 
            rightIcon={<FaStar />}
            as={Link}
            to="/networking"
          >
            Find More
          </Button>
        </Flex>
        
        {loading ? (
          <Stack spacing={4} mt={4}>
            {renderSkeletons()}
          </Stack>
        ) : projects.length > 0 ? (
          <Stack spacing={4} mt={4}>
            {projects.map((project, index) => renderProjectCard(project, index))}
          </Stack>
        ) : (
          <Box 
            p={6} 
            textAlign="center" 
            borderWidth="1px" 
            borderRadius="lg" 
            borderColor={borderColor}
            bg={cardBg}
          >
            <Heading size="md" mb={3}>No Recommendations Yet</Heading>
            <Text mb={4}>We're working on finding the perfect projects for you. Check back soon or explore available projects.</Text>
            <Button 
              colorScheme="teal" 
              as={Link} 
              to="/projects"
            >
              Browse All Projects
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default RecommendedProjects; 