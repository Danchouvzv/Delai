import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  mode: 'remote' | 'onsite' | 'hybrid';
  ownerUid: string;
  ownerName: string;
  ownerAvatar?: string;
  teamSize: number;
  createdAt: any; // FirestoreTimestamp
  popularityScore?: number;
  applicationsCount?: number;
}

export interface UseAllProjectsParams {
  filters?: {
    tags?: string[];
    mode?: 'all' | 'remote' | 'onsite' | 'hybrid';
    teamSize?: 'all' | '1-2' | '3-5' | '6+';
  };
  sortBy?: 'createdAt' | 'popularityScore';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

/**
 * Hook for fetching and filtering projects
 * @param params - Object containing filters, sorting options, and pagination
 * @param queryOptions - Additional React Query options
 * @returns Query result with projects data, loading state, and error
 */
export function useAllProjects(
  params: UseAllProjectsParams = {}, 
  queryOptions?: UseQueryOptions<{ projects: ProjectData[]; total: number }, Error>
) {
  const { 
    filters = {}, 
    sortBy = 'createdAt', 
    sortDirection = 'desc', 
    page = 1, 
    perPage = 9 
  } = params;

  return useQuery({
    queryKey: ['allProjects', filters, sortBy, sortDirection, page, perPage],
    queryFn: async () => {
      const constraints: any[] = [];
      
      // Фильтр по mode
      if (filters.mode && filters.mode !== 'all') {
        constraints.push(where('mode', '==', filters.mode));
      }
      
      // Фильтр по teamSize
      if (filters.teamSize && filters.teamSize !== 'all') {
        switch (filters.teamSize) {
          case '1-2':
            constraints.push(where('teamSize', '>=', 1));
            constraints.push(where('teamSize', '<=', 2));
            break;
          case '3-5':
            constraints.push(where('teamSize', '>=', 3));
            constraints.push(where('teamSize', '<=', 5));
            break;
          case '6+':
            constraints.push(where('teamSize', '>=', 6));
            break;
        }
      }
      
      // Фильтр по tags
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
      
      // Составляем запрос
      const projectsQuery = query(
        collection(db, 'projects'),
        ...constraints,
        orderBy(sortBy, sortDirection),
        limit(perPage * page)
      );
      
      const snapshot = await getDocs(projectsQuery);
      
      const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ProjectData[];
      
      // Клиентская пагинация
      const startIndex = (page - 1) * perPage;
      const paginatedProjects = allProjects.slice(startIndex, startIndex + perPage);
      
      return {
        projects: paginatedProjects,
        total: snapshot.size
      };
    },
    staleTime: 1000 * 60 * 5, // 5 минут
    keepPreviousData: true,
    ...queryOptions,
  });
}

/**
 * Hook for fetching and filtering projects with infinite scrolling
 * @param params - Object containing filters, sorting options, and pagination
 * @returns Query result with projects data, loading state, and error
 */
export interface Project extends ProjectData {}

export function useInfiniteProjects(
  params: UseAllProjectsParams = {}
) {
  const { 
    filters = {}, 
    sortBy = 'createdAt', 
    sortDirection = 'desc',
    search = '',
    selectedTags = [],
    selectedSkills = [],
    teamSizeRange = [1, 20],
    isOpenOnly = true,
    pageSize = 10
  } = params;

  return useQuery({
    queryKey: ['infiniteProjects', params],
    queryFn: async () => {
      const constraints: any[] = [];
      
      // Filter by mode
      if (filters.mode && filters.mode !== 'all') {
        constraints.push(where('mode', '==', filters.mode));
      }
      
      // Filter by team size
      if (filters.teamSize && filters.teamSize !== 'all') {
        switch (filters.teamSize) {
          case '1-2':
            constraints.push(where('teamSize', '>=', 1));
            constraints.push(where('teamSize', '<=', 2));
            break;
          case '3-5':
            constraints.push(where('teamSize', '>=', 3));
            constraints.push(where('teamSize', '<=', 5));
            break;
          case '6+':
            constraints.push(where('teamSize', '>=', 6));
            break;
        }
      }
      
      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
      
      // Create the query
      const projectsQuery = query(
        collection(db, 'projects'),
        ...constraints,
        orderBy(sortBy, sortDirection),
        limit(pageSize)
      );
      
      const snapshot = await getDocs(projectsQuery);
      
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ProjectData[];
      
      return {
        pages: [{
          projects,
          lastVisible: snapshot.docs[snapshot.docs.length - 1],
          hasMore: projects.length === pageSize
        }],
        pageParams: [null]
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export default useAllProjects; 