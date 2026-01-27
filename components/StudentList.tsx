
import React, { useState } from 'react';
import { Student } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StudentListProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAddStudent }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    grNumber: '',
    name: '',
    fatherName: '',
    caste: '',
    className: '',
    gender: 'Male',
    religion: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      ...formData,
      id: uuidv4(),
      qrCode: formData.grNumber,
      sync_status: 'pending',
      created_at: Date.now(),
    };
    onAddStudent(newStudent);
    setShowAdd(false);
    setFormData({ grNumber: '', name: '', fatherName: '', caste: '', className: '', gender: 'Male', religion: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Directory</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {showAdd ? 'Cancel' : 'Register Student'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">GR Number</label>
              <input required type="text" value={formData.grNumber} onChange={e => setFormData({...formData, grNumber: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Father Name</label>
              <input required type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Class</label>
              <input required type="text" value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Religion</label>
              <input type="text" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">Save to Database</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GR #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {students.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No students recorded.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{student.grNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{student.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.sync_status === 'synced' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {student.sync_status === 'synced' ? 'Synced' : 'Offline'}
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

export default StudentList;
