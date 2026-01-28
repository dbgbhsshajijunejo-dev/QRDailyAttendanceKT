
import React, { useState, useEffect } from 'react';
import { AppTab, Student, AttendanceRecord } from './types';
import { localDb } from './services/db';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import QRScanner from './components/QRScanner';
import AttendanceReport from './components/AttendanceReport';
import SyncView from './components/SyncView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string>(() => localStorage.getItem('schoolName') || 'EDUSYNC INTERNATIONAL SCHOOL');

  const fetchData = async () => {
    try {
      const s = await localDb.getAllStudents();
      const a = await localDb.getAllAttendance();
      setStudents(s);
      setAttendance(a);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localDb.init().then(fetchData);
  }, []);

  useEffect(() => {
    localStorage.setItem('schoolName', schoolName);
  }, [schoolName]);

  const handleAddStudent = async (student: Student) => {
    await localDb.saveStudent(student);
    setStudents(prev => [...prev, student]);
  };

  const handleUpdateStudent = async (student: Student) => {
    await localDb.updateStudent(student);
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      await localDb.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleScan = async (record: AttendanceRecord) => {
    await localDb.saveAttendance(record);
    setAttendance(prev => [...prev, record]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-4xl">⚙️</div>
        <span className="ml-4 font-medium text-slate-600">Initializing Offline DB...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 bg-slate-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === AppTab.DASHBOARD && (
          <Dashboard students={students} attendance={attendance} />
        )}
        {activeTab === AppTab.STUDENTS && (
          <StudentList 
            students={students} 
            schoolName={schoolName} 
            onAddStudent={handleAddStudent} 
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}
        {activeTab === AppTab.SCAN && (
          <QRScanner students={students} onScan={handleScan} />
        )}
        {activeTab === AppTab.REPORTS && (
          <AttendanceReport attendance={attendance} students={students} schoolName={schoolName} />
        )}
        {activeTab === AppTab.SYNC && (
          <SyncView 
            students={students} 
            attendance={attendance} 
            onSyncComplete={fetchData} 
          />
        )}
        {activeTab === AppTab.SETTINGS && (
          <SettingsView 
            schoolName={schoolName} 
            setSchoolName={setSchoolName} 
            onDataImported={fetchData} 
          />
        )}
      </main>

      <footer className="hidden md:block py-12 text-center text-slate-400 text-sm">
        <p>Offline-First Architecture Implementation</p>
        <p className="mt-1 font-bold text-slate-500 uppercase">{schoolName}</p>
        <p className="mt-1">Built with React + Tailwind + Supabase (Mock)</p>
      </footer>
    </div>
  );
};

export default App;
