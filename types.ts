export interface Exercise {
  name: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration_minutes?: number | null;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  exercises: Exercise[];
  raw_transcription: string;
  notes?: string;
  createdAt: number; // Timestamp
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  mostFrequent: string;
}

export enum AppState {
  IDLE,
  RECORDING,
  PROCESSING,
  REVIEW,
  ERROR
}
