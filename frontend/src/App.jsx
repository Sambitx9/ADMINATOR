import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { HeroSection } from './components/landing/HeroSection';
import { WhatsAppSimulator } from './components/chat/WhatsAppSimulator';
import { StaffDashboardShell } from './components/dashboard/StaffDashboardShell';
import { CollegeComparison } from './components/comparison/CollegeComparison';
import { ShieldCheck, Heart, Github } from 'lucide-react';

export default function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [activeView, setActiveView] = useState(urlParams.get('view') || 'student');
  const [currentLanguage, setCurrentLanguage] = useState(urlParams.get('lang') || 'en');

  const handleLaunchChat = () => {
    setActiveView('simulator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 selection:bg-electric-blue selection:text-navy-950">
      {/* Top Application Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-2 sm:p-4 w-full">
        {activeView === 'student' && (
          <HeroSection
            currentLanguage={currentLanguage}
            onLaunchChat={handleLaunchChat}
            onNavigateToCompare={() => setActiveView('compare')}
          />
        )}
        {activeView === 'compare' && (
          <CollegeComparison
            currentLanguage={currentLanguage}
            onSelectCollegeForChat={() => setActiveView('simulator')}
          />
        )}
        {activeView === 'simulator' && (
          <WhatsAppSimulator
            defaultLanguage={currentLanguage}
            onBackToHero={() => setActiveView('student')}
          />
        )}
        {activeView === 'staff' && (
          <StaffDashboardShell currentLanguage={currentLanguage} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-800 bg-navy-900/60 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider">ADMINATOR</span>
            <span>—</span>
            <span>SMART ADMISSIONS. ZERO CHAOS.</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>₹0 Operating Target • 100% Offline-Capable Foundation</span>
          </div>

          <div className="text-slate-400">
            Diploma Engineering Admissions Demo • Odisha
          </div>
        </div>
      </footer>
    </div>
  );
}
