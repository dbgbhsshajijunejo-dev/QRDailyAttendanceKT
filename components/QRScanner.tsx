
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Student, AttendanceRecord } from '../types';

interface QRScannerProps {
  students: Student[];
  onScan: (record: AttendanceRecord) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ students, onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<Student | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        setError(null);
      }
    } catch (err) {
      setError("Unable to access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setScanning(false);
    }
  };

  const simulateScan = () => {
    if (students.length === 0) {
      setError("Please add students first to simulate scanning.");
      return;
    }
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const record: AttendanceRecord = {
      id: uuidv4(),
      student_db_id: randomStudent.id,
      grNumber: randomStudent.grNumber,
      timestamp: Date.now(),
      session_name: "Daily Session " + new Date().toLocaleDateString(),
      status: 'present',
      sync_status: 'pending'
    };
    onScan(record);
    setLastScanned(randomStudent);
    setTimeout(() => setLastScanned(null), 3000);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center space-y-4">
        <h2 className="text-xl font-bold">QR Attendance Scanner</h2>
        
        <div className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
          {scanning ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-indigo-500 opacity-50 m-12 rounded-lg pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse" />
            </>
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <span className="text-4xl mb-2">📷</span>
              <p className="text-sm">Camera Offline</p>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 justify-center">
          {!scanning ? (
            <button onClick={startCamera} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">Start Camera</button>
          ) : (
            <button onClick={stopCamera} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium">Stop Camera</button>
          )}
          <button onClick={simulateScan} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium">Simulate Scan</button>
        </div>

        {lastScanned && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg animate-bounce">
            <p className="text-emerald-800 font-bold">Success!</p>
            <p className="text-emerald-600 text-sm">{lastScanned.name} marked present.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
