
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem('schoolName') || 'EDUSYNC INTERNATIONAL SCHOOL';
  });

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
    // Check if record for this day and student already exists to update it instead of duplicate
    const recordDate = new Date(record.timestamp).toDateString();
    const existingIndex = attendance.findIndex(a => 
      a.student_db_id === record.student_db_id && 
      new Date(a.timestamp).toDateString() === recordDate
    );

    if (existingIndex > -1) {
      const updatedAttendance = [...attendance];
      updatedAttendance[existingIndex] = record;
      await localDb.saveAttendance(record);
      setAttendance(updatedAttendance);
    } else {
      await localDb.saveAttendance(record);
      setAttendance(prev => [...prev, record]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-black text-indigo-900 uppercase tracking-widest text-xs">Loading EduSync Engine</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-slate-50">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
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
          <QRScanner 
            students={students} 
            attendance={attendance} 
            onScan={handleScan}
            onUpdateStudent={handleUpdateStudent}
            onNavigateToStudents={() => setActiveTab(AppTab.STUDENTS)}
          />
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

      <footer className="py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
        <p>Offline-First Architecture Implementation</p>
        <p className="mt-2 text-indigo-500">{schoolName}</p>
      </footer>
    </div>
  );
};

export default App;
