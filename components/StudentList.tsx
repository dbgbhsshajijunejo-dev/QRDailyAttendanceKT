
import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { v4 as uuidv4 } from 'uuid';
import IDCardGenerator from './IDCardGenerator';
import * as XLSX from 'xlsx';
import { Download, Upload, UserPlus, CreditCard, Search, Edit3, Trash2 } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    grNumber: '',
    name: '',
    fatherName: '',
    caste: '',
    className: '',
    gender: 'Boys',
    religion: '',
    photo: '' as string | undefined,
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.grNumber.includes(searchQuery)
  );

  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "GR Number": "1001", "Student Name": "Ali Ahmed", "Father Name": "Sajid Ahmed", "Class": "10th", "Gender": "Boys", "Caste": "Pathan", "Religion": "Islam" }
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
              gender: String(row['Gender'] || 'Boys'),
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
    setFormData({ grNumber: '', name: '', fatherName: '', caste: '', className: '', gender: 'Boys', religion: '', photo: undefined });
  };

  return (
    <div className="space-y-6">
      {showIDCards && <IDCardGenerator students={students} schoolName={schoolName} onClose={() => setShowIDCards(false)} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">STUDENT DIRECTORY</h2>
          <p className="text-slate-500 font-medium text-sm">Manage student profiles and export ID cards.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={downloadExcelTemplate} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs border border-slate-200 hover:bg-slate-50 transition-all">
            <Download size={16} /> Template
          </button>
          <input type="file" ref={fileInputRef} onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-2xl font-bold text-xs border border-indigo-100 hover:bg-indigo-100 transition-all">
            <Upload size={16} /> Import Excel
          </button>
          <button onClick={() => setShowIDCards(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg hover:bg-black transition-all">
            <CreditCard size={16} /> Bulk ID Cards
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg ${showAdd ? 'bg-slate-200 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            <UserPlus size={16} /> {showAdd ? 'Cancel' : 'New Admission'}
          </button>
        </div>
      </div>

      {(showAdd || editingStudent) && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-app shadow-2xl shadow-indigo-100/50 border border-slate-100 space-y-6 animate-in zoom-in duration-300">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{editingStudent ? 'Update Profile' : 'Student Registration Form'}</h3>
          <div className="flex flex-col items-center gap-4">
             <div onClick={() => photoInputRef.current?.click()} className="w-28 h-28 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-200 shadow-inner transition-all group">
                {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <div className="text-slate-300 group-hover:text-indigo-400 transition-colors"><Upload size={32} /></div>}
             </div>
             <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
             <p className="text-[10px] font-black text-slate-400 uppercase">Student Photograph</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['grNumber', 'name', 'fatherName', 'className', 'caste', 'religion'].map(field => (
              <div key={field}>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input required={field==='grNumber'||field==='name'} type="text" value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold transition-all" placeholder={`Enter ${field}`} />
              </div>
            ))}
            
            {/* Gender Selection */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1 tracking-widest">Select Gender</label>
              <div className="flex gap-3">
                {['Boys', 'Girls', 'Others'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                      formData.gender === g 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3"><button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Confirm & Save</button></div>
        </form>
      )}

      <div className="bg-white rounded-app shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Search by name or GR number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none outline-none font-medium text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
             />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredStudents.length} Records found</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>{['Profile', 'GR #', 'Full Name', 'Class / Grade', 'Gender', 'Actions'].map(h => <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="px-8 py-4"><div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">{student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400">PIC</div>}</div></td>
                  <td className="px-8 py-4 text-sm font-black text-indigo-600">{student.grNumber}</td>
                  <td className="px-8 py-4 text-sm font-black text-slate-800">{student.name}</td>
                  <td className="px-8 py-4 text-sm font-bold text-slate-500 uppercase">{student.className}</td>
                  <td className="px-8 py-4">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      student.gender === 'Boys' ? 'bg-blue-50 text-blue-600' : 
                      student.gender === 'Girls' ? 'bg-pink-50 text-pink-600' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {student.gender}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingStudent(student); setFormData(student as any); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => onDeleteStudent(student.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <div className="text-4xl mb-4">📂</div>
            <p className="font-bold">No students match your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
