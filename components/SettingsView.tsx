
import React, { useRef } from 'react';
import { localDb } from '../services/db';

interface SettingsViewProps {
  schoolName: string;
  setSchoolName: (name: string) => void;
  onDataImported: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ schoolName, setSchoolName, onDataImported }) => {
  const restoreInputRef = useRef<HTMLInputElement>(null);

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
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl">⚙️</div>
          <h2 className="text-2xl font-bold">App Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School / Institution Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Enter your school name"
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Data Management</h3>
          <p className="text-sm text-slate-500">Keep your data safe. Download a full backup of all students, attendance records, and app settings.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleBackup}
              className="flex items-center justify-center gap-3 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
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
                className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                <span>📤</span> Restore Data
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-700 flex gap-3">
            <span>💡</span>
            <p>Your settings and data are stored offline on this device. Use Backup before clearing your browser cache.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
