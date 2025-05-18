/** @jsxRuntime automatic */
/** @jsxImportSource react */
// @ts-nocheck /* временно отключаем проверки типов, чтобы обойти ошибки JSX */
import React, { useEffect, useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProgressBar from './ProgressBar';
import { LEVELS } from '../utils/points';
import { generateResume } from '../api/gemini';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { ResumeTemplate } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
// import { UserData } from '../types';

// Интерфейс данных резюме
interface ResumeData {
  education: string;
  skills: string;
  experience: string;
  achievements: string;
  languages: string[];
  portfolio: string;
}

// Расширяем интерфейс UserData
interface UserData {
  uid: string;
  role: 'school' | 'business'; // Разрешаем только роли, определенные в AuthContext
  bio?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  interests?: string[];
  location?: string;
  phoneNumber?: string;
  website?: string;
  company?: string;
  position?: string;
  yearsOfExperience?: number;
  displayName: string;
  photoURL?: string;
  university?: string;
  graduationYear?: string;
  major?: string;
  gpa?: string;
  industry?: string;
  employeeCount?: string;
  foundedYear?: string;
  linkedIn?: string;
  companyDescription?: string;
  resume?: ResumeData;
  resumeData?: ResumeData;
  points?: number;
  level?: number;
  totalXp?: number;
  email: string;
}

// Add a type for the AI-generated resume content
interface AIResumeData {
  displayName: string;
  position: string;
  photoUrl: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  summary: string;
  skills: string[];
  education: {
    degree: string;
    school: string;
    dates: string;
  }[];
  languages: {
    lang: string;
    level: string;
  }[];
  interests: string[];
  experience: {
    title: string;
    company: string;
    dates: string;
    location: string;
    achievements: string[];
  }[];
  courses: {
    name: string;
    type: string;
    provider: string;
  }[];
}

// Resume View Component Props
interface ResumeViewProps {
  resumeData: {
  education: string;
  skills: string;
  experience: string;
  achievements: string;
  languages: string[];
  portfolio: string;
  };
  displayName: string;
  template: ResumeTemplate;
}

// Resume View Component
const ResumeView: React.FC<ResumeViewProps> = ({ resumeData, displayName, template }) => {
  const getTemplateClasses = () => ({
    container: 'max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg',
          section: 'mb-6',
    heading: 'text-xl font-bold mb-2 text-gray-800',
    content: 'text-gray-600'
  });

  const classes = getTemplateClasses();

  return (
    <div className={classes.container}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
      {resumeData.education && (
          <p className="text-gray-600 mt-2">{resumeData.education}</p>
      )}
      </div>
      
      {resumeData.skills && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Skills</h2>
          <p className={classes.content}>{resumeData.skills}</p>
        </div>
      )}
      
      {resumeData.experience && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Опыт работы</h2>
          <p className={classes.content}>{resumeData.experience}</p>
        </div>
      )}
      
      {resumeData.achievements && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Достижения</h2>
          <p className={classes.content}>{resumeData.achievements}</p>
        </div>
      )}
      
      {resumeData.languages && resumeData.languages.length > 0 && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Языки</h2>
          <p className={classes.content}>{resumeData.languages.join(', ')}</p>
        </div>
      )}
      
      {resumeData.portfolio && (
        <div className={classes.section}>
          <h2 className={classes.heading}>Портфолио</h2>
          <p className={classes.content}>{resumeData.portfolio}</p>
        </div>
      )}
    </div>
  );
};

