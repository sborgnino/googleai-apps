import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RecordWorkout } from './pages/RecordWorkout';
import { History } from './pages/History';

const App: React.FC = () => {
  return (
    <WorkoutProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="record" element={<RecordWorkout />} />
            <Route path="history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </WorkoutProvider>
  );
};

export default App;
