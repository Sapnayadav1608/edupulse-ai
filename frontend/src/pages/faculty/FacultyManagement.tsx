import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, X, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const departments  = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics'];
const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD'];

const defaultForm = { name: '', email: '', password: '', department: 'Computer Science', designation: 'Assistant Professor', phone: '' };

const FacultyManagement = () => {
  const [faculty,     setFaculty]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [editData,    setEditData]    = useState<any>(null);
  const [form,        setForm]        = useState<any>(defaultForm);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [deleteId,    setDeleteId]    = useState<string | null>(null);

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/faculty', { params: search ? { search } : {} });
      setFaculty(data.faculty || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  const openAdd = () => {
    setEditData(null);
    setForm(defaultForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (f: any) => {
    setEditData(f);
    setForm({ name: f.name, email: f.email, password: '', department: f.department || 'Computer Science', designation: f.designation || 'Assistant Professor', phone: f.phone || '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editData) {
        const payload: any = { name: form.name, email: form.email, department: form.department, designation: form.designation, phone: form.phone };
        await api.put(`/faculty/${editData._id}`, payload);
      } else {
        await api.post('/faculty', form);
      }
      setShowForm(false);
      fetchFaculty();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/faculty/${deleteId}`);
      setDeleteId(null);
      fetchFaculty();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Management</h2>
          <p className="page-subtitle">{faculty.length} faculty members</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> Add Faculty
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10 text-sm" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
              <tr>
                {['Faculty', 'Department', 'Designation', 'Phone', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : faculty.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <UserCog size={32} className="mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                  No faculty found
                </td></tr>
              ) : faculty.map((f, i) => (
                <motion.tr key={f._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {f.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{f.name}</p>
                        <p className="text-xs text-gray-400">{f.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">{f.department || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{f.designation || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{f.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${f.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                      {f.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(f)}
                        className="w-7 h-7 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(f._id)}
                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <UserCog size={16} className="text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editData ? 'Edit Faculty' : 'Add New Faculty'}
                  </h3>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>

              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                    <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  {!editData && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                      <input type="password" className="input-field" placeholder="Default: faculty123"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                    <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                      {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation *</label>
                    <select className="input-field" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                      {designations.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input className="input-field" placeholder="e.g. 9876543210" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">
                    {saving ? 'Saving...' : editData ? 'Update Faculty' : 'Add Faculty'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-box max-w-sm p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">Delete Faculty?</h3>
              <p className="text-gray-500 text-sm text-center mb-6">This will permanently delete the faculty account. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                <button onClick={handleDelete} className="btn-danger flex-1 py-2.5 text-sm justify-center">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyManagement;
