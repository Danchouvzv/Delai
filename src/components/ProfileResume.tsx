import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';
import html2pdf from 'html2pdf.js';
import { generateResume } from '../api/gemini';

// Типы шаблонов резюме
export type ResumeTemplate = 'standard' | 'professional' | 'academic' | 'modern';

interface ProfileResumeProps {
  userData: UserData | null;
  userId: string;
}

const ProfileResume: React.FC<ProfileResumeProps> = ({ userData, userId }) => {
  const [resumeTemplate, setResumeTemplate] = useState<ResumeTemplate>('modern');
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(userData?.resume?.generatedHtml || null);
  const [error, setError] = useState<string | null>(null);
  
  // Reference for PDF export
  const resumeRef = useRef<HTMLDivElement>(null);

  // Генерация резюме с использованием AI
  const handleGenerateAIResume = async () => {
    setError(null);
    // Define enhancedProfileData at the top level of the function so it's available in all blocks
    const enhancedProfileData = {
      displayName: userData?.displayName || 'Пользователь',
      name: userData?.displayName || 'Пользователь', // Add name field for compatibility
      email: userData?.email || 'example@email.com',
      photoURL: userData?.photoURL || 'https://placehold.co/150x150',
      photo: userData?.photoURL || 'https://placehold.co/150x150', // Add photo field for compatibility
      location: userData?.location || 'Казахстан',
      bio: userData?.bio || 'Информация не указана',
      skills: userData?.skills?.length ? userData.skills : ['JavaScript', 'Python', 'React'],
      experience: Array.isArray(userData?.experience) 
        ? userData.experience 
        : typeof userData?.experience === 'string' 
          ? [userData.experience] 
          : [],
      education: Array.isArray(userData?.education) 
        ? userData.education 
        : typeof userData?.education === 'string' 
          ? [userData.education] 
          : [],
      languages: userData?.resume?.languages?.length ? userData.resume.languages : ['Казахский', 'Русский', 'Английский'],
      interests: userData?.interests?.length ? userData.interests : [],
      position: userData?.position || 'Студент',
      university: userData?.university || '',
      graduationYear: userData?.graduationYear || '2024',
      linkedIn: userData?.linkedIn || '',
    };

    try {
      setIsGeneratingResume(true);
      
      // Запускаем генерацию резюме с возможностью повторных попыток
      let attempts = 0;
      const maxAttempts = 3;
      let result = null;
      
      while (attempts < maxAttempts && !result) {
        try {
          attempts++;
          // Try models in order of preference based on attempt number
          const modelToUse = attempts === 1 ? 'gemini-1.5-pro' : 
                            attempts === 2 ? 'gemini-1.5-flash' : 'gemini-pro';
          
          console.log(`Resume generation attempt ${attempts} using model: ${modelToUse} with style: ${resumeTemplate}`);
          
          // Pass the selected template style to the API
          result = await generateResume(enhancedProfileData, modelToUse, resumeTemplate);
          
          // If we get a successful result with HTML, break the loop
          if (result && result.html) break;
        } catch (retryError) {
          console.log(`Attempt ${attempts} failed:`, retryError);
          // If this is the last attempt, don't suppress the error
          if (attempts >= maxAttempts) throw retryError;
          // Wait before retrying (implement exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
      }

      // Handle case where result has no HTML or has an error
      if (!result || !result.html) {
        if (result?.error) {
          throw new Error(result.error);
        } else {
          throw new Error('Не удалось сгенерировать резюме');
        }
      }

      // Обработка результата
      let fixedHtml = result.html
        .replace(/\*\*Massachusetts Institute of Technology.*?\n/g, '')
        .replace(/\*\*Programming Languages.*?\n/g, '')
        .replace(/example@gmail\.com/g, enhancedProfileData.email)
        .replace(/John Doe/g, enhancedProfileData.displayName);

      // Проверка качества сгенерированного HTML
      if (!fixedHtml.includes(enhancedProfileData.displayName) || 
          !fixedHtml.includes('class=') || 
          fixedHtml.length < 500) {
        console.log('Generated HTML failed quality check, using template...');
        fixedHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
      }

      // Обновляем данные резюме в Firestore
      if (userData?.uid) {
        const updatedResumeData = {
          ...userData?.resume,
          generatedHtml: fixedHtml,
          lastGenerated: new Date().toISOString(),
          template: resumeTemplate,
        };

        try {
          await updateDoc(doc(db, 'users', userId), {
            resume: updatedResumeData,
          });
        } catch (docError) {
          console.error('Error updating Firestore document:', docError);
          // Continue without throwing - we still want to show the HTML even if saving fails
        }

        setGeneratedHtml(fixedHtml);
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      
      // Более понятные сообщения об ошибках
      let errorMessage = 'Произошла ошибка при генерации резюме. Пожалуйста, попробуйте позже.';
      
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota') || 
            error.message.toLowerCase().includes('превышен лимит')) {
          errorMessage = 'Превышен лимит запросов к AI. Пожалуйста, попробуйте позже.';
          
          // Если превышен лимит запросов, можно сразу использовать шаблон
          const templateHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
          setGeneratedHtml(templateHtml);
          errorMessage += ' Используется локальный шаблон.';
        } else if (error.message.includes('404') || error.message.includes('not found') ||
                  error.message.toLowerCase().includes('недоступна')) {
          errorMessage = 'Модель AI временно недоступна. Используется локальный шаблон.';
          const templateHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
          setGeneratedHtml(templateHtml);
        } else if (error.message.includes('timed out')) {
          errorMessage = 'Время ожидания ответа от AI истекло. Используется локальный шаблон.';
          const templateHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
          setGeneratedHtml(templateHtml);
        } else if (error.message.includes('invalid') || error.message.includes('incomplete')) {
          errorMessage = 'AI сгенерировал некорректный HTML. Используем предустановленный шаблон.';
          // В случае проблем с HTML применяем шаблон
          const templateHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
          setGeneratedHtml(templateHtml);
          return; // Прерываем выполнение и не показываем ошибку
        } else {
          errorMessage = error.message;
          // Try template as fallback for all error cases
          try {
            const templateHtml = generateTemplateForStyle(resumeTemplate, enhancedProfileData);
            setGeneratedHtml(templateHtml);
            errorMessage += ' Используется локальный шаблон.';
          } catch (templateError) {
            console.error('Failed to generate template', templateError);
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // Генерация шаблона резюме
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

    return templates[template] || templates.modern;
  };

  // Экспорт резюме в PDF
  const exportResumeToPDF = () => {
    const element = resumeRef.current;
    
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

  // Update the resume template selector with visual previews and better styling
  const ResumeTemplateSelector = () => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Выберите стиль резюме</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Standard Template */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 
              ${resumeTemplate === 'standard' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
            onClick={() => setResumeTemplate('standard')}
          >
            <div className="h-24 mb-2 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              <div className="w-full p-2 transform scale-[0.6]">
                <div className="h-3 w-24 bg-blue-800 mb-2 rounded"></div>
                <div className="flex gap-1.5 mb-1.5">
                  <div className="h-2 w-12 bg-gray-400 rounded"></div>
                  <div className="h-2 w-12 bg-gray-400 rounded"></div>
                </div>
                <div className="h-1.5 w-full bg-gray-300 mb-1.5 rounded"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-1.5 rounded"></div>
                <div className="h-1.5 w-3/4 bg-gray-300 mb-3 rounded"></div>
                <div className="h-2 w-20 bg-blue-800 mb-1.5 rounded"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                <div className="h-1.5 w-2/3 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">Стандартный</div>
              <div className="text-xs text-gray-500">Классический, профессиональный</div>
            </div>
          </div>

          {/* Professional Template */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 
              ${resumeTemplate === 'professional' ? 'ring-2 ring-amber-500 bg-amber-50' : 'hover:bg-gray-50'}`}
            onClick={() => setResumeTemplate('professional')}
          >
            <div className="h-24 mb-2 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              <div className="w-full p-2 transform scale-[0.6]">
                <div className="flex">
                  <div className="w-1/3 pr-1">
                    <div className="h-3 w-full bg-gray-700 mb-2 rounded"></div>
                    <div className="h-1.5 w-full bg-gray-400 mb-1 rounded"></div>
                    <div className="h-1.5 w-full bg-gray-400 mb-1 rounded"></div>
                    <div className="h-2 w-full bg-amber-500 mt-2 mb-1 rounded"></div>
                    <div className="h-1 w-4/5 bg-gray-300 mb-0.5 rounded"></div>
                    <div className="h-1 w-full bg-gray-300 mb-0.5 rounded"></div>
                  </div>
                  <div className="w-2/3 pl-1">
                    <div className="h-2 w-2/3 bg-gray-700 mb-1 rounded"></div>
                    <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                    <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                    <div className="h-1.5 w-5/6 bg-gray-300 mb-2 rounded"></div>
                    <div className="h-2 w-1/2 bg-gray-700 mb-1 rounded"></div>
                    <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">Профессиональный</div>
              <div className="text-xs text-gray-500">Элегантный, для руководителей</div>
            </div>
          </div>

          {/* Academic Template */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 
              ${resumeTemplate === 'academic' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
            onClick={() => setResumeTemplate('academic')}
          >
            <div className="h-24 mb-2 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
              <div className="w-full p-2 transform scale-[0.6]">
                <div className="flex justify-center mb-2">
                  <div className="h-3 w-32 bg-gray-700 rounded"></div>
                </div>
                <div className="flex justify-center mb-3">
                  <div className="h-1.5 w-24 bg-gray-400 rounded"></div>
                </div>
                <div className="h-2 w-24 bg-green-700 uppercase mb-1.5 rounded tracking-wider mx-auto"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-2.5 rounded"></div>
                <div className="h-2 w-24 bg-green-700 uppercase mb-1.5 rounded tracking-wider mx-auto"></div>
                <div className="h-1.5 w-full bg-gray-300 mb-1 rounded"></div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">Академический</div>
              <div className="text-xs text-gray-500">Формальный, для науки и образования</div>
            </div>
          </div>

          {/* Modern Template */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 
              ${resumeTemplate === 'modern' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
            onClick={() => setResumeTemplate('modern')}
          >
            <div className="h-24 mb-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center overflow-hidden">
              <div className="w-full p-2 transform scale-[0.6]">
                <div className="flex items-start mb-2">
                  <div className="h-6 w-6 rounded-full bg-purple-400 mr-2"></div>
                  <div>
                    <div className="h-2 w-20 bg-gradient-to-r from-purple-500 to-blue-500 mb-1 rounded"></div>
                    <div className="h-1.5 w-16 bg-gray-400 rounded"></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <div className="h-2 w-8 rounded-full bg-blue-400"></div>
                  <div className="h-2 w-10 rounded-full bg-purple-400"></div>
                  <div className="h-2 w-6 rounded-full bg-indigo-400"></div>
                  <div className="h-2 w-9 rounded-full bg-blue-400"></div>
                </div>
                <div className="h-2 w-24 bg-gradient-to-r from-purple-500 to-blue-500 mb-1.5 rounded"></div>
                <div className="flex mb-1.5">
                  <div className="w-1/4">
                    <div className="h-1.5 w-full bg-gray-400 rounded"></div>
                  </div>
                  <div className="w-3/4 pl-1">
                    <div className="h-1.5 w-full bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/4">
                    <div className="h-1.5 w-full bg-gray-400 rounded"></div>
                  </div>
                  <div className="w-3/4 pl-1">
                    <div className="h-1.5 w-full bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-medium">Современный</div>
              <div className="text-xs text-gray-500">Креативный, с яркими акцентами</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Выберите стиль резюме, который лучше всего подходит для вашей индустрии и позиции.
          <span className="block mt-1">
            <span className="font-medium text-purple-600">Современный</span> - для креативных индустрий, дизайна, IT.
            <span className="mx-1">|</span>
            <span className="font-medium text-amber-600">Профессиональный</span> - для руководящих и бизнес-позиций.
            <span className="mx-1">|</span>
            <span className="font-medium text-blue-600">Стандартный</span> - универсальный формат для большинства позиций.
            <span className="mx-1">|</span>  
            <span className="font-medium text-green-600">Академический</span> - для научных, исследовательских и образовательных сфер.
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
          AI Генератор резюме
        </h2>
        <div className="flex flex-wrap items-center gap-3">
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
            <option value="modern">Современный</option>
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
            } transition-all duration-300 flex items-center gap-2`}
          >
            {isGeneratingResume ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Генерация...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Сгенерировать резюме
              </>
            )}
          </motion.button>
        </div>
      </div>
      
      {/* Отображение ошибки */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Предпросмотр резюме */}
      <AnimatePresence mode="wait">
        {generatedHtml ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-inner overflow-auto">
              {/* Декоративные элементы */}
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div 
                ref={resumeRef}
                className="max-w-4xl mx-auto prose prose-headings:text-purple-700 dark:prose-headings:text-purple-300 prose-a:text-blue-600 dark:prose-a:text-blue-400"
                dangerouslySetInnerHTML={{ __html: generatedHtml }} 
              />
            </div>
            
            <div className="mt-8 flex flex-wrap justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportResumeToPDF()}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg flex items-center gap-2 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setGeneratedHtml(null)}
                className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:shadow flex items-center gap-2 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-center"
          >
            <svg className="w-20 h-20 mb-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-3">Резюме не создано</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-8 leading-relaxed">
              Наш AI-генератор создаст профессиональное резюме на основе вашего профиля.
              Выберите подходящий шаблон и нажмите кнопку "Сгенерировать резюме".
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateAIResume}
                disabled={isGeneratingResume}
                className={`px-6 py-3 rounded-lg font-medium text-white ${
                  isGeneratingResume 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:shadow-lg'
                } transition-all duration-300 flex items-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Сгенерировать резюме
              </motion.button>
            </div>
            
            {/* Превью шаблонов */}
            <ResumeTemplateSelector />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileResume; 