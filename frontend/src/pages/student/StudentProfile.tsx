import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, BookOpen, Award, Briefcase, ClipboardList, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import studentService, { StudentData } from '../../services/studentService';
import attendanceService from '../../services/attendanceService';

const placementBadge: Record<string, string> = {
  not_applied: 'bg-gray-100 text-gray-600',
  applied:     'bg-yellow-100 text-yellow-600',
  placed:      'bg-green-100 text-green-600',
};

const StudentProfile = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [student,    setStudent]    = useState<StudentData | null>(null);
  const [attSummary, setAttSummary] = useState<any[]>([]);
  const [marks,      setMarks]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'info' | 'attendance' | 'marks'>('info');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [stuRes, attRes, marksRes] = await Promise.all([
          studentService.getById(id),
          attendanceService.getStudentAttendance(id),
          attendanceService.getStudentMarks(id),
        ]);
        setStudent(stuRes.data.student);
        setAttSummary(attRes.data.summary || []);
        setMarks(marksRes.data.marks || []);
      } catch {
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!student) return null;

  const avgAttendance = attSummary.length > 0
    ? Math.round(attSummary.reduce((s, x) => s + x.percentage, 0) / attSummary.length)
    : 0;

  // Group marks by subject
  const subjectMarks: Record<string, any[]> = {};
  marks.forEach(m => {
    if (!subjectMarks[m.subject]) subjectMarks[m.subject] = [];
    subjectMarks[m.subject].push(m);
  });

  const marksChartData = Object.entries(subjectMarks).map(([subject, entries]) => {
    const avg = entries.reduce((s, e) => s + (e.marksObtained / e.totalMarks) * 100, 0) / entries.length;
    return { subject: subject.length > 10 ? subject.slice(0, 10) + '…' : subject, avg: Math.round(avg) };
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition font-medium">
        <ArrowLeft size={15} /> Back to Students
      </button>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-colored">
            {student.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.user?.name}</h2>
            <p className="text-gray-400 font-mono text-sm mt-0.5">{student.rollNumber}</p>
            <div className="flex items-center flex-wrap gap-2 mt-2.5">
              <span className={`badge capitalize ${
                student.placementStatus === 'placed'  ? 'badge-green' :
                student.placementStatus === 'applied' ? 'badge-yellow' : 'badge-gray'
              }`}>
                <Briefcase size={11} />
                {(student.placementStatus || 'not applied').replace('_', ' ')}
              </span>
              <span className="badge badge-blue">{student.department}</span>
              <span className="badge badge-purple">Sem {student.semester}</span>
            </div>
          </div>
          <div className="flex gap-6 text-center flex-shrink-0">
            <div>
              <p className="text-2xl font-bold text-primary-600">{student.cgpa?.toFixed(1)}</p>
              <p className="text-xs text-gray-400 mt-0.5">CGPA</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${avgAttendance >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>{avgAttendance}%</p>
              <p className="text-xs text-gray-400 mt-0.5">Attendance</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
        {([
          { id: 'info',       label: 'Info',       icon: BookOpen },
          { id: 'attendance', label: 'Attendance', icon: ClipboardList },
          { id: 'marks',      label: 'Marks',      icon: TrendingUp },
        ] as const).map(({ id: tid, label, icon: Icon }) => (
          <button key={tid} onClick={() => setActiveTab(tid)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tid ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Mail,     label: 'Email',      value: student.user?.email },
              { icon: Phone,    label: 'Phone',      value: student.phone || 'N/A' },
              { icon: BookOpen, label: 'Department', value: student.department },
              { icon: BookOpen, label: 'Semester',   value: `Semester ${student.semester}` },
              { icon: BookOpen, label: 'Batch',      value: student.batch },
              { icon: Award,    label: 'CGPA',       value: student.cgpa?.toFixed(2) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Icon size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {attSummary.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">No attendance records found</div>
          ) : (
            <>
              <div className="card">
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Subject-wise Attendance</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={attSummary.map(s => ({
                    sub: s.subject.length > 10 ? s.subject.slice(0, 10) + '…' : s.subject,
                    pct: s.percentage,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="sub" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Attendance']} />
                    <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                      {attSummary.map((s, i) => (
                        <Cell key={i} fill={s.percentage < 75 ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2 text-center">🟢 ≥75% Safe &nbsp; 🔴 &lt;75% Defaulter</p>
              </div>
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Subject', 'Present', 'Total', 'Attendance %'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attSummary.map((s, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{s.subject}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{s.present}</td>
                        <td className="px-4 py-3 text-gray-500">{s.total}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.percentage >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {s.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Marks Tab */}
      {activeTab === 'marks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {marks.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">No marks records found</div>
          ) : (
            <>
              {marksChartData.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Subject-wise Performance</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={marksChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
                      <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                        {marksChartData.map((d, i) => (
                          <Cell key={i} fill={d.avg < 60 ? '#ef4444' : d.avg < 75 ? '#f59e0b' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Subject', 'Exam Type', 'Marks Obtained', 'Total Marks', 'Percentage'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, i) => {
                      const pct = Math.round((m.marksObtained / m.totalMarks) * 100);
                      return (
                        <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{m.subject}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{m.examType?.replace('internal', 'Internal ')}</td>
                          <td className="px-4 py-3 font-semibold text-primary-600">{m.marksObtained}</td>
                          <td className="px-4 py-3 text-gray-500">{m.totalMarks}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pct >= 75 ? 'bg-green-100 text-green-600' : pct >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StudentProfile;
