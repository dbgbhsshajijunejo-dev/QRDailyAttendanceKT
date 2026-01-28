
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
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto p-4 md:p-8 print:p-0">
      <div className="max-w-[100%] mx-auto space-y-6 print:space-y-4">
        <div className="flex flex-wrap justify-between items-center print:hidden border-b pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Monthly Attendance Register</h1>
            <p className="text-slate-500 text-sm">Official monthly record grid view.</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">Close</button>
            <button onClick={handlePrint} className="px-6 py-2 bg-indigo-900 text-white rounded-lg font-bold shadow-lg hover:bg-black transition-colors">Print Register</button>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-800 p-4 md:p-8 print:border-none print:p-0">
          <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900">{schoolName}</h2>
            <h3 className="text-lg font-bold uppercase mt-1 tracking-wider">Attendance Register</h3>
            <div className="flex justify-center gap-8 mt-4 text-sm font-bold uppercase">
              <span>Month: {monthName}</span>
              <span>Year: {year}</span>
            </div>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="min-w-full border-collapse border-2 border-slate-800 text-[10px] md:text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-800 p-1 text-left w-8">#</th>
                  <th className="border border-slate-800 p-1 text-left min-w-[60px]">GR#</th>
                  <th className="border border-slate-800 p-1 text-left min-w-[120px]">Student Name</th>
                  {dateArray.map(day => (
                    <th key={day} className="border border-slate-800 p-0 w-6 text-center">{day}</th>
                  ))}
                  <th className="border-l-2 border-slate-800 border-y border-slate-800 p-1 bg-emerald-50 w-8">P</th>
                  <th className="border border-slate-800 p-1 bg-red-50 w-8">A</th>
                  <th className="border border-slate-800 p-1 bg-blue-50 w-8">L</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const summary = getSummary(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="border border-slate-800 p-1 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-800 p-1 font-medium">{student.grNumber}</td>
                      <td className="border border-slate-800 p-1 font-bold truncate">{student.name}</td>
                      {dateArray.map(day => {
                        const status = getStatusForDay(student.id, day);
                        return (
                          <td 
                            key={day} 
                            className={`border border-slate-800 p-0 text-center font-black ${
                              status === 'A' ? 'text-red-600' : status === 'L' ? 'text-blue-600' : 'text-emerald-600'
                            }`}
                          >
                            {status}
                          </td>
                        );
                      })}
                      <td className="border-l-2 border-slate-800 border-y border-slate-800 p-1 text-center font-black bg-emerald-50/30">{summary.P}</td>
                      <td className="border border-slate-800 p-1 text-center font-black bg-red-50/30">{summary.A}</td>
                      <td className="border border-slate-800 p-1 text-center font-black bg-blue-50/30">{summary.L}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-12 flex justify-between px-4 pb-4 print:mt-16">
            <div className="text-center">
              <div className="w-40 border-b-2 border-slate-800 mb-1"></div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Class Teacher Signature</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-slate-800 mb-1"></div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Principal Seal/Signature</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print\\:overflow-visible { overflow: visible !important; }
          .print\\:border-none { border: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid black !important; padding: 2px !important; }
        }
      `}</style>
    </div>
  );
};

export default MonthlyRegister;
