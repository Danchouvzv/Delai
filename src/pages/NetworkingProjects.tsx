import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, Text, SimpleGrid, Input, Select, 
  Flex, Button, IconButton, useColorModeValue, 
  HStack, VStack, Tabs, TabList, Tab, TabPanel, 
  TabPanels, Badge, Divider, useDisclosure, 
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, 
  DrawerBody, DrawerCloseButton, Stack, Checkbox, 
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, 
  RangeSliderThumb, FormLabel, Tooltip, Spinner,
  InputGroup, InputRightElement
} from '@chakra-ui/react';
import { FaFilter, FaStar, FaFire, FaSearch, FaSortAmountDown, FaSortAmountUpAlt } from 'react-icons/fa';
import { collection, query, where, orderBy, limit, getDocs, startAfter, DocumentData, Query, QuerySnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion } from 'framer-motion';
import RecommendedProjects from '../components/RecommendedProjects';
import { useNavigate } from 'react-router-dom';

// Типы для проектов
interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  skillsNeeded: string[];
  mode: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  ownerUid: string;
  ownerName?: string;
  ownerRole?: string;
  teamSize?: number;
  createdAt: any;
  isOpen: boolean;
}

// Типы для фильтров
interface Filters {
  search: string;
  tags: string[];
  skills: string[];
  mode: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  isOpenOnly: boolean;
  teamSizeRange: [number, number];
}

const defaultFilters: Filters = {
  search: '',
  tags: [],
  skills: [],
  mode: 'all',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  isOpenOnly: true,
  teamSizeRange: [1, 10]
};

const MotionBox = motion(Box);

