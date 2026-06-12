import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import attendanceService from '../../services/attendanceService';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];

const pctColor = (pct: number) => {
  if (pct >= 85) return 'text-green-600 bg-green-50';
  if (pct >= 75) return 'text-blue-600 bg-blue-50';
  if (pct >= 60) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const barColor = (pct: number) => pct >= 75 ? '#22c55e' : '#ef4444';

const AttendanceReports = () => {
  const [report, setReport]         = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'report' | 'defaulters'>('report');
  const [filter, setFilter]         = useState({ department: 'Computer Science', semester: '4' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { department: filter.department, semester: filter.semester };
      const [reportRes, defaultersRes] = await Promise.allSettled([
        attendanceService.getReport(params),
        attendanceService.getDefaulters(params),
      ]);
      if (reportRes.status === 'fulfilled')    setReport(reportRes.value.data.report || []);
      if (defaultersRes.status === 'fulfilled') setDefaulters(defaultersRes.value.data.defaulters || []);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [filter]);

  const avgAttendance = report.length
    ? Math.round(report.reduce((sum, r) => sum + r.percentage, 0) / report.length)
    : 0;

  const chartData = report.slice(0, 10).map(r => ({
    name: r.student?.user?.name?.split(' ')[0] || 'N/A',
    attendance: r.percentage,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance Reports</h2>
        <p className="text-gray-500 text-sm mt-1">Monitor student attendance and identify defaulters</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Department</label>
            <select className="input-field w-auto" value={filter.department} onChange={e => setFilter({ ...filter, department: e.target.value })}>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Semester</label>
            <select className="input-field w-auto" value={filter.semester} onChange={e => setFilter({ ...filter, semester: e.target.value })}>
              {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Total Students',    value: report.length,      icon: Users,         color: 'bg-blue-500' },
          { title: 'Avg Attendance',    value: `${avgAttendance}%`, icon: TrendingUp,    color: 'bg-green-500' },
          { title: 'Defaulters',        value: defaulters.length,  icon: AlertTriangle, color: 'bg-red-500' },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card flex items-center gap-4">
            <div className={`${card.color} p-3 rounded-xl text-white`}><card.icon size={22} /></div>
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">Student-wise Attendance (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val: any) => [`${val}%`, 'Attendance']} />
              <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={barColor(entry.attendance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">🟢 ≥75% (Safe) &nbsp; 🔴 &lt;75% (Defaulter)</p>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {(['report', 'defaulters'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab} {tab === 'defaulters' && defaulters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">{defaulters.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Report Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : activeTab === 'report' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Student', 'Roll No', 'Present', 'Absent', 'Late', 'Total', 'Attendance %'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">No attendance data found</td></tr>
                ) : report.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{r.student?.user?.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{r.student?.rollNumber}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{r.present}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">{r.absent}</td>
                    <td className="px-4 py-3 text-yellow-500 font-medium">{r.late}</td>
                    <td className="px-4 py-3 text-gray-500">{r.total}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pctColor(r.percentage)}`}>
                        {r.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Defaulters Table */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle size={16} /> {defaulters.length} students below 75% attendance threshold
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Student', 'Roll No', 'Department', 'Attendance %', 'Risk Level'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-green-500">🎉 No defaulters found!</td></tr>
                ) : defaulters.map((d, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{d.student?.user?.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{d.student?.rollNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{d.student?.department}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">{d.percentage}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${d.percentage < 50 ? 'bg-red-200 text-red-700' : d.percentage < 65 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {d.percentage < 50 ? '🔴 Critical' : d.percentage < 65 ? '🟠 High' : '🟡 Medium'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AttendanceReports;
