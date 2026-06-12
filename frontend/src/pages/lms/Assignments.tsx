import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Clock, CheckCircle, X, Eye, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import lmsService from '../../services/lmsService';
import api from '../../services/api';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];

const Assignments = () => {
  const { user } = useAuth();
  const [assignments,  setAssignments]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [submitId,     setSubmitId]     = useState<string | null>(null);
  const [submitFile,   setSubmitFile]   = useState<File | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  // Submissions modal (faculty)
  const [viewSubs,     setViewSubs]     = useState<any | null>(null);
  const [markingId,    setMarkingId]    = useState<string | null>(null);
  const [markVal,      setMarkVal]      = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '', description: '', subject: '',
    department: 'Computer Science', semester: 1,
    dueDate: '', maxMarks: 100,
  });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await lmsService.getAssignments();
      setAssignments(data.assignments);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await lmsService.createAssignment(form);
      setShowForm(false);
      setForm({ title: '', description: '', subject: '', department: 'Computer Science', semester: 1, dueDate: '', maxMarks: 100 });
      fetchAssignments();
    } finally { setSubmitting(false); }
  };

  const handleSubmitAssignment = async () => {
    if (!submitId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (submitFile) fd.append('file', submitFile);
      await lmsService.submitAssignment(submitId, fd);
      setSubmitId(null);
      setSubmitFile(null);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    await lmsService.deleteAssignment(id);
    fetchAssignments();
  };

  const handleGiveMark = async (assignmentId: string, submissionStudentId: string) => {
    const val = markVal[submissionStudentId];
    if (!val) return;
    setMarkingId(submissionStudentId);
    try {
      await api.put(`/lms/assignments/${assignmentId}/submissions/${submissionStudentId}/mark`, {
        marksObtained: Number(val),
      });
      // refresh viewSubs
      const { data } = await lmsService.getAssignments();
      const updated = data.assignments.find((a: any) => a._id === assignmentId);
      if (updated) setViewSubs(updated);
      setMarkVal(prev => { const n = { ...prev }; delete n[submissionStudentId]; return n; });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save marks');
    } finally { setMarkingId(null); }
  };

  const canManage = user?.role === 'admin' || user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  const hasSubmitted = (assignment: any) =>
    assignment.submissions?.some((s: any) => s.student === user?.id || s.student?._id === user?.id);

  const isOverdue = (dueDate: string) => new Date() > new Date(dueDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Assignments</h2>
          <p className="text-gray-500 text-sm mt-1">{assignments.length} assignments</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Create Assignment
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No assignments yet</div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a, i) => {
            const overdue   = isOverdue(a.dueDate);
            const submitted = hasSubmitted(a);
            return (
              <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{a.title}</h3>
                      {overdue
                        ? <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">Overdue</span>
                        : <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">Active</span>}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{a.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{a.subject}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Sem {a.semester}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">{a.department}</span>
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">Max: {a.maxMarks} marks</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-2">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{new Date(a.dueDate).toLocaleDateString()}</span>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setViewSubs(a)}
                          className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition">
                          <Eye size={13} /> {a.submissions?.length || 0} submissions
                        </button>
                        <button onClick={() => handleDelete(a._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                    {isStudent && (
                      submitted
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={14} /> Submitted</span>
                        : <button onClick={() => setSubmitId(a._id)}
                            className="flex items-center gap-1 text-xs btn-primary px-3 py-1.5">
                            <Upload size={13} /> Submit
                          </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Assignment</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <input className="input-field" placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                <textarea className="input-field resize-none" rows={3} placeholder="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                <input className="input-field" placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select className="input-field" value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })}>
                    {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Due Date *</label>
                    <input type="datetime-local" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Marks</label>
                    <input type="number" className="input-field" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">{submitting ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Submit Modal */}
      <AnimatePresence>
        {submitId && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submit Assignment</h3>
                <button onClick={() => setSubmitId(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center mb-4">
                <input type="file" id="submitFile" className="hidden" onChange={e => setSubmitFile(e.target.files?.[0] || null)} />
                <label htmlFor="submitFile" className="cursor-pointer text-sm text-gray-500 hover:text-primary-600">
                  {submitFile ? <span className="text-primary-600 font-medium">{submitFile.name}</span> : '📎 Attach your file'}
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSubmitId(null)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                <button onClick={handleSubmitAssignment} disabled={submitting} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Faculty: View Submissions Modal */}
      <AnimatePresence>
        {viewSubs && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewSubs.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Submissions — Max {viewSubs.maxMarks} marks</p>
                </div>
                <button onClick={() => setViewSubs(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>

              {viewSubs.submissions?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No submissions yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {['Student', 'Submitted On', 'Status', 'File', 'Marks', 'Action'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewSubs.submissions.map((sub: any, i: number) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">
                            {sub.student?.user?.name || sub.student?.name || 'Student'}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.status === 'late' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {sub.fileUrl ? (
                              <a href={`http://localhost:5000${sub.fileUrl}`} target="_blank" rel="noreferrer"
                                className="text-xs text-primary-500 hover:underline">Download</a>
                            ) : <span className="text-xs text-gray-400">No file</span>}
                          </td>
                          <td className="px-3 py-2">
                            {sub.marksObtained != null ? (
                              <span className="font-semibold text-primary-600">{sub.marksObtained}/{viewSubs.maxMarks}</span>
                            ) : (
                              <input type="number" min={0} max={viewSubs.maxMarks}
                                className="input-field py-1 w-20 text-xs"
                                placeholder={`0-${viewSubs.maxMarks}`}
                                value={markVal[sub.student?._id || sub.student] || ''}
                                onChange={e => setMarkVal(prev => ({ ...prev, [sub.student?._id || sub.student]: e.target.value }))}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {sub.marksObtained == null && (
                              <button
                                onClick={() => handleGiveMark(viewSubs._id, sub.student?._id || sub.student)}
                                disabled={markingId === (sub.student?._id || sub.student) || !markVal[sub.student?._id || sub.student]}
                                className="flex items-center gap-1 text-xs bg-primary-100 text-primary-600 hover:bg-primary-200 px-2 py-1 rounded-lg transition disabled:opacity-40">
                                <Award size={12} />
                                {markingId === (sub.student?._id || sub.student) ? 'Saving...' : 'Give Marks'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Assignments;
