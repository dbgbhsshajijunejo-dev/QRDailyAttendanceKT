
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
      return [a.grNumber, student?.name || "Unknown", student?.className || "Unknown", new Date(a.timestamp).toLocaleString(), a.status];
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
    link.click();
  };

  const handleDownloadImage = async () => {
    if (!summaryRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(summaryRef.current, { 
        scale: 3, 
        backgroundColor: '#ffffff', 
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `attendance_summary_${selectedDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) { 
      alert("Image generation failed. Please try again."); 
    } finally { 
      setIsExporting(false); 
    }
  };

  const getStats = () => {
    const countStatus = (gender: string, status: string) => 
      filteredAttendance.filter(a => a.status === status && students.find(s => s.id === a.student_db_id)?.gender === gender).length;
    
    return {
      boys: { present: countStatus('Male', 'present'), absent: countStatus('Male', 'absent'), leave: countStatus('Male', 'leave'), total: students.filter(s => s.gender === 'Male').length },
      girls: { present: countStatus('Female', 'present'), absent: countStatus('Female', 'absent'), leave: countStatus('Female', 'leave'), total: students.filter(s => s.gender === 'Female').length },
      total: { 
        present: filteredAttendance.filter(a => a.status === 'present').length, 
        absent: filteredAttendance.filter(a => a.status === 'absent').length, 
        leave: filteredAttendance.filter(a => a.status === 'leave').length,
        total: students.length 
      }
    };
  };

  const stats = getStats();
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {showMonthlyRegister && <MonthlyRegister students={students} attendance={attendance} schoolName={schoolName} onClose={() => setShowMonthlyRegister(false)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-bold">Reports Center</h2><p className="text-slate-500 text-sm">Download official registers and WhatsApp summaries.</p></div>
        <div className="flex flex-wrap gap-2">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-slate-200 border rounded-lg px-3 py-2 text-sm font-bold outline-none shadow-sm focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => setShowMonthlyRegister(true)} className="bg-indigo-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md">📅 Monthly Register (PDF)</button>
          <button onClick={() => setShowImageExport(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md">🖼️ Summary Image</button>
          <button onClick={downloadReportCSV} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200">📊 CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: 'Present', v: stats.total.present, c: 'text-emerald-600' }, { l: 'Absent', v: stats.total.absent, c: 'text-red-600' }, { l: 'Leave', v: stats.total.leave, c: 'text-blue-600' }, { l: 'Strength', v: stats.total.total, c: 'text-slate-600' }].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p>
            <p className={`text-3xl font-black ${item.c}`}>{item.v}</p>
          </div>
        ))}
      </div>

      {showImageExport && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowImageExport(false)} className="absolute top-4 right-4 text-slate-400 text-2xl font-black hover:text-slate-600 transition-colors">✕</button>
             
             <div ref={summaryRef} className="border-[10px] border-indigo-900 p-10 space-y-8 bg-white text-center">
                <div className="border-b-4 border-indigo-50 pb-6">
                  <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tighter leading-none">{schoolName}</h1>
                  <p className="bg-indigo-900 text-white inline-block px-6 py-2 text-[10px] font-black mt-4 tracking-[0.2em] rounded-full">DAILY ATTENDANCE SUMMARY</p>
                  <p className="text-indigo-700 font-bold mt-4 text-xl">{displayDate}</p>
                </div>

                <table className="w-full border-4 border-indigo-900 border-collapse">
                   <thead><tr className="bg-indigo-900 text-white text-[10px] font-black uppercase">
                     <th className="p-4 border border-indigo-800">STATUS</th>
                     <th className="p-4 border border-indigo-800">BOYS</th>
                     <th className="p-4 border border-indigo-800">GIRLS</th>
                     <th className="p-4 border border-indigo-800">TOTAL</th>
                   </tr></thead>
                   <tbody className="text-sm font-black">
                     {[ { l: 'PRESENT', b: stats.boys.present, g: stats.girls.present, t: stats.total.present, c: 'text-emerald-600' }, { l: 'ABSENT', b: stats.boys.absent, g: stats.girls.absent, t: stats.total.absent, c: 'text-red-600' }, { l: 'LEAVE', b: stats.boys.leave, g: stats.girls.leave, t: stats.total.leave, c: 'text-blue-600' } ].map((row, i) => (
                       <tr key={i} className="border-b-2 border-indigo-900">
                         <td className="p-4 border-r-2 border-indigo-900 text-indigo-900">{row.l}</td>
                         <td className="p-4 border-r-2 border-indigo-900">{row.b}</td>
                         <td className="p-4 border-r-2 border-indigo-900">{row.g}</td>
                         <td className={`p-4 ${row.c}`}>{row.t}</td>
                       </tr>
                     ))}
                     <tr className="bg-indigo-900 text-white">
                       <td className="p-4">TOTAL STRENGTH</td><td className="p-4">{stats.boys.total}</td><td className="p-4">{stats.girls.total}</td><td className="p-4 font-black text-lg">{stats.total.total}</td>
                     </tr>
                   </tbody>
                </table>

                <div className="flex justify-between pt-16 px-4">
                  <div className="text-center"><div className="w-40 h-0.5 bg-indigo-900 mx-auto" /><p className="text-[9px] font-black mt-2 text-indigo-900 uppercase">Class Teacher</p></div>
                  <div className="text-center"><div className="w-40 h-0.5 bg-indigo-900 mx-auto" /><p className="text-[9px] font-black mt-2 text-indigo-900 uppercase">Principal Seal</p></div>
                </div>
             </div>

             <div className="mt-8 flex justify-center gap-4">
                <button 
                  onClick={handleDownloadImage} 
                  disabled={isExporting} 
                  className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isExporting ? 'Creating Image...' : '📥 Save Image for WhatsApp'}
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Logs - {selectedDate}</p>
           <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">{filteredAttendance.length} Records</span>
        </div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-200">
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAttendance.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-slate-400 italic">No attendance marked for this date.</td></tr>
              ) : (
                [...filteredAttendance].reverse().map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
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
    </div>
  );
};

export default AttendanceReport;
