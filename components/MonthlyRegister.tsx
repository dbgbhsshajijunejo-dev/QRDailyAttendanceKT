
import React, { useState } from 'react';
import { Student, AttendanceRecord } from '../types';

interface MonthlyRegisterProps {
  students: Student[];
  attendance: AttendanceRecord[];
  schoolName: string;
  onClose: () => void;
}

const MonthlyRegister: React.FC<MonthlyRegisterProps> = ({ students, attendance, schoolName, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dateArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const handlePrint = () => {
    window.print();
  };

  const getStatusForDay = (studentId: string, day: number) => {
    const record = attendance.find(a => {
      const d = new Date(a.timestamp);
      return (
        a.student_db_id === studentId &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month &&
        d.getDate() === day
      );
    });

    if (!record) return '';
    if (record.status === 'present') return 'P';
    if (record.status === 'absent') return 'A';
    if (record.status === 'leave') return 'L';
    return '';
  };

  const getSummary = (studentId: string) => {
    const records = attendance.filter(a => {
      const d = new Date(a.timestamp);
      return (
        a.student_db_id === studentId &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    });

    return {
      P: records.filter(r => r.status === 'present').length,
      A: records.filter(r => r.status === 'absent').length,
      L: records.filter(r => r.status === 'leave').length,
    };
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto p-4 md:p-8 print:p-0 animate-in fade-in duration-300">
      <div className="max-w-[100%] mx-auto space-y-6 print:space-y-4">
        <div className="flex flex-wrap justify-between items-center print:hidden border-b pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Attendance Register</h1>
            <p className="text-slate-500 text-sm font-medium">Monthly official record grid.</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none"
            />
            <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Close</button>
            <button onClick={handlePrint} className="px-8 py-2 bg-indigo-900 text-white rounded-xl font-black shadow-xl hover:bg-black transition-all active:scale-95">📥 Download PDF</button>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-900 p-8 print:border-none print:p-0">
          <div className="text-center mb-10 border-b-4 border-slate-900 pb-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">{schoolName}</h2>
            <h3 className="text-xl font-black uppercase mt-4 tracking-[0.2em] bg-slate-900 text-white inline-block px-8 py-1.5 rounded-full">Monthly Attendance Register</h3>
            <div className="flex justify-center gap-12 mt-6 text-lg font-black uppercase text-indigo-900">
              <span>Month: {monthName}</span>
              <span>Year: {year}</span>
            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="min-w-full border-collapse border-4 border-slate-900 text-[9px] md:text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border-2 border-slate-900 p-2 text-left w-10">#</th>
                  <th className="border-2 border-slate-900 p-2 text-left min-w-[150px]">NAME OF STUDENT</th>
                  {dateArray.map(day => (
                    <th key={day} className="border-2 border-slate-900 p-0 w-8 text-center font-black">{day}</th>
                  ))}
                  <th className="border-l-4 border-slate-900 border-y-2 p-2 bg-emerald-100 w-10 text-emerald-900 font-black">P</th>
                  <th className="border-2 border-slate-900 p-2 bg-red-100 w-10 text-red-900 font-black">A</th>
                  <th className="border-2 border-slate-900 p-2 bg-blue-100 w-10 text-blue-900 font-black">L</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const summary = getSummary(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/30">
                      <td className="border-2 border-slate-900 p-2 text-center font-black">{idx + 1}</td>
                      <td className="border-2 border-slate-900 p-2 font-black uppercase">{student.name}</td>
                      {dateArray.map(day => {
                        const status = getStatusForDay(student.id, day);
                        return (
                          <td 
                            key={day} 
                            className={`border-2 border-slate-900 p-0 text-center font-black ${
                              status === 'A' ? 'text-red-600 bg-red-50' : status === 'L' ? 'text-blue-600 bg-blue-50' : 'text-emerald-600'
                            }`}
                          >
                            {status}
                          </td>
                        );
                      })}
                      <td className="border-l-4 border-slate-900 border-y-2 p-2 text-center font-black bg-emerald-50">{summary.P}</td>
                      <td className="border-2 border-slate-900 p-2 text-center font-black bg-red-50">{summary.A}</td>
                      <td className="border-2 border-slate-900 p-2 text-center font-black bg-blue-50">{summary.L}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-20 flex justify-between px-10 pb-10 print:mt-24">
            <div className="text-center">
              <div className="w-56 h-0.5 bg-slate-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Class Teacher Signature</p>
            </div>
            <div className="text-center">
              <div className="w-56 h-0.5 bg-slate-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Headmaster / Principal Seal</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print\\:overflow-visible { overflow: visible !important; }
          .print\\:border-none { border: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 2px solid black !important; }
          th, td { border: 1px solid black !important; padding: 2px !important; }
        }
      `}</style>
    </div>
  );
};

export default MonthlyRegister;
