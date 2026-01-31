
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, AttendanceRecord } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Calendar, UserCheck, XCircle, Search, Edit3, UserCircle2 } from 'lucide-react';

interface QRScannerProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onScan: (record: AttendanceRecord) => void;
  onUpdateStudent: (student: Student) => void;
  onNavigateToStudents: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ students, attendance, onScan, onUpdateStudent, onNavigateToStudents }) => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{student: Student, isDuplicate: boolean} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const targetDateStr = useMemo(() => new Date(selectedDate).toDateString(), [selectedDate]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(q) || s.grNumber.includes(q));
  }, [students, searchQuery]);

  const startCamera = async () => {
    setError(null);
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode("reader");
      }
      
      await qrScannerRef.current.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          if (!cooldown) {
            handleDecodedText(decodedText);
          }
        },
        () => {} 
      );
      setScanning(true);
    } catch (err: any) {
      setError("Camera Permission Denied. Go to settings to enable.");
    }
  };

  const stopCamera = async () => {
    if (qrScannerRef.current) {
      await qrScannerRef.current.stop();
      setScanning(false);
    }
  };

  const handleDecodedText = (text: string) => {
    const student = students.find(s => s.grNumber === text || s.id === text);
    if (student) processAttendance(student, 'present');
  };

  const processAttendance = (student: Student, status: 'present' | 'absent' | 'leave') => {
    const alreadyMarked = attendance.find(a => 
      a.student_db_id === student.id && new Date(a.timestamp).toDateString() === targetDateStr
    );

    // If already marked with the SAME status, show duplicate warning
    if (alreadyMarked && alreadyMarked.status === status) {
      setLastScanned({ student, isDuplicate: true });
      setCooldown(true);
      setTimeout(() => { setCooldown(false); setLastScanned(null); }, 2000);
      return;
    }

    setCooldown(true);
    const targetDate = new Date(selectedDate);
    const now = new Date();
    targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const record: AttendanceRecord = {
      id: alreadyMarked?.id || uuidv4(),
      student_db_id: student.id,
      grNumber: student.grNumber,
      timestamp: targetDate.getTime(),
      session_name: "Quick Session",
      status: status,
      sync_status: 'pending'
    };
    
    onScan(record);
    setLastScanned({ student, isDuplicate: false });
    setTimeout(() => { setLastScanned(null); setCooldown(false); }, 1500);
  };

  const getStudentStatus = (studentId: string) => {
    const record = attendance.find(a => a.student_db_id === studentId && new Date(a.timestamp).toDateString() === targetDateStr);
    return record?.status;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
      {/* Left Column: QR Scanner */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-app shadow-xl shadow-indigo-100/40 border border-slate-100 sticky top-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Session Date</p>
               <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-lg font-black text-slate-800 outline-none w-full bg-transparent"
                />
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-[2.5rem] shadow-inner bg-black aspect-square">
            <div id="reader" className={`w-full h-full ${scanning ? 'scan-anim' : ''}`}></div>
            
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-slate-800/50 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 border border-white/20">
                  <Camera size={32} className="text-white" />
                </div>
                <h4 className="text-white text-xl font-black uppercase tracking-widest">Scanner Standby</h4>
                <p className="text-slate-400 text-sm mt-2">Point camera at ID card QR codes.</p>
              </div>
            )}

            {cooldown && (
              <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl animate-in zoom-in duration-300 ${lastScanned?.isDuplicate ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                 <div className="bg-white rounded-full p-8 shadow-2xl">
                    {lastScanned?.isDuplicate ? <XCircle size={64} className="text-rose-600" /> : <UserCheck size={64} className="text-emerald-600" />}
                 </div>
                 <p className="mt-6 font-black text-2xl text-white uppercase tracking-tighter drop-shadow-lg">
                   {lastScanned?.isDuplicate ? 'Conflict' : 'Captured'}
                 </p>
              </div>
            )}
          </div>

          {error && <div className="mt-4 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl text-center border border-rose-100">{error}</div>}

          <button 
            onClick={scanning ? stopCamera : startCamera} 
            className={`w-full mt-6 py-5 rounded-2xl font-black text-lg tracking-widest transition-all active:scale-95 shadow-2xl ${
              scanning ? 'bg-rose-50 text-rose-600' : 'bg-indigo-600 text-white shadow-indigo-200'
            }`}
          >
            {scanning ? 'STOP SCAN' : 'START CAMERA'}
          </button>
          
          {lastScanned && !lastScanned.isDuplicate && (
            <div className="mt-6 p-4 bg-indigo-900 text-white rounded-3xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                {lastScanned.student.photo ? <img src={lastScanned.student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black">?</div>}
              </div>
              <div className="flex-1 truncate">
                <h4 className="font-black truncate uppercase text-sm">{lastScanned.student.name}</h4>
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Marked Present</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Manual Student List */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-app shadow-sm border border-slate-100 flex flex-col h-[700px]">
          <div className="p-6 border-b border-slate-50">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4">Manual Entry List</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Student..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
            {filteredStudents.map(student => {
              const currentStatus = getStudentStatus(student.id);
              return (
                <div key={student.id} className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-3xl border border-transparent hover:border-slate-100 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
                    {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle2 size={20}/></div>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{student.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold">GR: {student.grNumber}</p>
                  </div>

                  {/* P/A/L Chips */}
                  <div className="flex gap-1.5 shrink-0">
                    {[
                      { id: 'present', label: 'P', activeClass: 'bg-emerald-600 text-white shadow-emerald-200', inactiveClass: 'bg-emerald-50 text-emerald-600' },
                      { id: 'absent', label: 'A', activeClass: 'bg-rose-600 text-white shadow-rose-200', inactiveClass: 'bg-rose-50 text-rose-600' },
                      { id: 'leave', label: 'L', activeClass: 'bg-amber-600 text-white shadow-amber-200', inactiveClass: 'bg-amber-50 text-amber-600' }
                    ].map(status => (
                      <button
                        key={status.id}
                        onClick={() => processAttendance(student, status.id as any)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all active:scale-90 ${
                          currentStatus === status.id ? status.activeClass + ' shadow-lg scale-105' : status.inactiveClass
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                    
                    <button 
                      onClick={onNavigateToStudents}
                      className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all ml-2"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredStudents.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic font-bold">No students found matching your search.</div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredStudents.length} of {students.length} Students</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
