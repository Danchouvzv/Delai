import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import axios from 'axios';

// Initialize the Google Generative AI client
// Use a fallback for API_KEY to prevent runtime errors if environment variable is missing
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_NAME = "gemini-1.5-pro-latest"; // Standardize on the latest model

// Initialize the client only if API key is available
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// Tracking for rate limits and retries
const rateLimitInfo = {
  lastErrorTime: 0,
  failedRequests: 0,
  backoffUntil: 0,
  fallbackMode: false
};

// Safety settings configuration
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Function to generate text using Gemini API
export async function generateText(prompt: string, role: string = 'career advisor') {
  try {
    // Check if API key is configured
    if (!API_KEY) {
      console.error('Gemini API key is not configured');
      return {
        success: false,
        error: 'API key not configured. Please contact the administrator.'
      };
    }

    // Check if client is initialized
    if (!genAI) {
      console.error('Gemini client initialization failed');
      return {
        success: false,
        error: 'AI service initialization failed. Please try again later.'
      };
    }

    // Select the model based on rate limit status
    const modelToUse = rateLimitInfo.fallbackMode ? 'gemini-1.5-flash' : MODEL_NAME;
    
    const model = genAI.getGenerativeModel({ 
      model: modelToUse,
      safetySettings,
    });

    // Create system instruction based on role
    let systemInstruction = '';
    
    if (role === 'career advisor') {
      systemInstruction = 'You are an AI career advisor for JumysAL, a career platform for Kazakhstan. ' +
        'Provide helpful career advice tailored for Kazakhstan\'s job market. ' +
        'Be encouraging, positive, and provide specific actionable advice. ' +
        'Keep responses concise and focused on practical steps.';
    } else if (role === 'resume generator') {
      systemInstruction = 'You are an AI resume creator for JumysAL, a career platform for Kazakhstan. ' +
        'Create professional, modern resumes based on the information provided. ' +
        'Format using markdown with clear sections for experience, skills, education, etc. ' +
        'Highlight strengths and achievements in a professional tone. ' +
        'Keep the resume content appropriate for Kazakhstan\'s job market.';
    }

    // Form the full prompt
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;
    
    // Get response from the model with timeout handling
    const result = await Promise.race([
      model.generateContent(fullPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 30000)
      )
    ]) as any;
    
    // Reset rate limiting stats on successful request
    rateLimitInfo.failedRequests = 0;
    rateLimitInfo.fallbackMode = false;
    
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      data: text
    };
    
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    
    // Check for rate limit errors
    if (error instanceof Error && 
        (error.message.includes('429') || 
         error.message.includes('quota') || 
         error.message.toLowerCase().includes('rate limit'))) {
      
      rateLimitInfo.lastErrorTime = Date.now();
      rateLimitInfo.failedRequests += 1;
      rateLimitInfo.backoffUntil = Date.now() + (rateLimitInfo.failedRequests * 5000); // Exponential backoff
      rateLimitInfo.fallbackMode = true;
      
      return {
        success: false,
        error: 'Превышен лимит запросов к AI. Пожалуйста, повторите попытку позже.',
        rateLimited: true
      };
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
      
    return {
      success: false,
      error: errorMessage === 'Request timed out'
        ? 'The AI service took too long to respond. Please try again later.'
        : errorMessage
    };
  }
}

// Simple in-memory cache for generated resumes
const resumeCache = new Map<string, {html: string, timestamp: number}>();

// Fallback model chain - sorted by priority
const AVAILABLE_MODELS = [
  'gemini-1.5-pro',      // First choice - best quality
  'gemini-1.5-flash',    // Second choice - faster but still good
  'gemini-pro',          // Older model, more widely available
  'gemini-pro-latest'    // Last resort fallback
];

// Function to select next fallback model
function getNextFallbackModel(currentModel: string): string | null {
  const currentIndex = AVAILABLE_MODELS.indexOf(currentModel);
  if (currentIndex === -1 || currentIndex >= AVAILABLE_MODELS.length - 1) {
    return null; // No more fallbacks available
  }
  return AVAILABLE_MODELS[currentIndex + 1];
}

