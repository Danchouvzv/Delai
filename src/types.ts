export interface Post {
  id: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  experienceLevel?: string;
  experience?: string;
  skills: string[];
  postedDate: Date | string;
  companyLogo?: string;
  userId?: string; // ID пользователя, разместившего вакансию
  user?: {
    id: string;
    displayName?: string;
    photoURL?: string;
  };
  aiMatch?: number;
  aiMatchScore?: number;
  aiMatchReason?: string;
  aiMatchReasons?: string[];
  format?: string;
  requirements?: string[];
  benefits?: string[];
  authorId?: string;
  createdAt?: Date;
  status: 'active' | 'closed' | 'draft' | 'pending' | 'rejected' | 'archived';
  // AI Matching fields
  aiMatching?: boolean;
  skillsRequired?: string[];
  minExperience?: number;
  preferredUniversities?: string[];
  otherCriteria?: string;
  // Additional fields used in components
  company?: string;
  city?: string;
  category?: string;
  responsibilities?: string[];
  createdBy?: string; // User ID who created the post
  moderationComment?: string; // Комментарий модератора
  moderatedAt?: any; // Timestamp | Date модерации
  archivedAt?: any; // Timestamp | Date архивации
  views?: number; // Счетчик просмотров
  applicationCount?: number; // Счетчик откликов
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  savedPosts?: string[];
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  role: 'student' | 'professional' | 'recruiter' | 'employer' | 'business' | 'admin';
  isBlocked?: boolean;
  
  // Company Information (for employers)
  companyName?: string;
  industry?: string;
  companySize?: string;
  companyWebsite?: string;
  
  // Basic Information
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  location?: string;
  birthDate?: string;
  position?: string;
  bio?: string;
  interests?: string[];
  university?: string;
  graduationYear?: string;
  linkedIn?: string;
  
  // Student Specific Information
  studentId?: string;
  academicYear?: number;
  gpa?: number;
  major?: string;
  minor?: string;
  expectedGraduation?: string;
  
  // Academic Information
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    location: string;
    startDate: string;
    endDate?: string;
    gpa?: number;
    highlights?: string[];
    relevantCourses?: string[];
  }>;

  // Skills & Competencies
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: 'technical' | 'soft' | 'language' | 'other';
  }>;
  
  // Academic Projects
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    role: string;
    startDate: string;
    endDate?: string;
    url?: string;
    repository?: string;
    highlights: string[];
  }>;

  // Work Experience
  experience: Array<{
    title: string;
    company: string;
    location: string;
    type: 'internship' | 'part-time' | 'full-time' | 'volunteer';
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
    technologies?: string[];
  }>;

  // Certifications & Achievements
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
  }>;

  achievements: Array<{
    title: string;
    date: string;
    description: string;
    issuer?: string;
  }>;

  // Extracurricular Activities
  volunteerWork: Array<{
    organization: string;
    role: string;
    startDate: string;
    endDate?: string;
    description: string;
    achievements: string[];
  }>;

  // Languages
  languages: Array<{
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'native';
    certifications?: string[];
  }>;

  // Career Preferences
  careerGoals: {
    shortTerm: string[];
    longTerm: string[];
    preferredIndustries: string[];
    preferredLocations: string[];
  };

  workPreferences: {
    employmentTypes: Array<'internship' | 'part-time' | 'full-time'>;
    remotePreference: 'onsite' | 'hybrid' | 'remote';
    availableFrom?: string;
    salaryExpectation?: {
      minimum: number;
      preferred: number;
      currency: string;
    };
  };

  // Resume Data
  resume?: {
    generatedHtml?: string;
    lastGenerated?: string;
    template?: 'modern' | 'professional' | 'academic' | 'creative';
    languages?: string[];
    analysis?: {
      score: number;
      strengths: string[];
      improvements: string[];
      detailedFeedback: string;
      enhancedContent: string;
      lastAnalyzed: string;
    };
  };

  // Social & Portfolio
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    other?: string[];
  };

  // Privacy Settings
  privacySettings?: {
    profileVisibility: 'public' | 'private' | 'recruiters';
    showEmail: boolean;
    showPhone: boolean;
    showSalary: boolean;
  };

  // File Upload
  avatarFile?: File;

  // Add the experienceLevel property if it exists
  experienceLevel?: string;
}

export interface Filters {
  city: string;
  category: string;
  format: string;
  search: string;
  experience: string;
  salary: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp?: {
    toDate: () => Date;
  } | Date;
  createdAt?: {
    toDate: () => Date;
  } | Date;
  read: boolean;
  fileUrl?: string;
  fileType?: string;
}

export interface ChatData {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: { [key: string]: number };
  otherUser?: {
    id: string;
    name: string;
    role: string;
  };
}

// Micro-Internship Types
export interface MicroInternship {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  employerId: string;
  employer: {
    id: string;
    name: string;
    company: string;
    photoURL?: string;
  };
  xpReward: number;
  badgeId: string;
  badgeName: string;
  badgeImageUrl: string;
  deadline: Date | string;
  createdAt: Date | string;
  status: 'active' | 'completed' | 'expired';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  category: string;
  applicationsCount: number;
  completionsCount: number;
  aiTechSpec?: string; // Generated technical specification
}

export interface MicroApplication {
  id: string;
  microInternshipId: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    photoURL?: string;
    level: number;
  };
  status: 'applied' | 'in-progress' | 'submitted' | 'reviewed' | 'completed' | 'rejected';
  submissionUrl?: string; // Link to code repository or deployed solution
  submissionNotes?: string;
  submissionDate?: Date | string;
  aiReviewScore?: number;
  aiReviewFeedback?: string[];
  aiReviewDate?: Date | string;
  employerReview?: {
    rating: number; // 1-5 stars
    comment: string;
    feedbackPoints: string[];
    date: Date | string;
  };
  messages: MicroMessage[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MicroMessage {
  id: string;
  senderId: string;
  senderType: 'student' | 'employer' | 'ai';
  text: string;
  timestamp: Date | string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  xpValue: number;
  issuedCount: number;
  createdBy: string;
  createdAt: Date | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
}

export interface AIPrompt {
  role: string;
  content: string;
}

export interface AIGuidanceTemplate {
  id: string;
  name: string;
  category: string;
  prompts: AIPrompt[];
  defaultContext: string;
}

export type ResumeTemplate = 'standard' | 'professional' | 'academic' | 'modern' | 'creative'; 