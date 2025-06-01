import * as admin from 'firebase-admin';
import { matchmakeDaily, enqueueMatchJob } from './matchmakeDaily';

// Инициализация Firebase Admin SDK
admin.initializeApp();

// Экспорт Cloud Functions
export { matchmakeDaily, enqueueMatchJob }; 