import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Users, GraduationCap, Briefcase, ClipboardList, TrendingUp, Award } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AnalyticsDashboard = () => {
  const [overview,     setOverview]     = useState<any>(null);
  const [deptStats,    setDeptStats]    = useState<any[]>([]);
  const [cgpaDist,     setCgpaDist]     = useState<any[]>([]);
  const [attTrend,     setAttTrend]     = useState<any[]>([]);
  const [subjectPerf,  setSubjectPerf]  = useState<any[]>([]);
  const [placement,    setPlacement]    = useState<any>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ov, dept, cgpa, att, subj, place] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getDepartmentStats(),
          analyticsService.getCGPADistribution(),
          analyticsService.getAttendanceTrend(),
          analyticsService.getSubjectPerformance(),
          analyticsService.getPlacementAnalytics(),
        ]);
        setOverview(ov.data.overview);
        setDeptStats(dept.data.stats);
        setCgpaDist(cgpa.data.distribution);
        setAttTrend(att.data.trend);
        setSubjectPerf(subj.data.performance);
        setPlacement(place.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const overviewCards = overview ? [
    { title: 'Total Students',   value: overview.totalStudents,   icon: Users,          color: 'bg-blue-500' },
    { title: 'Total Faculty',    value: overview.totalFaculty,    icon: GraduationCap,  color: 'bg-purple-500' },
    { title: 'Avg CGPA',         value: overview.avgCGPA,         icon: Award,          color: 'bg-yellow-500' },
    { title: 'Avg Attendance',   value: `${overview.avgAttendance}%`, icon: ClipboardList, color: 'bg-green-500' },
    { title: 'Company Drives',   value: overview.totalCompanies,  icon: Briefcase,      color: 'bg-orange-500' },
    { title: 'Students Placed',  value: overview.placedStudents,  icon: TrendingUp,     color: 'bg-teal-500' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Analytics Dashboard</h2>
        <p className="page-subtitle">Comprehensive academic & placement insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {overviewCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all">
            <div className={`${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <card.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Row 1: Attendance Trend + CGPA Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Attendance Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attTrend}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Attendance']} />
              <Area type="monotone" dataKey="pct" stroke="#22c55e" fill="url(#attGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* CGPA Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">CGPA Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cgpaDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {cgpaDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Department Stats + Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Students */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Students by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Subject Performance Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Subject-wise Avg Performance (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Marks']} />
              <Bar dataKey="avgMarks" radius={[4, 4, 0, 0]}>
                {subjectPerf.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 3: Placement Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Applications by Status</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={placement?.byStatus || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
                  {(placement?.byStatus || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {(placement?.byStatus || []).map((s: any, i: number) => (
                <div key={s.status} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{s.status.replace('_', ' ')}: <strong>{s.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Companies */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Top Companies by Applications</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={placement?.topCompanies || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="applications" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Dept CGPA Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Department-wise CGPA Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                {['Department', 'Students', 'Avg CGPA', 'Performance'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptStats.map((d, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{d.department}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{d.count}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${
                      d.avgCGPA >= 7.5 ? 'text-green-600' : d.avgCGPA >= 6.5 ? 'text-blue-600' : 'text-red-500'
                    }`}>{d.avgCGPA}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 max-w-[120px]">
                        <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${(d.avgCGPA / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{((d.avgCGPA / 10) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
