import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Select,
  Input,
  FormControl,
  FormLabel,
  Flex,
  HStack,
  Icon,
  useColorModeValue,
  Grid,
  GridItem,
  Badge,
  useToast,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  Card,
  CardBody,
  List,
  ListItem,
  ListIcon,
  Image,
  Skeleton
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  FaUserAlt, 
  FaFileAlt, 
  FaMagic, 
  FaCheckCircle, 
  FaDownload, 
  FaBriefcase, 
  FaGraduationCap, 
  FaRocket,
  FaChartLine,
  FaRegLightbulb,
  FaUserTie,
  FaClipboardCheck
} from 'react-icons/fa';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

const AIResumeGenerator: React.FC = () => {
  const [targetPosition, setTargetPosition] = useState('');
  const [industry, setIndustry] = useState('');
  const [resumeStyle, setResumeStyle] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const toast = useToast();

  const bgGradient = useColorModeValue(
    'linear(to-br, purple.50, blue.50, teal.50)',
    'linear(to-br, purple.900, blue.900, teal.900)'
  );

  const accentColor = useColorModeValue('teal.500', 'teal.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleGenerateResume = () => {
    if (!targetPosition || !industry) {
      toast({
        title: 'Заполните все поля',
        description: 'Пожалуйста, укажите целевую должность и отрасль',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsGenerating(true);
    // Имитируем процесс генерации
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      toast({
        title: 'Резюме создано!',
        description: 'Ваше персонализированное резюме готово для скачивания',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 3000);
  };

  const handleDownload = () => {
    toast({
      title: 'Загрузка...',
      description: 'Резюме загружается в формате PDF',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const steps = [
    {
      title: 'Анализ профиля',
      description: 'Наш ИИ анализирует ваш профиль JumysAL, включая навыки, образование, опыт и достижения, чтобы понять ваши квалификации.',
      icon: FaUserAlt,
      color: 'blue'
    },
    {
      title: 'Соответствие вакансии',
      description: 'Система определяет наиболее релевантные навыки и опыт для целевых должностей, гарантируя, что ваше резюме подчеркивает то, что ищут работодатели.',
      icon: FaBriefcase,
      color: 'purple'
    },
    {
      title: 'Создание резюме',
      description: 'ИИ генерирует профессионально отформатированное резюме с убедительными описаниями вашего опыта и достижений, которые помогут вам выделиться.',
      icon: FaMagic,
      color: 'teal'
    },
    {
      title: 'Скачивание и редактирование',
      description: 'Просмотрите свое резюме, внесите необходимые изменения и скачайте его в формате PDF, готовом к отправке потенциальным работодателям.',
      icon: FaDownload,
      color: 'green'
    }
  ];

  const benefits = [
    {
      title: 'Экономия времени',
      description: 'Создавайте профессиональное резюме за считанные минуты, а не часы',
      icon: FaRocket
    },
    {
      title: 'Персонализированный контент',
      description: 'Оптимизировано под ваши конкретные карьерные цели и целевые должности',
      icon: FaUserTie
    },
    {
      title: 'Профессиональное форматирование',
      description: 'Четкий современный дизайн, привлекающий внимание работодателей',
      icon: FaFileAlt
    },
    {
      title: 'Совместимость с ATS',
      description: 'Разработано для прохождения через системы отслеживания соискателей',
      icon: FaCheckCircle
    },
    {
      title: 'Множество форматов',
      description: 'Скачивайте в формате PDF, Word или обычного текста',
      icon: FaClipboardCheck
    },
    {
      title: 'Подсказки по улучшению',
      description: 'Получайте рекомендации, как сделать ваше резюме еще лучше',
      icon: FaRegLightbulb
    }
  ];

  const industries = [
    'IT и разработка ПО',
    'Маркетинг и реклама',
    'Финансы и банковское дело',
    'Образование',
    'Здравоохранение',
    'Розничная торговля',
    'Производство',
    'Логистика и транспорт',
    'Консалтинг',
    'Медиа и коммуникации'
  ];

  return (
    <Box bgGradient={bgGradient} minH="100vh" py={12} px={4}>
      <Container maxW="container.xl">
        <VStack spacing={12}>
          {/* Заголовок */}
          <MotionBox 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            textAlign="center"
            w="full"
          >
            <MotionHeading 
              as="h1" 
              size="2xl" 
              mb={4}
              bgGradient="linear(to-r, teal.400, blue.500, purple.600)"
              bgClip="text"
              lineHeight="1.2"
            >
              AI-генератор резюме
            </MotionHeading>
            <MotionText 
              fontSize="xl" 
              color={useColorModeValue('gray.600', 'gray.300')}
              maxW="3xl"
              mx="auto"
            >
              Создайте профессиональное, адаптированное резюме за считанные секунды 
              с помощью нашей передовой технологии искусственного интеллекта
            </MotionText>
          </MotionBox>

          {/* Как это работает */}
          <Box w="full">
            <Heading 
              size="lg" 
              mb={8} 
              textAlign="center"
              position="relative"
              _after={{
                content: '""',
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100px',
                height: '4px',
                bgGradient: 'linear(to-r, teal.400, blue.500)',
                borderRadius: 'full'
              }}
            >
              Как это работает
            </Heading>

            <Text fontSize="lg" textAlign="center" mb={10} maxW="3xl" mx="auto">
              Наш генератор резюме на базе искусственного интеллекта создает персонализированные, 
              профессиональные резюме, адаптированные под ваши навыки, опыт и целевые должности.
            </Text>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={8}>
              {steps.map((step, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  bg={cardBg}
                  borderRadius="xl"
                  p={6}
                  boxShadow="lg"
                  borderTop="4px solid"
                  borderColor={`${step.color}.500`}
                  _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
                  transition="all 0.3s"
                  h="100%"
                >
                  <Flex direction="column" h="100%">
                    <Flex 
                      w="60px" 
                      h="60px" 
                      bg={`${step.color}.100`} 
                      color={`${step.color}.500`}
                      borderRadius="lg"
                      justify="center"
                      align="center"
                      mb={4}
                    >
                      <Text fontSize="2xl" fontWeight="bold">{index + 1}</Text>
                    </Flex>
                    <Heading size="md" mb={3} color={`${step.color}.600`}>{step.title}</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.300')} fontSize="sm" flex="1">
                      {step.description}
                    </Text>
                    <Box mt={4}>
                      <Icon as={step.icon} color={`${step.color}.400`} boxSize="1.5rem" />
                    </Box>
                  </Flex>
                </MotionBox>
              ))}
            </Grid>
          </Box>

          {/* Преимущества */}
          <Box w="full" bg={useColorModeValue('teal.50', 'rgba(49, 151, 149, 0.1)')} py={12} px={6} borderRadius="2xl">
            <Heading 
              size="lg" 
              mb={8} 
              textAlign="center"
              color={useColorModeValue('teal.600', 'teal.300')}
            >
              Ключевые преимущества
            </Heading>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
              {benefits.map((benefit, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <HStack spacing={4} align="flex-start">
                    <Flex 
                      w="40px" 
                      h="40px" 
                      bg={cardBg} 
                      color={accentColor}
                      borderRadius="md"
                      justify="center"
                      align="center"
                      boxShadow="md"
                      flexShrink={0}
                    >
                      <Icon as={benefit.icon} boxSize="1.2rem" />
                    </Flex>
                    <Box>
                      <Heading size="sm" mb={1}>{benefit.title}</Heading>
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                        {benefit.description}
                      </Text>
                    </Box>
                  </HStack>
                </MotionBox>
              ))}
            </Grid>
          </Box>

          {/* Форма генерации */}
          <Grid 
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }} 
            gap={8} 
            w="full" 
            mt={6}
          >
            <GridItem>
              <MotionBox
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card bg={cardBg} borderRadius="xl" boxShadow="xl" height="100%">
                  <CardBody p={8}>
                    <Heading 
                      size="md" 
                      mb={6} 
                      color={useColorModeValue('gray.700', 'white')}
                    >
                      Создайте свое резюме
                    </Heading>

                    <VStack spacing={6} align="stretch">
                      <FormControl isRequired>
                        <FormLabel>Целевая должность</FormLabel>
                        <Input 
                          placeholder="напр., Разработчик ПО, Маркетолог-стажер" 
                          value={targetPosition}
                          onChange={(e) => setTargetPosition(e.target.value)}
                          size="lg"
                          bg={useColorModeValue('white', 'gray.700')}
                          borderColor={borderColor}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Отрасль</FormLabel>
                        <Select 
                          placeholder="Выберите отрасль"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          size="lg"
                          bg={useColorModeValue('white', 'gray.700')}
                          borderColor={borderColor}
                        >
                          {industries.map((ind, index) => (
                            <option key={index} value={ind}>{ind}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Стиль резюме</FormLabel>
                        <RadioGroup value={resumeStyle} onChange={setResumeStyle}>
                          <Stack direction="row" spacing={5} wrap="wrap">
                            <Radio value="modern" colorScheme="teal">Современный</Radio>
                            <Radio value="classic" colorScheme="teal">Классический</Radio>
                            <Radio value="creative" colorScheme="teal">Креативный</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>

                      <Button
                        colorScheme="teal"
                        size="lg"
                        leftIcon={<Icon as={FaMagic} />}
                        onClick={handleGenerateResume}
                        isLoading={isGenerating}
                        loadingText="Создание резюме..."
                        mt={4}
                        bgGradient="linear(to-r, teal.400, blue.500)"
                        _hover={{
                          bgGradient: "linear(to-r, teal.500, blue.600)"
                        }}
                      >
                        Создать резюме
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            </GridItem>

            <GridItem>
              <MotionBox
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                height="100%"
              >
                <Card bg={cardBg} borderRadius="xl" boxShadow="xl" height="100%">
                  <CardBody p={8} position="relative" overflow="hidden">
                    {!isGenerated ? (
                      <Flex direction="column" align="center" justify="center" h="100%" textAlign="center">
                        <Icon as={FaFileAlt} boxSize="4rem" color="gray.300" mb={6} />
                        <Heading size="md" color="gray.500" mb={3}>
                          Предпросмотр резюме
                        </Heading>
                        <Text color="gray.400">
                          Здесь появится предпросмотр вашего резюме после генерации
                        </Text>
                      </Flex>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        <Flex justify="space-between" align="center" mb={2}>
                          <Heading size="md" color={useColorModeValue('teal.600', 'teal.300')}>
                            Ваше резюме готово!
                          </Heading>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            leftIcon={<Icon as={FaDownload} />}
                            onClick={handleDownload}
                            variant="outline"
                          >
                            Скачать PDF
                          </Button>
                        </Flex>
                        
                        <Box 
                          p={4} 
                          border="1px dashed" 
                          borderColor={borderColor} 
                          borderRadius="md"
                          bg={useColorModeValue('gray.50', 'gray.700')}
                          position="relative"
                          h="300px"
                          overflow="hidden"
                        >
                          <Image 
                            src="/assets/resume-preview.jpg"
                            alt="Предпросмотр резюме"
                            objectFit="cover"
                            w="full"
                            h="full"
                            opacity={0.7}
                            fallback={
                              <Skeleton 
                                startColor={useColorModeValue('gray.100', 'gray.700')} 
                                endColor={useColorModeValue('gray.300', 'gray.600')}
                                height="300px"
                              />
                            }
                          />
                          
                          <Box 
                            position="absolute" 
                            top="50%" 
                            left="50%" 
                            transform="translate(-50%, -50%)"
                            bg={useColorModeValue('white', 'gray.800')}
                            p={4}
                            borderRadius="md"
                            boxShadow="md"
                            textAlign="center"
                          >
                            <Button
                              size="md"
                              colorScheme="teal"
                              leftIcon={<Icon as={FaDownload} />}
                              onClick={handleDownload}
                              mb={2}
                            >
                              Скачать PDF
                            </Button>
                            <Text fontSize="sm">
                              Резюме создано и готово к скачиванию
                            </Text>
                          </Box>
                        </Box>
                        
                        <VStack spacing={3} align="start" mt={4}>
                          <Heading size="sm">Рекомендации по улучшению:</Heading>
                          <List spacing={2}>
                            <ListItem>
                              <ListIcon as={FaCheckCircle} color="green.500" />
                              <Text as="span" fontSize="sm">
                                Добавьте количественные показатели достижений
                              </Text>
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FaCheckCircle} color="green.500" />
                              <Text as="span" fontSize="sm">
                                Используйте ключевые слова из описания вакансии
                              </Text>
                            </ListItem>
                            <ListItem>
                              <ListIcon as={FaCheckCircle} color="green.500" />
                              <Text as="span" fontSize="sm">
                                Подчеркните навыки, наиболее актуальные для должности
                              </Text>
                            </ListItem>
                          </List>
                        </VStack>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </MotionBox>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default AIResumeGenerator; 