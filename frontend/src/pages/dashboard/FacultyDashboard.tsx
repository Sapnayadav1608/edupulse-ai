import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, ClipboardList, AlertTriangle, Brain, RefreshCw, TrendingUp, CheckCircle, Eye, Wifi, WifiOff, Zap, Target, Award, ArrowRight } from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import { useAuth } from '../../context/AuthContext';
import attendanceService from '../../services/attendanceService';
import studentService from '../../services/studentService';
import { analyticsService } from '../../services/analyticsService';
import { aiService } from '../../services/aiService';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const GRADE_COLORS: Record<string, string> = {
  excellent: '#22c55e', good: '#3b82f6', average: '#f59e0b', poor: '#ef4444',
};

const RiskBadge = ({ pct }: { pct: number }) => {
  if (pct < 65) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Critical</span>;
  if (pct < 75) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">Warning</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">Safe</span>;
};

const FacultyDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [students,     setStudents]     = useState<any[]>([]);
  const [defaulters,   setDefaulters]   = useState<any[]>([]);
  const [subjectPerf,  setSubjectPerf]  = useState<any[]>([]);
  const [assignments,  setAssignments]  = useState<any[]>([]);
  const [aiRiskList,   setAiRiskList]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [avgAtt,       setAvgAtt]       = useState(0);
  const [aiOnline,     setAiOnline]     = useState<boolean | null>(null);
  const [showAllRisk,  setShowAllRisk]  = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stuRes, defRes, subjRes, asgRes, reportRes] = await Promise.allSettled([
        studentService.getAll(),
        attendanceService.getDefaulters({ withMarks: true }),
        analyticsService.getSubjectPerformance(),
        api.get('/lms/assignments'),
        attendanceService.getReport(),
      ]);

      const stuList  = stuRes.status  === 'fulfilled' ? stuRes.value.data.students   || [] : [];
      const defList  = defRes.status  === 'fulfilled' ? defRes.value.data.defaulters || [] : [];
      const report   = reportRes.status === 'fulfilled' ? reportRes.value.data.report || [] : [];

      setStudents(stuList);
      setDefaulters(defList);
      setSubjectPerf(subjRes.status === 'fulfilled' ? subjRes.value.data.performance || [] : []);
      setAssignments(asgRes.status  === 'fulfilled' ? asgRes.value.data.assignments  || [] : []);

      if (report.length > 0) {
        const avg = Math.round(report.reduce((s: number, r: any) => s + r.percentage, 0) / report.length);
        setAvgAtt(avg);
      }

      runAIRisk(defList);
    } catch (err) {
      console.error('Faculty dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const runAIRisk = async (defList: any[]) => {
    if (defList.length === 0) return;
    setAiLoading(true);
    // Check AI health first
    try {
      await aiService.checkHealth();
      setAiOnline(true);
    } catch { setAiOnline(false); }

    try {
      const results = await Promise.allSettled(
        defList.map((d: any) => {
          const m = d.marksData || {};
          return aiService.predictFull({
            attendance_pct:  d.percentage,
            internal1_marks: m.internal1_marks ?? 15,
            internal2_marks: m.internal2_marks ?? 15,
            assignment_avg:  m.assignment_avg  ?? 5,
            cgpa:            m.cgpa            ?? 5.5,
            study_hours:     3,
            backlogs:        d.percentage < 60 ? 2 : 1,
          });
        })
      );
      setAiRiskList(defList.map((d: any, i: number) => {
        const res = results[i];
        const ai  = res.status === 'fulfilled' ? res.value.data : null;
        return {
          student:       d.student,
          attendance:    d.percentage,
          aiLabel:       ai?.performance?.label    || 'unknown',
          aiScore:       ai?.performance?.score    || 0,
          placementScore:ai?.placement?.score      || 0,
          placementBadge:ai?.placement?.badge      || '—',
          riskLevel:     ai?.attendance?.risk_level || 'unknown',
          hasRealData:   d.marksData?.hasRealData  || false,
        };
      }));
    } catch { /* AI offline */ }
    finally { setAiLoading(false); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalSubmissions = assignments.reduce((s: number, a: any) => s + (a.submissions?.length || 0), 0);
  const weakSubjects     = subjectPerf.filter(s => s.avgMarks < 60).length;

  const gradeDistribution = [
    { name: 'Excellent (>85)', value: subjectPerf.filter(s => s.avgMarks > 85).length,                          color: '#22c55e' },
    { name: 'Good (70-85)',    value: subjectPerf.filter(s => s.avgMarks >= 70 && s.avgMarks <= 85).length,     color: '#3b82f6' },
    { name: 'Average (55-70)', value: subjectPerf.filter(s => s.avgMarks >= 55 && s.avgMarks < 70).length,      color: '#f59e0b' },
    { name: 'Poor (<55)',      value: subjectPerf.filter(s => s.avgMarks < 55).length,                          color: '#ef4444' },
  ].filter(g => g.value > 0);

  const stats = [
    { title: 'Total Students',      value: students.length,      icon: Users,         color: 'bg-blue-500',   change: 'All departments' },
    { title: 'Avg Attendance',       value: `${avgAtt}%`,         icon: ClipboardList, color: avgAtt >= 75 ? 'bg-green-500' : 'bg-red-500', change: `${defaulters.length} defaulters` },
    { title: 'Assignments Posted',   value: assignments.length,   icon: BookOpen,      color: 'bg-purple-500', change: `${totalSubmissions} submissions` },
    { title: 'Weak Subjects',        value: weakSubjects,         icon: AlertTriangle, color: weakSubjects > 0 ? 'bg-orange-500' : 'bg-green-500', change: 'Below 60% avg' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-primary-500 mx-auto" />
        <p className="text-gray-500">Loading faculty dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Faculty Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Welcome, {user?.name} — Class monitoring & AI analytics</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatsCard key={s.title} {...s} index={i} />)}
      </div>

      {/* AI At-Risk Panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card border border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-lg text-white">
              <Brain size={16} />
            </div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">AI At-Risk Student Detection</h3>
            {aiLoading && <RefreshCw size={13} className="animate-spin text-red-500" />}
          </div>
          <div className="flex items-center gap-2">
            {/* AI Service Health Indicator */}
            {aiOnline !== null && (
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                aiOnline
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {aiOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                {aiOnline ? 'AI Online' : 'Local Mode'}
              </span>
            )}
            <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
              {defaulters.length} flagged
            </span>
          </div>
        </div>

        {aiRiskList.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-red-100 dark:border-red-900/30">
                    {['Student', 'Attendance', 'AI Performance', 'Perf. Score', 'Placement', 'Risk', 'Action'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAllRisk ? aiRiskList : aiRiskList.slice(0, 5)).map((r: any, i: number) => (
                    <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-red-50 dark:border-red-900/20 hover:bg-red-50/50 dark:hover:bg-red-900/10">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {r.student?.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200 text-xs leading-tight">{r.student?.user?.name || 'Unknown'}</p>
                            <p className="text-gray-400 text-xs font-mono">{r.student?.rollNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${r.attendance}%`, backgroundColor: r.attendance < 65 ? '#ef4444' : r.attendance < 75 ? '#f59e0b' : '#22c55e' }} />
                          </div>
                          <span className="font-semibold text-xs" style={{ color: r.attendance < 65 ? '#ef4444' : r.attendance < 75 ? '#f59e0b' : '#22c55e' }}>
                            {r.attendance}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="capitalize font-medium text-xs" style={{ color: GRADE_COLORS[r.aiLabel] || '#6b7280' }}>{r.aiLabel}</span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${r.aiScore}%`, backgroundColor: GRADE_COLORS[r.aiLabel] || '#6b7280' }} />
                          </div>
                          <span className="text-xs text-gray-500">{r.aiScore}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <Target size={11} className="text-purple-400" />
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{r.placementScore}</span>
                          <span className="text-gray-400 text-xs hidden sm:inline">— {r.placementBadge}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3"><RiskBadge pct={r.attendance} /></td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate('/ai-prediction', { state: { studentId: r.student?._id } })}
                            className="text-xs bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md flex items-center gap-1 transition-colors">
                            <Brain size={11} /> AI
                          </button>
                          <button onClick={() => navigate(`/students/${r.student?._id}`)}
                            className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1">
                            <Eye size={11} /> View
                          </button>
                          {!r.hasRealData && (
                            <span className="text-xs text-yellow-500" title="Marks not entered — estimated values used">⚠️</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {aiRiskList.length > 5 && (
              <button onClick={() => setShowAllRisk(v => !v)}
                className="mt-3 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto">
                {showAllRisk ? 'Show less' : `Show all ${aiRiskList.length} at-risk students`}
                <ArrowRight size={11} className={showAllRisk ? 'rotate-90' : ''} />
              </button>
            )}
          </>
        ) : aiLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-red-100 dark:bg-red-900/20 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600 py-4">
            <CheckCircle size={18} />
            <span className="text-sm">No at-risk students detected — great job!</span>
          </div>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Subject-wise Avg Performance (%)</h3>
          {subjectPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectPerf.slice(0, 8).map(s => ({
                name: s.subject.length > 8 ? s.subject.slice(0, 8) + '…' : s.subject,
                avg:  s.avgMarks,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Marks']} />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {subjectPerf.slice(0, 8).map((s, i) => (
                    <Cell key={i} fill={s.avgMarks < 60 ? '#ef4444' : s.avgMarks < 75 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No subject data yet</div>
          )}
        </motion.div>

        {/* Grade Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Subject Grade Distribution</h3>
          {gradeDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={gradeDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                    {gradeDistribution.map((g, i) => <Cell key={i} fill={g.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {gradeDistribution.map(g => (
                  <div key={g.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{g.name}: <strong>{g.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No grade data yet</div>
          )}
        </motion.div>
      </div>

      {/* Defaulters + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defaulters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Attendance Defaulters</h3>
            {defaulters.length > 0 && (
              <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{defaulters.length}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Student', 'Roll No', 'Attendance', 'Risk'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-sm">No defaulters found 🎉</td></tr>
                ) : defaulters.slice(0, 5).map((d: any, i: number) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">{d.student?.user?.name}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs font-mono">{d.student?.rollNumber}</td>
                    <td className="py-2 px-3 font-semibold text-red-500">{d.percentage}%</td>
                    <td className="py-2 px-3"><RiskBadge pct={d.percentage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {defaulters.length > 5 && (
            <button onClick={() => navigate('/attendance')} className="text-xs text-primary-500 hover:text-primary-700 mt-2 block text-center w-full">
              +{defaulters.length - 5} more — View full report
            </button>
          )}
        </motion.div>

        {/* AI Teaching Recommendations */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-1.5 rounded-lg text-white">
              <Zap size={14} />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">AI Teaching Recommendations</h3>
          </div>
          <div className="space-y-2.5">
            {([
              {
                icon: AlertTriangle,
                severity: defaulters.length > 5 ? 'high' : defaulters.length > 0 ? 'medium' : 'ok',
                color: defaulters.length > 5 ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : defaulters.length > 0 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'border-green-400 bg-green-50 dark:bg-green-900/10',
                iconColor: defaulters.length > 5 ? 'text-red-500' : defaulters.length > 0 ? 'text-orange-500' : 'text-green-500',
                label: defaulters.length > 5 ? 'Critical' : defaulters.length > 0 ? 'Warning' : 'Good',
                text: defaulters.length > 0
                  ? `${defaulters.length} students below 75% attendance. Schedule remedial sessions & send parent alerts immediately.`
                  : 'All students have adequate attendance. Keep monitoring weekly.',
              },
              {
                icon: TrendingUp,
                severity: weakSubjects > 3 ? 'high' : weakSubjects > 0 ? 'medium' : 'ok',
                color: weakSubjects > 3 ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : weakSubjects > 0 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'border-green-400 bg-green-50 dark:bg-green-900/10',
                iconColor: weakSubjects > 3 ? 'text-red-500' : weakSubjects > 0 ? 'text-orange-500' : 'text-green-500',
                label: weakSubjects > 3 ? 'Critical' : weakSubjects > 0 ? 'Warning' : 'Good',
                text: weakSubjects > 0
                  ? `${weakSubjects} subject(s) below 60% avg. Consider conducting extra revision classes & topic-wise tests.`
                  : 'All subjects performing above 60% average. Maintain current teaching pace.',
              },
              {
                icon: BookOpen,
                severity: totalSubmissions < assignments.length * (students.length * 0.5) ? 'medium' : 'ok',
                color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/10',
                iconColor: 'text-blue-500',
                label: 'Info',
                text: `${assignments.length} assignments posted — ${totalSubmissions} submissions received. ${
                  assignments.length > 0 && totalSubmissions < assignments.length
                    ? 'Follow up with students who haven\'t submitted yet.'
                    : 'Submission rate looks healthy.'
                }`,
              },
              {
                icon: Award,
                severity: aiRiskList.filter((r: any) => r.placementScore < 40).length > 0 ? 'medium' : 'ok',
                color: aiRiskList.filter((r: any) => r.placementScore < 40).length > 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' : 'border-purple-400 bg-purple-50 dark:bg-purple-900/10',
                iconColor: aiRiskList.filter((r: any) => r.placementScore < 40).length > 0 ? 'text-yellow-500' : 'text-purple-500',
                label: aiRiskList.filter((r: any) => r.placementScore < 40).length > 0 ? 'Action Needed' : 'Good',
                text: aiRiskList.filter((r: any) => r.placementScore < 40).length > 0
                  ? `${aiRiskList.filter((r: any) => r.placementScore < 40).length} at-risk student(s) have low placement readiness (<40). Conduct aptitude workshops & mock interviews.`
                  : 'At-risk students have decent placement scores. Focus on CGPA improvement for better outcomes.',
              },
            ] as Array<{ icon: any; severity: string; color: string; iconColor: string; label: string; text: string }>).map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.07 }}
                className={`border-l-4 ${item.color} rounded-r-lg pl-3 pr-3 py-2 flex items-start gap-2`}>
                <item.icon size={14} className={`${item.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <span className={`text-xs font-semibold ${item.iconColor} mr-1.5`}>{item.label}:</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{item.text}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
            <button onClick={() => navigate('/ai-prediction')}
              className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
              <Brain size={12} /> Full AI Analysis
            </button>
            <button onClick={() => navigate('/attendance')}
              className="flex items-center gap-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
              <ClipboardList size={12} /> Defaulter Report
            </button>
            <button onClick={() => navigate('/analytics')}
              className="flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
              <TrendingUp size={12} /> Full Analytics
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
