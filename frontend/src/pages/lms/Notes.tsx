import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import lmsService from '../../services/lmsService';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];

const fileIconColor: Record<string, string> = {
  pdf: 'text-red-500', ppt: 'text-orange-500', pptx: 'text-orange-500',
  doc: 'text-blue-500', docx: 'text-blue-500', default: 'text-gray-500',
};

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', description: '', subject: '', department: 'Computer Science', semester: 1 });
  const [file, setFile]         = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await lmsService.getNotes();
      setNotes(data.notes);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (file) fd.append('file', file);
      await lmsService.createNote(fd);
      setShowForm(false);
      setForm({ title: '', description: '', subject: '', department: 'Computer Science', semester: 1 });
      setFile(null);
      fetchNotes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    await lmsService.deleteNote(id);
    fetchNotes();
  };

  const canManage = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Study Notes</h2>
          <p className="text-gray-500 text-sm mt-1">{notes.length} notes available</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Upload Note
          </button>
        )}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No notes uploaded yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, i) => (
            <motion.div key={note._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${fileIconColor[note.fileType] || fileIconColor.default}`}>
                  <FileText size={20} />
                </div>
                <div className="flex gap-1">
                  {note.fileUrl && (
                    <a href={`http://localhost:5000${note.fileUrl}`} target="_blank" rel="noreferrer"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Download">
                      <Download size={15} />
                    </a>
                  )}
                  {canManage && (
                    <button onClick={() => handleDelete(note._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{note.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{note.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">{note.subject}</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs">Sem {note.semester}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs">{note.department}</span>
              </div>
              <p className="text-xs text-gray-400 mt-3">By {note.uploadedBy?.name} • {new Date(note.createdAt).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Note</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input className="input-field" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                <input className="input-field" placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                <textarea className="input-field resize-none" rows={2} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select className="input-field" value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })}>
                    {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                  <input type="file" id="noteFile" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={e => setFile(e.target.files?.[0] || null)} />
                  <label htmlFor="noteFile" className="cursor-pointer text-sm text-gray-500 hover:text-primary-600">
                    {file ? <span className="text-primary-600 font-medium">{file.name}</span> : '📎 Click to attach file (PDF, DOC, PPT)'}
                  </label>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">{submitting ? 'Uploading...' : 'Upload'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notes;
