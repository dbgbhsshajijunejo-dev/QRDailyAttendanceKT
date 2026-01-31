
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, AttendanceRecord } from '../types';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onScan: (record: AttendanceRecord) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ students, attendance, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{student: Student, isDuplicate: boolean} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const activeDateDisplay = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'success' ? 800 : 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode("reader");
      }
      
      await qrScannerRef.current.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!cooldown) {
            handleDecodedText(decodedText);
          }
        },
        () => {} 
      );
      setScanning(true);
    } catch (err: any) {
      setError("Camera Permission Denied or Not Found. Ensure HTTPS is used.");
      console.error(err);
    }
  };

  const stopCamera = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleDecodedText = (text: string) => {
    const student = students.find(s => s.grNumber === text || s.id === text);
    if (student) {
      processAttendance(student, 'present');
    }
  };

  const processAttendance = (student: Student, status: 'present' | 'absent' | 'leave') => {
    const targetDay = new Date(selectedDate).toDateString();
    const alreadyMarked = attendance.some(a => 
      a.student_db_id === student.id && new Date(a.timestamp).toDateString() === targetDay
    );

    if (alreadyMarked) {
      playBeep('error');
      setLastScanned({ student, isDuplicate: true });
      setCooldown(true);
      setTimeout(() => { setCooldown(false); setLastScanned(null); }, 2000);
      return;
    }

    playBeep('success');
    setCooldown(true);
    
    const targetDate = new Date(selectedDate);
    const now = new Date();
    targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const record: AttendanceRecord = {
      id: uuidv4(),
      student_db_id: student.id,
      grNumber: student.grNumber,
      timestamp: targetDate.getTime(),
      session_name: "Session " + selectedDate,
      status: status,
      sync_status: 'pending'
    };
    
    onScan(record);
    setLastScanned({ student, isDuplicate: false });
    setTimeout(() => { setLastScanned(null); setCooldown(false); }, 1500);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      <div className="bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Mark Attendance For</p>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-indigo-800 text-white border-none rounded-2xl px-4 py-2 text-xl font-black outline-none w-full text-center"
        />
        <p className="text-[10px] font-bold text-indigo-300 mt-2 uppercase">{activeDateDisplay}</p>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div id="reader" className={`aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-50 relative ${!scanning ? 'flex items-center justify-center' : ''}`}>
          {!scanning && (
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <span className="text-4xl">📸</span>
              </div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Scanner Ready</p>
            </div>
          )}
          {cooldown && (
            <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md animate-in fade-in ${lastScanned?.isDuplicate ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
               <div className="bg-white rounded-full p-8 shadow-2xl scale-125">
                  <span className={`${lastScanned?.isDuplicate ? 'text-red-600' : 'text-emerald-600'} text-6xl font-black`}>
                    {lastScanned?.isDuplicate ? '✕' : '✓'}
                  </span>
               </div>
            </div>
          )}
        </div>

        {error && <div className="mt-4 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center">{error}</div>}

        <button 
          onClick={scanning ? stopCamera : startCamera} 
          className={`w-full mt-4 py-5 rounded-[1.5rem] font-black text-xl shadow-xl transition-all active:scale-95 ${scanning ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white'}`}
        >
          {scanning ? 'STOP CAMERA' : 'OPEN QR SCANNER'}
        </button>

        {lastScanned && (
          <div className={`mt-4 p-6 rounded-[2rem] flex items-center gap-5 text-left animate-in slide-in-from-bottom-4 shadow-2xl ${lastScanned.isDuplicate ? 'bg-red-950 text-white' : 'bg-slate-900 text-white'}`}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 border-2 border-white/10">
              {lastScanned.student.photo ? <img src={lastScanned.student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">PIC</div>}
            </div>
            <div>
              <p className={`${lastScanned.isDuplicate ? 'text-red-400' : 'text-emerald-400'} font-black text-[10px] uppercase tracking-widest`}>
                {lastScanned.isDuplicate ? 'ALREADY MARKED' : 'PRESENT RECORDED'}
              </p>
              <p className="font-black text-xl leading-tight">{lastScanned.student.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest border-b pb-4">Manual Entry List</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {students.map(student => {
            const isMarked = attendance.some(a => a.student_db_id === student.id && new Date(a.timestamp).toDateString() === new Date(selectedDate).toDateString());
            return (
              <div key={student.id} className={`p-4 rounded-3xl border-2 flex items-center justify-between transition-all ${isMarked ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-50 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden font-black text-[10px] flex items-center justify-center">
                    {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : student.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate w-24">{student.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">GR: {student.grNumber}</p>
                  </div>
                </div>
                {!isMarked ? (
                  <div className="flex gap-1">
                    {['present', 'absent', 'leave'].map(s => (
                      <button key={s} onClick={() => processAttendance(student, s as any)} className={`w-8 h-8 rounded-lg text-[10px] font-black border-2 ${s==='present'?'border-emerald-50 text-emerald-600 bg-emerald-50':s==='absent'?'border-red-50 text-red-600 bg-red-50':'border-blue-50 text-blue-600 bg-blue-50'}`}>
                        {s[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Marked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
