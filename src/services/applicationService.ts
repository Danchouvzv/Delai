import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ApplicationStatus } from '../hooks/useApplicationStatuses';

/**
 * Service for managing project applications
 */
export const applicationService = {
  /**
   * Create a new application for a project
   * @param userId - The ID of the user applying
   * @param projectId - The ID of the project
   * @param message - Application message
   * @returns Promise that resolves when the application is created
   */
  async createApplication(userId: string, projectId: string, message: string): Promise<void> {
    if (!userId || !projectId) {
      throw new Error('User ID and Project ID are required');
    }

    // Create a unique ID for the application document
    const applicationId = `${userId}_${projectId}`;
    const applicationRef = doc(db, 'applications', applicationId);

    // Check if application already exists
    const applicationDoc = await getDoc(applicationRef);
    if (applicationDoc.exists()) {
      throw new Error('Вы уже откликнулись на этот проект');
    }

    // Create application document
    await setDoc(applicationRef, {
      userId,
      projectId,
      status: 'pending' as ApplicationStatus,
      message,
      createdAt: serverTimestamp()
    });

    // Increment the applications count on the project
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      applicationsCount: increment(1)
    });
  },

  /**
   * Update the status of an application
   * @param userId - The ID of the user who applied
   * @param projectId - The ID of the project
   * @param status - New application status
   * @returns Promise that resolves when the application is updated
   */
  async updateApplicationStatus(
    userId: string, 
    projectId: string, 
    status: ApplicationStatus
  ): Promise<void> {
    if (!userId || !projectId) {
      throw new Error('User ID and Project ID are required');
    }

    const applicationId = `${userId}_${projectId}`;
    const applicationRef = doc(db, 'applications', applicationId);

    // Check if application exists
    const applicationDoc = await getDoc(applicationRef);
    if (!applicationDoc.exists()) {
      throw new Error('Заявка не найдена');
    }

    // Update application status
    await updateDoc(applicationRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete an application
   * @param userId - The ID of the user who applied
   * @param projectId - The ID of the project
   * @returns Promise that resolves when the application is deleted
   */
  async deleteApplication(userId: string, projectId: string): Promise<void> {
    if (!userId || !projectId) {
      throw new Error('User ID and Project ID are required');
    }

    const applicationId = `${userId}_${projectId}`;
    const applicationRef = doc(db, 'applications', applicationId);

    // Check if application exists
    const applicationDoc = await getDoc(applicationRef);
    if (!applicationDoc.exists()) {
      throw new Error('Заявка не найдена');
    }

    // Get current application data
    const applicationData = applicationDoc.data();
    
    // Delete application
    await setDoc(applicationRef, {
      ...applicationData,
      deleted: true,
      deletedAt: serverTimestamp()
    });

    // Decrement the applications count on the project
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      applicationsCount: increment(-1)
    });
  }
};

export default applicationService; 