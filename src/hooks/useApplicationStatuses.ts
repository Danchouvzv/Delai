import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export type ApplicationStatus = 'pending' | 'accepted' | 'declined';

export interface Application {
  id: string;
  userId: string;
  projectId: string;
  status: ApplicationStatus;
  message: string;
  createdAt: any; // FirestoreTimestamp
}

interface UseApplicationStatusesParams {
  userId: string | undefined;
  projectIds: string[];
}

/**
 * Hook to fetch application statuses for a user across multiple projects
 * @param params - Object containing userId and projectIds
 * @returns Object with statuses map and loading state
 */
export function useApplicationStatuses({ userId, projectIds }: UseApplicationStatusesParams) {
  return useQuery({
    queryKey: ['applicationStatuses', userId, projectIds],
    queryFn: async () => {
      // Если нет пользователя или проектов, возвращаем пустой объект
      if (!userId || projectIds.length === 0) {
        return {};
      }

      // Максимальное количество элементов в array-contains-any или in - 10
      // Если проектов больше 10, разбиваем на чанки
      const chunkSize = 10;
      const statusMap: Record<string, ApplicationStatus> = {};
      
      // Разбиваем массив projectIds на чанки по 10 элементов
      for (let i = 0; i < projectIds.length; i += chunkSize) {
        const chunk = projectIds.slice(i, i + chunkSize);
        
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('userId', '==', userId),
          where('projectId', 'in', chunk)
        );
        
        const snapshot = await getDocs(applicationsQuery);
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Application;
          statusMap[data.projectId] = data.status;
        });
      }
      
      return statusMap;
    },
    enabled: !!userId && projectIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

export default useApplicationStatuses; 