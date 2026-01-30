
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

  const getStatus = (sid: string, day: number) => {
    const a = attendance.find(r => {
      const d = new Date(r.timestamp);
      return r.student_db_id === sid && d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
    });
    return a ? (a.status === 'present' ? 'P' : a.status === 'absent' ? 'A' : 'L') : '';
  };

  const getSum = (sid: string) => {
    const rs = attendance.filter(r => {
      const d = new Date(r.timestamp);
      return r.student_db_id === sid && d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    return { P: rs.filter(r => r.status === 'present').length, A: rs.filter(r => r.status === 'absent').length, L: rs.filter(r => r.status === 'leave').length };
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-auto p-4 md:p-8 print:p-0">
      <div className="max-w-[1200px] mx-auto space-y-6 print:space-y-0">
        <div className="flex justify-between items-center print:hidden border-b pb-4">
          <h1 className="text-2xl font-black text-indigo-900">Attendance Register</h1>
          <div className="flex gap-2">
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border rounded-xl px-3 py-1 font-bold" />
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Close</button>
            <button onClick={() => window.print()} className="px-6 py-2 bg-indigo-900 text-white rounded-xl font-black shadow-lg">📥 Download PDF</button>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-900 p-6 print:border-none print:p-0">
          <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
            <h2 className="text-3xl font-black uppercase text-slate-900">{schoolName}</h2>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] mt-2">Monthly Register: {monthName} {year}</h3>
          </div>

          <table className="w-full border-collapse border-2 border-slate-900 text-[8px] md:text-[9px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-900 p-1 w-6">#</th>
                <th className="border border-slate-900 p-1 text-left min-w-[120px]">STUDENT NAME</th>
                {dateArray.map(d => <th key={d} className="border border-slate-900 p-0 w-6 text-center">{d}</th>)}
                <th className="border-l-2 border-slate-900 p-1 bg-emerald-50">P</th>
                <th className="border border-slate-900 p-1 bg-red-50">A</th>
                <th className="border border-slate-900 p-1 bg-blue-50">L</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const sum = getSum(s.id);
                return (
                  <tr key={s.id}>
                    <td className="border border-slate-900 p-1 text-center font-bold">{i+1}</td>
                    <td className="border border-slate-900 p-1 font-black uppercase whitespace-nowrap">{s.name}</td>
                    {dateArray.map(d => {
                      const st = getStatus(s.id, d);
                      return <td key={d} className={`border border-slate-900 p-0 text-center font-black ${st==='A'?'text-red-600':st==='L'?'text-blue-600':''}`}>{st}</td>
                    })}
                    <td className="border-l-2 border-slate-900 p-1 text-center font-bold">{sum.P}</td>
                    <td className="border border-slate-900 p-1 text-center font-bold">{sum.A}</td>
                    <td className="border border-slate-900 p-1 text-center font-bold">{sum.L}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-16 flex justify-between px-10"><div className="text-center"><div className="w-40 border-b border-slate-900" /><p className="text-[8px] font-black uppercase mt-1">Class Teacher</p></div><div className="text-center"><div className="w-40 border-b border-slate-900" /><p className="text-[8px] font-black uppercase mt-1">Principal Seal</p></div></div>
        </div>
      </div>
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } body { background: white !important; -webkit-print-color-adjust: exact; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
};

export default MonthlyRegister;
