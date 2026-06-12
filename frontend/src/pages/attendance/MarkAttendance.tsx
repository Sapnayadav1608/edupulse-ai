import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Save, Search, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import studentService, { StudentData } from '../../services/studentService';
import attendanceService from '../../services/attendanceService';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];
const subjects    = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering'];

type Status = 'present' | 'absent' | 'late';

const statusBtn = {
  present: 'bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900',
  absent:  'bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900',
  late:    'bg-yellow-400 text-white shadow-md shadow-yellow-200 dark:shadow-yellow-900',
};

const MarkAttendance = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [records,  setRecords]  = useState<Record<string, Status>>({});
  const [filter,   setFilter]   = useState({ department: 'Computer Science', semester: '4', subject: 'Data Structures' });
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [search,   setSearch]   = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await studentService.getAll({ department: filter.department, semester: filter.semester });
      setStudents(data.students);
      const init: Record<string, Status> = {};
      data.students.forEach((s: StudentData) => { init[s._id!] = 'present'; });
      setRecords(init);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStudents(); }, [filter.department, filter.semester]);

  const setStatus = (id: string, status: Status) => setRecords(prev => ({ ...prev, [id]: status }));

  const markAll = (status: Status) => {
    const all: Record<string, Status> = {};
    students.forEach(s => { all[s._id!] = status; });
    setRecords(all);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsArr = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      await attendanceService.mark({ subject: filter.subject, department: filter.department, semester: filter.semester, date, records: recordsArr });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const filtered = students.filter(s =>
    !search ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = Object.values(records).filter(s => s === 'present').length;
  const absentCount  = Object.values(records).filter(s => s === 'absent').length;
  const lateCount    = Object.values(records).filter(s => s === 'late').length;
  const total        = students.length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mark Attendance</h2>
        <p className="text-gray-500 text-sm mt-1">Select status for each student using the P / A / L buttons</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Department</label>
            <select className="input-field" value={filter.department} onChange={e => setFilter({ ...filter, department: e.target.value })}>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Semester</label>
            <select className="input-field" value={filter.semester} onChange={e => setFilter({ ...filter, semester: e.target.value })}>
              {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subject</label>
            <select className="input-field" value={filter.subject} onChange={e => setFilter({ ...filter, subject: e.target.value })}>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {total > 0 && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Progress */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{total} Students</span>
                <span>{Math.round((presentCount / total) * 100)}% Present</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div className="bg-green-500 transition-all duration-300" style={{ width: `${(presentCount / total) * 100}%` }} />
                <div className="bg-yellow-400 transition-all duration-300" style={{ width: `${(lateCount / total) * 100}%` }} />
                <div className="bg-red-500 transition-all duration-300" style={{ width: `${(absentCount / total) * 100}%` }} />
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={12} /> {presentCount} Present</span>
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} /> {absentCount} Absent</span>
                <span className="flex items-center gap-1 text-xs text-yellow-500 font-medium"><Clock size={12} /> {lateCount} Late</span>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 mr-1">Mark all:</span>
              <button onClick={() => markAll('present')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
                <Users size={13} /> Present
              </button>
              <button onClick={() => markAll('absent')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                <Users size={13} /> Absent
              </button>
              <button onClick={() => markAll('late')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition">
                <Users size={13} /> Late
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {students.length > 0 && (
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No students found</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((student, i) => {
              const status = records[student._id!] || 'present';
              return (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0
                      ${status === 'present' ? 'bg-green-500' : status === 'absent' ? 'bg-red-500' : 'bg-yellow-400'}`}>
                      {student.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{student.user?.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{student.rollNumber}</p>
                    </div>
                  </div>

                  {/* P / A / L Buttons */}
                  <div className="flex items-center gap-2">
                    {(['present', 'absent', 'late'] as Status[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(student._id!, s)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all
                          ${status === s ? statusBtn[s] : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        {s === 'present' ? 'P' : s === 'absent' ? 'A' : 'L'}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${saved ? 'bg-green-500 text-white' : 'btn-primary'} disabled:opacity-60`}>
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saving ? 'Saving...' : saved ? 'Attendance Saved!' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
