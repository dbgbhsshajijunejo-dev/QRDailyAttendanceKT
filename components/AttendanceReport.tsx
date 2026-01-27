
import React from 'react';
import { AttendanceRecord, Student } from '../types';

interface AttendanceReportProps {
  attendance: AttendanceRecord[];
  students: Student[];
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({ attendance, students }) => {
  const downloadReport = () => {
    const headers = ["GR Number", "Name", "Class", "Date", "Status"];
    const rows = attendance.map(a => {
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
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Attendance Log</h2>
        <button onClick={downloadReport} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <span>📥</span> Export CSV
        </button>
      </div>

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
            {attendance.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">No records found.</td></tr>
            ) : (
              [...attendance].reverse().map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(record.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{record.grNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-semibold text-emerald-600 capitalize">{record.status}</span></td>
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
