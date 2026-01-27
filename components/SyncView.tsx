
import React, { useState } from 'react';
import { syncWithCloud } from '../services/syncService';
import { Student, AttendanceRecord } from '../types';

interface SyncViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onSyncComplete: () => void;
}

const SyncView: React.FC<SyncViewProps> = ({ students, attendance, onSyncComplete }) => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{students: number, attendance: number} | null>(null);

  const pendingStudents = students.filter(s => s.sync_status === 'pending').length;
  const pendingAttendance = attendance.filter(a => a.sync_status === 'pending').length;
  const totalPending = pendingStudents + pendingAttendance;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncWithCloud();
      setResult({ students: res.syncedStudents, attendance: res.syncedAttendance });
      onSyncComplete();
    } catch (err) {
      alert("Sync failed. Check connection.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl">
          {syncing ? '🔄' : '☁️'}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold">Cloud Synchronization</h2>
          <p className="text-slate-500 mt-2">Upload your local data to the Supabase database.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase">Pending Students</p>
            <p className="text-2xl font-bold">{pendingStudents}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold uppercase">Pending Records</p>
            <p className="text-2xl font-bold">{pendingAttendance}</p>
          </div>
        </div>

        <button 
          disabled={syncing || totalPending === 0}
          onClick={handleSync}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            totalPending === 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          } ${syncing ? 'animate-pulse' : ''}`}
        >
          {syncing ? 'Syncing with Supabase...' : totalPending === 0 ? 'All Data Synced' : 'Sync Now'}
        </button>

        {result && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
            ✅ Successfully synced {result.students} students and {result.attendance} attendance records.
          </div>
        )}

        <div className="pt-4 text-xs text-slate-400">
          SQLite Local Cache Size: ~{(JSON.stringify(students).length + JSON.stringify(attendance).length) / 1024} KB
        </div>
      </div>
    </div>
  );
};

export default SyncView;
