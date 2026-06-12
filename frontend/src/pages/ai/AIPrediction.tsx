import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, ClipboardList, Briefcase,
  AlertTriangle, CheckCircle, Loader, Info,
  RefreshCw, User, Shield, Sparkles,
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { aiService, PredictionInput } from '../../services/aiService';
import studentService from '../../services/studentService';
import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────
interface PredictionResult {
  performance: { label: string; confidence: number; score: number; recommendations: string[] };
  attendance:  { risk_level: string; risk_percentage: number; is_defaulter: boolean };
  placement:   { score: number; badge: string };
}

const PERF_COLORS: Record<string, string> = {
  excellent: 'text-green-500', good: 'text-blue-500',
  average:   'text-yellow-500', poor: 'text-red-500',
};
const PERF_BG: Record<string, string> = {
  excellent: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  good:      'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  average:   'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  poor:      'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
};

// ── Score Gauge ────────────────────────────────────────────
const ScoreGauge = ({ value, color, label }: { value: number; color: string; label: string }) => {
  const data = [
    { name: label,   value,         fill: color },
    { name: 'empty', value: 100 - value, fill: '#e5e7eb' },
  ];
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={110} height={110}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
          data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={6} />
          <Tooltip formatter={(v: any) => [`${v}`, label]} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-2xl font-bold -mt-7" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500 mt-1 text-center">{label}</p>
    </div>
  );
};

