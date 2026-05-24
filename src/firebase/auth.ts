import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './config';
import type { User } from '@/types';

export async function signIn(email: string, password: string) {
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try {
    // We need to find the doc id by email or uid first to update it
    const profile = await getCurrentUserProfile(email, credential.user.uid);
    if (profile) {
      await updateDoc(doc(db, 'users', profile.id), { isActive: true });
    }
  } catch (e) {
    console.error('Failed to update user status on login', e);
  }
  return credential.user;
}

export async function signOut() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const profile = await getCurrentUserProfile(currentUser.email, currentUser.uid);
      if (profile) {
        await updateDoc(doc(db, 'users', profile.id), { isActive: false });
      }
    } catch (e) {
      console.error('Failed to update user status on logout', e);
    }
  }
  await firebaseSignOut(auth);
}

export async function getCurrentUserProfile(email: string | null, uid: string): Promise<User | null> {
  if (!email) return null;
  // First try direct lookup by UID (in case it matches)
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return { id: userDoc.id, uid: data.uid || userDoc.id, ...data } as User;
  }

  // If not found, query by email (Admin dashboard might use random doc IDs)
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return { id: docSnap.id, uid: data.uid || docSnap.id, ...data } as User;
  }

  return null;
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { createUserWithEmailAndPassword };
