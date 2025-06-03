import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, Heading, Text, SimpleGrid, Input, Select, 
  Flex, Button, IconButton, useColorModeValue, 
  HStack, VStack, Tag, TagLabel, TagCloseButton,
  Badge, Divider, useDisclosure, 
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, 
  DrawerBody, DrawerCloseButton, DrawerFooter, 
  Stack, Checkbox, Switch, Avatar, Image, 
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, 
  RangeSliderThumb, FormLabel, Tooltip, Spinner,
  InputGroup, InputRightElement, CircularProgress, 
  CircularProgressLabel, FormHelperText, useToast,
  Container, Grid, GridItem, Card, CardBody, CardHeader, CardFooter, Icon
} from '@chakra-ui/react';
import { 
  FaFilter, FaStar, FaFire, FaSearch, FaSortAmountDown, FaSortAmountUpAlt,
  FaGlobe, FaBriefcase, FaUserFriends, FaMapMarkerAlt, FaEye, FaArrowRight,
  FaSearchMinus, FaCheck, FaChevronDown, FaLaptopHouse, FaExclamationCircle
} from 'react-icons/fa';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'framer-motion';
import RecommendedProjects from '../components/RecommendedProjects';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { UseAllProjectsParams, useInfiniteProjects, Project as BaseProject } from '../hooks/useAllProjects';

// Extend the Project interface to include matchScore
interface Project extends BaseProject {
  matchScore?: number;
}

// Define the page structure for the infinite query
interface ProjectPage {
  projects: Project[];
  lastVisible: any;
  hasMore: boolean;
}

// Режимы работы с переводом
const modeTranslations: Record<string, string> = {
  all: 'Все форматы',
  remote: 'Удалённо',
  onsite: 'На месте',
  hybrid: 'Гибридно'
};

// Варианты сортировки с переводом
const sortOptions = [
  { value: 'createdAt', label: 'Сначала новые' },
  { value: 'title', label: 'По названию' },
  { value: 'teamSize', label: 'По размеру команды' }
];

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionCard = motion(Card);

// Варианты анимации для элементов
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.48, 0.15, 0.25, 0.96]
    }
  }),
  exit: { 
    opacity: 0,
    y: -10,
    transition: { 
      duration: 0.2,
      ease: [0.48, 0.15, 0.25, 0.96]
    }
  }
};

