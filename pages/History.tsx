import React from 'react';
import { useWorkoutStore } from '../context/WorkoutContext';
import { Trash2, Calendar, Clock, AlignLeft } from 'lucide-react';

export const History: React.FC = () => {
  const { sessions, deleteSession } = useWorkoutStore();

  // Sort by date descending
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sessions.length === 0) {
    return (
      <div className="text-center mt-20">
        <p className="text-slate-500">No workouts recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-4">Workout History</h2>
      
      <div className="grid gap-4">
        {sortedSessions.map((session) => (
          <div key={session.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors group">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">
                      {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button 
                  onClick={() => deleteSession(session.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete workout"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {session.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-baseline justify-between border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-200">{ex.name}</span>
                    <span className="text-sm text-slate-400 font-mono">
                       {ex.sets && <span className="text-emerald-400">{ex.sets}</span>}
                       {ex.sets && ' set'}{ex.sets !== 1 ? 's' : ''}
                       {(ex.reps || ex.duration_minutes) && ' × '}
                       {ex.reps && <span>{ex.reps} reps</span>}
                       {ex.duration_minutes && <span>{ex.duration_minutes}m</span>}
                       {ex.weight && <span className="text-slate-500 ml-2">({ex.weight}kg)</span>}
                    </span>
                  </div>
                ))}
              </div>

              {session.raw_transcription && (
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <div className="flex gap-2">
                     <AlignLeft className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                     <p className="text-sm text-slate-500 italic line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                        "{session.raw_transcription}"
                     </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
