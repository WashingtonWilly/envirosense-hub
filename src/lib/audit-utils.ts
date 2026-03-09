import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface LogActivityParams {
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details: string;
  targetId?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    console.log('Enviando log...');
    await addDoc(collection(db, 'audit_logs'), {
      userId: params.userId,
      userEmail: params.userEmail || null,
      userName: params.userName || null,
      action: params.action,
      details: params.details,
      targetId: params.targetId || null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
