import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Tabs, TabList, Tab, TabPanels, TabPanel,
  Button, VStack, HStack, Flex, useColorModeValue, Image, Icon, SimpleGrid,
  Card, CardBody, Divider, Badge, Avatar, Link as ChakraLink, useToast,
  Tag, TagLabel, TagLeftIcon, Grid, Circle, Tooltip, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Textarea
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
    'linear(to-br, orange.50, purple.50, cyan.50)',
    'linear(to-br, orange.900, purple.900, cyan.900)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('orange.100', 'purple.700');
  const accentColor = useColorModeValue('orange.500', 'orange.300');
  const gradientOverlay = useColorModeValue(
    'linear(to-r, orange.400, purple.500)', 
    'linear(to-r, orange.500, purple.600)'
  );
  
  // Добавляем новые состояния
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applicationText, setApplicationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      color: 'orange.400',
      animation: 'float'
    },
    {
      title: 'Поиск соратников',
      description: 'Найдите единомышленников для создания команды или присоединитесь к интересным проектам',
      icon: FaUsers,
      color: 'purple.400',
      animation: 'pulse'
    },
    {
      title: 'Открытие проектов',
      description: 'Просматривайте отобранный список проектов, ищущих сотрудников с вашим опытом',
      icon: FaBriefcase,
      color: 'cyan.400',
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
  
  // Обработчик для открытия модального окна отклика
  const handleApplyToProject = (projectId: string) => {
    setSelectedProject(projectId);
    setIsApplyModalOpen(true);
    setApplicationText('');
  };
  
  // Обработчик для отправки заявки на проект
  const handleSubmitApplication = async () => {
    if (!selectedProject || !user || !applicationText.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните текст заявки",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Здесь будет код для отправки заявки в базу данных
      // В демо-версии просто имитируем задержку
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Заявка отправлена",
        description: "Владелец проекта получит уведомление о вашем интересе",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      setIsApplyModalOpen(false);
      setSelectedProject(null);
      setApplicationText('');
    } catch (error) {
      console.error("Ошибка при отправке заявки:", error);
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить заявку. Пожалуйста, попробуйте позже.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Если пользователь не авторизован
  if (!user && !loading) {
    return (
      <Box py={10} px={4} bgGradient="linear(to-br, orange.50, purple.50, cyan.50)" minH="100vh">
        <Container maxW="1200px">
          <MotionFlex 
            direction="column" 
            align="center" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MotionBox 
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
                bgGradient: "linear(to-r, orange.400, purple.500, cyan.400)",
                borderRadius: 'full'
              }}
            >
              <Heading 
                as="h1" 
                size="2xl" 
                bgGradient="linear(to-r, orange.400, purple.500, cyan.400)" 
                bgClip="text"
                textAlign="center"
              >
                Нетворкинг JumysAL
              </Heading>
            </MotionBox>
            
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
                bgGradient="linear(to-r, orange.400, purple.500)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, orange.500, purple.600)",
                  transform: "translateY(-2px)",
                  shadow: "lg"
                }}
                px={8}
                py={7}
                shadow="md"
                fontWeight="bold"
                rightIcon={<Icon as={FaArrowRight} transition="transform 0.3s" _groupHover={{ transform: "translateX(4px)" }} />}
                role="group"
                transition="all 0.3s"
              >
                Войти и начать
              </Button>
            </MotionBox>
            
            {/* Features section with improved styling */}
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
                  bgGradient: "linear(to-r, orange.400, purple.500)",
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
                    bg={useColorModeValue('white', 'gray.800')} 
                    borderRadius="2xl" 
                    overflow="hidden" 
                    boxShadow="xl"
                    borderWidth="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      y: -10, 
                      boxShadow: "2xl",
                      borderColor: "orange.200"
                    }}
                    height="100%"
                    role="group"
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
                          _groupHover={{
                            transform: "scale(1.1)",
                            bg: `${feature.color}30`
                          }}
                          transition="all 0.3s ease"
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
                          _groupHover={{ color: feature.color }}
                          transition="color 0.3s"
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
            
            {/* Testimonials with improved styling */}
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
                  bgGradient: "linear(to-r, orange.400, purple.500)",
                  borderRadius: 'full'
                }}
              >
                Истории успеха
              </Heading>
              
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
                {testimonials.map((testimonial, index) => (
                  <MotionCard
                    key={index}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="2xl"
                    overflow="hidden"
                    boxShadow="lg"
                    borderWidth="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ 
                      y: -5, 
                      boxShadow: "xl",
                      borderColor: "orange.200"
                    }}
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '5px',
                      bgGradient: "linear(to-r, orange.400, purple.500)"
                    }}
                  >
                    <CardBody>
                      <Box 
                        position="absolute" 
                        top={4} 
                        right={4} 
                        color="orange.400" 
                        fontSize="4xl"
                        opacity={0.2}
                        fontFamily="Georgia, serif"
                      >
                        "
                      </Box>
                      <Flex direction="column" height="100%">
                        <Text
                          fontSize="md"
                          fontStyle="italic"
                          color={useColorModeValue('gray.600', 'gray.300')}
                          mb={6}
                          position="relative"
                          zIndex={1}
                        >
                          "{testimonial.text}"
                        </Text>
                        
                        <Flex mt="auto" align="center">
                          <Avatar 
                            size="md" 
                            name={testimonial.name} 
                            src={testimonial.avatar}
                            mr={3}
                            border="2px solid"
                            borderColor="orange.200"
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
            
            {/* CTA with improved styling */}
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
                bg={useColorModeValue('orange.50', 'rgba(109, 99, 255, 0.1)')}
                borderRadius="2xl"
                p={10}
                boxShadow="xl"
                textAlign="center"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  bg: 'orange.100',
                  borderRadius: 'full',
                  opacity: 0.4,
                  zIndex: 0,
                  filter: 'blur(20px)'
                }}
                _after={{
                  content: '""',
                  position: 'absolute',
                  bottom: '-60px',
                  left: '-60px',
                  width: '180px',
                  height: '180px',
                  bg: 'purple.100',
                  borderRadius: 'full',
                  opacity: 0.4,
                  zIndex: 0,
                  filter: 'blur(30px)'
                }}
              >
                <Box flex="1" mb={{ base: 6, md: 0 }} mr={{ md: 10 }} position="relative" zIndex={1}>
                  <Heading 
                    size="lg" 
                    mb={4}
                    bgGradient="linear(to-r, orange.400, purple.500)"
                    bgClip="text"
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
                  position="relative"
                  zIndex={1}
                >
                  <Button
                    as={RouterLink}
                    to="/signup"
                    size="lg"
                    bgGradient="linear(to-r, orange.400, purple.500)"
                    color="white"
                    _hover={{
                      bgGradient: "linear(to-r, orange.500, purple.600)",
                      transform: "translateY(-2px)",
                      shadow: "lg"
                    }}
                    rightIcon={<Icon as={FaRocket} transition="transform 0.3s" _groupHover={{ transform: "translateX(4px)" }} />}
                    px={8}
                    py={7}
                    boxShadow="lg"
                    fontWeight="bold"
                    role="group"
                    transition="all 0.3s"
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
              bgGradient="linear(to-r, orange.400, purple.500)" 
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
      {/* Заголовок с улучшенным стилем */}
      <Box 
        py={8} 
        px={4} 
        bgGradient="linear(to-r, orange.50, purple.50, cyan.50)"
        position="relative"
        overflow="hidden"
        _dark={{
          bgGradient: "linear(to-r, orange.900, purple.900, cyan.900)"
        }}
      >
        {/* Декоративные элементы */}
        <Box
          position="absolute"
          top="-20%"
          right="-10%"
          width="300px"
          height="300px"
          bg="orange.100"
          borderRadius="full"
          filter="blur(40px)"
          opacity="0.6"
          _dark={{ bg: "orange.800", opacity: "0.3" }}
        />
        <Box
          position="absolute"
          bottom="-30%"
          left="-5%"
          width="250px"
          height="250px"
          bg="purple.100"
          borderRadius="full"
          filter="blur(40px)"
          opacity="0.5"
          _dark={{ bg: "purple.800", opacity: "0.3" }}
        />
        
        <Container maxW="1200px" position="relative" zIndex={1}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
            <Box mb={{ base: 6, md: 0 }}>
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, orange.400, purple.500, cyan.400)" 
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
                leftIcon={<Icon as={FaBriefcase} />}
                bg="white"
                color="orange.500"
                _hover={{ 
                  bg: "orange.50",
                  transform: "translateY(-2px)",
                  boxShadow: "md"
                }}
                _dark={{ 
                  bg: "gray.800",
                  color: "orange.300",
                  _hover: { bg: "gray.700" }
                }}
                boxShadow="sm"
                transition="all 0.2s"
              >
                Просмотр проектов
              </Button>
              
              <Button
                onClick={() => setTabIndex(2)}
                leftIcon={<Icon as={FaLightbulb} />}
                bgGradient="linear(to-r, orange.400, purple.500)"
                color="white"
                _hover={{ 
                  bgGradient: "linear(to-r, orange.500, purple.600)",
                  transform: "translateY(-2px)",
                  boxShadow: "md"
                }}
                boxShadow="sm"
                transition="all 0.2s"
              >
                Создать проект
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      {/* Содержимое вкладок с улучшенным стилем */}
      <Container maxW="1200px" py={6}>
        <Tabs 
          variant="soft-rounded" 
          colorScheme="orange" 
          index={tabIndex} 
          onChange={setTabIndex}
          isLazy
        >
          <TabList 
            mb="1em" 
            borderBottom="1px" 
            borderColor={useColorModeValue('gray.200', 'gray.700')} 
            pb={2}
            overflowX="auto"
            css={{
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            }}
          >
            <Tab 
              fontWeight="semibold" 
              mx={1} 
              _selected={{ 
                color: 'white', 
                bg: 'orange.500',
                boxShadow: 'md'
              }}
              minW="fit-content"
            >
              <Icon as={FaStar} mr={2} /> Рекомендации
            </Tab>
            <Tab 
              fontWeight="semibold" 
              mx={1} 
              _selected={{ 
                color: 'white', 
                bg: 'orange.500',
                boxShadow: 'md'
              }}
              minW="fit-content"
            >
              <Icon as={FaUserAlt} mr={2} /> Мой профиль
            </Tab>
            <Tab 
              fontWeight="semibold" 
              mx={1} 
              _selected={{ 
                color: 'white', 
                bg: 'orange.500',
                boxShadow: 'md'
              }}
              minW="fit-content"
            >
              <Icon as={FaBriefcase} mr={2} /> Создать проект
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Вкладка рекомендаций */}
            <TabPanel p={0}>
              <VStack spacing={8} align="stretch">
                <RecommendedProjects onApply={handleApplyToProject} />
                
                <Box mt={8} textAlign="center">
                  <Button
                    as={RouterLink}
                    to="/networking/projects"
                    size="lg"
                    rightIcon={<Icon as={FaBriefcase} />}
                    bgGradient="linear(to-r, orange.400, purple.500)"
                    color="white"
                    _hover={{ 
                      bgGradient: "linear(to-r, orange.500, purple.600)",
                      transform: "translateY(-2px)"
                    }}
                    boxShadow="md"
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
      
      {/* Модальное окно для отклика на проект */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)}>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.300" />
        <ModalContent borderRadius="xl">
          <ModalHeader borderBottomWidth="1px" pb={4}>
            Отклик на проект
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Сопроводительное сообщение</FormLabel>
                <Textarea 
                  placeholder="Расскажите, почему вы заинтересованы в этом проекте и какой вклад можете внести..."
                  value={applicationText}
                  onChange={(e) => setApplicationText(e.target.value)}
                  minH="150px"
                />
              </FormControl>
              
              <Text fontSize="sm" color="gray.500">
                Ваше сообщение будет отправлено владельцу проекта вместе с информацией из вашего профиля.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" pt={4}>
            <Button variant="ghost" mr={3} onClick={() => setIsApplyModalOpen(false)}>
              Отмена
            </Button>
            <Button 
              bgGradient="linear(to-r, orange.400, purple.500)"
              color="white"
              _hover={{ bgGradient: "linear(to-r, orange.500, purple.600)" }}
              onClick={handleSubmitApplication}
              isLoading={isSubmitting}
              loadingText="Отправка..."
            >
              Отправить заявку
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Networking; 