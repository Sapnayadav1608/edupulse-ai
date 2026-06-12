import React, { useState, useEffect, useRef } from 'react';
import { Save, Search, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import studentService, { StudentData } from '../../services/studentService';
import attendanceService from '../../services/attendanceService';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];
const examTypes   = ['internal1', 'internal2', 'midterm', 'final'];
const subjects    = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering', 'Mathematics', 'Physics'];

const examLabel = (t: string) => t.replace('internal', 'Internal ').replace('midterm', 'Mid Term').replace('final', 'Final');

type SaveState = 'idle' | 'saving' | 'done' | 'error';

const MarksEntry = () => {
  const [students,   setStudents]   = useState<StudentData[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState({ department: 'Computer Science', semester: '4' });
  const [subject,    setSubject]    = useState('Data Structures');
  const [examType,   setExamType]   = useState('internal1');
  const [totalMarks, setTotalMarks] = useState(30);
  const [marksMap,   setMarksMap]   = useState<Record<string, string>>({});
  const [search,     setSearch]     = useState('');
  const [saveState,  setSaveState]  = useState<SaveState>('idle');
  const [progress,   setProgress]   = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await studentService.getAll({ department: filter.department, semester: filter.semester });
      setStudents(data.students);
      setMarksMap({});
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [filter.department, filter.semester]); // eslint-disable-line

  // Tab to next input
  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const ids = filtered.map(s => s._id!);
      const idx = ids.indexOf(currentId);
      const next = ids[idx + 1];
      if (next) inputRefs.current[next]?.focus();
    }
  };

  const saveAll = async () => {
    const entries = Object.entries(marksMap).filter(([, v]) => v !== '' && v !== undefined);
    if (!entries.length) return;
    setSaveState('saving');
    setProgress(0);
    setSavedCount(0);
    let done = 0;
    for (const [sid, val] of entries) {
      const stu = students.find(s => s._id === sid);
      if (!stu) continue;
      try {
        await attendanceService.addMarks({
          student: stu._id, subject, department: filter.department,
          semester: filter.semester, examType,
          marksObtained: Number(val), totalMarks,
        });
        done++;
        setSavedCount(done);
        setProgress(Math.round((done / entries.length) * 100));
      } catch { /* skip failed */ }
    }
    setSaveState('done');
    setTimeout(() => { setSaveState('idle'); setProgress(0); }, 3000);
  };

  const filtered = students.filter(s =>
    !search ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const filledCount  = Object.values(marksMap).filter(v => v !== '').length;
  const hasAnyMarks  = filledCount > 0;

  const getMarkColor = (val: string) => {
    if (!val) return '';
    const pct = (Number(val) / totalMarks) * 100;
    if (pct >= 75) return 'text-green-600 font-semibold';
    if (pct >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-500 font-semibold';
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Marks Entry</h2>
        <p className="text-gray-500 text-sm mt-1">Enter marks for all students, then save at once</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <select className="input-field" value={subject} onChange={e => setSubject(e.target.value)}>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Exam Type</label>
            <select className="input-field" value={examType} onChange={e => setExamType(e.target.value)}>
              {examTypes.map(t => <option key={t} value={t}>{examLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total Marks</label>
            <input type="number" className="input-field" value={totalMarks} min={1} max={100}
              onChange={e => setTotalMarks(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Search + Save Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          {hasAnyMarks && saveState === 'idle' && (
            <span className="text-xs text-gray-400">{filledCount} of {students.length} filled</span>
          )}
          {saveState === 'done' && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle size={16} /> {savedCount} marks saved!
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={!hasAnyMarks || saveState === 'saving'}
            className="flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saveState === 'saving' ? `Saving... ${progress}%` : saveState === 'done' ? 'Saved!' : 'Save All Marks'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {saveState === 'saving' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary-500 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{savedCount} / {filledCount} saved</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No students found</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 dark:bg-gray-700/60 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Roll No</div>
            <div className="col-span-3">Marks / {totalMarks}</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((stu, i) => {
              const val = marksMap[stu._id!] ?? '';
              const pct = val ? Math.round((Number(val) / totalMarks) * 100) : null;
              return (
                <motion.div
                  key={stu._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="grid grid-cols-12 items-center px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                >
                  <div className="col-span-1 text-xs text-gray-400">{i + 1}</div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {stu.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{stu.user?.name}</p>
                  </div>
                  <div className="col-span-3 text-sm text-gray-400 font-mono">{stu.rollNumber}</div>
                  <div className="col-span-3">
                    <input
                      ref={el => { inputRefs.current[stu._id!] = el; }}
                      type="number" min={0} max={totalMarks}
                      className="input-field w-24 py-1.5 text-center"
                      placeholder={`0–${totalMarks}`}
                      value={val}
                      onChange={e => setMarksMap(prev => ({ ...prev, [stu._id!]: e.target.value }))}
                      onKeyDown={e => handleKeyDown(e, stu._id!)}
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    {pct !== null && (
                      <span className={`text-xs ${getMarkColor(val)}`}>{pct}%</span>
                    )}
                    {!val && (
                      <ChevronRight size={14} className="text-gray-300" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer summary */}
          {hasAnyMarks && (
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/60 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-500">{filledCount} of {students.length} marks entered</span>
              <div className="flex items-center gap-3 text-xs">
                {(() => {
                  const vals = Object.values(marksMap).filter(v => v !== '').map(Number);
                  if (!vals.length) return null;
                  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                  const high = Math.max(...vals);
                  const low  = Math.min(...vals);
                  return (
                    <>
                      <span className="text-gray-400">Avg: <span className="font-semibold text-gray-700 dark:text-gray-200">{avg}</span></span>
                      <span className="text-green-600">High: <span className="font-semibold">{high}</span></span>
                      <span className="text-red-500">Low: <span className="font-semibold">{low}</span></span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Save */}
      {hasAnyMarks && (
        <div className="flex justify-end">
          <button onClick={saveAll} disabled={saveState === 'saving'}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${saveState === 'done' ? 'bg-green-500 text-white' : 'btn-primary'} disabled:opacity-60`}>
            {saveState === 'done' ? <CheckCircle size={18} /> : <Save size={18} />}
            {saveState === 'saving' ? `Saving ${progress}%...` : saveState === 'done' ? 'All Saved!' : `Save ${filledCount} Marks`}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;
