import { ResumeTemplate } from '../types';

export interface ResumeData {
  displayName: string;
  email: string;
  photoURL: string;
  location: string;
  bio: string;
  skills: string[];
  experience: string[];
  education: string[];
  languages: string[];
  interests: string[];
  position: string;
  university: string;
  graduationYear: string;
  linkedIn: string;
}

export const generateTemplateForStyle = (template: ResumeTemplate, data: ResumeData): string => {
  const templates = {
    standard: `
      <div class="resume-standard max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <header class="text-center py-8 bg-gray-50">
          <img src="${data.photoURL}" alt="${data.displayName}" class="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gray-200"/>
          <h1 class="text-3xl font-bold mb-2">${data.displayName}</h1>
          <p class="text-gray-600">${data.position}</p>
          <p class="text-gray-500">${data.location} | ${data.email}</p>
          ${data.linkedIn ? `<p class="text-blue-600 mt-2"><a href="${data.linkedIn}" target="_blank">LinkedIn Profile</a></p>` : ''}
        </header>
        
        <div class="p-8">
          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4 border-b pb-2">Образование</h2>
            <div class="ml-4">
              <p class="font-medium">${data.university}</p>
              <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
            </div>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4 border-b pb-2">Навыки</h2>
            <div class="ml-4 flex flex-wrap gap-2">
              ${data.skills.map(skill => `
                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">${skill}</span>
              `).join('')}
            </div>
          </section>

          ${data.experience.length ? `
            <section class="mb-8">
              <h2 class="text-xl font-semibold mb-4 border-b pb-2">Опыт работы</h2>
              <div class="ml-4">
                ${data.experience.map(exp => `<p class="mb-3">${exp}</p>`).join('')}
              </div>
            </section>
          ` : ''}

          <section class="mb-8">
            <h2 class="text-xl font-semibold mb-4 border-b pb-2">Языки</h2>
            <div class="ml-4">
              <p>${data.languages.join(', ')}</p>
            </div>
          </section>

          ${data.interests.length ? `
            <section class="mb-8">
              <h2 class="text-xl font-semibold mb-4 border-b pb-2">Интересы</h2>
              <div class="ml-4">
                <p>${data.interests.join(', ')}</p>
              </div>
            </section>
          ` : ''}
        </div>
      </div>
    `,

    professional: `
      <div class="resume-professional max-w-4xl mx-auto">
        <header class="bg-blue-600 text-white p-8 rounded-t-lg">
          <div class="flex items-center gap-8">
            <img src="${data.photoURL}" alt="${data.displayName}" class="w-32 h-32 rounded-full border-4 border-white"/>
            <div>
              <h1 class="text-3xl font-bold mb-2">${data.displayName}</h1>
              <p class="text-xl opacity-90">${data.position}</p>
              <p class="opacity-80 mt-2">${data.location} | ${data.email}</p>
              ${data.linkedIn ? `<p class="mt-2"><a href="${data.linkedIn}" target="_blank" class="text-white hover:text-blue-100">LinkedIn Profile</a></p>` : ''}
            </div>
          </div>
        </header>
        
        <div class="p-8 bg-white rounded-b-lg shadow-lg">
          <section class="mb-8">
            <h2 class="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">О себе</h2>
            <p class="text-gray-700 leading-relaxed">${data.bio}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">Образование</h2>
            <div class="ml-4">
              <p class="font-medium">${data.university}</p>
              <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
            </div>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">Навыки</h2>
            <div class="ml-4 flex flex-wrap gap-2">
              ${data.skills.map(skill => `
                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">${skill}</span>
              `).join('')}
            </div>
          </section>

          ${data.experience.length ? `
            <section class="mb-8">
              <h2 class="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">Опыт работы</h2>
              <div class="ml-4">
                ${data.experience.map(exp => `
                  <div class="mb-4">
                    <p class="text-gray-700">${exp}</p>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <div class="grid grid-cols-2 gap-8">
            <section>
              <h2 class="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">Языки</h2>
              <div class="ml-4">
                ${data.languages.map(lang => `
                  <span class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mr-2 mb-2">${lang}</span>
                `).join('')}
              </div>
            </section>

            ${data.interests.length ? `
              <section>
                <h2 class="text-xl font-semibold text-blue-600 mb-4 border-b border-blue-200 pb-2">Интересы</h2>
                <div class="ml-4">
                  ${data.interests.map(interest => `
                    <span class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm mr-2 mb-2">${interest}</span>
                  `).join('')}
                </div>
              </section>
            ` : ''}
          </div>
        </div>
      </div>
    `,

    academic: `
      <div class="resume-academic max-w-4xl mx-auto bg-white">
        <header class="text-center py-8 border-b-2 border-green-600">
          <img src="${data.photoURL}" alt="${data.displayName}" class="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-green-200"/>
          <h1 class="text-3xl font-serif mb-2">${data.displayName}</h1>
          <p class="text-gray-700 font-serif">${data.position}</p>
          <p class="text-gray-600 text-sm mt-2">${data.location} | ${data.email}</p>
          ${data.linkedIn ? `<p class="text-green-600 mt-2"><a href="${data.linkedIn}" target="_blank">LinkedIn Profile</a></p>` : ''}
        </header>
        
        <div class="max-w-3xl mx-auto p-8">
          <section class="mb-8">
            <h2 class="text-xl font-serif text-green-700 mb-4 uppercase border-b border-green-200 pb-2">О себе</h2>
            <p class="text-gray-700 leading-relaxed font-serif">${data.bio}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-serif text-green-700 mb-4 uppercase border-b border-green-200 pb-2">Образование</h2>
            <div class="ml-4">
              <p class="font-medium font-serif">${data.university}</p>
              <p class="text-gray-600">Год выпуска: ${data.graduationYear}</p>
            </div>
          </section>

          <section class="mb-8">
            <h2 class="text-xl font-serif text-green-700 mb-4 uppercase border-b border-green-200 pb-2">Навыки</h2>
            <div class="ml-4">
              <ul class="list-disc pl-4">
                ${data.skills.map(skill => `<li class="mb-2 font-serif">${skill}</li>`).join('')}
              </ul>
            </div>
          </section>

          ${data.experience.length ? `
            <section class="mb-8">
              <h2 class="text-xl font-serif text-green-700 mb-4 uppercase border-b border-green-200 pb-2">Опыт работы</h2>
              <div class="ml-4">
                ${data.experience.map(exp => `<p class="mb-3 font-serif">${exp}</p>`).join('')}
              </div>
            </section>
          ` : ''}

          <div class="grid grid-cols-2 gap-8">
            <section>
              <h2 class="text-xl font-serif text-green-700 mb-4 uppercase border-b border-green-200 pb-2">Языки</h2>
              <div class="ml-4">
                <ul class="list-disc pl-4">
                  ${data.languages.map(lang => `<li class="mb-2 font-serif">${lang}</li>`).join('')}
                </ul>
              </div>
            </section>

            ${data.interests.length ? `
              <section>
                <h2 class="text-xl font-serif text-green-700 mb-4 uppercase border-b border-green-200 pb-2">Интересы</h2>
                <div class="ml-4">
                  <ul class="list-disc pl-4">
                    ${data.interests.map(interest => `<li class="mb-2 font-serif">${interest}</li>`).join('')}
                  </ul>
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

export const cleanupGeneratedResume = (html: string, userData: ResumeData): string => {
  return html
    .replace(/\*\*Massachusetts Institute of Technology.*?\n/g, '')
    .replace(/\*\*Programming Languages.*?\n/g, '')
    .replace(/example@gmail\.com/g, userData.email)
    .replace(/John Doe/g, userData.displayName)
    .replace(/Lorem ipsum.*?\./, userData.bio || '')
    .replace(/placeholder\.com\/150/g, userData.photoURL);
};

export const validateGeneratedHtml = (html: string, userData: ResumeData): boolean => {
  return (
    html.includes(userData.displayName) &&
    html.includes('class=') &&
    html.length >= 500 &&
    html.includes('<div') &&
    html.includes('</div>')
  );
}; 