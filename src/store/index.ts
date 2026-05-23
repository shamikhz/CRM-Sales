import { create } from 'zustand';
import type { User } from '@/types';

// ─── Auth Store ───
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
}));

// ─── UI Store ───
interface UIState {
  isDarkMode: boolean;
  isOnline: boolean;
  activeTab: string;
  toggleDarkMode: () => void;
  setOnline: (online: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: true,
  isOnline: true,
  activeTab: 'home',
  toggleDarkMode: () =>
    set((state) => ({ isDarkMode: !state.isDarkMode })),
  setOnline: (isOnline) => set({ isOnline }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));

// ─── Attendance Store ───
interface AttendanceState {
  isCheckedIn: boolean;
  currentSessionId: string | null;
  checkInTime: Date | null;
  setCheckedIn: (isCheckedIn: boolean, sessionId?: string | null, checkInTime?: Date | null) => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  isCheckedIn: false,
  currentSessionId: null,
  checkInTime: null,
  setCheckedIn: (isCheckedIn, sessionId = null, checkInTime = null) =>
    set({ isCheckedIn, currentSessionId: sessionId, checkInTime }),
}));
