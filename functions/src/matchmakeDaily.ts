import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';


if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();


const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = "gemini-1.5-flash"; 


interface Profile {
  uid: string;
  role: 'seeker' | 'mentor' | 'founder';
  headline?: string;
  skills: string[];
  interests: string[];
  lookingFor: Array<'project' | 'people' | 'mentor'>;
  location?: string;
  openToRemote: boolean;
  experienceMonths?: number;
  age?: number;
}

interface Project {
  projectId: string;
  title: string;
  tags: string[];
  skillsNeeded: string[];
  ownerRole: string;
  isOpen: boolean;
  mode: 'remote' | 'onsite' | 'hybrid';
  description: string;
}

interface AiMatch {
  fromUid: string;
  toProjectId: string;
  score: number;
  reason: string;
}


function normalizeProfile(doc: admin.firestore.DocumentSnapshot): Profile {
  const data = doc.data() || {};
  
  return {
    uid: doc.id,
    role: data.role || 'seeker',
    headline: data.headline || '',
    skills: data.skills || [],
    interests: data.interests || [],
    lookingFor: data.lookingFor || ['project'],
    location: data.location || '',
    openToRemote: data.openToRemote || false,
    experienceMonths: data.experienceMonths || 0,
    age: data.age || null
  };
}

/**
 * Нормализация данных проекта для отправки в Gemini
 */
function normalizeProject(doc: admin.firestore.DocumentSnapshot): Project {
  const data = doc.data() || {};
  
  return {
    projectId: doc.id,
    title: data.title || '',
    tags: data.tags || [],
    skillsNeeded: data.skillsNeeded || [],
    ownerRole: data.ownerRole || 'founder',
    isOpen: data.isOpen || true,
    mode: data.mode || 'remote',
    description: data.description || ''
  };
}


function chunk<T>(array: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}


function buildPrompt(profiles: Profile[], projects: Project[]): string {
  return `
SYSTEM:
You are "JumysAL Matchmaker AI".
Your job: create the best possible pairs between PEOPLE profiles and PROJECTS, similar to how a recruiter matches candidates to jobs.
Output pure JSON only, no explanations.

RULES:
1. Only propose matches where BOTH sides benefit (skills vs skillsNeeded, interests overlap, language/remote compatibility).
2. Score every proposed match from 0 to 1 (higher = better).
3. Max 5 project suggestions per person; skip if score < 0.35.
4. Reasons must be concise (≤ 80 chars).

FORMAT:
[
  { "fromUid":"<profile uid>",
    "toProjectId":"<project id>",
    "score":0.82,
    "reason":"Knows Flutter & wants EdTech remote project" },
  ...
]

DATA:
## PEOPLE
${JSON.stringify(profiles)}

## PROJECTS
${JSON.stringify(projects)}
`;
}


async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  
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

  try {
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini:', error);
    
    
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await fallbackModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings
      });
      
      const response = await result.response;
      return response.text();
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError);
      throw new Error('All AI models failed to generate matches');
    }
  }
}


export const matchmakeDaily = onSchedule({
  schedule: 'every 24 hours',
  timeZone: 'UTC',
  retryCount: 3
}, async () => {
  try {
    console.log('Starting matchmakeDaily');
    
    
    const jobs = await db.collection('matchJobs').limit(100).get();
    console.log(`Found ${jobs.size} matchJobs to process`);
    
    if (jobs.empty) {
      console.log('No jobs to process');
      return;
    }

    
    const profiles: Profile[] = [];
    const projects: Project[] = [];
    
    for (const job of jobs.docs) {
      const docRef = job.data().docRef;
      if (!docRef) continue;
      
      const doc = await db.doc(docRef).get();
      if (!doc.exists) {
        await job.ref.delete();
      }
      
      const parentCollection = doc.ref.parent.id;
      if (parentCollection === 'networkingProfiles') {
        profiles.push(normalizeProfile(doc));
      } else if (parentCollection === 'projects') {
        projects.push(normalizeProject(doc));
      }
      
      
      await job.ref.delete();
    }
    
    if (profiles.length === 0 || projects.length === 0) {
      console.log('Not enough data for matching');
      return;
    }
    
    console.log(`Processing ${profiles.length} profiles and ${projects.length} projects`);

  
    const batches = chunk(profiles, 30);
    let totalMatches = 0;
    
    // 4. тип каждый пакет обрабытываем
    for (const batch of batches) {
      const prompt = buildPrompt(batch, projects);
      
      // Вызываем наш гемини апи
      console.log(`Calling Gemini API with ${batch.length} profiles and ${projects.length} projects`);
      const aiResponse = await callGemini(prompt);
      
      try {
        // Парсим 
        const matches: AiMatch[] = JSON.parse(aiResponse);
        console.log(`Received ${matches.length} matches from AI`);
        
        // Подготавливаем пакетную запись
        const batchWrite = db.batch();
        
        for (const match of matches) {
          if (!match.fromUid || !match.toProjectId || match.score === undefined) {
            console.warn('Invalid match data:', match);
            continue;
          }
          
          // Генерируем уникальный ID для матча
          const matchId = `${match.fromUid}_${match.toProjectId}`;
          
          // Добавляем метаданные и timestamp
          const matchData = {
            ...match,
            matchType: 'ai',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            // TTL для автоматического удаления через 14 дней
            expiresAt: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            )
          };
          
          // Записываем для нашего пользовтел
          batchWrite.set(
            db.doc(`matches/${match.fromUid}/${matchId}`),
            matchData
          );
          
          // Записываем зеркально 
          batchWrite.set(
            db.doc(`matchesProjects/${match.toProjectId}/${matchId}`),
            matchData
          );
          
          totalMatches++;
        }
        
        
        await batchWrite.commit();
        console.log(`Committed ${totalMatches} matches to Firestore`);
        
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', aiResponse);
        
        
        await db.collection('matchesErrors').add({
          error: 'parse_error',
          message: (parseError as Error).message,
          rawResponse: aiResponse,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    console.log(`Matching complete. Created ${totalMatches} matches in total`);
    
  } catch (error) {
    console.error('Error in matchmakeDaily:', error);
    throw error;
  }
});


export const enqueueMatchJob = onDocumentCreated(
  '{collection}/{docId}', 
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const collection = event.params.collection;
    const docId = event.params.docId;
    
    
    if (collection !== 'networkingProfiles' && collection !== 'projects') {
      return;
    }
    
    
    await db.collection('matchJobs').add({
      docRef: `${collection}/${docId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
); 