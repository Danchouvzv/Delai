import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Tabs, TabList, Tab, TabPanels, TabPanel,
  Button, VStack, HStack, Flex, useColorModeValue, Image, Icon, SimpleGrid,
  Card, CardBody, Divider, Badge, Avatar, Link as ChakraLink, useToast,
  Tag, TagLabel, TagLeftIcon, Grid, Circle, Tooltip, IconButton
} from '@chakra-ui/react';
import { 
  FaUserAlt, FaBriefcase, FaStar, FaRobot, FaUsers, FaLightbulb, 
  FaRegLightbulb, FaArrowRight, FaGlobe, FaRocket, FaCode, FaHandshake 
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NetworkingProfile from '../components/NetworkingProfile';
import CreateProject from '../components/CreateProject';
import RecommendedProjects from '../components/RecommendedProjects';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionCard = motion(Card);

const Networking: React.FC = () => {
  const [user] = useAuthState(auth);
  const [tabIndex, setTabIndex] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50, teal.50)',
    'linear(to-br, blue.900, purple.900, teal.900)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('teal.500', 'teal.300');
  const gradientOverlay = useColorModeValue(
    'linear(to-r, teal.400, blue.500)', 
    'linear(to-r, teal.500, blue.600)'
  );
  
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
      title: 'ИИ-подбор соответствий',
      description: 'Наш алгоритм соединяет вас с проектами и людьми, которые соответствуют вашим навыкам и интересам',
      icon: FaRobot,
      color: 'purple.400',
      animation: 'float'
    },
    {
      title: 'Поиск соратников',
      description: 'Найдите единомышленников для создания команды или присоединитесь к интересным проектам',
      icon: FaUsers,
      color: 'blue.400',
      animation: 'pulse'
    },
    {
      title: 'Открытие проектов',
      description: 'Просматривайте отобранный список проектов, ищущих сотрудников с вашим опытом',
      icon: FaBriefcase,
      color: 'teal.400',
      animation: 'bounce'
    },
    {
      title: 'Развитие навыков',
      description: 'Находите возможности для расширения своих навыков через реальные проекты',
      icon: FaRegLightbulb,
      color: 'yellow.400',
      animation: 'spin'
    }
  ];
  
  const testimonials = [
    {
      name: 'Азамат К.',
      role: 'Ученик 11 класса',
      avatar: '/assets/testimonials/person1.jpg',
      text: 'Благодаря нетворкингу на JumysAL я нашел единомышленников для своего проекта по разработке мобильного приложения. Сейчас мы уже запустились в бета-режиме!'
    },
    {
      name: 'Дана М.',
      role: 'Студентка',
      avatar: '/assets/testimonials/person2.jpg',
      text: 'Платформа помогла мне найти стажировку в IT-компании, хотя я была уверена, что без опыта работы это невозможно. Рекомендации ИИ действительно работают!'
    },
    {
      name: 'Тимур Ж.',
      role: 'Основатель стартапа',
      avatar: '/assets/testimonials/person3.jpg',
      text: 'Мы нашли талантливых школьников-программистов для нашего стартапа. Их энтузиазм и свежий взгляд на проблемы дали нам новый импульс.'
    }
  ];
  
  // Если пользователь не авторизован
  if (!user && !loading) {
    return (
      <Box py={10} px={4} bgGradient={bgGradient} minH="100vh">
        <Container maxW="1200px">
          <MotionFlex 
            direction="column" 
            align="center" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box 
              mb={8}
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100px',
                height: '5px',
                background: gradientOverlay,
                borderRadius: 'full'
              }}
            >
              <Heading 
                as="h1" 
                size="2xl" 
                bgGradient="linear(to-r, teal.400, blue.500, purple.600)" 
                bgClip="text"
                textAlign="center"
              >
                Нетворкинг JumysAL
              </Heading>
            </Box>
            
            <Text 
              fontSize="xl" 
              maxW="800px" 
              textAlign="center" 
              mb={12}
              color={useColorModeValue('gray.600', 'gray.300')}
            >
              Подключайтесь к профессионалам, находите членов команды и открывайте проекты, 
              соответствующие вашим навыкам и интересам, с помощью нашей платформы нетворкинга на базе ИИ.
            </Text>
            
            <MotionBox
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              mb={16}
            >
              <Button 
                as={RouterLink} 
                to="/login" 
                size="lg" 
                colorScheme="teal"
                bgGradient={gradientOverlay}
                _hover={{
                  bgGradient: 'linear(to-r, teal.500, blue.600)'
                }}
                rightIcon={<FaArrowRight />}
                px={8}
                py={7}
                boxShadow="lg"
                fontWeight="bold"
              >
                Войти и начать
              </Button>
            </MotionBox>
            
            <Box w="full" mt={8}>
              <Heading 
                size="lg" 
                mb={12} 
                textAlign="center"
                position="relative"
                _after={{
                  content: '""',
                  position: 'absolute',
                  bottom: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '50px',
                  height: '3px',
                  bgGradient: gradientOverlay,
                  borderRadius: 'full'
                }}
              >
                Почему стоит использовать нетворкинг JumysAL?
              </Heading>
              
              <Grid 
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} 
                gap={8}
              >
                {features.map((feature, index) => (
                  <MotionCard 
                    key={index} 
                    bg={cardBg} 
                    borderRadius="2xl" 
                    overflow="hidden" 
                    boxShadow="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10, boxShadow: "2xl" }}
                    height="100%"
                  >
                    <CardBody>
                      <Flex direction="column" align="center" textAlign="center" height="100%">
                        <Circle 
                          size="80px" 
                          bg={`${feature.color}20`} 
                          mb={6}
                          position="relative"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            inset: '-5px',
                            borderRadius: 'full',
                            background: `${feature.color}10`,
                            opacity: 0.7
                          }}
                        >
                          <motion.div
                            animate={
                              feature.animation === 'float' 
                                ? { y: [0, -10, 0] } 
                                : feature.animation === 'pulse' 
                                ? { scale: [1, 1.2, 1] }
                                : feature.animation === 'spin'
                                ? { rotate: 360 }
                                : { y: [0, -5, 0] }
                            }
                            transition={{ 
                              repeat: Infinity, 
                              duration: feature.animation === 'spin' ? 8 : 2,
                              ease: "easeInOut" 
                            }}
                          >
                            <Icon as={feature.icon} boxSize="40px" color={feature.color} />
                          </motion.div>
                        </Circle>
                        
                        <Heading 
                          size="md" 
                          mb={4}
                          color={useColorModeValue('gray.700', 'white')}
                        >
                          {feature.title}
                        </Heading>
                        
                        <Text 
                          color={useColorModeValue('gray.600', 'gray.300')}
                          fontSize="md"
                        >
                          {feature.description}
                        </Text>
                      </Flex>
                    </CardBody>
                  </MotionCard>
                ))}
              </Grid>
            </Box>
            
            <Box w="full" mt={20}>
              <Heading 
                size="lg" 
                mb={12} 
                textAlign="center"
                position="relative"
                _after={{
                  content: '""',
                  position: 'absolute',
                  bottom: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '50px',
                  height: '3px',
                  bgGradient: gradientOverlay,
                  borderRadius: 'full'
                }}
              >
                Истории успеха
              </Heading>
              
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
                {testimonials.map((testimonial, index) => (
                  <MotionCard
                    key={index}
                    bg={cardBg}
                    borderRadius="2xl"
                    overflow="hidden"
                    boxShadow="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '5px',
                      bgGradient: gradientOverlay
                    }}
                  >
                    <CardBody>
                      <Flex direction="column" height="100%">
                        <Text
                          fontSize="md"
                          fontStyle="italic"
                          color={useColorModeValue('gray.600', 'gray.300')}
                          mb={6}
                        >
                          "{testimonial.text}"
                        </Text>
                        
                        <Flex mt="auto" align="center">
                          <Avatar 
                            size="md" 
                            name={testimonial.name} 
                            src={testimonial.avatar}
                            mr={3}
                          />
                          <Box>
                            <Text fontWeight="bold">{testimonial.name}</Text>
                            <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')}>
                              {testimonial.role}
                            </Text>
                          </Box>
                        </Flex>
                      </Flex>
                    </CardBody>
                  </MotionCard>
                ))}
              </Grid>
            </Box>
            
            <MotionBox
              mt={20}
              w="full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Flex 
                direction={{ base: "column", md: "row" }}
                align="center"
                justify="center"
                bg={useColorModeValue('teal.50', 'rgba(49, 151, 149, 0.1)')}
                borderRadius="2xl"
                p={10}
                boxShadow="xl"
                textAlign="center"
              >
                <Box flex="1" mb={{ base: 6, md: 0 }} mr={{ md: 10 }}>
                  <Heading 
                    size="lg" 
                    mb={4}
                    color={useColorModeValue('teal.600', 'teal.300')}
                  >
                    Готовы найти свой идеальный проект?
                  </Heading>
                  <Text 
                    fontSize="lg"
                    color={useColorModeValue('gray.600', 'gray.300')}
                  >
                    Присоединяйтесь к растущему сообществу JumysAL и открывайте новые возможности для сотрудничества!
                  </Text>
                </Box>
                
                <MotionBox
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    as={RouterLink}
                    to="/signup"
                    size="lg"
                    colorScheme="teal"
                    bgGradient={gradientOverlay}
                    _hover={{
                      bgGradient: 'linear(to-r, teal.500, blue.600)'
                    }}
                    rightIcon={<FaRocket />}
                    px={8}
                    py={7}
                    boxShadow="lg"
                    fontWeight="bold"
                  >
                    Зарегистрироваться
                  </Button>
                </MotionBox>
              </Flex>
            </MotionBox>
          </MotionFlex>
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
            <Heading 
              size="xl" 
              bgGradient="linear(to-r, teal.400, blue.500)" 
              bgClip="text"
            >
              Заполните свой профиль нетворкинга
            </Heading>
            <Text fontSize="lg" textAlign="center" maxW="800px">
              Чтобы начать нетворкинг и получать персонализированные рекомендации проектов,
              пожалуйста, заполните свой профиль. Эта информация поможет нашему ИИ подобрать вам 
              подходящие возможности.
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
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, teal.400, blue.500)" 
                bgClip="text"
              >
                Нетворкинг
              </Heading>
              <Text fontSize="lg" mt={2} color={useColorModeValue('gray.600', 'gray.300')}>
                Связывайтесь с профессионалами и открывайте интересные проекты
              </Text>
            </Box>
            
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/networking/projects"
                leftIcon={<FaBriefcase />}
                colorScheme="blue"
                variant="solid"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Просмотр проектов
              </Button>
              
              <Button
                onClick={() => setTabIndex(2)}
                leftIcon={<FaLightbulb />}
                colorScheme="purple"
                variant="solid"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Создать проект
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      {/* Содержимое вкладок */}
      <Container maxW="1200px" py={6}>
        <Tabs 
          variant="soft-rounded" 
          colorScheme="teal" 
          index={tabIndex} 
          onChange={setTabIndex}
          isLazy
        >
          <TabList mb="1em" borderBottom="1px" borderColor={borderColor} pb={2}>
            <Tab fontWeight="semibold" mx={1} _selected={{ color: 'white', bg: 'teal.500' }}>
              <Icon as={FaStar} mr={2} /> Рекомендации
            </Tab>
            <Tab fontWeight="semibold" mx={1} _selected={{ color: 'white', bg: 'teal.500' }}>
              <Icon as={FaUserAlt} mr={2} /> Мой профиль
            </Tab>
            <Tab fontWeight="semibold" mx={1} _selected={{ color: 'white', bg: 'teal.500' }}>
              <Icon as={FaBriefcase} mr={2} /> Создать проект
            </Tab>
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
                    boxShadow="md"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    Все проекты
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