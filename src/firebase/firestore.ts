import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';

// Helper to robustly convert Firestore values to Date objects
const parseDate = (val: unknown): Date | undefined => {
  if (!val) return undefined;
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

// Convert date fields in a document
const convertDates = (data: DocumentData) => {
  const dateFields = [
    'createdAt', 'updatedAt', 'checkIn', 'checkOut',
    'dueDate', 'timestamp', 'generatedAt',
  ];
  const result: Record<string, unknown> = { ...data };
  for (const field of dateFields) {
    if (result[field] !== undefined) {
      result[field] = parseDate(result[field]) || result[field];
    }
  }
  return result;
};

// Get all documents from a collection
export async function getDocuments(
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  const ref = collection(db, collectionName);
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertDates(doc.data()),
  }));
}

// Get single document
export async function getDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...convertDates(snapshot.data()) };
}

// Create document
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>
) {
  const ref = collection(db, collectionName);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// Update document (uses setDoc merge to act as upsert)
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
) {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
}

// Delete document
export async function deleteDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

// Real-time subscription to a collection
export function subscribeToCollection(
  collectionName: string,
  callback: (data: Record<string, unknown>[]) => void,
  ...constraints: QueryConstraint[]
) {
  const ref = collection(db, collectionName);
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertDates(doc.data()),
    }));
    callback(data);
  });
}

// Real-time subscription to a single document
export function subscribeToDocument(
  collectionName: string,
  docId: string,
  callback: (data: Record<string, unknown> | null) => void
) {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...convertDates(snapshot.data()) });
  });
}

// Re-export Firestore query helpers for convenience
export { where, orderBy, limit, Timestamp };