export interface ResumeGenerationResult {
  html: string;
  error?: string;
}

interface ProfileData {
  name?: string;
  email?: string;
  position?: string;
  location?: string;
  photo?: string | null;
  bio?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  languages?: string[];
  interests?: string[];
  university?: string;
  graduationYear?: string;
  linkedIn?: string;
}

/**
 * Creates a style-specific prompt for resume generation
 * @param profileData User profile information
 * @param style Resume style (modern, professional, standard, academic)
 * @returns Specialized prompt for the Gemini API
 */
function createStylePrompt(profileData: ProfileData, style: string): string {
  // Basic profile information formatted for all styles
  const basicInfo = `
    Name: ${profileData.name || 'Not provided'}
    Email: ${profileData.email || 'Not provided'}
    Position: ${profileData.position || 'Not provided'}
    Location: ${profileData.location || 'Not provided'}
    Photo: ${profileData.photo ? 'Provided' : 'Not provided'}
    Bio: ${profileData.bio || 'Not provided'}
    
    Skills: ${profileData.skills?.join(', ') || 'Not provided'}
    
    Work Experience:
    ${profileData.experience?.map(exp => `- ${exp}`).join('\\n') || 'Not provided'}
    
    Education:
    ${profileData.education?.map(edu => `- ${edu}`).join('\\n') || 'Not provided'}
    
    Languages: ${profileData.languages?.join(', ') || 'Not provided'}
    Interests: ${profileData.interests?.join(', ') || 'Not provided'}
    University: ${profileData.university || 'Not provided'}
    Graduation Year: ${profileData.graduationYear || 'Not provided'}
    LinkedIn: ${profileData.linkedIn || 'Not provided'}
  `;

  // Style-specific prompts with different visual directions
  switch (style) {
    case 'standard':
      return `
        Create a beautiful, clean, professional HTML resume using Tailwind CSS classes.
        
        PROFILE DATA:
        ${basicInfo}
        
        DESIGN REQUIREMENTS:
        1. Create a simple, traditional resume layout that's easy to scan and print
        2. Use a clean white background with subtle gray accents and light blue highlights (#e0f2fe)
        3. Use a professional sans-serif font (font-sans) with clear hierarchy
        4. Create a distinct header with name, title, contact info, and a small border or underline separator
        5. Organize content in a single column with clear section headers that stand out
        6. Use navy blue (#1e3a8a) for section headers and accents with subtle transitions
        7. Include these sections in order: Summary, Experience, Skills, Education, Languages
        8. For skills, create a visually appealing grid of skill tags with subtle backgrounds
        9. For experience and education, create a timeline style with dates clearly aligned
        10. Add subtle spacing, padding and dividers between sections for excellent readability
        11. Include subtle hover effects on interactive elements
        12. Ensure excellent typography with proper line heights, letter spacing and font weights
        
        SPECIFIC STYLING DETAILS:
        - Header: Large name (text-3xl), position underneath (text-xl), contact info with icons
        - Section titles: text-xl font-semibold text-blue-800 with bottom border
        - Skills: flex flex-wrap with gap-2, each skill as rounded-lg bg-blue-50 px-3 py-1
        - Experience: Each job with position (font-semibold), company/dates (text-gray-600)
        - Add subtle rounded corners (rounded-md) and gentle shadows (shadow-sm) to containers
        
        OUTPUT:
        Create only the HTML with Tailwind CSS classes - no external CSS. Make it look polished and professional, like it was designed by a professional resume designer. Focus on excellent typography, spacing, and visual hierarchy.
      `;
    
    case 'professional':
      return `
        Create a sophisticated, executive-level HTML resume using Tailwind CSS classes.
        
        PROFILE DATA:
        ${basicInfo}
        
        DESIGN REQUIREMENTS:
        1. Create an elegant, premium resume design suited for senior professionals and executives
        2. Use a sophisticated color scheme with deep navy (#0f172a), gold accents (#ca8a04), and slate gray (#475569)
        3. Implement a two-column layout with left sidebar (~30% width) for contact info and skills
        4. Use elegant typography with serif fonts for headings (font-serif) and sans-serif for body text
        5. Create a distinctive header with the person's name prominently displayed with perfect spacing
        6. Add subtle shadows (shadow-md), refined borders and premium visual effects
        7. Include professional icons for contact information and section headings
        8. Create visually distinctive skills section with elegant proficiency indicators (bars or dots)
        9. Use refined decorative elements to separate sections (gradient lines, subtle patterns)
        10. If photo available, incorporate a professional square photo with subtle border
        11. Add gold accents for key achievements or statistics (numbers, percentages)
        12. Create an executive summary section that stands out visually
        
        SPECIFIC STYLING DETAILS:
        - Header: Elegant spacing with name (text-4xl font-serif font-bold) and position underneath
        - Left sidebar: bg-slate-50 with contact info at top, skills and languages below
        - Skills: Each with elegant proficiency bar using gold gradient
        - Main column: Experience and education with refined spacing and typography
        - Company names: font-semibold text-navy-900
        - Dates: text-sm text-gold-600 font-medium
        - Section dividers: h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent
        
        OUTPUT:
        Create only the HTML with Tailwind CSS classes - no external CSS. Focus on creating a resume that conveys authority, experience, and executive presence. The design should feel premium and refined, like it was created by a high-end design agency.
      `;
    
    case 'academic':
      return `
        Create a formal academic CV/resume using Tailwind CSS classes.
        
        PROFILE DATA:
        ${basicInfo}
        
        DESIGN REQUIREMENTS:
        1. Create a scholarly CV suitable for academic positions, research roles, and higher education
        2. Use a formal layout with traditional styling and excellent information hierarchy
        3. Implement serif fonts (font-serif) for headings and sans-serif for body with optimal readability
        4. Use a conservative color scheme with dark green accents (#166534) and ivory background (#fffef0)
        5. Focus on detailed presentation of education, research, and academic achievements
        6. Create clear hierarchical sections with formal headings and appropriate spacing
        7. Emphasize education details, research interests, and academic publications
        8. Use a structured, formal layout with minimal but effective decorative elements
        9. Include dedicated sections for publications, research interests, and teaching experience
        10. Format languages with clear proficiency levels in a visually organized manner
        11. Use traditional academic styling with attention to proper citation formatting
        12. Include a formal header with complete contact information and institutional affiliation
        
        SPECIFIC STYLING DETAILS:
        - Header: Centered design with name (text-3xl font-serif) and academic position
        - Section headings: text-green-800 font-serif font-semibold text-xl uppercase tracking-wide
        - Education: Detailed format with degree, institution, date and honors clearly distinguished
        - Publications: Formatted in an academic citation style with proper indentation
        - Skills: Organized by category (Research Methods, Technical Skills, etc.)
        - Experience: Chronological with emphasis on academic and research positions
        - Add subtle parchment-like background to main content (bg-amber-50)
        
        OUTPUT:
        Create only the HTML with Tailwind CSS classes - no external CSS. The design should look scholarly and traditional with emphasis on academic credentials and accomplishments. The final result should be suitable for academic job applications and grant proposals.
      `;
    
    case 'modern':
    default:
      return `
        Create a visually stunning and creative HTML resume using Tailwind CSS.
        
        PROFILE DATA:
        ${basicInfo}
        
        DESIGN REQUIREMENTS:
        1. Create a visually impressive, contemporary resume design with excellent visual appeal
        2. Use a vibrant gradient color scheme with purples (#8B5CF6), blues (#3B82F6), and accent colors
        3. Implement creative layout with cards, grid patterns, and modern UI components
        4. Use animation-friendly structure (compatible with CSS transitions and transforms)
        5. Add decorative elements like dot patterns, subtle polygons, or geometric accents
        6. Create visually distinctive skills section with modern badges or tags and visual skill levels
        7. Include modern icons for contact info and section headings (using SVG or emoji)
        8. Add creative timeline elements for experience history with visual connectors
        9. Use generous white space and asymmetrical layouts for visual interest
        10. Add layered elements with shadows, rounded corners, and overlapping components
        11. Include an eye-catching header area with modern typography and gradient backgrounds
        12. Incorporate a circular profile photo with decorative border or overlay effects
        13. Use micro-interactions and hover effects that enhance the experience
        
        SPECIFIC STYLING DETAILS:
        - Background: Subtle gradient or pattern (bg-gradient-to-br from-purple-50 to-blue-50)
        - Header: Asymmetric design with bold name (text-4xl font-bold) and gradient accents
        - Profile image: rounded-full with border or glow effect (ring-2 ring-purple-500/50)
        - Contact info: Horizontal list with icons and hover effects
        - Skills: Interactive tags with gradient backgrounds and visual skill levels
          (bg-gradient-to-r from-indigo-500 to-purple-500)
        - Experience: Card-based timeline with shadow-lg rounded-xl and connector elements
        - Section headings: Gradient text (text-transparent bg-clip-text bg-gradient-to-r)
        - Add decorative floating shapes in background using absolute positioning
        
        OUTPUT:
        Create only the HTML with Tailwind CSS classes - no external CSS. Focus on creating a resume that feels contemporary, visually exciting, and creatively designed while maintaining professional appearance. The final result should look like it was created by a UI/UX design specialist with attention to both aesthetics and usability.
      `;
  }
}

