
import React from 'react';
import { Student } from '../types';

interface IDCardGeneratorProps {
  students: Student[];
  schoolName: string;
  onClose: () => void;
}

const IDCardGenerator: React.FC<IDCardGeneratorProps> = ({ students, schoolName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto p-8 print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:max-w-none">
        <div className="flex justify-between items-center print:hidden border-b pb-4">
          <div><h1 className="text-2xl font-bold text-indigo-900">Student ID Cards</h1><p className="text-slate-500 text-sm">Enhanced QR sizes for instant recognition.</p></div>
          <div className="flex gap-3"><button onClick={onClose} className="px-6 py-2 bg-slate-100 rounded-xl font-bold">Close</button><button onClick={() => window.print()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Print All Cards</button></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
          {students.map((s) => (
            <div key={s.id} className="border-[6px] border-indigo-900 rounded-[3rem] overflow-hidden bg-white aspect-[3/4.8] flex flex-col shadow-2xl print:shadow-none break-inside-avoid">
              <div className="bg-indigo-900 text-white p-6 text-center">
                <h3 className="text-sm font-black uppercase tracking-tight line-clamp-1">{schoolName}</h3>
                <p className="text-[9px] opacity-80 font-black tracking-[0.4em] mt-1 uppercase">Student Identity</p>
              </div>
              <div className="flex-1 p-8 flex flex-col items-center justify-between text-center">
                <div className="flex items-center justify-center gap-6 w-full">
                  <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-50">
                    {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">NO PHOTO</div>}
                  </div>
                  <div className="w-44 h-44 bg-white border-2 border-indigo-50 rounded-[2rem] flex items-center justify-center shadow-inner p-2">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${s.grNumber}`} className="w-full h-full" alt="QR" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-3xl font-black text-indigo-950 uppercase leading-none tracking-tighter">{s.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">S/O: {s.fatherName}</p>
                </div>
                <div className="grid grid-cols-2 w-full gap-4 pt-6 border-t-2 border-slate-50">
                  <div className="text-left"><p className="text-[8px] text-indigo-400 font-black uppercase">Class</p><p className="text-sm font-black text-indigo-900 uppercase">{s.className}</p></div>
                  <div className="text-right"><p className="text-[8px] text-indigo-400 font-black uppercase">GR Number</p><p className="text-sm font-black text-indigo-900">{s.grNumber}</p></div>
                </div>
              </div>
              <div className="bg-indigo-50 p-4 text-center border-t border-indigo-100">
                <p className="text-[8px] font-black text-indigo-900 tracking-[0.5em] uppercase">Scan for Daily Attendance</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media print { body { background: white !important; } .print\\:hidden { display: none !important; } @page { margin: 10mm; size: A4; } .break-inside-avoid { break-inside: avoid; } }`}</style>
    </div>
  );
};

export default IDCardGenerator;
