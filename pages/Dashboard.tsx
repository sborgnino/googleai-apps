import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid
} from 'recharts';
import { useWorkoutStore } from '../context/WorkoutContext';
import { TrendingUp, Dumbbell, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { sessions } = useWorkoutStore();

  const stats = useMemo(() => {
    // 1. Total Volume over time (simple approximation: sets * reps)
    const volumeData = sessions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(session => {
        const totalReps = session.exercises.reduce((acc, curr) => {
          return acc + ((curr.sets || 1) * (curr.reps || 0));
        }, 0);
        return {
          date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}),
          volume: totalReps
        };
      })
      .slice(-7); // Last 7 sessions

    // 2. Most frequent exercises
    const exerciseCounts: Record<string, number> = {};
    sessions.forEach(s => {
      s.exercises.forEach(e => {
        const name = e.name.toLowerCase();
        exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
      });
    });

    const topExercises = Object.entries(exerciseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // 3. Workouts per week (current week)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekCount = sessions.filter(s => new Date(s.date) > oneWeekAgo).length;

    return { volumeData, topExercises, lastWeekCount };
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-slate-800 p-4 rounded-full mb-4">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Data Yet</h2>
        <p className="text-slate-400">Record your first workout to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Last 7 Days</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.lastWeekCount} <span className="text-sm font-normal text-slate-500">sessions</span></p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Dumbbell className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Total Logged</span>
          </div>
          <p className="text-2xl font-bold text-white">{sessions.length} <span className="text-sm font-normal text-slate-500">workouts</span></p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Volume Chart */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Volume Trend (Total Reps)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#60a5fa" 
                  strokeWidth={3} 
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Exercises */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Frequent Exercises</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topExercises} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={100}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                   cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
