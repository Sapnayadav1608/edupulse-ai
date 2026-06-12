import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, Filter, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import studentService, { StudentData, CreateStudentPayload } from '../../services/studentService';
import StudentForm from '../../components/student/StudentForm';

const departments = ['All', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];

const cgpaBadge = (cgpa: number) => {
  if (cgpa >= 8.5) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (cgpa >= 7.0) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (cgpa >= 5.0) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const DEPT_COLORS: Record<string, string> = {
  'Computer Science':       'bg-blue-100 text-blue-700',
  'Information Technology': 'bg-cyan-100 text-cyan-700',
  'Electronics':            'bg-purple-100 text-purple-700',
  'Mechanical':             'bg-orange-100 text-orange-700',
  'Civil':                  'bg-green-100 text-green-700',
};

const StudentManagement = () => {
  const navigate = useNavigate();
  const [students, setStudents]       = useState<StudentData[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [deptFilter, setDeptFilter]   = useState('All');
  const [semFilter, setSemFilter]     = useState('All');
  const [showForm, setShowForm]       = useState(false);
  const [editStudent, setEditStudent] = useState<StudentData | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search)               params.search     = search;
      if (deptFilter !== 'All') params.department = deptFilter;
      if (semFilter  !== 'All') params.semester   = semFilter;
      const { data } = await studentService.getAll(params);
      setStudents(data.students);
    } finally { setLoading(false); }
  }, [search, deptFilter, semFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleCreate = async (formData: CreateStudentPayload) => { await studentService.create(formData); fetchStudents(); };
  const handleUpdate = async (formData: CreateStudentPayload) => {
    if (!editStudent?._id) return;
    await studentService.update(editStudent._id, formData); fetchStudents();
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await studentService.delete(deleteId);
    setDeleting(false); setDeleteId(null); fetchStudents();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Management</h2>
          <p className="page-subtitle">{students.length} students enrolled</p>
        </div>
        <button onClick={() => { setEditStudent(null); setShowForm(true); }} className="btn-primary text-sm">
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10 text-sm" placeholder="Search name or roll number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <select className="input-field text-sm w-auto" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <select className="input-field text-sm w-auto" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
          {semesters.map(s => <option key={s} value={s}>{s === 'All' ? 'All Semesters' : `Sem ${s}`}</option>)}
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
              <tr>
                {['Student', 'Roll No', 'Department', 'Sem', 'Batch', 'CGPA', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                    No students found
                  </td>
                </tr>
              ) : students.map((student, i) => (
                <motion.tr key={student._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {student.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{student.user?.name}</p>
                        <p className="text-xs text-gray-400">{student.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{student.rollNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEPT_COLORS[student.department] || 'bg-gray-100 text-gray-600'}`}>
                      {student.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{student.semester}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{student.batch}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cgpaBadge(student.cgpa || 0)}`}>
                      {student.cgpa?.toFixed(1) || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/students/${student._id}`)}
                        className="w-7 h-7 flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => { setEditStudent(student); setShowForm(true); }}
                        className="w-7 h-7 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(student._id!)}
                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <StudentForm isOpen={showForm} onClose={() => setShowForm(false)}
        onSubmit={editStudent ? handleUpdate : handleCreate} editData={editStudent} />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-box max-w-sm p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">Delete Student?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">This will permanently remove the student and their account. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1 py-2.5 text-sm justify-center">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentManagement;
