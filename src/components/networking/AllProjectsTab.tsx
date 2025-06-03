import React, { useState, useEffect } from 'react';
import {
  Box, SimpleGrid, Button, Flex, Heading, Text,
  useDisclosure, useToast, HStack, Icon
} from '@chakra-ui/react';
import { FaFilter, FaClipboardList } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAllProjects, UseAllProjectsParams } from '../../hooks/useAllProjects';
import DrawerFilter from './DrawerFilter';
import ProjectCard from './ProjectCard';
import SkeletonProjectCard from '../common/SkeletonProjectCard';
import EmptyStateCard from './EmptyStateCard';
import Pagination from './Pagination';
import { useApplicationStatuses } from '../../hooks/useApplicationStatuses';

interface AllProjectsTabProps {
  onApplyToProject?: (projectId: string) => void;
}

/**
 * Component for displaying all projects with filtering and pagination
 */
const AllProjectsTab: React.FC<AllProjectsTabProps> = ({ onApplyToProject }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [user] = useAuthState(auth);
  
  // Состояние фильтров
  const [filters, setFilters] = useState<UseAllProjectsParams['filters']>({});
  const [sortBy, setSortBy] = useState<'createdAt' | 'popularityScore'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Загрузка проектов
  const { data, isLoading, error } = useAllProjects({
    filters,
    sortBy,
    sortDirection,
    page,
    perPage: 9
  });
  
  // Получение статусов заявок для текущего пользователя
  const projectIds = data?.projects?.map(p => p.id) || [];
  const { data: statuses, isLoading: isStatusesLoading } = useApplicationStatuses(
    user?.uid,
    projectIds
  );
  
  // Синхронизация с URL при монтировании
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Извлечение параметров из URL
    const pageParam = Number(params.get('page') || '1');
    const sortByParam = (params.get('sortBy') as 'createdAt' | 'popularityScore') || 'createdAt';
    const sortDirParam = (params.get('sortDir') as 'asc' | 'desc') || 'desc';
    const modeParam = (params.get('mode') as 'remote' | 'onsite' | 'hybrid' | 'all') || 'all';
    const teamSizeParam = (params.get('teamSize') as '1-2' | '3-5' | '6+' | 'all') || 'all';
    const tagsParam = params.get('tags') ? params.get('tags')!.split(',') : [];
    
    setPage(pageParam);
    setSortBy(sortByParam);
    setSortDirection(sortDirParam);
    setFilters({
      mode: modeParam,
      teamSize: teamSizeParam,
      tags: tagsParam
    });
  }, []);
  
  // Синхронизация URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', 'projects');
    params.set('page', String(page));
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDirection);
    
    if (filters.mode && filters.mode !== 'all') params.set('mode', filters.mode);
    if (filters.teamSize && filters.teamSize !== 'all') params.set('teamSize', filters.teamSize);
    if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, { replace: true });
  }, [filters, sortBy, sortDirection, page, navigate, location.pathname]);
  
  // Обработка ошибок
  useEffect(() => {
    if (error) {
      toast({
        title: 'Ошибка загрузки проектов',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);
  
  // Обработчик изменения фильтров
  const handleApplyFilters = (
    newFilters: UseAllProjectsParams['filters'],
    newSortBy: UseAllProjectsParams['sortBy'],
    newSortDirection: UseAllProjectsParams['sortDirection']
  ) => {
    setFilters(newFilters);
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    setPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };
  
  // Отображение скелетонов при загрузке
  const renderSkeletons = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {Array(9)
        .fill(0)
        .map((_, idx) => (
          <SkeletonProjectCard key={idx} />
        ))}
    </SimpleGrid>
  );
  
  // Отображение пустого состояния
  const renderEmptyState = () => (
    <EmptyStateCard
      icon={FaClipboardList}
      title="Проекты не найдены"
      description="Попробуйте изменить фильтры или убрать некоторые условия."
      buttonText="Сбросить фильтры"
      onButtonClick={() => {
        setFilters({});
        setSortBy('createdAt');
        setSortDirection('desc');
        setPage(1);
      }}
      colorScheme="orange"
    />
  );
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Все проекты</Heading>
        <Button 
          leftIcon={<Icon as={FaFilter} />} 
          onClick={onOpen}
          colorScheme="orange"
          variant="outline"
          aria-label="Открыть фильтры проектов"
        >
          Фильтры
        </Button>
      </Flex>
      
      {/* Фильтры */}
      <DrawerFilter
        isOpen={isOpen}
        onClose={onClose}
        appliedFilters={filters}
        appliedSortBy={sortBy}
        appliedSortDirection={sortDirection}
        onApplyFilters={handleApplyFilters}
      />
      
      {/* Активные фильтры */}
      {(filters.tags?.length || filters.mode !== 'all' || filters.teamSize !== 'all') && (
        <HStack spacing={2} mb={4} flexWrap="wrap">
          <Text fontWeight="medium">Активные фильтры:</Text>
          {filters.mode && filters.mode !== 'all' && (
            <Text fontSize="sm">Режим: {filters.mode}</Text>
          )}
          {filters.teamSize && filters.teamSize !== 'all' && (
            <Text fontSize="sm">Команда: {filters.teamSize}</Text>
          )}
          {filters.tags && filters.tags.length > 0 && (
            <Text fontSize="sm">Теги: {filters.tags.join(', ')}</Text>
          )}
        </HStack>
      )}
      
      {/* Контент */}
      {isLoading ? (
        renderSkeletons()
      ) : data?.projects && data.projects.length > 0 ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {data.projects.map((project) => (
              <ProjectCard
                key={project.id}
                projectId={project.id}
                title={project.title}
                description={project.description}
                tags={project.tags}
                mode={project.mode}
                ownerName={project.ownerName}
                ownerAvatar={project.ownerAvatar}
                teamSize={project.teamSize}
                onApply={onApplyToProject}
                applicationStatus={statuses?.[project.id]}
              />
            ))}
          </SimpleGrid>
          
          {/* Пагинация */}
          <Pagination
            currentPage={page}
            totalCount={data.total}
            pageSize={9}
            onPageChange={setPage}
          />
        </>
      ) : (
        renderEmptyState()
      )}
    </Box>
  );
};

export default AllProjectsTab; 