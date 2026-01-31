
import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { v4 as uuidv4 } from 'uuid';
import IDCardGenerator from './IDCardGenerator';
import * as XLSX from 'xlsx';

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

  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "GR Number": "1001", "Student Name": "Ali Ahmed", "Father Name": "Sajid Ahmed", "Class": "10th", "Gender": "Male", "Caste": "Pathan", "Religion": "Islam" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "EduSync_Template.xlsx");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        data.forEach((row: any) => {
          const gr = row['GR Number'] || row['gr'];
          const name = row['Student Name'] || row['Name'] || row['name'];
          if (gr && name) {
            onAddStudent({
              id: uuidv4(),
              grNumber: String(gr),
              name: String(name),
              fatherName: String(row['Father Name'] || ''),
              className: String(row['Class'] || ''),
              gender: String(row['Gender'] || 'Male'),
              caste: String(row['Caste'] || ''),
              religion: String(row['Religion'] || ''),
              qrCode: String(gr),
              sync_status: 'pending',
              created_at: Date.now()
            });
          }
        });
        alert("Students imported successfully!");
      } catch (err) {
        alert("Invalid Excel file. Please use our template.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdateStudent({ ...editingStudent, ...formData });
      setEditingStudent(null);
    } else {
      onAddStudent({
        ...formData,
        id: uuidv4(),
        qrCode: formData.grNumber,
        sync_status: 'pending',
        created_at: Date.now(),
      });
      setShowAdd(false);
    }
    setFormData({ grNumber: '', name: '', fatherName: '', caste: '', className: '', gender: 'Male', religion: '', photo: undefined });
  };

  return (
    <div className="space-y-6">
      {showIDCards && <IDCardGenerator students={students} schoolName={schoolName} onClose={() => setShowIDCards(false)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Student Directory</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadExcelTemplate} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold border border-emerald-100">Template .xlsx</button>
          <input type="file" ref={fileInputRef} onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold border border-indigo-100">Import Excel</button>
          <button onClick={() => setShowIDCards(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold">ID Cards</button>
          <button onClick={() => setShowAdd(!showAdd)} className={`px-4 py-2 rounded-xl font-bold ${showAdd ? 'bg-slate-200' : 'bg-indigo-600 text-white'}`}>{showAdd ? 'Cancel' : 'New Student'}</button>
        </div>
      </div>

      {(showAdd || editingStudent) && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6 animate-in zoom-in-95">
          <h3 className="text-xl font-black text-slate-800">{editingStudent ? 'Update Details' : 'Student Registration'}</h3>
          <div className="flex flex-col items-center gap-4">
             <div onClick={() => photoInputRef.current?.click()} className="w-24 h-24 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-200 shadow-inner">
                {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <div className="text-center"><span className="text-2xl">📷</span></div>}
             </div>
             <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['grNumber', 'name', 'fatherName', 'className', 'caste', 'religion'].map(field => (
              <div key={field}>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input required={field==='grNumber'||field==='name'} type="text" value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-50 focus:border-indigo-500 outline-none font-bold" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3"><button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs">Save Student</button></div>
        </form>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>{['Photo', 'GR #', 'Name', 'Class', 'Actions'].map(h => <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(student => (
                <tr key={student.id} className="hover:bg-indigo-50/20">
                  <td className="px-6 py-4"><div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-slate-100">{student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">NO PIC</div>}</div></td>
                  <td className="px-6 py-4 text-sm font-black text-indigo-600">{student.grNumber}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800">{student.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">{student.className}</td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => { setEditingStudent(student); setFormData(student as any); }} className="text-indigo-600 font-bold">Edit</button>
                    <button onClick={() => onDeleteStudent(student.id)} className="text-red-500 font-bold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
