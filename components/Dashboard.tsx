
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Student, AttendanceRecord } from '../types';
import { TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ students, attendance }) => {
  const totalStudents = students.length;
  const totalRecords = attendance.length;
  
  const classData = students.reduce((acc: any, student) => {
    const className = student.className || "Unassigned";
    const classAttendance = attendance.filter(a => a.student_db_id === student.id).length;
    if (!acc[className]) acc[className] = { name: className, students: 0, attendance: 0 };
    acc[className].students += 1;
    acc[className].attendance += classAttendance;
    return acc;
  }, {});

  const chartData = Object.values(classData);

  const stats = [
    { label: 'Total Enrollment', value: totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Today Attendance', value: totalRecords, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sync Status', value: students.filter(s => s.sync_status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800">Operational Overview</h1>
          <p className="text-slate-500 font-medium">Monitoring real-time student engagement and data integrity.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl text-indigo-700 font-bold text-sm">
          <TrendingUp size={16} />
          <span>+12% vs last month</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="group bg-white p-8 rounded-app shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-500">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
              <stat.icon size={28} />
            </div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-black mt-2 text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-app shadow-sm border border-slate-100">
          <h3 className="text-xl font-black mb-8 text-slate-800">Attendance Distribution</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }} 
                />
                <Bar dataKey="attendance" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-app shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-xl font-black mb-8 w-full text-left text-slate-800">Enrollment Mix</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  dataKey="students" 
                  nameKey="name" 
                  cx="50%" cy="50%" 
                  innerRadius={80}
                  outerRadius={120} 
                  paddingAngle={8}
                  stroke="none"
                >
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
