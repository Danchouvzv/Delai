import React from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  Heading,
  useToast
} from '@chakra-ui/react';
import { FaThumbsUp } from 'react-icons/fa';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import ProjectCard from './networking/ProjectCard';
import EmptyStateCard from './networking/EmptyStateCard';
import SkeletonProjectCard from './common/SkeletonProjectCard';
import { useRecommendedProjects } from '../hooks/useRecommendedProjects';
import { useApplicationStatuses } from '../hooks/useApplicationStatuses';

interface RecommendedProjectsProps {
  onApply?: (projectId: string) => void;
}

/**
 * Component for displaying recommended projects
 */
const RecommendedProjects: React.FC<RecommendedProjectsProps> = ({ onApply }) => {
  const [user] = useAuthState(auth);
  const toast = useToast();
  
  // Получаем рекомендованные проекты
  const { data: projects, isLoading, error } = useRecommendedProjects({
    userId: user?.uid || '',
    options: { limit: 6 },
    queryOptions: {
      enabled: !!user?.uid,
      onError: (err: Error) => {
        toast({
          title: 'Ошибка загрузки рекомендаций',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  });
  
  // Получаем статусы заявок
  const projectIds = projects?.map(p => p.projectId) || [];
  const { data: statuses } = useApplicationStatuses({
    userId: user?.uid,
    projectIds
  });
  
  // Рендер карточки проекта
  const renderProjectCard = (project: any) => {
    if (!project.projectData) return null;
    
    return (
      <ProjectCard
        key={project.projectId}
        projectId={project.projectId}
        title={project.projectData.title}
        description={project.projectData.description}
        tags={project.projectData.tags || []}
        mode={project.projectData.mode}
        ownerName={project.projectData.ownerName || 'Неизвестный'}
        ownerAvatar={project.projectData.ownerAvatar}
        teamSize={project.projectData.teamSize}
        onApply={onApply}
        applicationStatus={statuses?.[project.projectId]}
      />
    );
  };
  
  // Рендер скелетонов при загрузке
  const renderSkeletons = () => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {Array(6)
        .fill(0)
        .map((_, idx) => (
          <SkeletonProjectCard key={idx} />
        ))}
    </SimpleGrid>
  );
  
  // Рендер пустого состояния
  const renderEmptyState = () => (
    <EmptyStateCard
      icon={FaThumbsUp}
      title="Пока нет рекомендаций"
      description="Заполните свой профиль, чтобы получить персональные рекомендации проектов."
      buttonText="Обновить профиль"
      onButtonClick={() => {
        // Переход на вкладку профиля
        const params = new URLSearchParams(window.location.search);
        params.set('tab', 'profile');
        window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        window.dispatchEvent(new Event('popstate'));
      }}
      colorScheme="orange"
    />
  );
  
  return (
    <Box>
      <Heading size="lg" mb={6}>
        Рекомендованные проекты
      </Heading>
      
      {error && (
        <Text color="red.500" mb={4}>
          Ошибка загрузки рекомендаций: {error.message}
        </Text>
      )}
      
      {isLoading ? (
        renderSkeletons()
      ) : projects && projects.length > 0 ? (
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3 }}
          spacing={6}
        >
          {projects.map(project => renderProjectCard(project))}
        </SimpleGrid>
      ) : (
        renderEmptyState()
      )}
    </Box>
  );
};

export default RecommendedProjects; 