import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  Timestamp, 
  increment,
  limit,
  DocumentReference
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';

// Базовые функции CRUD для работы с вакансиями
export const fetchAllPosts = async (): Promise<Post[]> => {
  try {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
  } catch (error) {
    console.error('Error fetching all posts:', error);
    throw error;
  }
};

export const fetchPostById = async (postId: string): Promise<Post | null> => {
  try {
    const postDoc = await getDoc(doc(db, 'posts', postId));
    
    if (postDoc.exists()) {
      return {
        id: postDoc.id,
        ...postDoc.data()
      } as Post;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching post with ID ${postId}:`, error);
    throw error;
  }
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: postData.status || 'pending', // Default to pending for moderation
      views: 0,
      applicationCount: 0
    };
    
    const docRef = await addDoc(collection(db, 'posts'), postWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updatePost = async (postId: string, postData: Partial<Post>): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    // Добавляем timestamp обновления
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating post with ID ${postId}:`, error);
    throw error;
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error(`Error deleting post with ID ${postId}:`, error);
    throw error;
  }
};

// Специализированные функции для админ-панели
export const fetchPendingPosts = async (): Promise<Post[]> => {
  try {
    const pendingQuery = query(
      collection(db, 'posts'), 
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(pendingQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[];
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    throw error;
  }
};

export const approvePost = async (postId: string, moderatorComment?: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    await updateDoc(postRef, {
      status: 'active',
      moderationComment: moderatorComment || 'Одобрено',
      moderatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error approving post with ID ${postId}:`, error);
    throw error;
  }
};

export const rejectPost = async (postId: string, moderatorComment: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    await updateDoc(postRef, {
      status: 'rejected',
      moderationComment: moderatorComment || 'Отклонено',
      moderatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error rejecting post with ID ${postId}:`, error);
    throw error;
  }
};

export const archivePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    
    await updateDoc(postRef, {
      status: 'archived',
      archivedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error archiving post with ID ${postId}:`, error);
    throw error;
  }
};

// Статистика для админ-панели
export const getPostsStats = async () => {
  try {
    // Получаем все посты для статистики
    const posts = await fetchAllPosts();
    
    // Базовая статистика
    const stats = {
      total: posts.length,
      active: posts.filter(post => post.status === 'active').length,
      pending: posts.filter(post => post.status === 'pending').length,
      rejected: posts.filter(post => post.status === 'rejected').length,
      closed: posts.filter(post => post.status === 'closed').length,
      draft: posts.filter(post => post.status === 'draft').length,
      archived: posts.filter(post => post.status === 'archived').length,
      
      // Последние 7 дней
      lastWeek: posts.filter(post => {
        const postDate = post.createdAt instanceof Timestamp 
          ? post.createdAt.toDate() 
          : new Date(post.createdAt as any);
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return postDate >= oneWeekAgo;
      }).length,
      
      // Топ посты по просмотрам (если есть поле views)
      topViewed: [...posts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5),
      
      // Топ посты по откликам (если есть поле applicationCount)
      topApplied: [...posts]
        .sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0))
        .slice(0, 5)
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting posts stats:', error);
    throw error;
  }
};

export const incrementPostViews = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing views for post ${postId}:`, error);
    // Не выбрасываем ошибку, чтобы не блокировать UI
  }
};

export const incrementPostApplications = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      applicationCount: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing applications for post ${postId}:`, error);
    // Не выбрасываем ошибку, чтобы не блокировать UI
  }
};

export default {
  fetchAllPosts,
  fetchPostById,
  createPost,
  updatePost,
  deletePost,
  fetchPendingPosts,
  approvePost,
  rejectPost,
  archivePost,
  getPostsStats,
  incrementPostViews,
  incrementPostApplications
}; 