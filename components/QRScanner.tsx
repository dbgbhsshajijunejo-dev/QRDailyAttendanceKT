
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, AttendanceRecord } from '../types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const activeDateDisplay = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const playBeep = (type: 'success' | 'error' = 'success') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(type === 'success' ? 880 : 220, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (type === 'success' ? 0.1 : 0.3));
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + (type === 'success' ? 0.15 : 0.35));
    } catch (e) {}
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode("reader");
      }
      
      const qrConfig = { fps: 15, qrbox: { width: 250, height: 250 } };
      
      await qrScannerRef.current.start(
        { facingMode: "environment" },
        qrConfig,
        (decodedText) => {
          if (!cooldown) {
            handleDecodedText(decodedText);
          }
        },
        () => {} // silent error for frames without QR
      );
      setScanning(true);
    } catch (err: any) {
      setError(`Camera access failed: ${err}`);
      console.error(err);
    }
  };

  const stopCamera = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Stop failed", err);
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
    
    const now = new Date();
    const targetDate = new Date(selectedDate);
    targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const record: AttendanceRecord = {
      id: uuidv4(),
      student_db_id: student.id,
      grNumber: student.grNumber,
      timestamp: targetDate.getTime(),
      session_name: "Attendance - " + targetDate.toLocaleDateString(),
      status: status,
      sync_status: 'pending'
    };
    
    onScan(record);
    setLastScanned({ student, isDuplicate: false });
    setTimeout(() => { setLastScanned(null); setCooldown(false); }, 1500);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Date Control */}
      <div className="bg-indigo-900 text-white p-5 rounded-3xl shadow-xl space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-center">Attendance Log Date</p>
        <div className="flex flex-col items-center">
           <input 
             type="date" 
             value={selectedDate}
             onChange={(e) => setSelectedDate(e.target.value)}
             className="bg-indigo-800 text-white border-none rounded-xl px-4 py-3 text-lg font-black focus:ring-2 focus:ring-white/30 outline-none w-full text-center cursor-pointer"
           />
           <p className="text-[10px] font-bold text-indigo-300 mt-2 uppercase tracking-widest">{activeDateDisplay}</p>
        </div>
      </div>

      {/* Scanner Box */}
      <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-100 text-center space-y-4">
        <div 
          id="reader" 
          className={`aspect-square bg-slate-900 rounded-[2rem] overflow-hidden border-4 border-slate-100 relative ${!scanning ? 'flex items-center justify-center' : ''}`}
        >
          {!scanning && (
            <div className="text-slate-500 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-2xl">
                <span className="text-4xl">📷</span>
              </div>
              <p className="font-black text-slate-400 tracking-widest uppercase text-sm">Scanner Ready</p>
            </div>
          )}
          {cooldown && (
            <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200 ${lastScanned?.isDuplicate ? 'bg-red-500/40' : 'bg-emerald-500/40'}`}>
               <div className="bg-white rounded-full p-8 shadow-2xl scale-110">
                  <span className={`${lastScanned?.isDuplicate ? 'text-red-600' : 'text-emerald-600'} text-6xl font-black`}>
                    {lastScanned?.isDuplicate ? '✕' : '✓'}
                  </span>
               </div>
            </div>
          )}
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 uppercase tracking-wide">{error}</div>}

        <button 
          onClick={scanning ? stopCamera : startCamera} 
          className={`w-full py-5 rounded-[1.5rem] font-black text-xl shadow-xl transition-all active:scale-95 ${scanning ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {scanning ? 'STOP CAMERA' : 'OPEN QR SCANNER'}
        </button>

        {lastScanned && (
          <div className={`p-6 rounded-[2rem] flex items-center gap-5 text-left animate-in slide-in-from-bottom-4 duration-300 shadow-2xl border-4 ${lastScanned.isDuplicate ? 'bg-red-950 text-white border-red-800' : 'bg-slate-900 text-white border-slate-800'}`}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 shadow-lg border border-white/10">
              {lastScanned.student.photo ? <img src={lastScanned.student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase">NO PIC</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${lastScanned.isDuplicate ? 'text-red-400' : 'text-emerald-400'} font-black text-[10px] uppercase tracking-[0.2em] mb-1`}>
                {lastScanned.isDuplicate ? 'ALREADY MARKED' : 'PRESENT MARKED'}
              </p>
              <p className="font-black text-xl truncate leading-tight">{lastScanned.student.name}</p>
              <p className="text-[10px] opacity-60 font-medium">GR NO: {lastScanned.student.grNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Mark List */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
            <span>📝</span> Student Register
          </h3>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{students.length} Students</span>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {students.map(student => {
            const dayStr = new Date(selectedDate).toDateString();
            const record = attendance.find(a => 
              a.student_db_id === student.id && new Date(a.timestamp).toDateString() === dayStr
            );
            const isMarked = !!record;

            return (
              <div 
                key={student.id} 
                className={`p-4 rounded-3xl border-2 flex items-center gap-4 transition-all ${isMarked ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-100 hover:border-indigo-100 shadow-sm'}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex-shrink-0 relative shadow-sm">
                  {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-300">PIC</div>}
                  {isMarked && (
                    <div className="absolute inset-0 bg-indigo-900/10 flex items-center justify-center">
                      <span className={`text-xl font-black ${record.status === 'present' ? 'text-emerald-600' : record.status === 'absent' ? 'text-red-600' : 'text-blue-600'}`}>
                        {record.status[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black truncate ${isMarked ? 'text-slate-400' : 'text-slate-800'}`}>{student.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">GR: {student.grNumber}</p>
                </div>
                {!isMarked ? (
                  <div className="flex gap-1">
                    <button onClick={() => processAttendance(student, 'present')} className="w-9 h-9 rounded-xl text-[10px] font-black border-2 border-emerald-100 bg-emerald-50 text-emerald-700 active:scale-90">P</button>
                    <button onClick={() => processAttendance(student, 'absent')} className="w-9 h-9 rounded-xl text-[10px] font-black border-2 border-red-100 bg-red-50 text-red-700 active:scale-90">A</button>
                    <button onClick={() => processAttendance(student, 'leave')} className="w-9 h-9 rounded-xl text-[10px] font-black border-2 border-blue-100 bg-blue-50 text-blue-700 active:scale-90">L</button>
                  </div>
                ) : (
                  <div className="text-[10px] font-black uppercase text-slate-400 pr-2">Marked</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="text-center text-slate-300 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">EduSync Offline Scanner • Active</p>
      </div>
    </div>
  );
};

export default QRScanner;
