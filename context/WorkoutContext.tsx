import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WorkoutSession } from '../types';

interface WorkoutContextType {
  sessions: WorkoutSession[];
  addSession: (session: Omit<WorkoutSession, 'id' | 'createdAt'>) => void;
  deleteSession: (id: string) => void;
  loading: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_KEY = 'voicefit_sessions_v1';

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist to local storage whenever sessions change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, loading]);

  const addSession = useCallback((data: Omit<WorkoutSession, 'id' | 'createdAt'>) => {
    const newSession: WorkoutSession = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <WorkoutContext.Provider value={{ sessions, addSession, deleteSession, loading }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkoutStore = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkoutStore must be used within a WorkoutProvider");
  }
  return context;
};
