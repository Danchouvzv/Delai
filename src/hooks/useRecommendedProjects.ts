import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { collection, query, orderBy, limit as firestoreLimit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Интерфейс для данных рекомендованного проекта
export interface RecommendedProject {
  id: string;
  projectId: string;
  score: number;
  reason: string;
  matchType?: string;
  createdAt?: any;
  
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

interface RecommendedProjectsFilters {
  tags?: string[];
  skills?: string[];
  mode?: 'remote' | 'onsite' | 'hybrid' | 'all';
}

interface UseRecommendedProjectsOptions {
  limit?: number;
  filters?: RecommendedProjectsFilters;
}

interface UseRecommendedProjectsParams {
  userId: string;
  options?: UseRecommendedProjectsOptions;
  queryOptions?: UseQueryOptions<RecommendedProject[], Error>;
}

export function useRecommendedProjects({
  userId,
  options = {},
  queryOptions
}: UseRecommendedProjectsParams) {
  const { limit = 10, filters } = options;
  
  return useQuery({
    queryKey: ['recommendedProjects', userId, limit, filters],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      
      // Получаем рекомендации для текущего пользователя
      const matchesRef = collection(db, 'matches', userId, 'recommendations');
      const matchesQuery = query(
        matchesRef,
        orderBy('score', 'desc'),
        firestoreLimit(limit)
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      
      if (matchesSnapshot.empty) {
        return [];
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
        
        // Apply client-side filters if provided
        if (filters) {
          // Filter by tags
          if (filters.tags && filters.tags.length > 0) {
            const projectTags = projectData?.tags || [];
            if (!filters.tags.some(tag => projectTags.includes(tag))) {
              return null;
            }
          }
          
          // Filter by skills
          if (filters.skills && filters.skills.length > 0) {
            const projectSkills = projectData?.skillsNeeded || [];
            if (!filters.skills.some(skill => projectSkills.includes(skill))) {
              return null;
            }
          }
          
          // Filter by mode
          if (filters.mode && filters.mode !== 'all') {
            if (projectData?.mode !== filters.mode) {
              return null;
            }
          }
        }
        
        return {
          ...matchData,
          id: matchDoc.id,
          projectData: {
            ...projectData,
            ownerName,
            ownerAvatar
          }
        };
      });
      
      const resolvedProjects = await Promise.all(projectPromises);
      return resolvedProjects.filter(Boolean) as RecommendedProject[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
    enabled: !!userId,
    ...queryOptions,
  });
} 