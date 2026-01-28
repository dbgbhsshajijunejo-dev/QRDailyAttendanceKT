
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
            <h1 className="text-2xl font-bold">Daily wise Attendance Card for Students</h1>
            <p className="text-slate-500">Preview of ID cards with QR codes</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Close</button>
            <button onClick={handlePrint} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200">Print Cards</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {students.map((student) => (
            <div key={student.id} className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white aspect-[3/4] flex flex-col print:border-indigo-900 print:shadow-none shadow-sm break-inside-avoid">
              <div className="bg-indigo-900 text-white p-3 text-center">
                <h3 className="text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight">{schoolName || "SCHOOL NAME"}</h3>
                <p className="text-[10px] opacity-80 font-bold mt-1">STUDENT ID CARD</p>
              </div>
              
              <div className="flex-1 p-4 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-24 h-24 bg-slate-100 border-2 border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.qrCode}`} 
                    alt="QR" 
                    className="w-full h-full p-2"
                  />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-indigo-900 uppercase leading-none">{student.name}</h4>
                  <p className="text-sm font-bold text-slate-600">S/O: {student.fatherName}</p>
                </div>

                <div className="grid grid-cols-2 w-full gap-2 pt-2 border-t border-slate-100">
                  <div className="text-left">
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Class</p>
                    <p className="text-xs font-bold text-slate-800">{student.className}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-400 font-bold uppercase">GR No.</p>
                    <p className="text-xs font-bold text-slate-800">{student.grNumber}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                <p className="text-[8px] font-bold text-slate-400">DAILY WISE ATTENDANCE CARD</p>
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
