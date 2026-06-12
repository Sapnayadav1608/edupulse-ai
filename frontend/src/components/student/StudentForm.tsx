import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentData, CreateStudentPayload } from '../../services/studentService';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudentPayload) => Promise<void>;
  editData?: StudentData | null;
}

const defaultForm: CreateStudentPayload = {
  name: '', email: '', password: '', rollNumber: '',
  department: 'Computer Science', semester: 1, batch: '', phone: '', cgpa: 0,
};

const StudentForm = ({ isOpen, onClose, onSubmit, editData }: Props) => {
  const [form, setForm] = useState<CreateStudentPayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.user?.name || '',
        email: editData.user?.email || '',
        rollNumber: editData.rollNumber,
        department: editData.department,
        semester: editData.semester,
        batch: editData.batch,
        phone: editData.phone || '',
        cgpa: editData.cgpa || 0,
      });
    } else {
      setForm(defaultForm);
    }
    setError('');
  }, [editData, isOpen]);

  const set = (field: keyof CreateStudentPayload, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editData ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>

                {!editData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <input type="password" className="input-field" placeholder="Default: student123" value={form.password} onChange={e => set('password', e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number *</label>
                  <input className="input-field" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                  <select className="input-field" value={form.department} onChange={e => set('department', e.target.value)}>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester *</label>
                  <select className="input-field" value={form.semester} onChange={e => set('semester', Number(e.target.value))}>
                    {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch *</label>
                  <input className="input-field" placeholder="e.g. 2021-2025" value={form.batch} onChange={e => set('batch', e.target.value)} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" className="input-field" value={form.cgpa} onChange={e => set('cgpa', parseFloat(e.target.value))} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 disabled:opacity-60">
                  {loading ? 'Saving...' : editData ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StudentForm;
