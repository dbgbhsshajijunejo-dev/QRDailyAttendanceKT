
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Student, AttendanceRecord } from '../types';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, attendance }) => {
  const totalStudents = students.length;
  const totalRecords = attendance.length;
  
  // Calculate attendance by Class
  const classData = students.reduce((acc: any, student) => {
    const className = student.className || "Unknown Class";
    const classAttendance = attendance.filter(a => a.student_db_id === student.id).length;
    if (!acc[className]) acc[className] = { name: className, students: 0, attendance: 0 };
    acc[className].students += 1;
    acc[className].attendance += classAttendance;
    return acc;
  }, {});

  const chartData = Object.values(classData);

  const stats = [
    { label: 'Total Enrolled', value: totalStudents, color: 'bg-blue-500' },
    { label: 'Today\'s Attendance', value: totalRecords, color: 'bg-emerald-500' },
    { label: 'Pending Sync', value: students.filter(s => s.sync_status === 'pending').length + attendance.filter(a => a.sync_status === 'pending').length, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
            <div className={`h-1 w-full mt-4 rounded-full ${stat.color} opacity-20`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Attendance by Class</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="attendance" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Student Enrollment</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