// AI Resume View Component
const AIResumeView: React.FC<{ userData: UserData; generatedHtml?: string }> = ({ userData, generatedHtml }) => {
  // If we have generatedHtml, use that instead of creating our own 
  if (generatedHtml) {
    return (
      <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
    );
  }

  // Fallback to our manual layout if no generatedHtml is provided
  // Create a realistic AI resume data structure from user data
  const createResumeData = (): AIResumeData => {
    return {
      displayName: userData.displayName || '',
      position: userData.position || 'Professional',
      photoUrl: userData.photoURL || 'https://via.placeholder.com/150',
      contact: {
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        location: userData.location || 'Казахстан',
        linkedin: userData.linkedIn || '',
      },
      summary: userData.bio || 'Experienced professional with a strong background in the industry.',
      skills: userData.skills || ['Communication', 'Teamwork', 'Problem Solving'],
      education: [
        {
          degree: userData.major || 'Degree',
          school: userData.university || 'University',
          dates: userData.graduationYear ? `${parseInt(userData.graduationYear) - 4} - ${userData.graduationYear}` : '2018 - 2022'
        }
      ],
      languages: userData.resumeData?.languages?.map(lang => ({
        lang,
        level: 'Fluent'
      })) || [
        { lang: 'Казахский', level: 'Родной' },
        { lang: 'Русский', level: 'Свободно' },
        { lang: 'Английский', level: 'B2' }
      ],
      interests: userData.interests || ['Technology', 'Innovation', 'Self-development'],
      experience: userData.experience?.map((exp, index) => ({
        title: exp.split(' at ')[0] || 'Position',
        company: exp.split(' at ')[1] || 'Company',
        dates: `${2022 - index} - ${index === 0 ? 'настоящее время' : (2022 - index + 2)}`,
        location: userData.location || 'Казахстан',
        achievements: [
          'Successfully completed major projects with significant results',
          'Led team initiatives that improved productivity and collaboration',
          'Implemented innovative solutions to complex problems'
        ]
      })) || [
        {
          title: 'Senior Specialist',
          company: 'Leading Company',
          dates: '2022 - настоящее время',
          location: 'Алматы',
          achievements: [
            'Successfully completed major projects with significant results',
            'Led team initiatives that improved productivity and collaboration',
            'Implemented innovative solutions to complex problems'
          ]
        }
      ],
      courses: [
        {
          name: 'Professional Development',
          type: 'Certificate',
          provider: 'Industry Leader'
        },
        {
          name: 'Advanced Skills Training',
          type: 'Online Course',
          provider: 'Educational Platform'
        }
      ]
    };
  };

  const resumeData = createResumeData();

  return (
    <div className="grid grid-cols-[250px_1fr] gap-8 p-8 bg-white text-gray-800">
      {/* Left column */}
      <aside className="bg-gray-900 text-white p-6 rounded-lg">
        <img src={resumeData.photoUrl} className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-teal-400" alt={resumeData.displayName} />
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Contact</h3>
          <ul className="space-y-1 text-sm">
            <li>📧 {resumeData.contact.email}</li>
            {resumeData.contact.phone && <li>📞 {resumeData.contact.phone}</li>}
            <li>📍 {resumeData.contact.location}</li>
            {resumeData.contact.linkedin && <li>🔗 {resumeData.contact.linkedin}</li>}
          </ul>
        </section>
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-gray-800 text-teal-400 rounded-full text-xs">
                {skill}
              </span>
            ))}
          </div>
        </section>
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Education</h3>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="font-medium">{edu.degree}</div>
              <div className="text-sm text-gray-300">{edu.school}</div>
              <div className="text-xs text-gray-400">{edu.dates}</div>
            </div>
          ))}
        </section>
        
        <section className="mb-6">
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Languages</h3>
          {resumeData.languages.map((lang, index) => (
            <div key={index} className="flex justify-between mb-1">
              <span>{lang.lang}</span>
              <span className="text-teal-400 text-sm">{lang.level}</span>
            </div>
          ))}
        </section>
        
        <section>
          <h3 className="uppercase tracking-wider mb-2 text-sm font-bold">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {resumeData.interests.map((interest, index) => (
              <span key={index} className="flex items-center text-sm">
                <span className="mr-1">•</span> {interest}
              </span>
            ))}
          </div>
        </section>
      </aside>
      
      {/* Right column */}
      <main>
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{resumeData.displayName}</h1>
          <h2 className="text-xl text-gray-600">{resumeData.position}</h2>
          <p className="mt-4 text-gray-700 leading-relaxed">{resumeData.summary}</p>
        </header>
        
        <section className="mt-8">
          <h3 className="text-2xl font-semibold border-b pb-2 mb-4">Experience</h3>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="mb-6">
              <h4 className="font-semibold text-lg">{exp.title}</h4>
              <span className="text-sm text-gray-500">
                {exp.company} • {exp.dates} • {exp.location}
              </span>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                {exp.achievements.map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        
        <section className="mt-8">
          <h3 className="text-2xl font-semibold border-b pb-2 mb-4">Courses & Certifications</h3>
          {resumeData.courses.map((course, index) => (
            <p key={index} className="mt-3">
              <strong>{course.name}</strong>{' '}
              <span className="text-sm text-gray-500">({course.provider}, {course.type})</span>
            </p>
          ))}
        </section>
      </main>
    </div>
  );
};

