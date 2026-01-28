
import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { v4 as uuidv4 } from 'uuid';
import IDCardGenerator from './IDCardGenerator';

interface StudentListProps {
  students: Student[];
  schoolName: string;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, schoolName, onAddStudent, onUpdateStudent, onDeleteStudent }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showIDCards, setShowIDCards] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    grNumber: '',
    name: '',
    fatherName: '',
    caste: '',
    className: '',
    gender: 'Male',
    religion: '',
    photo: '' as string | undefined,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
      });
      setEditingStudent(null);
    } else {
      const newStudent: Student = {
        ...formData,
        id: uuidv4(),
        qrCode: formData.grNumber,
        sync_status: 'pending',
        created_at: Date.now(),
      };
      onAddStudent(newStudent);
      setShowAdd(false);
    }
    setFormData({ grNumber: '', name: '', fatherName: '', caste: '', className: '', gender: 'Male', religion: '', photo: undefined });
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      grNumber: student.grNumber,
      name: student.name,
      fatherName: student.fatherName,
      caste: student.caste,
      className: student.className,
      gender: student.gender,
      religion: student.religion,
      photo: student.photo,
    });
    setShowAdd(false);
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setShowAdd(false);
    setFormData({ grNumber: '', name: '', fatherName: '', caste: '', className: '', gender: 'Male', religion: '', photo: undefined });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      let count = 0;
      
      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const [gr, name, fName, caste, cls, gender, religion] = line.split(',');
        if (gr && name) {
          onAddStudent({
            id: uuidv4(),
            grNumber: gr.trim(),
            name: name.trim(),
            fatherName: fName?.trim() || '',
            caste: caste?.trim() || '',
            className: cls?.trim() || '',
            gender: gender?.trim() || 'Male',
            religion: religion?.trim() || '',
            qrCode: gr.trim(),
            sync_status: 'pending',
            created_at: Date.now()
          });
          count++;
        }
      });
      alert(`Successfully imported ${count} students!`);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "GR Number,Name,Father Name,Caste,Class,Gender,Religion";
    const sampleData = "1001,John Doe,Richard Doe,General,10th,Male,Christianity";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleData;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {showIDCards && (
        <IDCardGenerator 
          students={students} 
          schoolName={schoolName} 
          onClose={() => setShowIDCards(false)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Student Directory</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            <span>📄</span> Template
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            <span>📥</span> Excel Import
          </button>
          <button 
            disabled={students.length === 0}
            onClick={() => setShowIDCards(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <span>🪪</span> Generate ID Cards
          </button>
          <button 
            onClick={() => { if(showAdd || editingStudent) handleCancel(); else setShowAdd(true); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${showAdd || editingStudent ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {showAdd || editingStudent ? 'Cancel' : 'Register Student'}
          </button>
        </div>
      </div>

      {(showAdd || editingStudent) && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-800">{editingStudent ? 'Edit Student' : 'Register New Student'}</h3>
          
          <div className="flex flex-col items-center gap-4 mb-4">
             <div 
               onClick={() => photoInputRef.current?.click()}
               className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-200 transition-colors"
             >
                {formData.photo ? (
                  <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-2xl">📷</span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Upload Photo</p>
                  </div>
                )}
             </div>
             <input 
               type="file" 
               ref={photoInputRef} 
               onChange={handlePhotoChange} 
               className="hidden" 
               accept="image/*"
             />
          </div>

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
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleCancel} className="px-6 py-2 rounded-lg font-medium bg-slate-100 text-slate-600">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium">{editingStudent ? 'Update Student' : 'Save to Database'}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GR #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {students.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No students recorded. Use the "Excel Import" to add students in bulk.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-[10px]">No Photo</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{student.grNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{student.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.sync_status === 'synced' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {student.sync_status === 'synced' ? 'Synced' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleEditClick(student)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
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
