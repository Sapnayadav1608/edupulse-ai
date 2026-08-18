import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, MapPin, Calendar, TrendingUp, CheckCircle, Upload, X, FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import placementService from '../../services/placementService';

const statusColors: Record<string, string> = {
  applied:             'bg-yellow-100 text-yellow-600',
  shortlisted:         'bg-blue-100 text-blue-600',
  interview_scheduled: 'bg-purple-100 text-purple-600',
  selected:            'bg-green-100 text-green-600',
  rejected:            'bg-red-100 text-red-600',
};

const statusSteps = ['applied', 'shortlisted', 'interview_scheduled', 'selected'];

const StudentPlacement = () => {
  const [companies,  setCompanies]  = useState<any[]>([]);
  const [myApps,     setMyApps]     = useState<any[]>([]);
  const [tab,        setTab]        = useState<'drives' | 'applications'>('drives');
  const [loading,    setLoading]    = useState(true);
  // Resume upload modal
  const [applyModal, setApplyModal] = useState<any>(null);
  const [resume,     setResume]     = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesRes, appsRes] = await Promise.all([
        placementService.getCompanies(),
        placementService.getMyApplications(),
      ]);
      setCompanies(companiesRes.data.companies);
      setMyApps(appsRes.data.applications);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openApplyModal = (company: any) => {
    setApplyModal(company);
    setResume(null);
  };

  const handleApply = async () => {
    if (!applyModal) return;
    setUploading(true);
    try {
      // If resume selected, upload as FormData
      if (resume) {
        const fd = new FormData();
        fd.append('resume', resume);
        await placementService.applyWithResume(applyModal._id, fd);
      } else {
        await placementService.apply(applyModal._id);
      }
      setApplyModal(null);
      setResume(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Application failed');
    } finally { setUploading(false); }
  };

  const appliedIds = myApps.map(a => a.company?._id);

  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Placement Portal</h2>
        <p className="text-gray-500 text-sm mt-1">Browse company drives and track your applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available Drives', value: companies.length,                                    color: 'bg-blue-500' },
          { label: 'Applied',          value: myApps.length,                                       color: 'bg-yellow-500' },
          { label: 'Selected',         value: myApps.filter(a => a.status === 'selected').length,  color: 'bg-green-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="card flex items-center gap-3">
            <div className={`${s.color} w-2 h-10 rounded-full flex-shrink-0`} />
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {(['drives', 'applications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize
              ${tab === t ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'applications' && myApps.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary-600 text-white rounded-full text-xs">{myApps.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : tab === 'drives' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.length === 0 ? (
            <div className="card text-center py-16 text-gray-400 col-span-2">No drives available yet</div>
          ) : companies.map((c, i) => {
            const applied = appliedIds.includes(c._id);
            const closed  = new Date() > new Date(c.lastDateToApply);
            return (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.industry}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${c.status === 'upcoming' ? 'bg-blue-100 text-blue-600' : c.status === 'ongoing' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <Briefcase size={14} className="text-primary-500" /><span>{c.jobRole}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <TrendingUp size={14} /><span>{c.package}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={14} /><span>{c.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar size={14} /><span>{new Date(c.driveDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{c.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs text-gray-400">
                    <span>Min CGPA: {c.eligibility?.minCGPA}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1 inline-flex">
                      <Clock size={11} /> Last date: {new Date(c.lastDateToApply).toLocaleDateString()}
                    </span>
                  </div>
                  {applied ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle size={14} /> Applied
                    </span>
                  ) : closed ? (
                    <span className="text-xs text-red-500 font-medium">Closed</span>
                  ) : (
                    <button onClick={() => openApplyModal(c)}
                      className="btn-primary px-4 py-1.5 text-xs">
                      Apply Now
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* My Applications */
        <div className="space-y-4">
          {myApps.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">You haven't applied to any company yet</div>
          ) : myApps.map((app, i) => (
            <motion.div key={app._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{app.company?.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{app.company?.jobRole} • {app.company?.package} • {app.company?.location}</p>
                  <p className="text-xs text-gray-400 mt-1">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                {app.status === 'selected' && (
                  <div className="text-right">
                    <p className="text-xs text-green-600 font-medium">🎉 Offer Received!</p>
                    {app.package && <p className="text-sm font-bold text-green-600">{app.package}</p>}
                  </div>
                )}
              </div>

              {/* Progress Tracker */}
              {app.status !== 'rejected' && (
                <div className="flex items-center gap-1 mb-3">
                  {statusSteps.map((step, idx) => {
                    const currentIdx = getStepIndex(app.status);
                    const done = idx <= currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all
                          ${done ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                          {done && <CheckCircle size={11} />}
                          <span className="capitalize">{step.replace('_', ' ')}</span>
                        </div>
                        {idx < statusSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 ${idx < currentIdx ? 'bg-primary-400' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {app.status === 'rejected' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-xs text-red-600">
                  Application was not selected. Keep applying to other companies!
                </div>
              )}

              {/* Interview Details */}
              {app.interviewDate && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2 flex items-center gap-2 mt-2">
                  <Calendar size={14} className="text-purple-500" />
                  <div>
                    <span className="text-xs font-medium text-purple-600">Interview Scheduled: </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {new Date(app.interviewDate).toLocaleDateString()} • {app.interviewMode || 'online'}
                    </span>
                  </div>
                </div>
              )}

              {/* Resume */}
              {app.resumeUrl && (
                <div className="mt-2">
                  <a href={`http://localhost:5000${app.resumeUrl}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary-500 hover:underline">
                    <FileText size={12} /> View submitted resume
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Apply Modal with Resume Upload */}
      <AnimatePresence>
        {applyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Apply to {applyModal.name}</h3>
                  <p className="text-sm text-gray-500">{applyModal.jobRole} • {applyModal.package}</p>
                </div>
                <button onClick={() => setApplyModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              {/* Company Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4 space-y-1">
                <p className="text-xs text-gray-500">Min CGPA: <span className="font-medium text-gray-700 dark:text-gray-300">{applyModal.eligibility?.minCGPA}</span></p>
                <p className="text-xs text-gray-500">Location: <span className="font-medium text-gray-700 dark:text-gray-300">{applyModal.location}</span></p>
                <p className="text-xs text-gray-500">Drive Date: <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(applyModal.driveDate).toLocaleDateString()}</span></p>
              </div>

              {/* Resume Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Resume <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                  <input type="file" id="resumeFile" className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setResume(e.target.files?.[0] || null)} />
                  <label htmlFor="resumeFile" className="cursor-pointer">
                    {resume ? (
                      <div className="flex items-center justify-center gap-2 text-primary-600">
                        <FileText size={18} />
                        <span className="text-sm font-medium">{resume.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <Upload size={24} className="mx-auto mb-1" />
                        <p className="text-sm">Click to upload resume (PDF, DOC)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setApplyModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button onClick={handleApply} disabled={uploading}
                  className="flex-1 btn-primary py-2.5 disabled:opacity-60">
                  {uploading ? 'Applying...' : 'Confirm Apply'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentPlacement;
