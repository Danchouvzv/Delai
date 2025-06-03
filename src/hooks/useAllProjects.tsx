import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  skillsNeeded: string[];
  mode: 'remote' | 'onsite' | 'hybrid';
  ownerUid: string;
  ownerName?: string;
  ownerAvatar?: string;
  teamSize: number;
  isOpen: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface UseAllProjectsParams {
  isOpenOnly: boolean;
  mode: 'all' | 'remote' | 'onsite' | 'hybrid';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  selectedTags: string[];
  selectedSkills: string[];
  teamSizeRange: [number, number];
  pageSize: number;
}

export function useAllProjects(
  params: UseAllProjectsParams, 
  lastVisibleSnapshot: QueryDocumentSnapshot | null
) {
  return useQuery({
    queryKey: ['allProjects', params, lastVisibleSnapshot ? lastVisibleSnapshot.id : null],
    queryFn: async () => {
      // 1. Строим базовый запрос Firestore
      let projectsQuery = collection(db, 'projects') as any;
      
      if (params.isOpenOnly) {
        projectsQuery = query(projectsQuery, where('isOpen', '==', true));
      }
      
      if (params.mode !== 'all') {
        projectsQuery = query(projectsQuery, where('mode', '==', params.mode));
      }
      
      projectsQuery = query(
        projectsQuery, 
        orderBy(params.sortBy, params.sortDirection), 
        limit(params.pageSize)
      );
      
      if (lastVisibleSnapshot) {
        projectsQuery = query(projectsQuery, startAfter(lastVisibleSnapshot));
      }

      const snapshot = await getDocs(projectsQuery);
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      const projects: Project[] = [];

      // 2. Собираем данные вместе с владельцем
      for (const docSnap of snapshot.docs) {
        const pd = docSnap.data() as any;
        let ownerName = '—';
        let ownerAvatar = '';
        
        if (pd.ownerUid) {
          const ownerRef = doc(db, `users/${pd.ownerUid}`);
          const ownerSnap = await getDoc(ownerRef);
          
          if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();
            ownerName = ownerData?.displayName || ownerData?.name || '—';
            ownerAvatar = ownerData?.photoURL || '';
          }
        }

        projects.push({
          id: docSnap.id,
          ...pd,
          ownerName,
          ownerAvatar
        });
      }

      // 3. Клиентская фильтрация: search, tags, skills, teamSizeRange
      const filteredProjects = projects.filter((p) => {
        const searchable = [
          p.title?.toLowerCase() || '',
          p.description?.toLowerCase() || '',
          ...(p.tags || []).map((t: string) => t.toLowerCase()),
          ...(p.skillsNeeded || []).map((s: string) => s.toLowerCase()),
        ];
        
        const matchesSearch = params.search
          ? searchable.some((val) => val.includes(params.search.toLowerCase()))
          : true;
          
        const matchesTags = params.selectedTags.length
          ? params.selectedTags.some((tag) => (p.tags || []).includes(tag))
          : true;
          
        const matchesSkills = params.selectedSkills.length
          ? params.selectedSkills.some((sk) => (p.skillsNeeded || []).includes(sk))
          : true;
          
        const teamSize = p.teamSize || 1;
        const matchesTeam = teamSize >= params.teamSizeRange[0] && teamSize <= params.teamSizeRange[1];

        return matchesSearch && matchesTags && matchesSkills && matchesTeam;
      });

      return {
        projects: filteredProjects,
        lastVisible,
        hasMore: snapshot.docs.length === params.pageSize
      };
    },
    keepPreviousData: true, // чтобы при подгрузке следующей страницы не "мерцал" предыдущий список
    onError: (err) => console.error('useAllProjects error:', err),
  });
}

// Хук для бесконечной подгрузки проектов
export function useInfiniteProjects(params: UseAllProjectsParams) {
  return useInfiniteQuery({
    queryKey: ['infiniteProjects', params],
    queryFn: async ({ pageParam = null }) => {
      // Создаем новый экземпляр запроса для каждой страницы
      let projectsQuery = collection(db, 'projects') as any;
      
      if (params.isOpenOnly) {
        projectsQuery = query(projectsQuery, where('isOpen', '==', true));
      }
      
      if (params.mode !== 'all') {
        projectsQuery = query(projectsQuery, where('mode', '==', params.mode));
      }
      
      projectsQuery = query(
        projectsQuery, 
        orderBy(params.sortBy, params.sortDirection), 
        limit(params.pageSize)
      );
      
      if (pageParam) {
        projectsQuery = query(projectsQuery, startAfter(pageParam));
      }

      const snapshot = await getDocs(projectsQuery);
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      const projects: Project[] = [];

      // Собираем данные вместе с владельцем
      for (const docSnap of snapshot.docs) {
        const pd = docSnap.data() as any;
        let ownerName = '—';
        let ownerAvatar = '';
        
        if (pd.ownerUid) {
          const ownerRef = doc(db, `users/${pd.ownerUid}`);
          const ownerSnap = await getDoc(ownerRef);
          
          if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();
            ownerName = ownerData?.displayName || ownerData?.name || '—';
            ownerAvatar = ownerData?.photoURL || '';
          }
        }

        projects.push({
          id: docSnap.id,
          ...pd,
          ownerName,
          ownerAvatar
        });
      }

      // Клиентская фильтрация
      const filteredProjects = projects.filter((p) => {
        const searchable = [
          p.title?.toLowerCase() || '',
          p.description?.toLowerCase() || '',
          ...(p.tags || []).map((t: string) => t.toLowerCase()),
          ...(p.skillsNeeded || []).map((s: string) => s.toLowerCase()),
        ];
        
        const matchesSearch = params.search
          ? searchable.some((val) => val.includes(params.search.toLowerCase()))
          : true;
          
        const matchesTags = params.selectedTags.length
          ? params.selectedTags.some((tag) => (p.tags || []).includes(tag))
          : true;
          
        const matchesSkills = params.selectedSkills.length
          ? params.selectedSkills.some((sk) => (p.skillsNeeded || []).includes(sk))
          : true;
          
        const teamSize = p.teamSize || 1;
        const matchesTeam = teamSize >= params.teamSizeRange[0] && teamSize <= params.teamSizeRange[1];

        return matchesSearch && matchesTags && matchesSkills && matchesTeam;
      });

      return {
        projects: filteredProjects,
        lastVisible,
        hasMore: snapshot.docs.length === params.pageSize
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    keepPreviousData: true,
    onError: (err) => console.error('useInfiniteProjects error:', err),
  });
} 