import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Tabs, TabList, Tab, TabPanels, TabPanel,
  Button, VStack, HStack, Flex, useColorModeValue, Image, Icon, SimpleGrid,
  Card, CardBody, Divider, Badge, Avatar, Link as ChakraLink, useToast
} from '@chakra-ui/react';
import { FaUserAlt, FaBriefcase, FaStar, FaRobot, FaUsers, FaLightbulb, FaRegLightbulb } from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NetworkingProfile from '../components/NetworkingProfile';
import CreateProject from '../components/CreateProject';
import RecommendedProjects from '../components/RecommendedProjects';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const MotionBox = motion(Box);

const Networking: React.FC = () => {
  const [user] = useAuthState(auth);
  const [tabIndex, setTabIndex] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, teal.50)',
    'linear(to-br, blue.900, teal.900)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('teal.500', 'teal.300');
  
  // Проверяем наличие профиля пользователя
  useEffect(() => {
    const checkProfileExists = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const profileRef = doc(db, 'networkingProfiles', user.uid);
        const profileSnapshot = await getDoc(profileRef);
        
        setHasProfile(profileSnapshot.exists());
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkProfileExists();
  }, [user]);
  
  // Преимущества нетворкинга
  const features = [
    {
      title: 'AI-Powered Matching',
      description: 'Our algorithm connects you with projects and people that match your skills and interests',
      icon: FaRobot,
      color: 'purple.400'
    },
    {
      title: 'Find Collaborators',
      description: 'Connect with like-minded professionals to build your team or join exciting projects',
      icon: FaUsers,
      color: 'blue.400'
    },
    {
      title: 'Project Discovery',
      description: 'Browse through a curated list of projects seeking collaborators with your expertise',
      icon: FaBriefcase,
      color: 'teal.400'
    },
    {
      title: 'Skill Development',
      description: 'Identify opportunities to expand your skill set through real-world projects',
      icon: FaRegLightbulb,
      color: 'yellow.400'
    }
  ];
  
  // Если пользователь не авторизован
  if (!user && !loading) {
    return (
      <Box py={10} px={4} bgGradient={bgGradient} minH="100vh">
        <Container maxW="1200px">
          <VStack spacing={8} align="center" textAlign="center">
            <Heading size="2xl">JumysAL Networking</Heading>
            <Text fontSize="xl" maxW="800px">
              Connect with professionals, find team members, and discover projects 
              that match your skills and interests through our AI-powered networking platform.
            </Text>
            
            <Button 
              as={RouterLink} 
              to="/login" 
              size="lg" 
              colorScheme="teal"
              mt={4}
            >
              Sign In to Get Started
            </Button>
            
            <Box w="full" mt={12}>
              <Heading size="lg" mb={8}>Why Use JumysAL Networking?</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
                {features.map((feature, index) => (
                  <Card key={index} bg={cardBg} borderWidth="1px" borderRadius="lg" overflow="hidden" shadow="md">
                    <CardBody>
                      <Flex direction="column" align="center" textAlign="center">
                        <Flex 
                          w="60px" 
                          h="60px" 
                          borderRadius="full" 
                          bg={`${feature.color}20`} 
                          justify="center" 
                          align="center" 
                          mb={4}
                        >
                          <Icon as={feature.icon} boxSize="30px" color={feature.color} />
                        </Flex>
                        
                        <Heading size="md" mb={2}>{feature.title}</Heading>
                        <Text color="gray.500">{feature.description}</Text>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }
  
  // Если у пользователя нет профиля
  if (!hasProfile && !loading && user) {
    return (
      <Box py={10} px={4} bgGradient={bgGradient} minH="100vh">
        <Container maxW="1200px">
          <VStack spacing={8}>
            <Heading size="xl">Complete Your Networking Profile</Heading>
            <Text fontSize="lg" textAlign="center" maxW="800px">
              To get started with networking and receive personalized project recommendations,
              please complete your profile. This information helps our AI match you with 
              the right opportunities.
            </Text>
            
            <Box w="full" mt={4}>
              <NetworkingProfile />
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box minH="100vh">
      {/* Заголовок */}
      <Box py={8} px={4} bgGradient={bgGradient}>
        <Container maxW="1200px">
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
            <Box mb={{ base: 6, md: 0 }}>
              <Heading size="xl">Networking</Heading>
              <Text fontSize="lg" mt={2}>
                Connect with professionals and discover exciting projects
              </Text>
            </Box>
            
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/networking/projects"
                leftIcon={<FaBriefcase />}
                colorScheme="blue"
                variant="solid"
              >
                Browse Projects
              </Button>
              
              <Button
                onClick={() => setTabIndex(2)}
                leftIcon={<FaLightbulb />}
                colorScheme="purple"
                variant="solid"
              >
                Create Project
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      {/* Содержимое вкладок */}
      <Container maxW="1200px" py={6}>
        <Tabs variant="enclosed" colorScheme="teal" index={tabIndex} onChange={setTabIndex}>
          <TabList mb="1em">
            <Tab fontWeight="semibold"><Icon as={FaStar} mr={2} /> Recommendations</Tab>
            <Tab fontWeight="semibold"><Icon as={FaUserAlt} mr={2} /> My Profile</Tab>
            <Tab fontWeight="semibold"><Icon as={FaBriefcase} mr={2} /> Create Project</Tab>
          </TabList>
          
          <TabPanels>
            {/* Вкладка рекомендаций */}
            <TabPanel p={0}>
              <VStack spacing={8} align="stretch">
                <RecommendedProjects />
                
                <Box mt={8} textAlign="center">
                  <Button
                    as={RouterLink}
                    to="/networking/projects"
                    size="lg"
                    colorScheme="teal"
                    rightIcon={<FaBriefcase />}
                  >
                    View All Projects
                  </Button>
                </Box>
              </VStack>
            </TabPanel>
            
            {/* Вкладка профиля */}
            <TabPanel p={0}>
              <NetworkingProfile />
            </TabPanel>
            
            {/* Вкладка создания проекта */}
            <TabPanel p={0}>
              <CreateProject />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
};

export default Networking; 