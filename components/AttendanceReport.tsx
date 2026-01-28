
import React, { useState } from 'react';
import { AttendanceRecord, Student } from '../types';

interface AttendanceReportProps {
  attendance: AttendanceRecord[];
  students: Student[];
  schoolName: string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ attendance, students, schoolName }) => {
  const [showImageExport, setShowImageExport] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredAttendance = attendance.filter(a => {
    const recordDate = new Date(a.timestamp).toISOString().split('T')[0];
    return recordDate === selectedDate;
  });

  const downloadReport = () => {
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

  const getStats = () => {
    const boys = students.filter(s => s.gender === 'Male');
    const girls = students.filter(s => s.gender === 'Female');
    
    const countStatus = (genderStudents: Student[], status: string) => {
      return filteredAttendance.filter(a => a.status === status && genderStudents.some(s => s.id === a.student_db_id)).length;
    };

    return {
      boys: { 
        total: boys.length, 
        present: countStatus(boys, 'present'), 
        absent: countStatus(boys, 'absent'),
        leave: countStatus(boys, 'leave')
      },
      girls: { 
        total: girls.length, 
        present: countStatus(girls, 'present'), 
        absent: countStatus(girls, 'absent'),
        leave: countStatus(girls, 'leave')
      },
      total: { 
        total: students.length, 
        present: filteredAttendance.filter(a => a.status === 'present').length, 
        absent: filteredAttendance.filter(a => a.status === 'absent').length,
        leave: filteredAttendance.filter(a => a.status === 'leave').length 
      }
    };
  };

  const stats = getStats();
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance Analysis</h2>
          <p className="text-slate-500 text-sm">Select a date to view logs and generate summaries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-slate-200 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
          <button 
            onClick={() => setShowImageExport(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <span>🖼️</span> Summary
          </button>
          <button onClick={downloadReport} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
            <span>📥</span> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present</p>
          <p className="text-2xl font-black text-emerald-600">{stats.total.present}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent</p>
          <p className="text-2xl font-black text-red-600">{stats.total.absent}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leave</p>
          <p className="text-2xl font-black text-blue-600">{stats.total.leave}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</p>
          <p className="text-sm font-bold text-slate-700 truncate">{displayDate}</p>
        </div>
      </div>

      {showImageExport && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
             <button 
               onClick={() => setShowImageExport(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl"
             >✕</button>
             
             <div className="border-4 border-indigo-900 p-8 space-y-6 bg-white text-center">
                <div className="border-b-2 border-indigo-100 pb-4">
                  <h1 className="text-2xl font-black text-indigo-900 tracking-wider uppercase">{schoolName || "EDUSYNC INTERNATIONAL SCHOOL"}</h1>
                  <p className="bg-indigo-900 text-white inline-block px-4 py-1 text-xs font-bold mt-2 tracking-widest uppercase">Daily Attendance Summary</p>
                  <p className="text-indigo-700 font-semibold mt-2">{displayDate}</p>
                </div>

                <table className="w-full border-2 border-indigo-900 border-collapse">
                   <thead>
                     <tr className="bg-indigo-900 text-white text-xs font-bold uppercase tracking-wider">
                       <th className="border border-indigo-800 p-3">Status</th>
                       <th className="border border-indigo-800 p-3">Boys</th>
                       <th className="border border-indigo-800 p-3">Girls</th>
                       <th className="border border-indigo-800 p-3">Total</th>
                     </tr>
                   </thead>
                   <tbody className="text-sm font-medium">
                     <tr>
                       <td className="border border-indigo-900 p-3 text-indigo-900 font-bold bg-indigo-50">PRESENT</td>
                       <td className="border border-indigo-900 p-3 text-emerald-700">{stats.boys.present}</td>
                       <td className="border border-indigo-900 p-3 text-emerald-700">{stats.girls.present}</td>
                       <td className="border border-indigo-900 p-3 text-indigo-900 font-black">{stats.total.present}</td>
                     </tr>
                     <tr>
                       <td className="border border-indigo-900 p-3 text-indigo-900 font-bold bg-indigo-50">ABSENT</td>
                       <td className="border border-indigo-900 p-3 text-red-600">{stats.boys.absent}</td>
                       <td className="border border-indigo-900 p-3 text-red-600">{stats.girls.absent}</td>
                       <td className="border border-indigo-900 p-3 text-indigo-900 font-black">{stats.total.absent}</td>
                     </tr>
                     <tr>
                       <td className="border border-indigo-900 p-3 text-indigo-900 font-bold bg-indigo-50">LEAVE</td>
                       <td className="border border-indigo-900 p-3 text-blue-600">{stats.boys.leave}</td>
                       <td className="border border-indigo-900 p-3 text-blue-600">{stats.girls.leave}</td>
                       <td className="border border-indigo-900 p-3 text-indigo-900 font-black">{stats.total.leave}</td>
                     </tr>
                     <tr className="bg-indigo-900 text-white font-black">
                       <td className="border border-indigo-900 p-3">STRENGTH</td>
                       <td className="border border-indigo-900 p-3">{stats.boys.total}</td>
                       <td className="border border-indigo-900 p-3">{stats.girls.total}</td>
                       <td className="border border-indigo-900 p-3">{stats.total.total}</td>
                     </tr>
                   </tbody>
                </table>

                <div className="flex justify-between pt-12">
                   <div className="text-center">
                     <div className="w-32 h-px bg-indigo-900 mx-auto" />
                     <p className="text-[10px] font-bold mt-1 text-indigo-900 uppercase">Class Teacher</p>
                   </div>
                   <div className="text-center">
                     <div className="w-32 h-px bg-indigo-900 mx-auto" />
                     <p className="text-[10px] font-bold mt-1 text-indigo-900 uppercase">Principal</p>
                   </div>
                </div>
             </div>

             <div className="mt-6 flex justify-center">
                <button 
                  onClick={() => setShowImageExport(false)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  Close Preview
                </button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GR #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredAttendance.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">No records found for {selectedDate}.</td></tr>
            ) : (
              [...filteredAttendance].reverse().map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(record.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{record.grNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${
                      record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                      record.status === 'absent' ? 'bg-red-50 text-red-600' : 
                      'bg-blue-50 text-blue-600'
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