// ── Input Field (for admin/faculty manual input) ───────────
const InputField = ({
  label, name, value, onChange, min, max, step = 0.1, hint, disabled = false,
}: {
  label: string; name: string; value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number; max: number; step?: number; hint?: string; disabled?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
      {hint && <span className="text-xs text-gray-400 ml-1">({hint})</span>}
    </label>
    <input type="number" name={name} value={value} onChange={onChange}
      min={min} max={max} step={step} disabled={disabled}
      className="input-field w-full disabled:opacity-60 disabled:cursor-not-allowed" />
    <input type="range" name={name} value={value} onChange={onChange}
      min={min} max={max} step={step} disabled={disabled}
      className="w-full mt-1 accent-primary-500 cursor-pointer disabled:opacity-60" />
  </div>
);

// ── Student Info Banner ────────────────────────────────────
const StudentBanner = ({ student, autoLoaded }: { student: any; autoLoaded: boolean }) => (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20
               border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex items-center gap-4">
    <div className="bg-primary-500 p-2.5 rounded-full text-white flex-shrink-0">
      <User size={20} />
    </div>
    <div className="flex-1">
      <p className="font-semibold text-gray-800 dark:text-white">
        {student?.user?.name || 'Student'}
        {autoLoaded && (
          <span className="ml-2 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400
                           px-2 py-0.5 rounded-full font-normal">
            Auto-loaded
          </span>
        )}
      </p>
      <p className="text-sm text-gray-500">
        {student?.rollNumber} &bull; {student?.department} &bull; Sem {student?.semester}
      </p>
    </div>
    <div className="text-right">
      <p className="text-2xl font-bold text-primary-600">{student?.cgpa || '—'}</p>
      <p className="text-xs text-gray-500">CGPA</p>
    </div>
  </motion.div>
);

// ── Main Component ─────────────────────────────────────────
const AIPrediction = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isStudent = user?.role === 'student';

  // Admin ko yahan kuch kaam nahi — analytics pe bhejo
  useEffect(() => {
    if (user?.role === 'admin') navigate('/analytics', { replace: true });
  }, [user, navigate]);

  const [form, setForm] = useState<PredictionInput>({
    attendance_pct: 78, internal1_marks: 22, internal2_marks: 20,
    assignment_avg: 7.5, cgpa: 7.2, study_hours: 4, backlogs: 0,
  });

  const [result,       setResult]       = useState<PredictionResult | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [offline,      setOffline]      = useState(false);
  const [error,        setError]        = useState('');
  const [studentData,  setStudentData]  = useState<any>(null);
  const [autoLoaded,   setAutoLoaded]   = useState(false);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');

  // Faculty: student list
  const [studentList,     setStudentList]     = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentLoading,  setStudentLoading]  = useState(false);

  // ── Fetch student list for faculty ──────────────────────
  useEffect(() => {
    if (user?.role === 'faculty' || user?.role === 'admin') {
      studentService.getAll().then(res => {
        const list = res.data.students || [];
        setStudentList(list);
        // Auto-select student passed from Faculty Dashboard
        const preselect = (location.state as any)?.studentId;
        if (preselect) {
          setSelectedStudent(preselect);
          loadFacultyStudentData(preselect);
        }
      }).catch(() => {});
    }
  }, [user]); // eslint-disable-line

  const loadFacultyStudentData = async (studentId: string) => {
    if (!studentId) return;
    setStudentLoading(true);
    setError('');
    setResult(null);
    try {
      const stuRes = await studentService.getById(studentId);
      const mine   = stuRes.data.student;
      setStudentData(mine);

      let avgAtt = mine.cgpa ? Math.min(95, Math.max(60, Math.round(mine.cgpa * 10))) : 75;
      try {
        const attRes = await attendanceService.getStudentAttendance(mine._id);
        const summary: any[] = attRes.data.summary || [];
        if (summary.length > 0)
          avgAtt = Math.round(summary.reduce((s: number, x: any) => s + x.percentage, 0) / summary.length);
      } catch {}

      let avgI1 = 20, avgI2 = 20;
      try {
        const marksRes = await attendanceService.getStudentMarks(mine._id);
        const marks: any[] = marksRes.data.marks || [];
        const i1 = marks.filter((m: any) => m.examType === 'internal1');
        const i2 = marks.filter((m: any) => m.examType === 'internal2');
        if (i1.length > 0) avgI1 = Math.round(i1.reduce((s: number, m: any) => s + (m.marksObtained / m.totalMarks) * 30, 0) / i1.length);
        if (i2.length > 0) avgI2 = Math.round(i2.reduce((s: number, m: any) => s + (m.marksObtained / m.totalMarks) * 30, 0) / i2.length);
      } catch {}

      setForm(prev => ({
        ...prev,
        attendance_pct:  avgAtt,
        internal1_marks: avgI1,
        internal2_marks: avgI2,
        cgpa:            mine.cgpa || 7.0,
      }));
      setAutoLoaded(true);
      setSuccessMsg(`Data loaded for ${mine.user?.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setError('Failed to load student data');
    } finally { setStudentLoading(false); }
  };

  // ── Auto-load student data for student role ────────────────────────────────
  const loadStudentData = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    setDataLoading(true);
    setError('');
    try {
      const res = await studentService.getMe();
      const mine = res.data.student;

      if (!mine) {
        setError('Student profile not found. Please contact admin.');
        return;
      }

      setStudentData(mine);

      // Get attendance summary
      let avgAtt = mine.cgpa ? Math.min(95, Math.max(60, Math.round(mine.cgpa * 10))) : 75;
      try {
        const attRes = await attendanceService.getMyAttendance();
        const summary: any[] = attRes.data.summary || [];
        if (summary.length > 0)
          avgAtt = Math.round(summary.reduce((sum: number, s: any) => sum + s.percentage, 0) / summary.length);
      } catch { /* use default */ }

      // Get marks
      let avgI1 = 20, avgI2 = 20;
      try {
        const marksRes = await attendanceService.getMyMarks();
        const marks: any[] = marksRes.data.marks || [];
        const i1Marks = marks.filter((m: any) => m.examType === 'internal1');
        const i2Marks = marks.filter((m: any) => m.examType === 'internal2');
        if (i1Marks.length > 0)
          avgI1 = Math.round(i1Marks.reduce((s: number, m: any) => s + (m.marksObtained / m.totalMarks) * 30, 0) / i1Marks.length);
        if (i2Marks.length > 0)
          avgI2 = Math.round(i2Marks.reduce((s: number, m: any) => s + (m.marksObtained / m.totalMarks) * 30, 0) / i2Marks.length);
      } catch { /* use default */ }

      setForm(prev => ({
        ...prev,
        attendance_pct:  avgAtt,
        internal1_marks: avgI1,
        internal2_marks: avgI2,
        cgpa:            mine.cgpa || 7.0,
      }));
      setAutoLoaded(true);
      setSuccessMsg('Your academic data loaded!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      setError(msg || 'Failed to load your data. You can enter values manually.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setOffline(false);
    setError('');
    try {
      const res = await aiService.predictFull(form);
      if (res.data.success) {
        setResult(res.data);
        setSuccessMsg('AI Prediction complete!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(res.data.message || 'Prediction failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 503 || msg.includes('offline') || msg.includes('not running') || msg.includes('ECONNREFUSED')) {
        // AI service offline — use local calculation
        const local = calcLocalPrediction(form);
        setResult(local);
        setOffline(true);
        setSuccessMsg('Prediction done (local mode — AI service offline)');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError('Prediction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Local fallback prediction when AI service is offline
  const calcLocalPrediction = (f: PredictionInput): PredictionResult => {
    const perfScore = Math.min(100, Math.max(0, Math.round(
      (f.attendance_pct / 100) * 25 +
      ((f.internal1_marks + f.internal2_marks) / 60) * 35 +
      (f.cgpa / 10) * 30 +
      (f.study_hours / 8) * 10 -
      f.backlogs * 2
    )));

    const label = perfScore >= 80 ? 'excellent' : perfScore >= 60 ? 'good' : perfScore >= 40 ? 'average' : 'poor';

    const placeScore = Math.min(100, Math.max(0, Math.round(
      (f.cgpa / 10) * 40 +
      (f.attendance_pct / 100) * 20 +
      (f.study_hours / 8) * 20 +
      ((f.internal1_marks + f.internal2_marks) / 60) * 20 -
      f.backlogs * 5
    )));
    const placeBadge = placeScore >= 80 ? 'Highly Ready' : placeScore >= 60 ? 'Ready' : placeScore >= 40 ? 'Partially Ready' : 'Not Ready';

    const recs: string[] = [];
    if (f.attendance_pct < 75) recs.push('WARNING: Attendance below 75% — risk of detention!');
    if (f.cgpa < 6.0) recs.push('CGPA is low — focus on weak subjects and seek faculty guidance.');
    if (f.backlogs > 0) recs.push(`Clear ${f.backlogs} backlog(s) as soon as possible.`);
    if (f.study_hours < 3) recs.push('Increase daily study hours to at least 3-4 hours.');
    if (label === 'excellent') recs.push('Excellent performance! Consider applying for scholarships.');
    else if (label === 'good') recs.push('Good performance! Push a little harder to reach excellent.');
    else if (label === 'average') recs.push('Average performance — consistent effort can move you to good.');
    else recs.push('Poor performance — seek immediate help from faculty and counselor.');
    if (recs.length === 0) recs.push('Keep up the good work and maintain consistency!');

    return {
      performance: { label, confidence: 85, score: perfScore, recommendations: recs },
      attendance:  { risk_level: f.attendance_pct < 75 ? 'at_risk' : 'safe', risk_percentage: Math.max(0, Math.round(100 - f.attendance_pct)), is_defaulter: f.attendance_pct < 75 },
      placement:   { score: placeScore, badge: placeBadge },
    };
  };

  return (
    <div className="space-y-6">

      {/* Success Message */}
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-sm text-green-700 dark:text-green-400">{successMsg}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </motion.div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-3 rounded-xl text-white">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Prediction System</h2>
            <p className="text-sm text-gray-500">
              {isStudent ? 'Your personalized academic analysis' : 'Powered by scikit-learn RandomForest models'}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          ${isStudent
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
          {isStudent ? <User size={13} /> : <Shield size={13} />}
          {isStudent ? 'Student View' : `${user?.role} View`}
        </div>
      </div>

      {/* ── Student Selector (faculty only) ── */}
      {!isStudent && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} className="text-primary-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Select Student</h3>
          </div>
          <div className="flex gap-3">
            <select
              className="input-field flex-1"
              value={selectedStudent}
              onChange={e => {
                setSelectedStudent(e.target.value);
                loadFacultyStudentData(e.target.value);
              }}
            >
              <option value="">-- Select a student --</option>
              {studentList.map(s => (
                <option key={s._id} value={s._id}>
                  {s.user?.name} — {s.rollNumber} ({s.department}, Sem {s.semester})
                </option>
              ))}
            </select>
            {studentLoading && <Loader size={20} className="animate-spin text-primary-500 flex-shrink-0 self-center" />}
          </div>
          {studentData && selectedStudent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {studentData.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{studentData.user?.name}</p>
                <p className="text-xs text-gray-500">{studentData.rollNumber} &bull; {studentData.department} &bull; Sem {studentData.semester}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-600">{studentData.cgpa?.toFixed(1)}</p>
                <p className="text-xs text-gray-400">CGPA</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── Student Banner (student role only) ── */}
      {isStudent && dataLoading && (
        <div className="card flex items-center gap-3 text-gray-500">
          <Loader size={16} className="animate-spin text-primary-500" />
          <span className="text-sm">Loading your academic data...</span>
        </div>
      )}
      {isStudent && studentData && !dataLoading && (
        <StudentBanner student={studentData} autoLoaded={autoLoaded} />
      )}

      {/* ── Offline Warning ── */}
      {offline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-orange-700 dark:text-orange-400">AI Service Offline — Using Local Prediction</p>
            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
              Results are calculated locally. Start Python AI service for ML-powered predictions.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Input Form ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-primary-500" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                {isStudent ? 'Your Academic Data' : 'Enter Student Data'}
              </h3>
            </div>
            {isStudent && autoLoaded && (
              <button onClick={loadStudentData} disabled={dataLoading}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors">
                <RefreshCw size={12} className={dataLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            )}
          </div>

          {/* Student note */}
          {isStudent && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                            rounded-lg p-3 flex items-start gap-2">
              <Sparkles size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {autoLoaded
                  ? 'Attendance, Marks & CGPA are auto-filled from your records (locked 🔒). Adjust Study Hours & Backlogs for accurate prediction.'
                  : 'Enter your academic details below to get an AI-powered performance analysis.'}
              </p>
            </div>
          )}

          <InputField label="Attendance %" name="attendance_pct" value={form.attendance_pct}
            onChange={handleChange} min={0} max={100} hint="0-100"
            disabled={isStudent && autoLoaded} />

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Internal 1 Marks" name="internal1_marks" value={form.internal1_marks}
              onChange={handleChange} min={0} max={30} hint="out of 30"
              disabled={isStudent && autoLoaded} />
            <InputField label="Internal 2 Marks" name="internal2_marks" value={form.internal2_marks}
              onChange={handleChange} min={0} max={30} hint="out of 30"
              disabled={isStudent && autoLoaded} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Assignment Avg" name="assignment_avg" value={form.assignment_avg}
              onChange={handleChange} min={0} max={10} hint="out of 10" />
            <InputField label="CGPA" name="cgpa" value={form.cgpa}
              onChange={handleChange} min={0} max={10} hint="0-10"
              disabled={isStudent && autoLoaded} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Study Hours/Day" name="study_hours" value={form.study_hours}
              onChange={handleChange} min={0} max={12} hint="hrs" />
            <InputField label="Backlogs" name="backlogs" value={form.backlogs}
              onChange={handleChange} min={0} max={10} step={1} hint="count" />
          </div>

          <button onClick={handlePredict} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading
              ? <><Loader size={18} className="animate-spin" /> Analyzing...</>
              : <><Brain size={18} /> {isStudent ? 'Analyze My Performance' : 'Run AI Prediction'}</>
            }
          </button>
        </motion.div>

        {/* ── Results Panel ── */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} className="space-y-4">

              {/* Score Gauges */}
              <div className="card">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
                  {isStudent ? 'Your Scores' : 'Prediction Scores'}
                </h3>
                <div className="flex justify-around">
                  <ScoreGauge value={result.performance.score} color="#3b82f6" label="Performance" />
                  <ScoreGauge value={result.placement.score}   color="#8b5cf6" label="Placement" />
                  <ScoreGauge
                    value={Math.round(100 - result.attendance.risk_percentage)}
                    color={result.attendance.is_defaulter ? '#ef4444' : '#22c55e'}
                    label="Att. Safety"
                  />
                </div>
              </div>

              {/* Performance */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`card border ${PERF_BG[result.performance.label]}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className={PERF_COLORS[result.performance.label]} />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {isStudent ? 'Your Performance' : 'Performance'}
                    </span>
                  </div>
                  <span className={`text-lg font-bold capitalize ${PERF_COLORS[result.performance.label]}`}>
                    {result.performance.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">AI Confidence: {result.performance.confidence}%</p>
                  <p className="text-xs text-gray-500">Score: {result.performance.score}/100</p>
                </div>
              </motion.div>

              {/* Attendance Risk */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className={`card border ${result.attendance.is_defaulter
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={18} className={result.attendance.is_defaulter ? 'text-red-500' : 'text-green-500'} />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Attendance Risk</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${result.attendance.is_defaulter ? 'text-red-500' : 'text-green-500'}`}>
                      {result.attendance.risk_level === 'at_risk' ? 'At Risk' : 'Safe'}
                    </p>
                    <p className="text-xs text-gray-500">Risk: {result.attendance.risk_percentage}%</p>
                  </div>
                </div>
                {result.attendance.is_defaulter && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    Attendance below 75% — risk of detention!
                  </p>
                )}
              </motion.div>

              {/* Placement */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {isStudent ? 'Your Placement Readiness' : 'Placement Readiness'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{result.placement.score}/100</p>
                    <p className="text-xs text-gray-500">{result.placement.badge}</p>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card flex flex-col items-center justify-center py-16 text-center">
              <Brain size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {isStudent ? 'Click "Analyze My Performance"' : 'Enter student data and click'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isStudent ? 'to get your AI-powered analysis' : '"Run AI Prediction" to see results'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Recommendations ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-primary-500" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                {isStudent ? 'Personalized Recommendations for You' : 'AI Recommendations'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.performance.recommendations.map((rec, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                </motion.div>
              ))}
            </div>

            {/* Student motivational footer */}
            {isStudent && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700
                              flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                <Sparkles size={16} />
                <span>Keep working hard — every improvement counts towards your future!</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPrediction;