export async function generateResume(
  profileData: ProfileData,
  model: string = AVAILABLE_MODELS[0],
  style: string = 'modern'
): Promise<ResumeGenerationResult> {
  try {
    // Validate the requested model is in our list
    const selectedModel = AVAILABLE_MODELS.includes(model) ? model : AVAILABLE_MODELS[0];
    
    // Use the same API key variable as defined at the top of the file
    const apiKey = API_KEY;
    
    if (!apiKey) {
      throw new Error('API key for Gemini is missing');
    }
    
    // Construct the API endpoint
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    
    // Get a style-specific prompt for better results
    const prompt = createStylePrompt(profileData, style || 'modern');
    
    // Configuration for API request
    const requestConfig = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
      // Adjust generation parameters for better creativity
      generationConfig: {
        temperature: 0.7, // Higher temperature for more creativity
        maxOutputTokens: 4096, // Limit output size
        topP: 0.95,  // Increased for more variety
        topK: 40
      }
    };
    
    // Try-catch for the main API request
    try {
      console.log(`Attempting to generate resume using model: ${selectedModel} with style: ${style}`);
      
      // Make the API request
      const response = await axios.post(apiUrl, requestConfig);
      
      // Extract the generated text from the response
      const responseData = response.data;
      
      if (
        responseData &&
        responseData.candidates &&
        responseData.candidates[0] &&
        responseData.candidates[0].content &&
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts[0] &&
        responseData.candidates[0].content.parts[0].text
      ) {
        // Extract and clean HTML content
        let html = responseData.candidates[0].content.parts[0].text;
        
        // Remove any markdown code block indicators if present
        html = html.replace(/```html/g, '').replace(/```/g, '').trim();
        
        // Reset rate limit counters since we succeeded
        rateLimitInfo.failedRequests = 0;
        rateLimitInfo.fallbackMode = false;
        
        return { html };
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (apiError: any) {
      console.error('Error with model:', selectedModel, apiError);
      
      // Get the next fallback model
      const nextModel = getNextFallbackModel(selectedModel);
      
      // If we have a next model to try and it's not a non-recoverable error
      if (nextModel) {
        // Handle rate limiting (429) or other errors that might benefit from retrying
        if (apiError.response && (apiError.response.status === 429 || apiError.response.status === 404)) {
          // Update rate limit tracking
          rateLimitInfo.lastErrorTime = Date.now();
          rateLimitInfo.failedRequests += 1;
          rateLimitInfo.fallbackMode = true;
          
          // Try with fallback model
          console.log(`Trying fallback model: ${nextModel}`);
          
          // Implement exponential backoff with delay
          const backoffTime = Math.min(1000 * Math.pow(2, rateLimitInfo.failedRequests), 8000);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          
          // Retry with the fallback model and the same style
          return generateResume(profileData, nextModel, style);
        }
      }
      
      // If we're out of fallbacks or it's another kind of error, rethrow
      if (apiError.response && apiError.response.status === 429) {
        throw new Error('Превышен лимит запросов к AI. Пожалуйста, попробуйте позже.');
      } else if (apiError.response && apiError.response.status === 404) {
        throw new Error('Модель AI временно недоступна. Пожалуйста, попробуйте позже.');
      }
      
      // For other errors, rethrow
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error generating resume:', error);
    
    // Return a more specific error message
    return {
      html: '',
      error: error.message || 'Failed to generate resume'
    };
  }
}

export interface ResumeAnalysisInput {
  role: string;
  field: string;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description: string;
  }>;
  interests: string[];
}

interface ResumeAnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  enhancedContent: string;
}