// Варианты анимации для скелетона
const skeletonVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const NetworkingProjects: React.FC = () => {
  const [user] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skeletonCount, setSkeletonCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  
  // Параметры запроса с использованием React Query
  const [queryParams, setQueryParams] = useState<UseAllProjectsParams>({
    isOpenOnly: true,
    mode: 'all',
    sortBy: 'createdAt',
    sortDirection: 'desc',
    search: '',
    selectedTags: [],
    selectedSkills: [],
    teamSizeRange: [1, 20],
    pageSize: 12
  });
  
  // Хук для определения видимости элемента для бесконечной прокрутки
  const [loadMoreRef, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Используем React Query для загрузки проектов с правильной типизацией
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteProjects(queryParams);
  
  // Собираем все проекты из всех страниц с правильной типизацией
  const projects = data?.pages.flatMap((page) => {
    // Ensure page is properly typed
    const typedPage = page as ProjectPage;
    return typedPage.projects;
  }) || [];
  
  // Цвета и стили в зависимости от темы
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const badgeBg = useColorModeValue('teal.50', 'teal.900');
  const highlightColor = useColorModeValue('teal.50', 'teal.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const pageGradient = useColorModeValue(
    'linear(to-r, blue.50, teal.50)',
    'linear(to-r, gray.900, gray.800)'
  );
  
  // Определение количества скелетонов в зависимости от размера экрана
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        setSkeletonCount(8); // 4 колонки
      } else if (window.innerWidth >= 768) {
        setSkeletonCount(6); // 3 колонки
      } else if (window.innerWidth >= 480) {
        setSkeletonCount(4); // 2 колонки
      } else {
        setSkeletonCount(2); // 1 колонка
      }
    };
    
    handleResize(); // Вызываем при монтировании
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Загрузка следующей страницы при скролле
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Показываем ошибку, если она есть
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить проекты. Пожалуйста, попробуйте позже.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isError, error, toast]);
  
  // Поиск при нажатии на кнопку или Enter
  const handleSearch = () => {
    setQueryParams({ ...queryParams, search: searchInput });
  };
  
  // Обработка нажатия Enter в поле поиска
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Сброс фильтров
  const resetFilters = () => {
    setQueryParams({
      isOpenOnly: true,
      mode: 'all',
      sortBy: 'createdAt',
      sortDirection: 'desc',
      search: '',
      selectedTags: [],
      selectedSkills: [],
      teamSizeRange: [1, 20],
      pageSize: 12
    });
    setSearchInput('');
    setSelectedTags([]);
    setSelectedSkills([]);
    
    toast({
      title: "Фильтры сброшены",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Изменение сортировки
  const toggleSortDirection = () => {
    const newDirection = queryParams.sortDirection === 'asc' ? 'desc' : 'asc';
    setQueryParams({ ...queryParams, sortDirection: newDirection });
  };
  
  // Обработчик изменения тегов
  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // Ограничение на количество выбранных тегов
      if (selectedTags.length >= 10) {
        toast({
          title: "Превышен лимит тегов",
          description: "Можно выбрать не более 10 тегов одновременно",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Обработчик удаления тега из выбранных
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  // Обработчик изменения навыков
  const handleSkillSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      // Ограничение на количество выбранных навыков
      if (selectedSkills.length >= 10) {
        toast({
          title: "Превышен лимит навыков",
          description: "Можно выбрать не более 10 навыков одновременно",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  // Обработчик удаления навыка из выбранных
  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };
  
  // Применение фильтров и закрытие drawer
  const applyFilters = () => {
    setQueryParams({
      ...queryParams,
      selectedTags,
      selectedSkills
    });
    onClose();
    
    // Уведомление о применении фильтров
    if (selectedTags.length > 0 || selectedSkills.length > 0) {
      toast({
        title: "Фильтры применены",
        description: `Выбрано: ${selectedTags.length} тегов, ${selectedSkills.length} навыков`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  // Переключение отображения фильтров на мобильных устройствах
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Получение всех уникальных тегов и навыков из проектов
  const allTags = [...new Set(projects.flatMap(project => project.tags || []))];
  const allSkills = [...new Set(projects.flatMap(project => project.skillsNeeded || []))];
  
  // Функция для отображения скелетонов загрузки
  const renderSkeletons = () => {
    return Array(skeletonCount).fill(0).map((_, index) => (
      <MotionBox
        key={`skeleton-${index}`}
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        bg={bgColor}
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        shadow="sm"
        height="330px"
      >
        <Flex justifyContent="space-between" alignItems="flex-start" mb={4}>
          <Box width="70%" height="24px" bg="gray.200" borderRadius="md" />
          <Box width="20%" height="24px" bg="gray.200" borderRadius="full" />
        </Flex>
        
        <Box width="100%" height="16px" bg="gray.200" borderRadius="md" mb={2} />
        <Box width="90%" height="16px" bg="gray.200" borderRadius="md" mb={4} />
        
        <Flex flexWrap="wrap" gap={2} mb={4}>
          <Box width="80px" height="20px" bg="gray.200" borderRadius="full" />
          <Box width="100px" height="20px" bg="gray.200" borderRadius="full" />
          <Box width="60px" height="20px" bg="gray.200" borderRadius="full" />
        </Flex>
        
        <Divider my={4} />
        
        <Flex justifyContent="space-between" alignItems="center" mt={4}>
          <HStack>
            <Box width="80px" height="20px" bg="gray.200" borderRadius="md" />
          </HStack>
          <Box width="120px" height="32px" bg="gray.200" borderRadius="md" />
        </Flex>
      </MotionBox>
    ));
  };

  // Отображение оценки соответствия
  const renderMatchScore = (score: number) => {
    let color = 'green';
    let label = 'Идеальное соответствие';
    
    if (score < 0.75) {
      color = 'orange';
      label = 'Хорошее соответствие';
    }
    if (score < 0.6) {
      color = 'yellow';
      label = 'Потенциальное соответствие';
    }
    
    return (
      <Tooltip label={label} placement="top">
        <Flex align="center">
          <CircularProgress value={score * 100} color={`${color}.400`} size="40px" thickness="8px">
            <CircularProgressLabel fontSize="xs" fontWeight="bold">
              {Math.round(score * 100)}%
            </CircularProgressLabel>
          </CircularProgress>
        </Flex>
      </Tooltip>
    );
  };
  
  // Отрисовка карточки проекта
  const renderProjectCard = (project: Project, index: number) => {
    const statusColor = project.isOpen ? 'green' : 'red';
    const statusText = project.isOpen ? 'Открыт' : 'Закрыт';
    
    // Переводим режим работы
    const modeText = modeTranslations[project.mode as keyof typeof modeTranslations] || project.mode;
    
    return (
      <MotionCard
        key={project.id}
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        bg={bgColor}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        shadow="sm"
        overflow="hidden"
        _hover={{ 
          shadow: 'lg', 
          borderColor: 'teal.300', 
          transform: 'translateY(-4px)', 
          transition: 'all 0.3s ease' 
        }}
        onClick={() => navigate(`/project/${project.id}`)}
        role="group"
        transition="all 0.3s ease"
        cursor="pointer"
      >
        <CardHeader pb={2}>
          <Flex justifyContent="space-between" alignItems="flex-start">
            <Heading size="md" fontWeight="bold" noOfLines={1} color={textColor}>
              {project.title}
            </Heading>
            {project.matchScore && renderMatchScore(project.matchScore)}
          </Flex>
          <Flex mt={1} alignItems="center" justifyContent="space-between">
            <Badge colorScheme={statusColor} variant="solid" borderRadius="full" px={2} py={0.5} fontSize="xs">
              {statusText}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              от {project.ownerName}
            </Text>
          </Flex>
        </CardHeader>
        
        <CardBody pt={0}>
          <Text fontSize="sm" color={subTextColor} mb={3} noOfLines={2}>
            {project.description}
          </Text>
          
          <Flex flexWrap="wrap" gap={2} mb={3}>
            {project.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} colorScheme="teal" fontSize="xs" borderRadius="full" px={2} py={0.5}>
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Tooltip 
                label={project.tags.slice(3).join(', ')} 
                placement="top" 
                hasArrow
              >
                <Badge colorScheme="gray" fontSize="xs" borderRadius="full" px={2} py={0.5}>
                  +{project.tags.length - 3}
                </Badge>
              </Tooltip>
            )}
          </Flex>
          
          <Divider my={2} />
          
          <Flex justifyContent="space-between" alignItems="center" mt={3}>
            <HStack spacing={3}>
              <Flex align="center">
                <Icon as={FaGlobe} color="blue.400" mr={1} />
                <Text fontSize="xs">{modeText}</Text>
              </Flex>
              
              {project.teamSize && (
                <Flex align="center">
                  <Icon as={FaUserFriends} color="purple.400" mr={1} />
                  <Text fontSize="xs">Команда: {project.teamSize}</Text>
                </Flex>
              )}
            </HStack>
            
            <MotionFlex
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                rightIcon={<FaArrowRight />} 
                size="sm" 
                colorScheme="teal" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/project/${project.id}`);
                }}
              >
                Подробнее
              </Button>
            </MotionFlex>
          </Flex>
        </CardBody>
      </MotionCard>
    );
  };
  
  // Отображение состояния ошибки
  const renderErrorState = () => (
    <Flex direction="column" align="center" justify="center" my={10} p={6} bg={highlightColor} borderRadius="lg">
      <Icon as={FaExclamationCircle} color="red.500" boxSize={12} mb={4} />
      <Heading size="md" mb={2}>Произошла ошибка</Heading>
      <Text textAlign="center" mb={4}>{error instanceof Error ? error.message : "Не удалось загрузить проекты. Пожалуйста, попробуйте позже."}</Text>
      <Button 
        colorScheme="teal" 
        onClick={() => resetFilters()}
        leftIcon={<FaSearch />}
      >
        Попробовать снова
      </Button>
    </Flex>
  );
  
  // Отображение пустого состояния
  const renderEmptyState = () => (
    <Flex direction="column" align="center" justify="center" my={10} p={6} bg={highlightColor} borderRadius="lg">
      <Icon as={FaSearchMinus} color="gray.500" boxSize={12} mb={4} />
      <Heading size="md" mb={2}>Проекты не найдены</Heading>
      <Text textAlign="center" mb={4}>Попробуйте изменить параметры поиска или фильтры</Text>
      <Button 
        colorScheme="teal" 
        onClick={resetFilters}
      >
        Сбросить все фильтры
      </Button>
    </Flex>
  );
  
  // Fix the mode type issues
  const handleModeChange = (newMode: string) => {
    // Ensure the mode is one of the allowed values
    if (newMode === 'all' || newMode === 'remote' || newMode === 'onsite' || newMode === 'hybrid') {
      setQueryParams({ ...queryParams, mode: newMode as UseAllProjectsParams['mode'] });
    }
  };
  
  return (
    <Box bgGradient={pageGradient} minH="100vh" p={{ base: 3, md: 6 }}>
      <Container maxW="1400px" mx="auto">
        {/* Секция рекомендаций */}
        <RecommendedProjects />
        
        {/* Секция всех проектов */}
        <Box mt={10} bg={bgColor} borderRadius="xl" p={{ base: 4, md: 6 }} shadow="md">
          {/* Заголовок и управляющие элементы */}
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'start', md: 'center' }} 
            mb={6}
            wrap="wrap"
            gap={3}
          >
            <Box>
              <Heading size="xl" mb={1} color={textColor}>Поиск проектов</Heading>
              <Text color={subTextColor}>
                Проекты, рекомендованные на основе вашего профиля и интересов
              </Text>
            </Box>
            
            <HStack spacing={3}>
              <Button 
                leftIcon={<FaFilter />} 
                colorScheme="teal" 
                variant="outline"
                onClick={onOpen}
              >
                Фильтры
              </Button>
              
              <Button 
                colorScheme="purple" 
                variant="solid"
                onClick={() => navigate('/create-project')}
              >
                Создать проект
              </Button>
            </HStack>
          </Flex>
          
          {/* Строка поиска и фильтров */}
          <Box
            position="sticky"
            top="64px"
            zIndex="10"
            bg={useColorModeValue('rgba(255,255,255,0.8)', 'rgba(26,32,44,0.8)')}
            backdropFilter="blur(8px)"
            p={3}
            borderRadius="lg"
            mb={4}
            shadow="sm"
          >
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              gap={3} 
              flexWrap="wrap" 
              alignItems={{ base: 'stretch', md: 'center' }}
            >
              <InputGroup size="md" flex={{ md: 2 }}>
                <Input
                  placeholder="Поиск проектов..."
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  borderRadius="md"
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Поиск"
                    icon={<FaSearch />}
                    size="sm"
                    onClick={handleSearch}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
              
              <Select
                value={queryParams.mode}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  handleModeChange(e.target.value)}
                flex={{ md: 1 }}
                maxW={{ md: '180px' }}
              >
                {Object.entries(modeTranslations).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              
              <Select
                value={queryParams.sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setQueryParams({ ...queryParams, sortBy: e.target.value })}
                flex={{ md: 1 }}
                maxW={{ md: '200px' }}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              
              <Flex align="center" gap={2}>
                <IconButton
                  aria-label="Изменить порядок сортировки"
                  icon={queryParams.sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUpAlt />}
                  onClick={toggleSortDirection}
                  variant="ghost"
                  size="md"
                />
                
                <Flex align="center">
                  <Switch
                    id="open-only"
                    isChecked={queryParams.isOpenOnly}
                    onChange={(e) => setQueryParams({ ...queryParams, isOpenOnly: e.target.checked })}
                    colorScheme="teal"
                    mr={2}
                  />
                  <FormLabel htmlFor="open-only" mb={0} fontSize="sm">Только открытые</FormLabel>
                </Flex>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  colorScheme="gray"
                >
                  Сбросить
                </Button>
              </Flex>
            </Flex>
          </Box>
          
          {/* Отображение выбранных фильтров */}
          {(selectedTags.length > 0 || selectedSkills.length > 0) && (
            <Flex wrap="wrap" gap={2} mb={4} p={2} bg={highlightColor} borderRadius="md">
              <Text fontSize="sm" fontWeight="medium" mr={2}>Активные фильтры:</Text>
              
              {selectedTags.map((tag) => (
                <Tag
                  key={`tag-${tag}`}
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="teal"
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => removeTag(tag)} />
                </Tag>
              ))}
              
              {selectedSkills.map((skill) => (
                <Tag
                  key={`skill-${skill}`}
                  size="md"
                  borderRadius="full"
                  variant="solid"
                  colorScheme="purple"
                >
                  <TagLabel>{skill}</TagLabel>
                  <TagCloseButton onClick={() => removeSkill(skill)} />
                </Tag>
              ))}
            </Flex>
          )}
          
          {/* Контент: список проектов, состояние загрузки или ошибки */}
          <Box mt={4}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} key="loading">
                  {renderSkeletons()}
                </SimpleGrid>
              ) : isError ? (
                <Box key="error">{renderErrorState()}</Box>
              ) : projects.length > 0 ? (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} key="projects">
                  {projects.map((project, index) => renderProjectCard(project, index))}
                  
                  {/* Элемент для отслеживания конца списка для бесконечной прокрутки */}
                  {hasNextPage && (
                    <Box ref={loadMoreRef} height="100px" width="100%" key="loadMore">
                      {isFetchingNextPage && (
                        <Flex justify="center" align="center" height="100%">
                          <Spinner size="lg" color="teal.500" thickness="3px" />
                        </Flex>
                      )}
                    </Box>
                  )}
                </SimpleGrid>
              ) : (
                <Box key="empty">{renderEmptyState()}</Box>
              )}
            </AnimatePresence>
            
            {/* Кнопка "Загрузить еще" как альтернатива бесконечной прокрутке */}
            {!isFetchingNextPage && hasNextPage && projects.length > 0 && (
              <Flex justify="center" mt={8}>
                <Button
                  onClick={() => fetchNextPage()}
                  colorScheme="teal"
                  variant="outline"
                  leftIcon={<FaSearch />}
                  size="lg"
                  width={{ base: 'full', md: 'auto' }}
                >
                  Загрузить еще
                </Button>
              </Flex>
            )}
          </Box>
        </Box>
      </Container>
      
      {/* Drawer для расширенных фильтров */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(2px)" />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" fontSize="xl">Расширенные фильтры</DrawerHeader>
          
          <DrawerBody>
            <VStack spacing={6} align="stretch" py={4}>
              <Box>
                <FormLabel fontWeight="medium">Размер команды</FormLabel>
                <Flex align="center">
                  <Text mr={2} fontWeight="medium">{queryParams.teamSizeRange[0]}</Text>
                  <RangeSlider
                    defaultValue={queryParams.teamSizeRange}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(val: number[]) => setQueryParams({ ...queryParams, teamSizeRange: [val[0], val[1]] as [number, number] })}
                    colorScheme="teal"
                  >
                    <RangeSliderTrack bg="teal.100">
                      <RangeSliderFilledTrack bg="teal.500" />
                    </RangeSliderTrack>
                    <Tooltip label={queryParams.teamSizeRange[0]} placement="top">
                      <RangeSliderThumb index={0} />
                    </Tooltip>
                    <Tooltip label={queryParams.teamSizeRange[1]} placement="top">
                      <RangeSliderThumb index={1} />
                    </Tooltip>
                  </RangeSlider>
                  <Text ml={2} fontWeight="medium">{queryParams.teamSizeRange[1]}+</Text>
                </Flex>
                <FormHelperText>Выберите диапазон размера команды</FormHelperText>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm" mb={3}>Режим работы</Heading>
                <Flex flexWrap="wrap" gap={3}>
                  {Object.entries(modeTranslations).map(([value, label]) => (
                    value !== 'all' && (
                      <Button
                        key={value}
                        size="sm"
                        colorScheme={queryParams.mode === value ? 'teal' : 'gray'}
                        variant={queryParams.mode === value ? 'solid' : 'outline'}
                        onClick={() => handleModeChange(value)}
                        leftIcon={
                          value === 'remote' ? <FaGlobe /> : 
                          value === 'onsite' ? <FaMapMarkerAlt /> : 
                          <FaLaptopHouse />
                        }
                      >
                        {label}
                      </Button>
                    )
                  ))}
                </Flex>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm" mb={3}>Теги</Heading>
                <Flex flexWrap="wrap" gap={2}>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      px={2}
                      py={1}
                      borderRadius="full"
                      colorScheme={selectedTags.includes(tag) ? 'teal' : 'gray'}
                      cursor="pointer"
                      onClick={() => handleTagSelect(tag)}
                      _hover={{ 
                        bg: selectedTags.includes(tag) ? 'teal.600' : 'gray.300',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }}
                      transition="all 0.2s"
                    >
                      {selectedTags.includes(tag) && <Icon as={FaCheck} mr={1} boxSize="2" />}
                      {tag}
                    </Badge>
                  ))}
                  {allTags.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      Нет доступных тегов. Попробуйте сначала загрузить проекты.
                    </Text>
                  )}
                </Flex>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm" mb={3}>Требуемые навыки</Heading>
                <Flex flexWrap="wrap" gap={2}>
                  {allSkills.map((skill) => (
                    <Badge
                      key={skill}
                      px={2}
                      py={1}
                      borderRadius="full"
                      colorScheme={selectedSkills.includes(skill) ? 'purple' : 'gray'}
                      cursor="pointer"
                      onClick={() => handleSkillSelect(skill)}
                      _hover={{ 
                        bg: selectedSkills.includes(skill) ? 'purple.600' : 'gray.300',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }}
                      transition="all 0.2s"
                    >
                      {selectedSkills.includes(skill) && <Icon as={FaCheck} mr={1} boxSize="2" />}
                      {skill}
                    </Badge>
                  ))}
                  {allSkills.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      Нет доступных навыков. Попробуйте сначала загрузить проекты.
                    </Text>
                  )}
                </Flex>
              </Box>
            </VStack>
          </DrawerBody>
          
          <DrawerFooter borderTopWidth="1px">
            <VStack width="full" spacing={3}>
              <Button colorScheme="teal" width="full" onClick={applyFilters} leftIcon={<FaCheck />}>
                Применить фильтры
              </Button>
              <Button variant="outline" width="full" onClick={resetFilters}>
                Сбросить все фильтры
              </Button>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default NetworkingProjects; 