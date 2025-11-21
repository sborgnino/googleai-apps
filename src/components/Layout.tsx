import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Mic, LayoutDashboard, History, Activity } from 'lucide-react';

export const Layout: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full py-3 text-xs font-medium transition-colors ${
      isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-50 overflow-hidden">
      <header className="flex-none p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            VoiceFit AI
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto pb-24">
          <Outlet />
        </div>
      </main>

      <nav className="flex-none border-t border-slate-800 bg-slate-900 pb-safe fixed bottom-0 w-full md:static md:w-auto md:border-t-0 md:bg-transparent md:pb-0">
        <div className="flex justify-around max-w-5xl mx-auto md:hidden">
          <NavLink to="/" className={navLinkClass}>
            <LayoutDashboard className="w-6 h-6 mb-1" />
            Dashboard
          </NavLink>
          <NavLink to="/record" className={navLinkClass}>
             <div className="bg-blue-600 rounded-full p-2 -mt-6 shadow-lg border-4 border-slate-900">
                <Mic className="w-6 h-6 text-white" />
             </div>
             <span className="mt-1">Record</span>
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            <History className="w-6 h-6 mb-1" />
            History
          </NavLink>
        </div>
      </nav>
    </div>
  );
};