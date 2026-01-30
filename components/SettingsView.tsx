
import React, { useRef, useState, useEffect } from 'react';
import { localDb } from '../services/db';

interface SettingsViewProps {
  schoolName: string;
  setSchoolName: (name: string) => void;
  onDataImported: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ schoolName, setSchoolName, onDataImported }) => {
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if ((window as any).deferredPrompt) {
      setCanInstall(true);
    }
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        setCanInstall(false);
      }
    } else {
      alert("Installation shortcut is not available. Please use 'Add to Home Screen' from your browser menu manually.");
    }
  };

  const handleBackup = async () => {
    try {
      const students = await localDb.getAllStudents();
      const attendance = await localDb.getAllAttendance();
      const settings = {
        schoolName,
        backupDate: new Date().toISOString(),
      };

      const fullBackup = {
        students,
        attendance,
        settings,
        version: "1.1"
      };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EduSync_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Backup failed: " + err);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("RESTORE BACKUP?\nThis will clear all current data and replace it with the backup content. This cannot be undone.")) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.students || !data.attendance) throw new Error("Invalid backup file format");

        await localDb.clearAllData();

        for (const student of data.students) {
          await localDb.saveStudent(student);
        }
        for (const record of data.attendance) {
          await localDb.saveAttendance(record);
        }

        if (data.settings?.schoolName) {
          setSchoolName(data.settings.schoolName);
        }

        alert("Data restored successfully!");
        onDataImported();
      } catch (err) {
        alert("Restore failed: Invalid backup file");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-inner">⚙️</div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">App Settings</h2>
        </div>

        {canInstall && (
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-4">
               <div className="text-3xl">📱</div>
               <div className="flex-1">
                 <h4 className="font-black uppercase text-sm tracking-widest">Install App</h4>
                 <p className="text-xs opacity-90 mt-1">Get instant access and full offline reliability on your home screen.</p>
               </div>
               <button 
                 onClick={handleInstall}
                 className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-indigo-50 transition-colors"
               >
                 Install
               </button>
             </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">School / Institution Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Enter your school name"
              className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all font-bold"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Data Management</h3>
          <p className="text-xs text-slate-500 font-medium">Your data is stored locally. We recommend downloading a backup weekly.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleBackup}
              className="flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50"
            >
              <span>💾</span> Download Backup
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                ref={restoreInputRef} 
                onChange={handleRestore}
                className="hidden" 
                accept=".json"
              />
              <button 
                onClick={() => restoreInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-700 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
              >
                <span>📤</span> Restore Data
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="bg-amber-50 p-4 rounded-2xl text-xs text-amber-800 flex gap-3 border border-amber-100">
            <span className="text-lg">⚠️</span>
            <p className="font-medium">Clearing your browser cache or site data will delete your records unless you have synced with the cloud or downloaded a backup.</p>
          </div>
        </div>
      </div>
      
      <div className="text-center text-slate-400">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">EduSync QR System • v3.1</p>
      </div>
    </div>
  );
};

export default SettingsView;
