
import React from 'react';
import { Student } from '../types';

interface IDCardGeneratorProps {
  students: Student[];
  schoolName: string;
  onClose: () => void;
}

const IDCardGenerator: React.FC<IDCardGeneratorProps> = ({ students, schoolName, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto p-8 print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:max-w-none">
        <div className="flex justify-between items-center print:hidden border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student Attendance Cards</h1>
            <p className="text-slate-500">Enhanced layout with Photos and Large QR codes.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">Close</button>
            <button onClick={handlePrint} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">Print Cards</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {students.map((student) => (
            <div key={student.id} className="border-4 border-indigo-900 rounded-[2rem] overflow-hidden bg-white aspect-[3/4.5] flex flex-col print:shadow-none shadow-xl break-inside-avoid relative">
              <div className="bg-indigo-900 text-white p-4 text-center">
                <h3 className="text-sm font-black uppercase tracking-tight line-clamp-2 leading-tight">{schoolName || "SCHOOL NAME"}</h3>
                <div className="h-0.5 bg-indigo-400/30 w-1/2 mx-auto my-2" />
                <p className="text-[10px] opacity-90 font-black tracking-[0.2em]">OFFICIAL IDENTITY</p>
              </div>
              
              <div className="flex-1 p-6 flex flex-col items-center justify-between text-center">
                {/* Photo and QR Side by Side or Optimized Stack */}
                <div className="w-full flex justify-center gap-4 items-center">
                   <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex-shrink-0">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase p-2">No Photo</div>
                      )}
                   </div>
                   <div className="w-32 h-32 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner p-1">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${student.qrCode}`} 
                        alt="QR" 
                        className="w-full h-full p-2"
                      />
                   </div>
                </div>
                
                <div className="space-y-1 w-full">
                  <h4 className="text-2xl font-black text-indigo-950 uppercase leading-none tracking-tight">{student.name}</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">S/O: {student.fatherName}</p>
                </div>

                <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t-2 border-slate-100">
                  <div className="text-left bg-slate-50 p-2 rounded-xl">
                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">Class</p>
                    <p className="text-sm font-black text-indigo-900">{student.className}</p>
                  </div>
                  <div className="text-right bg-slate-50 p-2 rounded-xl">
                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">GR Number</p>
                    <p className="text-sm font-black text-indigo-900">{student.grNumber}</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-3 text-center border-t border-indigo-100">
                <p className="text-[9px] font-black text-indigo-900 tracking-[0.3em]">DAILY ATTENDANCE PROTOCOL</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1cm; size: A4; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default IDCardGenerator;
