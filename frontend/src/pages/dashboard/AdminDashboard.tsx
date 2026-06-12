import React, { useState, useEffect } from 'react';
import { Users, BookOpen, ClipboardList, Briefcase, TrendingUp, Award, Brain, RefreshCw, AlertTriangle, CheckCircle, XCircle, GraduationCap, ArrowRight, Bell, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import StatsCard from '../../components/dashboard/StatsCard';
import { motion, AnimatePresence } from 'framer-motion';
import { analyticsService } from '../../services/analyticsService';
import attendanceService from '../../services/attendanceService';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [overview,    setOverview]    = useState<any>(null);
  const [deptStats,   setDeptStats]   = useState<any[]>([]);
  const [attTrend,    setAttTrend]    = useState<any[]>([]);
  const [defaulters,  setDefaulters]  = useState<any[]>([]);
  const [placement,   setPlacement]   = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [showAllDef,  setShowAllDef]  = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ovRes, deptRes, attRes, defRes, placeRes] = await Promise.allSettled([
        analyticsService.getOverview(),
        analyticsService.getDepartmentStats(),
        analyticsService.getAttendanceTrend(),
        attendanceService.getDefaulters(),
        analyticsService.getPlacementAnalytics(),
      ]);
      if (ovRes.status    === 'fulfilled') setOverview(ovRes.value.data.overview);
      if (deptRes.status  === 'fulfilled') setDeptStats(deptRes.value.data.stats || []);
      if (attRes.status   === 'fulfilled') setAttTrend(attRes.value.data.trend || []);
      if (defRes.status   === 'fulfilled') setDefaulters(defRes.value.data.defaulters || []);
      if (placeRes.status === 'fulfilled') setPlacement(placeRes.value.data);
    } catch (err) {
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const ov = overview;
  const placementRate = ov && ov.totalStudents > 0
    ? Math.round((ov.placedStudents / ov.totalStudents) * 100)
    : 0;

  const weakDept   = deptStats.length > 0 ? deptStats.reduce((a, b) => a.avgCGPA < b.avgCGPA ? a : b) : null;
  const strongDept = deptStats.length > 0 ? deptStats.reduce((a, b) => a.avgCGPA > b.avgCGPA ? a : b) : null;

  const alerts = ov ? [
    {
      type: 'Attendance',
      message: ov.avgAttendance < 75
        ? `Avg attendance ${ov.avgAttendance}% — below 75% threshold`
        : ov.avgAttendance < 85
        ? `Avg attendance ${ov.avgAttendance}% — borderline`
        : `Avg attendance ${ov.avgAttendance}% — healthy`,
      severity: ov.avgAttendance < 75 ? 'critical' : ov.avgAttendance < 85 ? 'warning' : 'good',
    },
    {
      type: 'Defaulters',
      message: defaulters.length > 20
        ? `${defaulters.length} students below 75% attendance — send alerts`
        : defaulters.length > 0
        ? `${defaulters.length} attendance defaulters detected`
        : 'No attendance defaulters — excellent!',
      severity: defaulters.length > 20 ? 'critical' : defaulters.length > 0 ? 'warning' : 'good',
    },
    {
      type: 'CGPA',
      message: parseFloat(ov.avgCGPA) < 6.0
        ? `Avg CGPA ${ov.avgCGPA} — critically low`
        : parseFloat(ov.avgCGPA) < 7.0
        ? `Avg CGPA ${ov.avgCGPA} — below 7.0`
        : `Avg CGPA ${ov.avgCGPA} — good academic standing`,
      severity: parseFloat(ov.avgCGPA) < 6.0 ? 'critical' : parseFloat(ov.avgCGPA) < 7.0 ? 'warning' : 'good',
    },
    {
      type: 'Placement',
      message: placementRate < 30
        ? `Placement rate ${placementRate}% — needs improvement`
        : `Placement rate ${placementRate}% — on track`,
      severity: placementRate < 30 ? 'warning' : 'good',
    },
  ] : [];

  const stats = ov ? [
    { title: 'Total Students',  value: ov.totalStudents,        icon: Users,         color: 'bg-blue-500',   change: `${deptStats.length} departments` },
    { title: 'Total Faculty',   value: ov.totalFaculty,         icon: GraduationCap, color: 'bg-purple-500', change: 'Active faculty' },
    { title: 'Avg Attendance',  value: `${ov.avgAttendance}%`,  icon: ClipboardList, color: 'bg-green-500',  change: `${defaulters.length} defaulters` },
    { title: 'Company Drives',  value: ov.totalCompanies,       icon: Briefcase,     color: 'bg-orange-500', change: 'Total drives' },
    { title: 'Avg CGPA',        value: ov.avgCGPA,              icon: TrendingUp,    color: 'bg-pink-500',   change: 'Institution avg' },
    { title: 'Students Placed', value: ov.placedStudents,       icon: Award,         color: 'bg-teal-500',   change: `${placementRate}% rate` },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-3">
        <RefreshCw size={32} className="animate-spin text-primary-500 mx-auto" />
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">EduPulse AI — Live Academic Overview</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => <StatsCard key={s.title} {...s} index={i} />)}
      </div>

      {/* AI Smart Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg text-white">
                <Brain size={16} />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">AI Smart Alerts</h3>
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-full">Live</span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Users,         label: 'Total Students',  value: ov?.totalStudents,              color: 'text-blue-500' },
                { icon: AlertTriangle, label: 'Defaulters',      value: defaulters.length,              color: defaulters.length > 0 ? 'text-red-500' : 'text-green-500' },
                { icon: TrendingUp,    label: 'Placement Rate',  value: `${placementRate}%`,            color: placementRate >= 30 ? 'text-green-500' : 'text-orange-500' },
                { icon: Award,         label: 'Top Dept (CGPA)', value: strongDept?.department || 'N/A', color: 'text-purple-500' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <item.icon size={18} className={`${item.color} flex-shrink-0`} />
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="font-bold text-gray-800 dark:text-white">{item.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Alerts */}
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                    alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    alert.severity === 'warning'  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                                                    'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  }`}>
                  {alert.severity === 'good'
                    ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    : alert.severity === 'critical'
                    ? <XCircle size={16} className="text-red-500 flex-shrink-0" />
                    : <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />}
                  <div className="flex-1">
                    <span className={`text-xs font-semibold mr-2 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'warning'  ? 'text-yellow-600' : 'text-green-600'
                    }`}>{alert.type}:</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{alert.message}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Weak vs Strong Dept */}
            {(weakDept || strongDept) && (
              <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30 grid grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Needs Attention</p>
                  <p className="font-semibold text-red-600">{weakDept?.department || 'N/A'}</p>
                  <p className="text-xs text-gray-400">Avg CGPA: {weakDept?.avgCGPA || '—'}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Top Performing</p>
                  <p className="font-semibold text-green-600">{strongDept?.department || 'N/A'}</p>
                  <p className="text-xs text-gray-400">Avg CGPA: {strongDept?.avgCGPA || '—'}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Attendance Trend (Last 30 Days)</h3>
          {attTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attTrend}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Attendance']} />
                <Area type="monotone" dataKey="pct" stroke="#3b82f6" fill="url(#attGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No attendance data yet</div>
          )}
        </motion.div>

        {/* Department CGPA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Department-wise Avg CGPA</h3>
          {deptStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} CGPA`, 'Avg CGPA']} />
                <Bar dataKey="avgCGPA" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, fill: '#6b7280' }}>
                  {deptStats.map((d, i) => (
                    <Cell key={i} fill={d.avgCGPA >= 7.5 ? '#22c55e' : d.avgCGPA >= 6.5 ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No department data yet</div>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ≥7.5</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 6.5–7.5</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;6.5</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Defaulters + Placement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Defaulters Table — sorted worst first */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Attendance Defaulters</h3>
            {defaulters.length > 0 && (
              <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{defaulters.length} students</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Student', 'Dept', 'Attendance', 'Risk'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-gray-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-green-500 text-sm">🎉 No defaulters found!</td></tr>
                ) : [...defaulters]
                    .sort((a, b) => a.percentage - b.percentage)
                    .slice(0, showAllDef ? 20 : 6)
                    .map((d: any, i: number) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{d.student?.user?.name}</p>
                      <p className="text-gray-400 text-xs font-mono">{d.student?.rollNumber}</p>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{d.student?.department}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${d.percentage}%` }} />
                        </div>
                        <span className="font-semibold text-xs text-red-500">{d.percentage}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.percentage < 50 ? 'bg-red-200 text-red-700' :
                        d.percentage < 65 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {d.percentage < 50 ? 'Critical' : d.percentage < 65 ? 'High' : 'Medium'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {defaulters.length > 6 && (
            <button onClick={() => setShowAllDef(v => !v)}
              className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto">
              {showAllDef ? 'Show less' : `Show all ${defaulters.length} defaulters`}
              <ArrowRight size={11} className={showAllDef ? 'rotate-90' : ''} />
            </button>
          )}
        </motion.div>

        {/* Placement Overview */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-teal-500" />
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">Placement Overview</h3>
          </div>
          {placement ? (
            <div className="space-y-3">
              {/* Rate Ring */}
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#14b8a6" strokeWidth="3"
                      strokeDasharray={`${placementRate * 0.942} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-teal-600">{placementRate}%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-xs text-gray-500">Placed: <strong className="text-gray-800 dark:text-white">{ov?.placedStudents || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    <span className="text-xs text-gray-500">Total Students: <strong className="text-gray-800 dark:text-white">{ov?.totalStudents || 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <span className="text-xs text-gray-500">Companies: <strong className="text-gray-800 dark:text-white">{ov?.totalCompanies || 0}</strong></span>
                  </div>
                </div>
              </div>
              {/* Dept breakdown if available */}
              {placement.byDepartment?.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">By Department</p>
                  <div className="space-y-1.5">
                    {placement.byDepartment.slice(0, 4).map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24 truncate">{d.department}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${d.rate || 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8">{d.rate || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-teal-600">{placementRate}%</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Overall Placement Rate</p>
                  <p className="text-xs text-gray-400">{ov?.placedStudents || 0} of {ov?.totalStudents || 0} students</p>
                </div>
              </div>
              <div className={`rounded-lg px-3 py-2 text-sm ${
                placementRate >= 50 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
              }`}>
                {placementRate >= 70 ? '🎉 Excellent placement rate!' :
                 placementRate >= 50 ? '📈 Good progress — keep pushing' :
                 '⚠️ Placement rate needs improvement'}
              </div>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/placement')}
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors">
              <BarChart2 size={12} /> View full placement report <ArrowRight size={11} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="card border border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Attendance Reports', icon: ClipboardList, path: '/attendance', color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' },
            { label: 'Full Analytics',     icon: TrendingUp,    path: '/analytics',  color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
            { label: 'Manage Students',    icon: Users,         path: '/students',   color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
            { label: 'Placement Drives',   icon: Briefcase,     path: '/placement',  color: 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400' },
            { label: 'Send Notification',  icon: Bell,          path: '/notifications', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${a.color}`}>
              <a.icon size={13} /> {a.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
