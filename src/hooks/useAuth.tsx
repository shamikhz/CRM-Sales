'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { onAuthChange, getCurrentUserProfile } from '@/firebase/auth';
import { useAuthStore } from '@/store';

interface AuthContextType {
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType>({ isReady: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getCurrentUserProfile(firebaseUser.email, firebaseUser.uid);
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Unknown User',
              role: 'unassigned',
              status: 'active',
              createdAt: new Date(),
            } as User);
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          import('sonner').then(({ toast }) => toast.error('Failed to load profile data', { description: error.message }));
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  return (
    <AuthContext.Provider value={{ isReady: !isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
