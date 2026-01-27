
import React from 'react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: AppTab.DASHBOARD, label: 'Dashboard', icon: '📊' },
    { id: AppTab.STUDENTS, label: 'Students', icon: '👥' },
    { id: AppTab.SCAN, label: 'Scan QR', icon: '🔍' },
    { id: AppTab.REPORTS, label: 'Reports', icon: '📄' },
    { id: AppTab.SYNC, label: 'Sync', icon: '☁️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between md:justify-start md:gap-8 items-center h-16">
          <div className="hidden md:block font-bold text-xl text-indigo-600 mr-8">EduSync</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl md:text-lg">{tab.icon}</span>
              <span className="text-[10px] md:text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