const NetworkingProjects: React.FC = () => {
  const [user] = useAuthState(auth);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [searchInput, setSearchInput] = useState('');
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const badgeBg = useColorModeValue('teal.50', 'teal.900');
  
  // Загрузка проектов
  useEffect(() => {
    fetchProjects();
  }, [filters.isOpenOnly, filters.mode, filters.sortBy, filters.sortDirection]);
  
  // Поиск при нажатии на кнопку или Enter
  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    fetchProjects(true);
  };
  
  // Обработка нажатия Enter в поле поиска
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Функция загрузки проектов
  const fetchProjects = async (reset = false) => {
    try {
      setLoading(reset);
      if (reset) {
        setLastVisible(null);
        setProjects([]);
        setHasMore(true);
      }
      
      if (!reset && !hasMore) return;
      
      // Создаем базовый запрос
      let projectsQuery: Query = collection(db, 'projects');
      
      // Добавляем только сортировку на уровне базы данных
      projectsQuery = query(
        projectsQuery, 
        orderBy(filters.sortBy, filters.sortDirection),
        limit(20) // Увеличиваем лимит, так как будем фильтровать на клиенте
      );
      
      // Если загружаем следующую страницу
      if (!reset && lastVisible) {
        projectsQuery = query(
          projectsQuery,
          startAfter(lastVisible)
        );
      }
      
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Обновляем указатель на последний видимый документ
      const lastDoc = projectsSnapshot.docs[projectsSnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      // Проверяем, есть ли еще данные
      setHasMore(projectsSnapshot.docs.length === 20);
      
      if (projectsSnapshot.empty) {
        setProjects(reset ? [] : [...projects]);
        return;
      }
      
      // Преобразуем документы в объекты проектов
      const fetchedProjects = await Promise.all(
        projectsSnapshot.docs.map(async (doc) => {
          const data = doc.data() as Project;
          
          // Загружаем информацию о владельце проекта
          let ownerName = 'Unknown User';
          let ownerRole = '';
          
          if (data.ownerUid) {
            try {
              const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', data.ownerUid)));
              if (!userDoc.empty) {
                const userData = userDoc.docs[0].data();
                ownerName = userData.displayName || 'Unknown User';
                ownerRole = userData.role || '';
              }
            } catch (error) {
              console.error('Error fetching project owner data:', error);
            }
          }
          
          return {
            ...data,
            id: doc.id,
            ownerName,
            ownerRole
          };
        })
      );
      
      // Применяем клиентскую фильтрацию для всех фильтров
      let filteredProjects = fetchedProjects;
      
      // Фильтрация по isOpen на клиенте
      if (filters.isOpenOnly) {
        filteredProjects = filteredProjects.filter(project => project.isOpen === true);
      }
      
      // Фильтрация по режиму работы на клиенте
      if (filters.mode !== 'all') {
        filteredProjects = filteredProjects.filter(project => project.mode === filters.mode);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProjects = filteredProjects.filter(project => 
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          project.skillsNeeded.some(skill => skill.toLowerCase().includes(searchLower))
        );
      }
      
      if (selectedTags.length > 0) {
        filteredProjects = filteredProjects.filter(project =>
          selectedTags.some(tag => project.tags.includes(tag))
        );
      }
      
      if (selectedSkills.length > 0) {
        filteredProjects = filteredProjects.filter(project =>
          selectedSkills.some(skill => project.skillsNeeded.includes(skill))
        );
      }
      
      if (filters.teamSizeRange[0] > 1 || filters.teamSizeRange[1] < 10) {
        filteredProjects = filteredProjects.filter(project => {
          const teamSize = project.teamSize || 1;
          return teamSize >= filters.teamSizeRange[0] && teamSize <= filters.teamSizeRange[1];
        });
      }
      
      // Обновляем список проектов
      setProjects(reset ? filteredProjects : [...projects, ...filteredProjects]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Загрузка следующей страницы
  const loadMore = () => {
    if (!loading && hasMore) {
      setLoadingMore(true);
      fetchProjects(false);
    }
  };
  
  // Сброс фильтров
  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchInput('');
    setSelectedTags([]);
    setSelectedSkills([]);
    fetchProjects(true);
  };
  
  // Изменение сортировки
  const toggleSortDirection = () => {
    const newDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sortDirection: newDirection });
  };
  
  // Обработчик изменения тегов
  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Обработчик изменения навыков
  const handleSkillSelect = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  // Применение фильтров и закрытие drawer
  const applyFilters = () => {
    setFilters({
      ...filters,
      tags: selectedTags,
      skills: selectedSkills
    });
    fetchProjects(true);
    onClose();
  };
  
  // Получение всех уникальных тегов и навыков из проектов
  const allTags = [...new Set(projects.flatMap(project => project.tags))];
  const allSkills = [...new Set(projects.flatMap(project => project.skillsNeeded))];
  
  // Отрисовка карточки проекта
  const renderProjectCard = (project: Project) => {
    return (
      <MotionBox
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        bg={bgColor}
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        shadow="sm"
        _hover={{ shadow: 'md', borderColor: 'teal.300', cursor: 'pointer' }}
        onClick={() => navigate(`/project/${project.id}`)}
      >
        <Flex justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Heading size="md" noOfLines={1}>{project.title}</Heading>
          {!project.isOpen && (
            <Badge colorScheme="red" ml={2}>Closed</Badge>
          )}
        </Flex>
        
        <Text fontSize="sm" color="gray.500" mb={2} noOfLines={2}>
          {project.description}
        </Text>
        
        <Flex flexWrap="wrap" gap={2} mb={3}>
          {project.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} colorScheme="teal" fontSize="xs">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge colorScheme="gray" fontSize="xs">
              +{project.tags.length - 3}
            </Badge>
          )}
        </Flex>
        
        <Divider my={2} />
        
        <Flex justifyContent="space-between" alignItems="center" mt={2}>
          <HStack>
            <Badge variant="outline" colorScheme="purple">
              {project.mode}
            </Badge>
            {project.teamSize && (
              <Badge variant="outline" colorScheme="blue">
                Team: {project.teamSize}
              </Badge>
            )}
          </HStack>
          
          <Text fontSize="xs" color="gray.500">
            by {project.ownerName}
          </Text>
        </Flex>
      </MotionBox>
    );
  };
  
  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch" maxW="1200px" mx="auto">
        {/* Секция рекомендаций */}
        <RecommendedProjects />
        
        {/* Секция всех проектов */}
        <Box mt={8}>
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="lg">Browse Projects</Heading>
            <Button 
              leftIcon={<FaFilter />} 
              colorScheme="teal" 
              variant="outline"
              onClick={onOpen}
            >
              Filters
            </Button>
          </Flex>
          
          <Flex mb={4} gap={2} flexWrap="wrap" alignItems="center">
            <InputGroup size="md" maxW="400px">
              <Input
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <InputRightElement>
                <IconButton
                  aria-label="Search"
                  icon={<FaSearch />}
                  size="sm"
                  onClick={handleSearch}
                />
              </InputRightElement>
            </InputGroup>
            
            <Select
              value={filters.mode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, mode: e.target.value })}
              maxW="150px"
            >
              <option value="all">All Modes</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </Select>
            
            <Select
              value={filters.sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, sortBy: e.target.value })}
              maxW="150px"
            >
              <option value="createdAt">Newest</option>
              <option value="title">Title</option>
              <option value="teamSize">Team Size</option>
            </Select>
            
            <IconButton
              aria-label="Toggle sort direction"
              icon={filters.sortDirection === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUpAlt />}
              onClick={toggleSortDirection}
              variant="ghost"
            />
            
            <Checkbox
              isChecked={filters.isOpenOnly}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, isOpenOnly: e.target.checked })}
            >
              Open Only
            </Checkbox>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Flex>
          
          {/* Отображение выбранных фильтров */}
          {(selectedTags.length > 0 || selectedSkills.length > 0) && (
            <Flex wrap="wrap" gap={2} mb={4}>
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  colorScheme="teal"
                  variant="solid"
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {tag} ×
                </Badge>
              ))}
              
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill}
                  colorScheme="purple"
                  variant="solid"
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {skill} ×
                </Badge>
              ))}
            </Flex>
          )}
          
          {/* Список проектов */}
          {loading ? (
            <Flex justify="center" align="center" my={10}>
              <Spinner size="xl" color="teal.500" />
            </Flex>
          ) : projects.length > 0 ? (
            <>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={4}>
                {projects.map(renderProjectCard)}
              </SimpleGrid>
              
              {hasMore && (
                <Flex justify="center" mt={6}>
                  <Button
                    onClick={loadMore}
                    isLoading={loadingMore}
                    loadingText="Loading more..."
                    colorScheme="teal"
                    variant="outline"
                  >
                    Load More
                  </Button>
                </Flex>
              )}
            </>
          ) : (
            <Box textAlign="center" py={10}>
              <Heading size="md" mb={3}>No projects found</Heading>
              <Text>Try adjusting your filters or search query</Text>
            </Box>
          )}
        </Box>
      </VStack>
      
      {/* Drawer для расширенных фильтров */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Advanced Filters</DrawerHeader>
          
          <DrawerBody>
            <VStack spacing={5} align="stretch" py={4}>
              <Box>
                <FormLabel>Team Size</FormLabel>
                <Flex align="center">
                  <Text mr={2}>{filters.teamSizeRange[0]}</Text>
                  <RangeSlider
                    defaultValue={filters.teamSizeRange}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(val: number[]) => setFilters({ ...filters, teamSizeRange: [val[0], val[1]] as [number, number] })}
                  >
                    <RangeSliderTrack bg="teal.100">
                      <RangeSliderFilledTrack bg="teal.500" />
                    </RangeSliderTrack>
                    <Tooltip label={filters.teamSizeRange[0]} placement="top">
                      <RangeSliderThumb index={0} />
                    </Tooltip>
                    <Tooltip label={filters.teamSizeRange[1]} placement="top">
                      <RangeSliderThumb index={1} />
                    </Tooltip>
                  </RangeSlider>
                  <Text ml={2}>{filters.teamSizeRange[1]}+</Text>
                </Flex>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm" mb={2}>Tags</Heading>
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
                    >
                      {tag}
                    </Badge>
                  ))}
                  {allTags.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      No tags available. Try loading some projects first.
                    </Text>
                  )}
                </Flex>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm" mb={2}>Skills Needed</Heading>
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
                    >
                      {skill}
                    </Badge>
                  ))}
                  {allSkills.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      No skills available. Try loading some projects first.
                    </Text>
                  )}
                </Flex>
              </Box>
              
              <Box pt={4}>
                <Button colorScheme="teal" width="full" onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button variant="outline" width="full" mt={2} onClick={resetFilters}>
                  Reset All Filters
                </Button>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default NetworkingProjects; 