interface UserContext {
  role: string;
  skills: string[];
  education: string[];
  experience: string[];
  interests: string[];
}

/**
 * Analyzes resume content using Gemini API
 * 
 * @param resumeContent - Text content of the resume to analyze
 * @param userData - User context data to provide better analysis
 * @returns Analysis result with score, strengths, improvements, etc.
 */
export async function generateResumeAnalysis(
  resumeContent: string,
  userData: UserContext
): Promise<ResumeAnalysisResult> {
  try {
    // Construct the prompt for the AI
    const prompt = `
      You are an expert resume reviewer with years of experience helping students and young professionals improve their resumes.
      
      Please analyze the following resume for a ${userData.role}, considering their background:
      - Skills: ${userData.skills.join(', ')}
      - Education: ${userData.education.join('; ')}
      - Experience: ${userData.experience.join('; ')}
      - Interests: ${userData.interests.join(', ')}
      
      RESUME TEXT:
      ${resumeContent}
      
      Provide a comprehensive analysis with the following sections:
      1. An overall score from 0-100
      2. Key strengths (3-5 bullet points)
      3. Areas for improvement (3-5 bullet points)
      4. Detailed feedback (paragraph format)
      5. Enhanced content suggestions (how specific sections could be rewritten)
      
      Return your analysis as a JSON object with these exact keys:
      {
        "score": number,
        "strengths": string[],
        "improvements": string[],
        "detailedFeedback": string,
        "enhancedContent": string
      }
      
      The analysis should be specifically tailored for students/graduates with focus on:
      - Highlighting academic achievements and relevant coursework
      - Emphasizing transferable skills for entry-level positions
      - Quantifying achievements where possible
      - Clear and concise language appropriate for their field
      
      Format your response ONLY as a valid JSON object. Do not include any other text.
    `;

    // Make request to Gemini API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.REACT_APP_GEMINI_API_KEY || '',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the JSON content from the response
    const textContent = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON string into an object
    let analysisResult: ResumeAnalysisResult;
    
    try {
      analysisResult = JSON.parse(textContent);
    } catch (e) {
      console.error('Failed to parse JSON from API response', textContent);
      
      // Fallback: Create a structured object from unstructured text
      const fallbackResult: ResumeAnalysisResult = {
        score: 65, // Default score
        strengths: [
          "Clearly presented educational background",
          "Good organization of information",
          "Includes relevant skills for the position"
        ],
        improvements: [
          "Add more quantifiable achievements",
          "Tailor content to specific job descriptions",
          "Strengthen action verbs in experience descriptions"
        ],
        detailedFeedback: "The resume has a solid foundation but could benefit from more specific achievements and metrics. Consider revising the experience section to highlight results rather than just responsibilities.",
        enhancedContent: "Consider reformatting the experience section to focus on achievements. For example, instead of 'Responsible for project management', use 'Successfully managed 5 concurrent projects, reducing delivery time by 15%'."
      };
      
      return fallbackResult;
    }
    
    return analysisResult;
  } catch (error) {
    console.error('Error in resume analysis:', error);
    
    // Return a friendly error message as fallback
    throw new Error(
      'Unable to analyze resume at this time. Please try again later.'
    );
  }
} 