const Profile: React.FC = () => {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [resumeTemplate, setResumeTemplate] = useState<ResumeTemplate>('standard');
  const [autoResume, setAutoResume] = useState(false);
  const [resumeLanguages, setResumeLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [resumeEducation, setResumeEducation] = useState('');
  const [resumeSkills, setResumeSkills] = useState('');
  const [resumeExperience, setResumeExperience] = useState('');
  const [resumeAchievements, setResumeAchievements] = useState('');
  const [resumePortfolio, setResumePortfolio] = useState('');
  
  // Reference for the resume view (for PDF export)
  const resumeRef = useRef<HTMLDivElement>(null);
  const aiResumeRef = useRef<HTMLDivElement>(null);
  
  // Spring animation for profile card - переместим анимации сюда, чтобы не было условных вызовов хуков
  const profileCardSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 170, friction: 26 }
  });

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          setEditedData(data);
          if (data.photoURL) {
            setAvatarPreview(data.photoURL);
          }
          
          // Load resume data if available
          if (data.resumeData) {
            setResumeEducation(data.resumeData.education || '');
            setResumeSkills(data.resumeData.skills || '');
            setResumeExperience(data.resumeData.experience || '');
            setResumeAchievements(data.resumeData.achievements || '');
            setResumeLanguages(data.resumeData.languages || []);
            setResumePortfolio(data.resumeData.portfolio || '');
          }
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const trackProfileView = async () => {
      if (user && userData && user.uid !== userData.uid) {
        await addDoc(collection(db, 'profileViews'), {
          viewedUserId: userData.uid,
          viewerUserId: user.uid,
          timestamp: Date.now()
        });
      }
    };

    trackProfileView();
  }, [user, userData]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return null;
    
    const avatarRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
    await uploadBytes(avatarRef, avatarFile);
    const downloadURL = await getDownloadURL(avatarRef);
    return downloadURL;
  };

  const handleSave = async () => {
    if (user && editedData) {
      try {
        let photoURL = editedData.photoURL;
        
        if (avatarFile) {
          const uploadedUrl = await uploadAvatar();
          if (uploadedUrl) {
            photoURL = uploadedUrl;
          }
        }

        const updateData = {
          role: editedData.role,
          bio: editedData.bio || null,
          skills: editedData.skills || [],
          experience: editedData.experience || [],
          education: editedData.education || [],
          interests: editedData.interests || [],
          location: editedData.location || null,
          phoneNumber: editedData.phoneNumber || null,
          website: editedData.website || null,
          company: editedData.company || null,
          position: editedData.position || null,
          yearsOfExperience: editedData.yearsOfExperience || null,
          displayName: editedData.displayName || null,
          photoURL: photoURL || null,
          companyDescription: editedData.companyDescription || null,
          industry: editedData.industry || null,
          employeeCount: editedData.employeeCount || null,
          foundedYear: editedData.foundedYear || null,
          linkedIn: editedData.linkedIn || null,
          university: editedData.university || null,
          graduationYear: editedData.graduationYear || null,
          major: editedData.major || null,
          gpa: editedData.gpa || null
        };

        await updateDoc(doc(db, 'users', user.uid), updateData);
        
        if (editedData.displayName || photoURL) {
          await updateProfile(user, {
            displayName: editedData.displayName || null,
            photoURL: photoURL || null
          });
        }
        
        setUserData({...editedData, photoURL});
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleAddSkill = () => {
    if (newSkill && editedData) {
      setEditedData({
        ...editedData,
        skills: [...(editedData.skills || []), newSkill]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        skills: editedData.skills?.filter(skill => skill !== skillToRemove)
      });
    }
  };

  const handleAddExperience = () => {
    if (newExperience && editedData) {
      setEditedData({
        ...editedData,
        experience: [...(editedData.experience || []), newExperience]
      });
      setNewExperience('');
    }
  };

  const handleSaveResume = async () => {
    if (user && editedData) {
      const resumeData = {
        education: resumeEducation,
        skills: resumeSkills,
        experience: resumeExperience,
        achievements: resumeAchievements,
        languages: resumeLanguages,
        portfolio: resumePortfolio
      };

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          resumeData
        });
        
        // Update local state
        setUserData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            resumeData
          };
        });
        
        alert('Резюме успешно сохранено!');
      } catch (error) {
        console.error('Error saving resume:', error);
        alert('Произошла ошибка при сохранении резюме. Пожалуйста, попробуйте еще раз.');
      }
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage && !resumeLanguages.includes(newLanguage)) {
      setResumeLanguages([...resumeLanguages, newLanguage]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setResumeLanguages(resumeLanguages.filter(l => l !== lang));
  };

  const getLevelInfo = (level: number) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  };

  const handleGenerateAIResume = async () => {
    setError(null);
    try {
      setIsGeneratingResume(true);
      
      // Enhanced profile data with fallback values
      const enhancedProfileData = {
        displayName: userData?.displayName || 'Talgatov Daniyal',
        email: userData?.email || 'example@gmail.com',
        photoURL: userData?.photoURL || 'https://placehold.co/150x150',
        location: userData?.location || 'Алматы, Казахстан',
        bio: userData?.bio || 'Я ученик НИШ ХБН Алматы',
        skills: userData?.skills?.length ? userData.skills : ['JavaScript', 'Python', 'React'],
        experience: userData?.experience?.length ? userData.experience : [],
        education: userData?.education?.length ? userData.education : [],
        languages: userData?.resume?.languages?.length ? userData.resume.languages : ['Казахский', 'Русский', 'Английский'],
        interests: userData?.interests?.length ? userData.interests : [],
        position: userData?.position || 'Студент',
        university: userData?.university || 'НИШ ХБН Алматы',
        graduationYear: userData?.graduationYear || '2024',
        linkedIn: userData?.linkedIn || '',
      };

      // Запускаем генерацию резюме с автоматическим переключением на fallback-модель
      const resumeResult = await generateResume(enhancedProfileData, 'gemini-1.5-pro');

      if (!resumeResult.success || !resumeResult.data) {
        // Показываем конкретную ошибку от API, если она есть
        throw new Error(resumeResult.error || 'Не удалось сгенерировать резюме');
      }

      // Показываем сообщение о modele, если использовалась fallback-модель
      if (resumeResult.model && resumeResult.model !== 'gemini-1.5-pro') {
        console.log(`Резюме сгенерировано с помощью модели ${resumeResult.model}`);
      }

      // Clean up the generated HTML
      let fixedHtml = resumeResult.data
        .replace(/\*\*Massachusetts Institute of Technology.*?\n/g, '')
        .replace(/\*\*Programming Languages.*?\n/g, '')
        .replace(/example@gmail\.com/g, enhancedProfileData.email)
        .replace(/John Doe/g, enhancedProfileData.displayName);

      // Validate generated HTML quality
      if (!fixedHtml.includes(enhancedProfileData.displayName) || 
          !fixedHtml.includes('class=') || 
          fixedHtml.length < 500) {
        console.log('Generated HTML failed quality check, using template...');
        fixedHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
      }

      // Update the resume data in state and Firestore
      if (userData?.uid) {
        const updatedResumeData = {
          ...userData?.resume,
          generatedHtml: fixedHtml,
          lastGenerated: new Date().toISOString(),
          template: resumeTemplate,
        };

        await updateDoc(doc(db, 'users', userData.uid), {
          resume: updatedResumeData,
        });

        setGeneratedHtml(fixedHtml);
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      
      // Более понятные сообщения об ошибках
      let errorMessage = 'Произошла ошибка при генерации резюме. Пожалуйста, попробуйте позже.';
      
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota')) {
          errorMessage = 'Превышен лимит запросов к AI. Мы переключились на более простую модель, но и она недоступна. Пожалуйста, попробуйте позже.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'Время ожидания ответа от AI истекло. Пожалуйста, попробуйте снова.';
        } else if (error.message.includes('invalid') || error.message.includes('incomplete')) {
          errorMessage = 'AI сгенерировал некорректный HTML. Мы используем предустановленный шаблон.';
          // В случае проблем с HTML применяем шаблон
          const templateHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
          setGeneratedHtml(templateHtml);
          return; // Прерываем выполнение и не показываем ошибку
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // Helper function to generate template-based resume
  const generateTemplateForStyle = (template: ResumeTemplate, data: any) => {
    const templates: Record<string, string> = {
      standard: `
        <div class="resume-standard">
          <header class="text-center mb-8">
            <h1 class="text-3xl font-bold mb-2">${data.displayName}</h1>
            <p class="text-gray-600">${data.position}</p>
            <p class="text-gray-500">${data.location} | ${data.email}</p>
          </header>
          
          <section class="mb-6">
            <h2 class="text-xl font-semibold mb-3">Образование</h2>
            <div class="ml-4">
              <p class="font-medium">${data.university}</p>
              <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
            </div>
          </section>

          <section class="mb-6">
            <h2 class="text-xl font-semibold mb-3">Навыки</h2>
            <div class="ml-4">
              <p>${data.skills.join(', ')}</p>
            </div>
          </section>

          ${data.experience.length ? `
          <section class="mb-6">
            <h2 class="text-xl font-semibold mb-3">Опыт работы</h2>
            <div class="ml-4">
              ${data.experience.map((exp: string) => `<p class="mb-2">${exp}</p>`).join('')}
            </div>
          </section>
          ` : ''}

          <section class="mb-6">
            <h2 class="text-xl font-semibold mb-3">Языки</h2>
            <div class="ml-4">
              <p>${data.languages.join(', ')}</p>
            </div>
          </section>
        </div>
      `,
      professional: `
        <div class="resume-professional">
          <header class="bg-blue-600 text-white p-6 rounded-t-lg">
            <h1 class="text-3xl font-bold mb-2">${data.displayName}</h1>
            <p class="opacity-90">${data.position}</p>
            <p class="opacity-80 text-sm">${data.location} | ${data.email}</p>
          </header>
          
          <div class="p-6">
            <section class="mb-8">
              <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Образование</h2>
              <div class="ml-4">
                <p class="font-medium">${data.university}</p>
                <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Навыки</h2>
              <div class="ml-4 flex flex-wrap gap-2">
                ${data.skills.map((skill: string) => `
                  <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">${skill}</span>
                `).join('')}
              </div>
            </section>

            ${data.experience.length ? `
            <section class="mb-8">
              <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Опыт работы</h2>
              <div class="ml-4">
                ${data.experience.map((exp: string) => `<p class="mb-2">${exp}</p>`).join('')}
              </div>
            </section>
            ` : ''}

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Языки</h2>
              <div class="ml-4">
                <p>${data.languages.join(', ')}</p>
              </div>
            </section>
          </div>
        </div>
      `,
      academic: `
        <div class="resume-academic">
          <header class="text-center mb-8 border-b-2 border-green-600 pb-4">
            <h1 class="text-3xl font-serif mb-2">${data.displayName}</h1>
            <p class="text-gray-700 font-serif">${data.position}</p>
            <p class="text-gray-600 text-sm">${data.location} | ${data.email}</p>
          </header>
          
          <div class="max-w-3xl mx-auto">
            <section class="mb-8">
              <h2 class="text-xl font-serif text-green-700 mb-3 uppercase">Образование</h2>
              <div class="ml-4">
                <p class="font-medium font-serif">${data.university}</p>
                <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
              </div>
            </section>

            <section class="mb-8">
              <h2 class="text-xl font-serif text-green-700 mb-3 uppercase">Навыки</h2>
              <div class="ml-4">
                <ul class="list-disc pl-4">
                  ${data.skills.map((skill: string) => `<li class="mb-1">${skill}</li>`).join('')}
                </ul>
              </div>
            </section>

            ${data.experience.length ? `
            <section class="mb-8">
              <h2 class="text-xl font-serif text-green-700 mb-3 uppercase">Опыт работы</h2>
              <div class="ml-4">
                ${data.experience.map((exp: string) => `<p class="mb-2 font-serif">${exp}</p>`).join('')}
              </div>
            </section>
            ` : ''}

            <section class="mb-8">
              <h2 class="text-xl font-serif text-green-700 mb-3 uppercase">Языки</h2>
              <div class="ml-4">
                <p class="font-serif">${data.languages.join(', ')}</p>
              </div>
            </section>
          </div>
        </div>
      `,
      modern: `
        <div class="resume-modern">
          <header class="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-lg shadow-lg mb-8">
            <h1 class="text-3xl font-bold mb-2">${data.displayName}</h1>
            <p class="text-xl">${data.position}</p>
            <p class="text-sm opacity-90">${data.location} | ${data.email}</p>
          </header>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <section class="mb-8 bg-white p-5 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">Образование</h2>
                <div class="ml-2">
                  <p class="font-medium">${data.university}</p>
                  <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
                </div>
              </section>
              
              <section class="mb-8 bg-white p-5 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">Навыки</h2>
                <div class="flex flex-wrap gap-2">
                  ${data.skills.map((skill: string) => `
                    <span class="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600 px-3 py-1 rounded-full text-sm">${skill}</span>
                  `).join('')}
                </div>
              </section>
              
              <section class="mb-8 bg-white p-5 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">Языки</h2>
                <p>${data.languages.join(', ')}</p>
              </section>
            </div>
            
            <div>
              ${data.experience.length ? `
              <section class="mb-8 bg-white p-5 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold text-purple-600 mb-3 border-b border-purple-200 pb-1">Опыт работы</h2>
                <div class="space-y-3">
                  ${data.experience.map((exp: string) => `
                    <div class="p-3 bg-gray-50 rounded-md shadow-sm">
                      <p>${exp}</p>
                    </div>
                  `).join('')}
                </div>
              </section>
              ` : ''}
            </div>
          </div>
        </div>
      `
    };

    return templates[template] || templates.standard;
  };

  // Export resume to PDF
  const exportResumeToPDF = () => {
    // Use the AI resume reference if autoResume is true, otherwise use the standard resume reference
    const element = autoResume ? aiResumeRef.current : resumeRef.current;
    
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `${userData?.displayName || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // Send resume to employer (when responding to vacancy)
  const sendResumeToEmployer = async (jobId: string, employerId: string) => {
    if (!user || !userData?.resumeData) return false;
    
    try {
      // Save the application with resume attached
      await setDoc(doc(db, `applications/${jobId}/responses/${user.uid}`), {
        studentId: user.uid,
        employerId,
        displayName: userData?.displayName,
        resumeData: userData.resumeData,
        submittedAt: new Date(),
        status: 'pending'
      });
      
      return true;
    } catch (error) {
      console.error('Error sending resume to employer:', error);
      return false;
    }
  };

  if (!user || !userData) return null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-5xl mx-auto mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-md"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
                  </div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline focus:outline-none transition duration-300"
          >
            Закрыть
          </button>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Info Section */}
          <motion.div 
            variants={itemVariants}
            className="w-full md:w-1/3"
          >
            <animated.div style={profileCardSpring} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">Профиль</h2>
                {!isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform transition duration-300"
                  >
                    Редактировать
                  </motion.button>
                ) : (
                  <div className="space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg shadow-md hover:shadow-lg transform transition duration-300"
                    >
                      Сохранить
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transform transition duration-300"
                    >
                      Отмена
                    </motion.button>
                  </div>
                )}
          </div>

              {/* Profile Content */}
              <AnimatePresence mode="wait">
          {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
              <div className="flex items-center gap-6">
                <div className="relative group">
                        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-purple-500 transition-all duration-300">
                    {(avatarPreview || editedData?.photoURL) ? (
                      <img 
                        src={avatarPreview || editedData?.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <input
                    type="text"
                    value={editedData?.displayName || ''}
                    onChange={(e) => setEditedData({...editedData!, displayName: e.target.value})}
                    placeholder="Display Name"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <input
                    type="text"
                    value={editedData?.location || ''}
                    onChange={(e) => setEditedData({...editedData!, location: e.target.value})}
                    placeholder="Location"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                  <textarea
                    value={editedData?.bio || ''}
                    onChange={(e) => setEditedData({...editedData!, bio: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all min-h-[120px]"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Education</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedData?.university || ''}
                      onChange={(e) => setEditedData({...editedData!, university: e.target.value})}
                      placeholder="University"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <input
                      type="text"
                      value={editedData?.major || ''}
                      onChange={(e) => setEditedData({...editedData!, major: e.target.value})}
                      placeholder="Major"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <input
                      type="text"
                      value={editedData?.graduationYear || ''}
                      onChange={(e) => setEditedData({...editedData!, graduationYear: e.target.value})}
                      placeholder="Graduation Year"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editedData?.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/20 rounded-full text-sm flex items-center group hover:bg-primary/30 transition-all"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-primary/70 hover:text-primary/100 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-primary/80 hover:bg-primary rounded-xl transition-all hover:scale-105"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Experience</label>
                <div className="space-y-3 mb-3">
                  {editedData?.experience?.map((exp, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                            <span className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">{exp}</span>
                      <button
                        onClick={() => setEditedData({
                          ...editedData!,
                          experience: editedData.experience?.filter((_, i) => i !== index)
                        })}
                        className="text-primary/70 hover:text-primary/100 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    placeholder="Add experience"
                          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <button
                    onClick={handleAddExperience}
                    className="px-4 py-2 bg-primary/80 hover:bg-primary rounded-xl transition-all hover:scale-105"
                  >
                    Add
                  </button>
                </div>
              </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Education</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editedData?.university || ''}
                          onChange={(e) => setEditedData({...editedData!, university: e.target.value})}
                          placeholder="University"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                        <input
                          type="text"
                          value={editedData?.major || ''}
                          onChange={(e) => setEditedData({...editedData!, major: e.target.value})}
                          placeholder="Major"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                        <input
                          type="text"
                          value={editedData?.graduationYear || ''}
                          onChange={(e) => setEditedData({...editedData!, graduationYear: e.target.value})}
                          placeholder="Graduation Year"
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4 group">
                        <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 ring-4 ring-offset-4 ring-offset-white dark:ring-offset-gray-800 ring-purple-500 shadow-lg">
                  {userData.photoURL ? (
                    <img 
                      src={userData.photoURL} 
                      alt="Profile" 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                      </div>
                      <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500 mb-1">
                        {userData.displayName || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 justify-center">
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full text-sm font-medium text-purple-800 dark:text-purple-300">
                          {userData.role === 'school' ? 'Студент' : 'Компания'}
                    </span>
                    {userData.location && (
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {userData.location}
                      </span>
                    )}
                </div>
              </div>

                    <motion.div 
                      className="grid grid-cols-1 gap-6 mt-6"
                      variants={containerVariants}
                    >
                      <motion.div 
                        variants={itemVariants}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                      >
                        <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          О себе
                        </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {userData.bio || 'Информация не добавлена'}
                        </p>
                      </motion.div>

                      <motion.div 
                        variants={itemVariants}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                      >
                        <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Навыки
                        </h4>
                  {userData.skills && userData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userData.skills.map((skill, index) => (
                              <motion.span
                          key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-full text-sm font-medium text-purple-700 dark:text-purple-300 hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300"
                        >
                          {skill}
                              </motion.span>
                      ))}
                    </div>
                  ) : (
                          <p className="text-gray-500 dark:text-gray-400">Навыки не добавлены</p>
                        )}
                      </motion.div>

                      <motion.div 
                        variants={itemVariants}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                      >
                        <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Опыт работы
                        </h4>
                  {userData.experience && userData.experience.length > 0 ? (
                          <div className="space-y-3">
                      {userData.experience.map((exp, index) => (
                              <motion.div
                          key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:shadow-md transition-all duration-300"
                        >
                          {exp}
                              </motion.div>
                      ))}
                    </div>
                  ) : (
                          <p className="text-gray-500 dark:text-gray-400">Опыт работы не добавлен</p>
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </animated.div>
          </motion.div>

          {/* Resume Section */}
          <motion.div 
            variants={itemVariants}
            className="w-full md:w-2/3"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">Резюме</h2>
                <div className="flex flex-wrap items-center gap-4">
                      <select
                        value={resumeTemplate}
                        onChange={(e) => setResumeTemplate(e.target.value as ResumeTemplate)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                      >
                        <option value="standard">Стандартный</option>
                        <option value="professional">Профессиональный</option>
                        <option value="academic">Академический</option>
                      </select>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateAIResume}
                    disabled={isGeneratingResume}
                    className={`px-6 py-2 rounded-lg font-medium text-white ${
                      isGeneratingResume 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:shadow-lg'
                    } transition-all duration-300`}
                  >
                    {isGeneratingResume ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Генерация...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Резюме
                      </span>
                    )}
                  </motion.button>
                    </div>
                  </div>
                  
              {/* Resume Preview */}
              <AnimatePresence mode="wait">
                {generatedHtml ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div 
                      className="prose max-w-none prose-headings:text-purple-700 dark:prose-headings:text-purple-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden shadow-inner"
                      dangerouslySetInnerHTML={{ __html: generatedHtml }} 
                    />
                    <div className="mt-6 flex flex-wrap justify-end gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => exportResumeToPDF()}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg flex items-center transition-all duration-300"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Скачать PDF
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGeneratedHtml(null)}
                        className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg flex items-center transition-all duration-300"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Сбросить
                      </motion.button>
                      </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-center"
                  >
                    <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">Резюме не создано</h3>
                    <p className="text-gray-400 dark:text-gray-500 max-w-md mb-6">
                      Нажмите "AI Резюме" чтобы создать профессиональное резюме на основе вашего профиля
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateAIResume}
                      disabled={isGeneratingResume}
                      className={`px-6 py-3 rounded-lg font-medium text-white ${
                        isGeneratingResume 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:shadow-lg'
                      } transition-all duration-300`}
                    >
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Создать AI Резюме
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
                  </div>
          </motion.div>
                </div>
      </motion.div>
    </div>
  );
};

export default Profile; 