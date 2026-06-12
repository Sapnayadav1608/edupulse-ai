import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  BookOpen, ClipboardList, Briefcase, TrendingUp,
  AlertCircle, CheckCircle, Brain, Sparkles, RefreshCw,
  ChevronRight, Target, Zap, Award, Bell, Play, X,
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import lmsService from '../../services/lmsService';
import { aiService } from '../../services/aiService';
import api from '../../services/api';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const TAG_COLOR: Record<string, string> = {
  weak:    'bg-red-100 text-red-600',
  dept:    'bg-blue-100 text-blue-600',
  general: 'bg-gray-100 text-gray-600',
};

const AIInsightCard = ({ icon: Icon, title, value, sub, color }: any) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className={`rounded-xl p-4 border ${color} flex items-center gap-3`}>
    <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
      <Icon size={18} className="text-gray-700 dark:text-gray-200" />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
      <p className="font-bold text-gray-800 dark:text-white capitalize">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </motion.div>
);

const StudentDashboard = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [student,       setStudent]       = useState<any>(null);
  const [attSummary,    setAttSummary]    = useState<any[]>([]);
  const [marks,         setMarks]         = useState<any[]>([]);
  const [assignments,   setAssignments]   = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiResult,      setAiResult]      = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [recommended,   setRecommended]   = useState<any[]>([]);
  const [activeQuiz,    setActiveQuiz]    = useState<any | null>(null);
  const [quizAnswers,   setQuizAnswers]   = useState<number[]>([]);
  const [quizResult,    setQuizResult]    = useState<any | null>(null);
  const [quizSubmitting,setQuizSubmitting]= useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const stuRes = await studentService.getMe();
      const stu    = stuRes.data.student;
      setStudent(stu);

      const [attRes, marksRes, asgRes, notifRes] = await Promise.all([
        attendanceService.getMyAttendance(),
        attendanceService.getMyMarks(),
        lmsService.getAssignments({ department: stu.department, semester: stu.semester }),
        api.get('/notifications'),
      ]);

      const summary  = attRes.data.summary   || [];
      const markList = marksRes.data.marks   || [];
      const asgList  = asgRes.data.assignments || [];

      setAttSummary(summary);
      setMarks(markList);
      setAssignments(asgList);
      setNotifications((notifRes.data.notifications || []).slice(0, 4));

      // Fetch recommended quizzes
      try {
        const recRes = await lmsService.getRecommendedQuizzes();
        setRecommended(recRes.data.quizzes || []);
      } catch { /* ignore */ }

      runAIPrediction(stu, summary, markList);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const runAIPrediction = async (stu: any, summary: any[], marksList: any[]) => {
    setAiLoading(true);
    try {
      const avgAtt = summary.length > 0
        ? Math.round(summary.reduce((s: number, x: any) => s + x.percentage, 0) / summary.length)
        : 75;
      const i1 = marksList.filter((m: any) => m.examType === 'internal1');
      const i2 = marksList.filter((m: any) => m.examType === 'internal2');
      const avgI1 = i1.length > 0 ? Math.round(i1.reduce((s: number, m: any) => s + (m.marksObtained / m.totalMarks) * 30, 0) / i1.length) : 20;
      const avgI2 = i2.length > 0 ? Math.round(i2.reduce((s: number, m: any) => s + (m.marksObtained / m.totalMarks) * 30, 0) / i2.length) : 20;

      const res = await aiService.predictFull({
        attendance_pct:  avgAtt,
        internal1_marks: avgI1,
        internal2_marks: avgI2,
        assignment_avg:  7.5,
        cgpa:            stu.cgpa || 7.0,
        study_hours:     4,
        backlogs:        0,
      });
      if (res.data.success) setAiResult(res.data);
    } catch { /* AI offline */ }
    finally { setAiLoading(false); }
  };

  const startRecommendedQuiz = async (quizId: string) => {
    try {
      const { data } = await lmsService.getQuizById(quizId);
      setActiveQuiz(data.quiz);
      setQuizAnswers(new Array(data.quiz.questions.length).fill(-1));
      setQuizResult(null);
    } catch { alert('Failed to load quiz'); }
  };

  const submitRecommendedQuiz = async () => {
    if (!activeQuiz) return;
    setQuizSubmitting(true);
    try {
      const { data } = await lmsService.attemptQuiz(activeQuiz._id, quizAnswers);
      setQuizResult(data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Attempt failed');
    } finally { setQuizSubmitting(false); }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived
  const avgAttendance = attSummary.length > 0
    ? Math.round(attSummary.reduce((s, x) => s + x.percentage, 0) / attSummary.length)
    : 0;

  // Subject marks chart
  const subjectMarksMap: Record<string, { total: number; count: number }> = {};
  marks.forEach((m: any) => {
    if (!subjectMarksMap[m.subject]) subjectMarksMap[m.subject] = { total: 0, count: 0 };
    subjectMarksMap[m.subject].total += (m.marksObtained / m.totalMarks) * 100;
    subjectMarksMap[m.subject].count += 1;
  });
  const subjectChartData = Object.entries(subjectMarksMap).map(([sub, v]) => ({
    sub:   sub.length > 8 ? sub.slice(0, 8) + '…' : sub,
    marks: Math.round(v.total / v.count),
  }));
  const weakSubject = subjectChartData.length > 0
    ? subjectChartData.reduce((a, b) => a.marks < b.marks ? a : b)
    : null;

  // Pending assignments — check by student._id in submissions
  const pendingAssignments = assignments.filter((a: any) => {
    const submitted = a.submissions?.some(
      (s: any) => s.student === student?._id || s.student?._id === student?._id
    );
    return !submitted && new Date(a.dueDate) > new Date();
  });

  const stats = [
    {
      title:  'Attendance',
      value:  `${avgAttendance}%`,
      icon:   ClipboardList,
      color:  avgAttendance >= 75 ? 'bg-green-500' : 'bg-red-500',
      change: avgAttendance >= 75 ? 'Above 75% ✅' : 'Below 75% — At Risk ⚠️',
    },
    {
      title:  'Current CGPA',
      value:  student?.cgpa?.toFixed(1) || '—',
      icon:   TrendingUp,
      color:  'bg-blue-500',
      change: student?.cgpa >= 7.5 ? 'Good standing' : 'Needs improvement',
    },
    {
      title:  'Assignments Due',
      value:  String(pendingAssignments.length),
      icon:   BookOpen,
      color:  pendingAssignments.length > 0 ? 'bg-orange-500' : 'bg-green-500',
      change: pendingAssignments.length > 0 ? `${pendingAssignments.length} pending` : 'All submitted ✅',
    },
    {title:  'Placement Score',
      value:  aiResult ? `${aiResult.placement.score}/100` : student?.cgpa ? `${Math.min(100, Math.round(student.cgpa * 10))}%` : '—',
      icon:   Briefcase,
      color:  'bg-purple-500',
      change: aiResult ? aiResult.placement.badge : 'Based on CGPA',
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-primary-500 mx-auto" />
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {student?.department} • Semester {student?.semester} • {student?.rollNumber}
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatsCard key={s.title} {...s} index={i} />)}
      </div>

      {/* AI Panel */}
      <AnimatePresence>
        {(aiResult || aiLoading) ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-lg text-white">
                  <Brain size={16} />
                </div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">AI Analysis</h3>
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-2 py-0.5 rounded-full">Live</span>
              </div>
              {aiLoading && <RefreshCw size={14} className="animate-spin text-purple-500" />}
            </div>
            {aiLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
              </div>
            ) : aiResult && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <AIInsightCard icon={TrendingUp} title="Performance"
                    value={aiResult.performance.label} sub={`Score: ${aiResult.performance.score}/100`}
                    color="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" />
                  <AIInsightCard icon={Target} title="AI Confidence"
                    value={`${aiResult.performance.confidence}%`} sub="Model accuracy"
                    color="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" />
                  <AIInsightCard icon={ClipboardList} title="Attendance Risk"
                    value={aiResult.attendance.risk_level === 'at_risk' ? 'At Risk' : 'Safe'}
                    sub={`Risk: ${aiResult.attendance.risk_percentage}%`}
                    color={aiResult.attendance.is_defaulter
                      ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                      : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"} />
                  <AIInsightCard icon={Briefcase} title="Placement"
                    value={aiResult.placement.badge} sub={`Score: ${aiResult.placement.score}/100`}
                    color="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800" />
                </div>
                {/* Score progress bars */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Performance Score', value: aiResult.performance.score, color: '#3b82f6' },
                    { label: 'Placement Readiness', value: aiResult.placement.score, color: '#8b5cf6' },
                    { label: 'Attendance Safety', value: 100 - aiResult.attendance.risk_percentage, color: aiResult.attendance.is_defaulter ? '#ef4444' : '#22c55e' },
                  ].map((bar, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{bar.label}</span>
                        <span className="font-semibold" style={{ color: bar.color }}>{bar.value}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${bar.value}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="h-2 rounded-full" style={{ backgroundColor: bar.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : (
          /* AI offline fallback banner */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="card border border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain size={20} className="text-purple-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Analysis unavailable</p>
                <p className="text-xs text-gray-400">AI service may be offline. Check full analysis page.</p>
              </div>
            </div>
            <button onClick={() => navigate('/ai-prediction')}
              className="flex-shrink-0 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Try Analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Subject Performance</h3>
            {weakSubject && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Weak: {weakSubject.sub}</span>
            )}
          </div>
          {subjectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="sub" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} />
                <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                  {subjectChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.marks < 60 ? '#ef4444' : entry.marks < 75 ? '#f59e0b' : COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No marks data yet</div>
          )}
        </motion.div>

        {/* Attendance by Subject */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Attendance by Subject</h3>
          {attSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attSummary.map(s => ({
                sub: s.subject.length > 8 ? s.subject.slice(0, 8) + '…' : s.subject,
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
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No attendance data yet</div>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Above 75%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Below 75%</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Pending Assignments</h3>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
              {pendingAssignments.length} due
            </span>
          </div>
          <div className="space-y-3">
            {pendingAssignments.length > 0 ? pendingAssignments.slice(0, 4).map((a: any, i: number) => {
              const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    {daysLeft <= 1
                      ? <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                      : <CheckCircle size={15} className="text-gray-300 flex-shrink-0" />}
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.subject}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0
                    ${daysLeft <= 1 ? 'bg-red-100 text-red-600' : daysLeft <= 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                    {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
                  </span>
                </div>
              );
            }) : (
              <div className="flex items-center gap-2 text-green-600 py-4">
                <CheckCircle size={18} />
                <span className="text-sm">All assignments submitted!</span>
              </div>
            )}
          </div>
          {pendingAssignments.length > 0 && (
            <button onClick={() => navigate('/lms')} className="mt-3 text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1">
              <Zap size={12} /> Go to LMS to submit <ChevronRight size={12} />
            </button>
          )}
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-purple-500" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">AI Recommendations</h3>
          </div>
          <div className="space-y-2">
            {aiResult?.performance?.recommendations?.length > 0
              ? aiResult.performance.recommendations.slice(0, 4).map((rec: string, i: number) => {
                  const isWarning = rec.toLowerCase().includes('warning') || rec.toLowerCase().includes('below') || rec.toLowerCase().includes('risk');
                  const isGood    = rec.toLowerCase().includes('excellent') || rec.toLowerCase().includes('good') || rec.toLowerCase().includes('✅');
                  const borderColor = isWarning ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : isGood ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-primary-400 bg-blue-50 dark:bg-blue-900/10';
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={`border-l-4 ${borderColor} rounded-r-lg pl-3 pr-2 py-2`}>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{rec}</p>
                    </motion.div>
                  );
                })
              : [
                  { text: weakSubject ? `Focus on ${weakSubject.sub} — your lowest scoring subject` : 'Keep up consistent study habits', color: 'border-red-400 bg-red-50 dark:bg-red-900/10' },
                  { text: avgAttendance >= 75 ? 'Attendance is good! Maintain above 85%' : '⚠️ Attendance below 75% — attend all classes immediately', color: avgAttendance >= 75 ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-red-400 bg-red-50 dark:bg-red-900/10' },
                  { text: 'Practice DSA problems daily for placement preparation', color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' },
                  { text: 'Submit pending assignments before deadlines', color: 'border-orange-400 bg-orange-50 dark:bg-orange-900/10' },
                ].map((item, i) => (
                  <div key={i} className={`border-l-4 ${item.color} rounded-r-lg pl-3 pr-2 py-2`}>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{item.text}</p>
                  </div>
                ))
            }
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/ai-prediction')}
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors">
              <Zap size={12} /> View full AI analysis <ChevronRight size={12} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary-500" />
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Recent Notifications</h3>
            </div>
            <button onClick={() => navigate('/notifications')} className="text-xs text-primary-500 hover:text-primary-700">View all</button>
          </div>
          <div className="space-y-2">
            {notifications.map((n: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-primary-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{n.title}</p>
                  <p className="text-xs text-gray-400">{n.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommended Quizzes */}
      {recommended.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg text-white">
              <Sparkles size={15} />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Recommended for You</h3>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">AI Picked</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommended.map((quiz: any, i: number) => (
              <motion.div key={quiz._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLOR[quiz.tag] || TAG_COLOR.general}`}>
                    {quiz.tag === 'weak' ? '⚠️ Weak Subject' : quiz.tag === 'dept' ? '🎓 Your Dept' : '🌟 Explore'}
                  </span>
                  <span className="text-xs text-gray-400">{quiz.questions?.length || 0} Qs</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-1">{quiz.title}</h4>
                <p className="text-xs text-gray-400 mb-3">{quiz.reason}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>⏱ {quiz.duration} mins</span>
                  <span>🏆 {quiz.totalMarks} marks</span>
                </div>
                <button onClick={() => startRecommendedQuiz(quiz._id)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition">
                  <Play size={13} /> Start Quiz
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quiz Attempt Modal */}
      <AnimatePresence>
        {activeQuiz && !quizResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{activeQuiz.title}</h3>
                <button onClick={() => setActiveQuiz(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <p className="text-xs text-gray-400 mb-4">⏱ {activeQuiz.duration} mins &nbsp;|&nbsp; 📝 {activeQuiz.questions?.length} questions</p>
              <div className="space-y-5">
                {activeQuiz.questions?.map((q: any, qi: number) => (
                  <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="font-medium text-gray-800 dark:text-white mb-3">Q{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt: string, oi: number) => (
                        <label key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition
                          ${quizAnswers[qi] === oi
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                          <input type="radio" name={`q-${qi}`} checked={quizAnswers[qi] === oi}
                            onChange={() => { const a = [...quizAnswers]; a[qi] = oi; setQuizAnswers(a); }}
                            className="text-primary-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400">{quizAnswers.filter(a => a !== -1).length}/{activeQuiz.questions?.length} answered</p>
                <button onClick={submitRecommendedQuiz} disabled={quizSubmitting}
                  className="btn-primary px-6 py-2.5 disabled:opacity-60">
                  {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quiz Result Modal */}
      <AnimatePresence>
        {quizResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="text-6xl mb-4">{quizResult.score >= quizResult.totalMarks * 0.7 ? '🎉' : '📚'}</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Quiz Complete!</h3>
              <p className="text-5xl font-bold text-primary-600 my-4">
                {quizResult.score}<span className="text-2xl text-gray-400">/{quizResult.totalMarks}</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">{Math.round((quizResult.score / quizResult.totalMarks) * 100)}% score</p>
              <button onClick={() => { setQuizResult(null); setActiveQuiz(null); }} className="btn-primary w-full py-3">Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
