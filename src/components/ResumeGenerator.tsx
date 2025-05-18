import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData } from '../types';

const ResumeGenerator = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [industry, setIndustry] = useState('');
  const [resumeStyle, setResumeStyle] = useState('modern');
  
  useEffect(() => {
    // Fetch user data when component mounts
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        setError('User profile not found. Please complete your profile first.');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user profile. Please try again.');
    }
  };
  
  const handleGenerateResume = async () => {
    if (!user) {
      setError('Please sign in to generate a resume');
      return;
    }

    if (!userData) {
      setError('Please complete your profile before generating a resume');
      return;
    }

    if (!targetPosition) {
      setError('Please enter a target position');
      return;
    }

    setGenerating(true);
    setError('');
    
    try {
      // Simulating AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create a sample resume template based on user data and input fields
      const generatedResume = `
# ${userData.displayName || 'Professional'} Resume
## ${targetPosition} - ${industry || 'General'}

### Contact Information
Email: ${userData.email || ''}
${userData.phone ? `Phone: ${userData.phone}` : ''}

### Professional Summary
${userData.bio || 'A dedicated professional with experience and skills in relevant fields.'}

### Skills
${Array.isArray(userData.skills) ? userData.skills.join(', ') : (userData.skills || 'Various professional skills')}

### Education
${userData.education || 'Educational background'}

### Experience
${userData.experience || 'Professional experience'}

### Languages
${Array.isArray(userData.languages) ? userData.languages.join(', ') : (userData.languages || 'Languages spoken')}

### Achievements
${userData.achievements || 'Notable achievements and awards'}

### Projects
${userData.portfolio || 'Portfolio of personal and professional projects'}
      `;
      
      // Save the generated resume to the user's profile in Firebase
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        resumes: userData.resumes 
          ? [...userData.resumes, { 
              id: Date.now().toString(),
              title: `${targetPosition} Resume`,
              content: generatedResume,
              createdAt: new Date().toISOString(),
              style: resumeStyle
            }] 
          : [{ 
              id: Date.now().toString(),
              title: `${targetPosition} Resume`,
              content: generatedResume,
              createdAt: new Date().toISOString(),
              style: resumeStyle
            }]
      });
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setTargetPosition('');
      setIndustry('');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error generating resume:', err);
      setError('An error occurred while generating your resume. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark py-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Resume <span className="text-primary">Generator</span>
          </h1>
          <div className="w-20 h-1 bg-primary mx-auto rounded mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Create a professional, tailored resume in seconds with our advanced AI technology
          </p>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left side - Feature explanation */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our AI Resume Generator uses state-of-the-art artificial intelligence to create personalized, 
                professional resumes tailored to your skills, experience, and target job positions.
              </p>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">1</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Analysis</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      Our AI analyzes your JumysAL profile, including your skills, education, experience, 
                      and achievements to understand your qualifications.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">2</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Job Matching</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      The system identifies the most relevant skills and experiences for your target job positions,
                      ensuring your resume highlights what employers are looking for.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">3</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Resume Creation</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      The AI generates a professionally formatted resume with compelling descriptions of your 
                      experience and achievements, tailored to make you stand out to employers.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <span className="font-bold">4</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Download & Edit</h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      Review your generated resume, make any desired edits, and download it in PDF format, 
                      ready to be shared with potential employers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Key Benefits</h2>
              <ul className="space-y-4">
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Time-saving:</strong> Create a professional resume in minutes, not hours
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Tailored content:</strong> Optimized for your specific career goals and target positions
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Professional formatting:</strong> Clean, modern designs that catch employers' attention
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">ATS-friendly:</strong> Designed to pass through Applicant Tracking Systems
                  </span>
                </li>
                <li className="flex">
                  <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white">Multiple formats:</strong> Download as PDF, Word, or plain text
                  </span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right side - Generator interface */}
          <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8 h-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Generate Your Resume</h2>
            
            {user ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Position</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark dark:text-white"
                    placeholder="e.g., Software Developer, Marketing Intern"
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-dark dark:text-white"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Select an industry</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume Style</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 hover:border-primary cursor-pointer">
                      <input 
                        type="radio" 
                        name="resumeStyle" 
                        id="modern" 
                        className="sr-only" 
                        value="modern"
                        checked={resumeStyle === 'modern'}
                        onChange={() => setResumeStyle('modern')}
                      />
                      <label htmlFor="modern" className="cursor-pointer flex flex-col items-center">
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          <div className="w-full h-4 bg-primary/30 rounded-t"></div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Modern</span>
                      </label>
                    </div>
                    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 hover:border-primary cursor-pointer">
                      <input 
                        type="radio" 
                        name="resumeStyle" 
                        id="classic" 
                        className="sr-only" 
                        value="classic"
                        checked={resumeStyle === 'classic'}
                        onChange={() => setResumeStyle('classic')}
                      />
                      <label htmlFor="classic" className="cursor-pointer flex flex-col items-center">
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          <div className="w-12 h-4 bg-primary/30 rounded-t mx-auto"></div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Classic</span>
                      </label>
                    </div>
                    <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg p-2 hover:border-primary cursor-pointer">
                      <input 
                        type="radio" 
                        name="resumeStyle" 
                        id="creative" 
                        className="sr-only" 
                        value="creative"
                        checked={resumeStyle === 'creative'}
                        onChange={() => setResumeStyle('creative')}
                      />
                      <label htmlFor="creative" className="cursor-pointer flex flex-col items-center">
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2">
                          <div className="w-1/3 h-full bg-primary/30 rounded-l"></div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">Creative</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  <button
                    onClick={handleGenerateResume}
                    disabled={generating}
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg shadow transition-all duration-300 ${
                      generating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary-dark'
                    } text-white font-medium`}
                  >
                    {generating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : 'Generate Resume'}
                  </button>
                </div>
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">Resume generated successfully! You can now download it from your profile.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-primary/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Please sign in to your JumysAL account to access the AI Resume Generator.
                </p>
                <a 
                  href="/login" 
                  className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                >
                  Sign In
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Testimonials section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Success Stories</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See how our AI Resume Generator has helped students land their dream jobs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Aidar K.",
                position: "Software Engineering Intern",
                company: "Tech Innovations",
                image: "/assets/testimonials/aidar.jpg",
                quote: "The AI Resume Generator helped me highlight my coding projects perfectly. I received three interview calls within a week of applying with my new resume!"
              },
              {
                name: "Madina T.",
                position: "Marketing Assistant",
                company: "Global Media Group",
                image: "/assets/testimonials/madina.jpg",
                quote: "As a student with limited work experience, I was struggling to create an impressive resume. The AI tool helped me showcase my relevant skills and academic achievements in a professional way."
              },
              {
                name: "Nurlan S.",
                position: "Finance Intern",
                company: "National Bank",
                image: "/assets/testimonials/nurlan.jpg",
                quote: "The resume tailoring feature is amazing! It automatically adjusted my resume to emphasize finance-related skills and coursework, which definitely helped me land my internship."
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-dark-lighter rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image doesn't load
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=0D8ABC&color=fff`;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{testimonial.name}</h3>
                    <p className="text-sm text-primary">{testimonial.position} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="relative">
                  <svg className="w-8 h-8 text-primary/20 absolute -top-4 -left-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-300 italic pt-2">{testimonial.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* FAQ Section */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded"></div>
          </div>
          
          <div className="bg-white dark:bg-dark-lighter rounded-2xl shadow-lg p-8 divide-y divide-gray-200 dark:divide-gray-700">
            {[
              {
                question: "Is the AI Resume Generator free to use?",
                answer: "Yes, the AI Resume Generator is completely free for all registered JumysAL users. We believe in providing valuable tools to help students succeed in their job search."
              },
              {
                question: "Can I edit the resume after it's generated?",
                answer: "Absolutely! While our AI creates a strong foundation, you can edit any part of the generated resume to add your personal touch or additional information."
              },
              {
                question: "How does the AI know what to include in my resume?",
                answer: "The AI analyzes the information from your JumysAL profile, including your education, skills, projects, and any work experience you've added. It then uses this data to create relevant content for your resume."
              },
              {
                question: "Will my resume be ATS-friendly?",
                answer: "Yes, all resumes generated by our AI are designed to be ATS (Applicant Tracking System) friendly, using appropriate formatting and keywords to help you pass through automated screening systems."
              },
              {
                question: "In what formats can I download my resume?",
                answer: "You can download your resume in PDF, Word (.docx), or plain text format, giving you flexibility depending on the application requirements."
              }
            ].map((faq, index) => (
              <div key={index} className="py-6 first:pt-0 last:pb-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeGenerator;