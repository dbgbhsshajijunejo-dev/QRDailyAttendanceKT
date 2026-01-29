
import React, { useState, useRef } from 'react';
import { AttendanceRecord, Student } from '../types';
import MonthlyRegister from './MonthlyRegister';
import html2canvas from 'html2canvas';

interface AttendanceReportProps {
  attendance: AttendanceRecord[];
  students: Student[];
  schoolName: string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ attendance, students, schoolName }) => {
  const [showImageExport, setShowImageExport] = useState(false);
  const [showMonthlyRegister, setShowMonthlyRegister] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const filteredAttendance = attendance.filter(a => {
    const recordDate = new Date(a.timestamp).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });

  const downloadReportCSV = () => {
    const headers = ["GR Number", "Name", "Class", "Date", "Status"];
    const rows = filteredAttendance.map(a => {
      const student = students.find(s => s.id === a.student_db_id);
      return [
        a.grNumber,
        student ? student.name : "Unknown",
        student ? student.className : "Unknown",
        new Date(a.timestamp).toLocaleString(),
        a.status
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(r => r.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = async () => {
    if (!summaryRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `attendance_summary_${selectedDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Failed to generate image.");
    } finally {
      setIsExporting(false);
    }
  };

  const getStats = () => {
    const boys = students.filter(s => s.gender === 'Male');
    const girls = students.filter(s => s.gender === 'Female');
    const countStatus = (genderStudents: Student[], status: string) => {
      return filteredAttendance.filter(a => a.status === status && genderStudents.some(s => s.id === a.student_db_id)).length;
    };

    return {
      boys: { total: boys.length, present: countStatus(boys, 'present'), absent: countStatus(boys, 'absent'), leave: countStatus(boys, 'leave') },
      girls: { total: girls.length, present: countStatus(girls, 'present'), absent: countStatus(girls, 'absent'), leave: countStatus(girls, 'leave') },
      total: { total: students.length, present: filteredAttendance.filter(a => a.status === 'present').length, absent: filteredAttendance.filter(a => a.status === 'absent').length, leave: filteredAttendance.filter(a => a.status === 'leave').length }
    };
  };

  const stats = getStats();
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {showMonthlyRegister && (
        <MonthlyRegister 
          students={students}
          attendance={attendance}
          schoolName={schoolName}
          onClose={() => setShowMonthlyRegister(false)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports Center</h2>
          <p className="text-slate-500 text-sm">Download official registers and summaries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-slate-200 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
          <button 
            onClick={() => setShowMonthlyRegister(true)}
            className="bg-indigo-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-sm"
          >
            <span>📅</span> Monthly Register
          </button>
          <button 
            onClick={() => setShowImageExport(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <span>🖼️</span> WhatsApp Summary
          </button>
          <button onClick={downloadReportCSV} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
            <span>📊</span> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Present', val: stats.total.present, color: 'text-emerald-600' },
          { label: 'Absent', val: stats.total.absent, color: 'text-red-600' },
          { label: 'Leave', val: stats.total.leave, color: 'text-blue-600' },
          { label: 'Selected Date', val: selectedDate, color: 'text-slate-600', isDate: true },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
            <p className={`text-2xl font-black ${item.color} ${item.isDate ? 'text-sm mt-2' : ''}`}>{item.val}</p>
          </div>
        ))}
      </div>

      {showImageExport && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowImageExport(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-2xl font-black">✕</button>
             
             <div ref={summaryRef} className="border-8 border-indigo-900 p-10 space-y-8 bg-white text-center">
                <div className="border-b-4 border-indigo-100 pb-6">
                  <h1 className="text-3xl font-black text-indigo-900 tracking-tighter uppercase leading-none">{schoolName}</h1>
                  <p className="bg-indigo-900 text-white inline-block px-6 py-1.5 text-xs font-black mt-4 tracking-[0.2em] rounded-full uppercase">DAILY ATTENDANCE SUMMARY</p>
                  <p className="text-indigo-700 font-bold mt-4 text-xl">{displayDate}</p>
                </div>

                <table className="w-full border-4 border-indigo-900 border-collapse overflow-hidden rounded-xl">
                   <thead>
                     <tr className="bg-indigo-900 text-white text-xs font-black uppercase tracking-widest">
                       <th className="p-4 border border-indigo-800">STATUS</th>
                       <th className="p-4 border border-indigo-800">BOYS</th>
                       <th className="p-4 border border-indigo-800">GIRLS</th>
                       <th className="p-4 border border-indigo-800">TOTAL</th>
                     </tr>
                   </thead>
                   <tbody className="text-sm font-black">
                     {[
                       { label: 'PRESENT', b: stats.boys.present, g: stats.girls.present, t: stats.total.present, color: 'text-emerald-600', bg: 'bg-emerald-50/30' },
                       { label: 'ABSENT', b: stats.boys.absent, g: stats.girls.absent, t: stats.total.absent, color: 'text-red-600', bg: 'bg-red-50/30' },
                       { label: 'LEAVE', b: stats.boys.leave, g: stats.girls.leave, t: stats.total.leave, color: 'text-blue-600', bg: 'bg-blue-50/30' },
                     ].map((row, i) => (
                       <tr key={i} className={row.bg}>
                         <td className="border-2 border-indigo-900 p-4 text-indigo-900">{row.label}</td>
                         <td className="border-2 border-indigo-900 p-4 font-bold">{row.b}</td>
                         <td className="border-2 border-indigo-900 p-4 font-bold">{row.g}</td>
                         <td className={`border-2 border-indigo-900 p-4 ${row.color}`}>{row.t}</td>
                       </tr>
                     ))}
                     <tr className="bg-indigo-900 text-white">
                       <td className="p-4 border-2 border-indigo-900">STRENGTH</td>
                       <td className="p-4 border-2 border-indigo-900">{stats.boys.total}</td>
                       <td className="p-4 border-2 border-indigo-900">{stats.girls.total}</td>
                       <td className="p-4 border-2 border-indigo-900">{stats.total.total}</td>
                     </tr>
                   </tbody>
                </table>

                <div className="flex justify-between pt-16 px-4">
                   <div className="text-center">
                     <div className="w-40 h-0.5 bg-indigo-900 mx-auto" />
                     <p className="text-[10px] font-black mt-2 text-indigo-900 uppercase tracking-widest">Class Teacher</p>
                   </div>
                   <div className="text-center">
                     <div className="w-40 h-0.5 bg-indigo-900 mx-auto" />
                     <p className="text-[10px] font-black mt-2 text-indigo-900 uppercase tracking-widest">Principal Seal</p>
                   </div>
                </div>
             </div>

             <div className="mt-8 flex justify-center gap-4">
                <button 
                  onClick={handleDownloadImage}
                  disabled={isExporting}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? 'Generating...' : '📥 Download Image'}
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity Logs</p>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredAttendance.length === 0 ? (
              <tr><td className="px-6 py-12 text-center text-slate-400 italic">No records for this date.</td></tr>
            ) : (
              [...filteredAttendance].reverse().map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">{new Date(record.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600">{record.grNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 
                      record.status === 'absent' ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReport;
