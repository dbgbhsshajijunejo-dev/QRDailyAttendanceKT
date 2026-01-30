
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, AttendanceRecord } from '../types';
import jsQR from 'jsqr';

interface QRScannerProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onScan: (record: AttendanceRecord) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ students, attendance, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{student: Student, isDuplicate: boolean} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const getComparisonDateStr = (dateStr: string) => new Date(dateStr).toDateString();
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
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }
  };

  const startCamera = async () => {
    try {
      // Clear previous error
      setError(null);
      
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Important attributes for mobile visibility and autoplay
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("muted", "true");
        
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Video play failed:", e);
            setError("Auto-play blocked. Please tap start again.");
          });
        };

        setScanning(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError') {
        setError("Camera permission denied. Please allow camera access in browser settings.");
      } else if (err.name === 'NotFoundError') {
        setError("No camera found on this device.");
      } else {
        setError(`Camera error: ${err.message || 'Unable to start video'}`);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setScanning(false);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    const tick = () => {
      if (scanning && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && !cooldown) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx && video.videoWidth > 0) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              const student = students.find(s => s.grNumber === code.data || s.id === code.data);
              if (student) {
                processAttendance(student, 'present');
              }
            }
          }
        }
      }
      if (scanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    
    if (scanning) {
      animationFrameId = requestAnimationFrame(tick);
    }
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [scanning, students, cooldown, selectedDate, attendance]);

  const processAttendance = (student: Student, status: 'present' | 'absent' | 'leave') => {
    const comparisonDate = getComparisonDateStr(selectedDate);
    
    const alreadyMarked = attendance.some(a => 
      a.student_db_id === student.id && 
      new Date(a.timestamp).toDateString() === comparisonDate
    );

    if (alreadyMarked) {
      playBeep('error');
      setLastScanned({ student, isDuplicate: true });
      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
        setLastScanned(null);
      }, 2000);
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
    
    setTimeout(() => {
      setLastScanned(null);
      setCooldown(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 text-center">Session Attendance Date</p>
        <div className="flex flex-col items-center gap-2">
           <input 
             type="date" 
             value={selectedDate}
             onChange={(e) => setSelectedDate(e.target.value)}
             className="bg-indigo-800 text-white border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-white/50 outline-none w-full text-center"
           />
           <p className="text-[10px] font-medium opacity-60 italic">{activeDateDisplay}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center space-y-4 overflow-hidden">
        <div className="relative aspect-square bg-slate-950 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-slate-100 shadow-inner">
          {scanning ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scan Overlay UI */}
              <div className="absolute inset-0 z-10 border-[40px] border-black/40 pointer-events-none" />
              <div className="absolute inset-[60px] z-20 border-2 border-white/20 rounded-3xl pointer-events-none">
                 <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                 <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                 <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                 <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
              </div>
              
              {!cooldown && (
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,1)] z-30 animate-pulse" />
              )}
              
              {cooldown && (
                <div className={`absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200 ${lastScanned?.isDuplicate ? 'bg-red-500/40' : 'bg-emerald-500/40'}`}>
                   <div className="bg-white rounded-full p-6 shadow-2xl scale-110">
                      <span className={`${lastScanned?.isDuplicate ? 'text-red-600' : 'text-emerald-600'} text-5xl font-black`}>
                        {lastScanned?.isDuplicate ? '✕' : '✓'}
                      </span>
                   </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
                <span className="text-5xl">📷</span>
              </div>
              <p className="font-black text-slate-300 text-lg tracking-widest uppercase">Scanner Offline</p>
              <p className="text-[10px] text-slate-500 mt-2">TAP BUTTON BELOW TO ACTIVATE</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl border border-red-100 uppercase tracking-wide animate-bounce">
            {error}
          </div>
        )}

        <button 
          onClick={scanning ? stopCamera : startCamera} 
          className={`w-full py-5 rounded-[1.25rem] font-black text-lg shadow-xl transition-all active:scale-95 ${scanning ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'}`}
        >
          {scanning ? 'STOP SCANNER' : 'START QR SCANNER'}
        </button>

        {lastScanned && (
          <div className={`p-5 rounded-[1.5rem] flex items-center gap-5 text-left animate-in slide-in-from-bottom-4 duration-300 shadow-2xl ${lastScanned.isDuplicate ? 'bg-red-900 text-white' : 'bg-slate-900 text-white'}`}>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/50 bg-slate-800 flex-shrink-0 shadow-lg">
              {lastScanned.student.photo ? <img src={lastScanned.student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold">NO PIC</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`${lastScanned.isDuplicate ? 'text-red-300' : 'text-emerald-400'} font-black text-xs uppercase tracking-widest mb-1`}>
                {lastScanned.isDuplicate ? 'ALREADY MARKED' : 'PRESENT MARKED'}
              </p>
              <p className="font-black text-lg truncate leading-tight">{lastScanned.student.name}</p>
              <p className="text-[10px] opacity-60 font-medium uppercase">GR: {lastScanned.student.grNumber}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.15em]">
            <span>📝</span> Student Register
          </h3>
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{students.length} Total</span>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3 opacity-20">👥</div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No students registered</p>
            </div>
          ) : (
            students.map(student => {
              const compDate = getComparisonDateStr(selectedDate);
              const record = attendance.find(a => 
                a.student_db_id === student.id && 
                new Date(a.timestamp).toDateString() === compDate
              );
              const isMarked = !!record;

              return (
                <div 
                  key={student.id} 
                  className={`p-4 rounded-3xl border flex items-center gap-4 transition-all ${isMarked ? 'bg-slate-100 border-slate-200 shadow-inner opacity-75' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-md'}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex-shrink-0 shadow-sm border border-slate-100 relative">
                    {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-bold">PIC</div>}
                    {isMarked && (
                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                        <span className={`text-xl font-black ${record.status === 'present' ? 'text-emerald-600' : record.status === 'absent' ? 'text-red-600' : 'text-blue-600'}`}>
                          {record.status[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${isMarked ? 'text-slate-400' : 'text-slate-800'}`}>{student.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">GR: {student.grNumber}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      disabled={isMarked}
                      onClick={() => processAttendance(student, 'present')} 
                      className={`w-9 h-9 rounded-xl text-[10px] font-black border transition-all ${isMarked ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-600 hover:text-white active:scale-90'}`}
                    >P</button>
                    <button 
                      disabled={isMarked}
                      onClick={() => processAttendance(student, 'absent')} 
                      className={`w-9 h-9 rounded-xl text-[10px] font-black border transition-all ${isMarked ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-600 hover:text-white active:scale-90'}`}
                    >A</button>
                    <button 
                      disabled={isMarked}
                      onClick={() => processAttendance(student, 'leave')} 
                      className={`w-9 h-9 rounded-xl text-[10px] font-black border transition-all ${isMarked ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-600 hover:text-white active:scale-90'}`}
                    >L</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="text-center px-8 text-slate-400">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
          OFFLINE SECURE PROTOCOL • V3.0
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
