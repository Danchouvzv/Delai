import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
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

export function useRecommendedProjects(userId: string) {
  return useQuery({
    queryKey: ['recommendedProjects', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        // Получаем рекомендации для текущего пользователя
        const matchesRef = collection(db, 'matches', userId, 'recommendations');
        const matchesQuery = query(
          matchesRef,
          orderBy('score', 'desc'),
          limit(10)
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
        const filteredProjects = resolvedProjects.filter(Boolean) as RecommendedProject[];
        
        return filteredProjects;
      } catch (err: any) {
        console.error('Error fetching recommended projects:', err);
        throw err; // Let React Query handle the error
      }
    },
    enabled: Boolean(userId), // запрос только после того, как есть userId
    onError: (err) => {
      console.error('useRecommendedProjects failed:', err);
    }
  });
} 