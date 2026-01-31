
import React from 'react';
import { AppTab } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  ClipboardList, 
  CloudSync, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const tabs = [
    { id: AppTab.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppTab.STUDENTS, label: 'Student Directory', icon: Users },
    { id: AppTab.SCAN, label: 'QR Scanner', icon: QrCode },
    { id: AppTab.REPORTS, label: 'Attendance Reports', icon: ClipboardList },
    { id: AppTab.SYNC, label: 'Cloud Sync', icon: CloudSync },
    { id: AppTab.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: AppTab) => {
    setActiveTab(tabId);
    setIsOpen(false); // Auto-hide sidebar after selection
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 glass z-[60] px-4 md:px-8 flex items-center justify-between border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200">E</div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800 uppercase">EduSync <span className="text-indigo-600 italic">Pro</span></h1>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* Sidebar Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Drawer Menu */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[80] shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-100 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">E</div>
            <span className="font-black text-slate-800 uppercase tracking-tighter">Main Navigation</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Management</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 bg-slate-50 mt-auto">
           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
             <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Offline Ready
             </p>
           </div>
           <p className="text-[9px] text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">Version 3.1.2</p>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
