import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Users, Briefcase, TrendingUp, Calendar, X, ChevronDown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import placementService from '../../services/placementService';

const statusColors: Record<string, string> = {
  upcoming:            'bg-blue-100 text-blue-600',
  ongoing:             'bg-green-100 text-green-600',
  completed:           'bg-gray-100 text-gray-600',
  applied:             'bg-yellow-100 text-yellow-600',
  shortlisted:         'bg-blue-100 text-blue-600',
  interview_scheduled: 'bg-purple-100 text-purple-600',
  selected:            'bg-green-100 text-green-600',
  rejected:            'bg-red-100 text-red-600',
};

const pieColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const defaultForm = {
  name: '', industry: '', jobRole: '', package: '', location: '',
  website: '', description: '', driveDate: '', lastDateToApply: '',
  status: 'upcoming',
  eligibility: { minCGPA: 6.0, departments: ['Computer Science', 'Information Technology'], maxBacklogs: 0 },
};

const PlacementDashboard = () => {
  const { user } = useAuth();
  const [tab,             setTab]             = useState<'drives' | 'applications'>('drives');
  const [companies,       setCompanies]       = useState<any[]>([]);
  const [applications,    setApplications]    = useState<any[]>([]);
  const [stats,           setStats]           = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [showForm,        setShowForm]        = useState(false);
  const [editCompany,     setEditCompany]     = useState<any>(null);
  const [form,            setForm]            = useState<any>(defaultForm);
  const [saving,          setSaving]          = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  // Interview scheduling
  const [interviewApp,    setInterviewApp]    = useState<any>(null);
  const [interviewForm,   setInterviewForm]   = useState({ interviewDate: '', interviewMode: 'online', feedback: '' });
  const [schedSaving,     setSchedSaving]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, companiesRes] = await Promise.all([
        placementService.getStats(),
        placementService.getCompanies(),
      ]);
      setStats(statsRes.data.stats);
      setCompanies(companiesRes.data.companies);
    } finally { setLoading(false); }
  }, []);

  const fetchApplications = useCallback(async () => {
    const params: any = {};
    if (selectedCompany) params.companyId = selectedCompany;
    const { data } = await placementService.getApplications(params);
    setApplications(data.applications);
  }, [selectedCompany]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (tab === 'applications') fetchApplications(); }, [tab, fetchApplications]);

  const openAdd  = () => { setEditCompany(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditCompany(c);
    setForm({ ...c, driveDate: c.driveDate?.split('T')[0], lastDateToApply: c.lastDateToApply?.split('T')[0] });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCompany) await placementService.updateCompany(editCompany._id, form);
      else             await placementService.createCompany(form);
      setShowForm(false);
      fetchAll();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this company drive?')) return;
    await placementService.deleteCompany(id);
    fetchAll();
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    await placementService.updateStatus(appId, { status });
    fetchApplications();
  };

  const openInterviewModal = (app: any) => {
    setInterviewApp(app);
    setInterviewForm({
      interviewDate: app.interviewDate ? app.interviewDate.split('T')[0] : '',
      interviewMode: app.interviewMode || 'online',
      feedback:      app.feedback || '',
    });
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSaving(true);
    try {
      await placementService.updateStatus(interviewApp._id, {
        status:        'interview_scheduled',
        interviewDate: interviewForm.interviewDate,
        interviewMode: interviewForm.interviewMode,
        feedback:      interviewForm.feedback,
      });
      setInterviewApp(null);
      fetchApplications();
    } finally { setSchedSaving(false); }
  };

  const canManage = user?.role === 'admin' || user?.role === 'faculty';

  const pieData = stats ? [
    { name: 'Selected',    value: stats.totalSelected },
    { name: 'Applied',     value: Math.max(0, stats.totalApplied - stats.totalSelected) },
    { name: 'Not Applied', value: Math.max(0, stats.totalStudents - stats.totalApplied) },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Placement Management</h2>
          <p className="page-subtitle">Company drives • Applications • Interview scheduling</p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus size={16} /> Add Company Drive
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Drives',    value: stats.totalDrives,    icon: Briefcase,  color: 'bg-blue-500' },
            { label: 'Upcoming Drives', value: stats.upcomingDrives, icon: Calendar,   color: 'bg-purple-500' },
            { label: 'Total Applied',   value: stats.totalApplied,   icon: Users,      color: 'bg-yellow-500' },
            { label: 'Students Placed', value: stats.totalSelected,  icon: TrendingUp, color: 'bg-green-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card flex items-center gap-4">
              <div className={`${s.color} p-3 rounded-xl text-white flex-shrink-0`}><s.icon size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pie + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col items-center">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2 self-start">Placement Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats?.placementRate || 0}%</p>
          <p className="text-xs text-gray-400">Placement Rate</p>
        </motion.div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            {(['drives', 'applications'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
                  ${tab === t ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'applications' && (
            <select className="input-field w-auto" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Drives Table */}
      {tab === 'drives' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {['Company', 'Role', 'Package', 'Drive Date', 'Min CGPA', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
                ) : companies.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No company drives added yet</td></tr>
                ) : companies.map((c, i) => (
                  <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.industry}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.jobRole}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{c.package}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.driveDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-500">{c.eligibility?.minCGPA}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Applications Table */}
      {tab === 'applications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  {['Student', 'Company', 'Role', 'Applied On', 'Interview', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No applications found</td></tr>
                ) : applications.map((app, i) => (
                  <motion.tr key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-white">{app.student?.user?.name}</p>
                      <p className="text-xs text-gray-400">{app.student?.rollNumber}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{app.company?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{app.company?.jobRole}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {app.interviewDate ? (
                        <div>
                          <p className="text-xs font-medium text-purple-600">{new Date(app.interviewDate).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400 capitalize">{app.interviewMode}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[app.status]}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select value={app.status} onChange={e => handleStatusUpdate(app._id, e.target.value)}
                              className="input-field py-1 text-xs w-auto pr-7 appearance-none">
                              {['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'].map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                          <button onClick={() => openInterviewModal(app)}
                            className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition" title="Schedule Interview">
                            <Clock size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Company Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editCompany ? 'Edit Company Drive' : 'Add Company Drive'}
                </h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field col-span-2" placeholder="Company Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <input className="input-field" placeholder="Industry *" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} required />
                  <input className="input-field" placeholder="Job Role *" value={form.jobRole} onChange={e => setForm({ ...form, jobRole: e.target.value })} required />
                  <input className="input-field" placeholder="Package (e.g. 6-8 LPA) *" value={form.package} onChange={e => setForm({ ...form, package: e.target.value })} required />
                  <input className="input-field" placeholder="Location *" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Drive Date *</label>
                    <input type="date" className="input-field" value={form.driveDate} onChange={e => setForm({ ...form, driveDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last Date to Apply *</label>
                    <input type="date" className="input-field" value={form.lastDateToApply} onChange={e => setForm({ ...form, lastDateToApply: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min CGPA</label>
                    <input type="number" step="0.1" min="0" max="10" className="input-field"
                      value={form.eligibility?.minCGPA}
                      onChange={e => setForm({ ...form, eligibility: { ...form.eligibility, minCGPA: parseFloat(e.target.value) } })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {['upcoming', 'ongoing', 'completed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <textarea className="input-field col-span-2 resize-none" rows={2} placeholder="Description"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">{saving ? 'Saving...' : editCompany ? 'Update' : 'Add Drive'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interview Scheduling Modal */}
      <AnimatePresence>
        {interviewApp && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Interview</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {interviewApp.student?.user?.name} — {interviewApp.company?.name}
                  </p>
                </div>
                <button onClick={() => setInterviewApp(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>
              <form onSubmit={handleScheduleInterview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Date *</label>
                  <input type="date" className="input-field" value={interviewForm.interviewDate}
                    onChange={e => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Mode</label>
                  <select className="input-field" value={interviewForm.interviewMode}
                    onChange={e => setInterviewForm({ ...interviewForm, interviewMode: e.target.value })}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Feedback</label>
                  <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..."
                    value={interviewForm.feedback}
                    onChange={e => setInterviewForm({ ...interviewForm, feedback: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setInterviewApp(null)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={schedSaving} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">
                    {schedSaving ? 'Scheduling...' : 'Schedule Interview'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacementDashboard;
