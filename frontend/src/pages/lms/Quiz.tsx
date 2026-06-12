import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, X, CheckCircle, Brain, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import lmsService from '../../services/lmsService';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
const semesters   = [1, 2, 3, 4, 5, 6, 7, 8];
const difficulties = ['easy', 'medium', 'hard'];

const Quiz = () => {
  const { user } = useAuth();
  const [quizzes,     setQuizzes]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [activeQuiz,  setActiveQuiz]  = useState<any | null>(null);
  const [answers,     setAnswers]     = useState<number[]>([]);
  const [result,      setResult]      = useState<any | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<'recommended' | 'all'>('recommended');

  // Create form
  const [form, setForm] = useState({ title: '', subject: '', department: 'Computer Science', semester: 1, duration: 30 });
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]);

  // AI generation
  const [aiTopic,      setAiTopic]      = useState('');
  const [aiNum,        setAiNum]        = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiError,      setAiError]      = useState('');
  const [showAI,       setShowAI]       = useState(false);

  const [recommended,   setRecommended]   = useState<any[]>([]);
  const [weakSubjects,  setWeakSubjects]  = useState<string[]>([]);
  const [showRecommended, setShowRecommended] = useState(false);

  // Interest-based quiz
  const [interests,       setInterests]      = useState<string[]>([]);
  const [newInterest,     setNewInterest]    = useState('');
  const [interestTopic,   setInterestTopic]  = useState('');
  const [interestNum,     setInterestNum]    = useState(5);
  const [interestDiff,    setInterestDiff]   = useState('medium');
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestError,   setInterestError]  = useState('');
  const [savingInterests, setSavingInterests] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      if (user?.role === 'student') {
        const [recRes, allRes] = await Promise.allSettled([
          lmsService.getRecommendedQuizzes(),
          lmsService.getQuizzes(),
        ]);
        if (recRes.status === 'fulfilled' && recRes.value.data.quizzes?.length > 0) {
          setRecommended(recRes.value.data.quizzes);
          setWeakSubjects(recRes.value.data.weakSubjects || []);
          setShowRecommended(true);
        }
        if (allRes.status === 'fulfilled') setQuizzes(allRes.value.data.quizzes);
      } else {
        const { data } = await lmsService.getQuizzes();
        setQuizzes(data.quizzes);
      }
    } finally { setLoading(false); }
  };

  const fetchInterests = async () => {
    try {
      const { data } = await lmsService.getMyProfile();
      const saved = data.student?.interests || [];
      setInterests(saved);
      if (saved.length > 0) setInterestTopic(saved[0]);
    } catch {}
  };

  const saveInterests = async (updated: string[]) => {
    setSavingInterests(true);
    try { await lmsService.updateInterests(updated); }
    finally { setSavingInterests(false); }
  };

  const addInterest = () => {
    const val = newInterest.trim();
    if (!val || interests.includes(val)) return;
    const updated = [...interests, val];
    setInterests(updated);
    setNewInterest('');
    if (!interestTopic) setInterestTopic(val);
    saveInterests(updated);
  };

  const removeInterest = (item: string) => {
    const updated = interests.filter(x => x !== item);
    setInterests(updated);
    if (interestTopic === item) setInterestTopic(updated[0] || '');
    saveInterests(updated);
  };

  const handleInterestQuiz = async () => {
    if (!interestTopic) { setInterestError('Please select a topic first.'); return; }
    setInterestLoading(true);
    setInterestError('');
    try {
      const { data } = await lmsService.generateInterestQuiz({
        topic: interestTopic, numQuestions: interestNum, difficulty: interestDiff,
      });
      if (data.success && data.questions?.length > 0) {
        setActiveQuiz({
          _id: 'interest-' + Date.now(),
          title: `${interestTopic} Practice Quiz`,
          duration: interestNum * 2,
          totalMarks: data.questions.reduce((s: number, q: any) => s + q.marks, 0),
          questions: data.questions,
        });
        setAnswers(new Array(data.questions.length).fill(-1));
        setResult(null);
      } else {
        setInterestError('Quiz generation failed. Please try again.');
      }
    } catch (err: any) {
      setInterestError(err.response?.data?.message || 'Generation failed');
    } finally { setInterestLoading(false); }
  };

  useEffect(() => {
    fetchQuizzes();
    if (user?.role === 'student') fetchInterests();
  }, [user?.role]);

  const addQuestion = () =>
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]);

  const removeQuestion = (i: number) =>
    setQuestions(questions.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[i] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const updated = [...questions];
    updated[qi].options[oi] = value;
    setQuestions(updated);
  };

  // AI Generate Questions
  const handleAIGenerate = async () => {
    if (!aiTopic || !form.subject) {
      setAiError('Enter topic and subject first');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const { data } = await lmsService.generateAIQuiz({
        topic:        aiTopic,
        subject:      form.subject,
        numQuestions: aiNum,
        difficulty:   aiDifficulty,
      });
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setShowAI(false);
        setAiTopic('');
      } else {
        setAiError('AI could not generate questions. Try again.');
      }
    } catch (err: any) {
      setAiError(err.response?.data?.message || 'AI generation failed');
    } finally { setAiLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await lmsService.createQuiz({ ...form, questions });
      setShowCreate(false);
      setForm({ title: '', subject: '', department: 'Computer Science', semester: 1, duration: 30 });
      setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 }]);
      fetchQuizzes();
    } finally { setSubmitting(false); }
  };

  // Fetch full quiz with questions before starting
  const startQuiz = async (quizId: string) => {
    try {
      const { data } = await lmsService.getQuizById(quizId);
      setActiveQuiz(data.quiz);
      setAnswers(new Array(data.quiz.questions.length).fill(-1));
      setResult(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load quiz');
    }
  };

  const handleAttempt = async () => {
    if (!activeQuiz) return;
    // Interest-based quiz: calculate score locally, don't save to DB
    if (activeQuiz._id?.startsWith('interest-')) {
      let score = 0;
      activeQuiz.questions.forEach((q: any, i: number) => {
        if (answers[i] === q.correctAnswer) score += q.marks;
      });
      setResult({ score, totalMarks: activeQuiz.totalMarks, message: `You scored ${score}/${activeQuiz.totalMarks}` });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await lmsService.attemptQuiz(activeQuiz._id, answers);
      setResult(data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Attempt failed');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quiz?')) return;
    await lmsService.deleteQuiz(id);
    fetchQuizzes();
  };

  const canManage = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quizzes</h2>
          <p className="text-gray-500 text-sm mt-1">{quizzes.length} quizzes available</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Create Quiz
          </button>
        )}
      </div>

      {/* Tabs for student */}
      {user?.role === 'student' && showRecommended && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === 'recommended'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            ⭐ Recommended for You
            <span className="ml-1.5 bg-primary-100 text-primary-600 text-xs px-1.5 py-0.5 rounded-full">
              {recommended.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            All Quizzes
            <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {quizzes.length}
            </span>
          </button>
        </div>
      )}

      {/* Weak subjects banner */}
      {user?.role === 'student' && weakSubjects.length > 0 && activeTab === 'recommended' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-yellow-600 text-sm">⚠️ Weak subjects detected:</span>
          {weakSubjects.map(s => (
            <span key={s} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
          ))}
          <span className="text-yellow-600 text-xs ml-1">— quizzes recommended below</span>
        </div>
      )}

      {/* Interest-Based Practice Section */}
      {user?.role === 'student' && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Practice by Your Interests</h3>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">AI Generated</span>
          </div>

          {/* Add Interest */}
          <div className="flex gap-2 mb-3">
            <input
              className="input-field flex-1 text-sm"
              placeholder="Add interest topic (e.g. Python, Machine Learning)"
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            />
            <button onClick={addInterest} disabled={savingInterests}
              className="btn-primary px-4 text-sm disabled:opacity-60">
              + Add
            </button>
          </div>

          {/* Interest Tags */}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.map(item => (
                <span key={item}
                  onClick={() => setInterestTopic(item)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm cursor-pointer border transition ${
                    interestTopic === item
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}>
                  {item}
                  <button onClick={e => { e.stopPropagation(); removeInterest(item); }}
                    className="hover:text-red-400 ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {interests.length === 0 && (
            <p className="text-sm text-white/40 mb-4">👆 Add your interest topics and get instant AI-generated quizzes</p>
          )}

          {/* Quiz Config */}
          {interests.length > 0 && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Questions</label>
                <input type="number" min={3} max={10} value={interestNum}
                  onChange={e => setInterestNum(Number(e.target.value))}
                  className="input-field w-24 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                <select value={interestDiff} onChange={e => setInterestDiff(e.target.value)}
                  className="input-field text-sm">
                  {difficulties.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              <button onClick={handleInterestQuiz} disabled={interestLoading || !interestTopic}
                className="flex items-center gap-2 btn-primary text-sm py-2 px-4 disabled:opacity-60">
                {interestLoading
                  ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
                  : <><Brain size={14} /> Generate Quiz on "{interestTopic}"</>}
              </button>
            </div>
          )}
          {interestError && <p className="text-xs text-red-500 mt-2">{interestError}</p>}
        </div>
      )}

      {/* Quiz Cards */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (() => {
        const displayQuizzes = user?.role === 'student' && showRecommended && activeTab === 'recommended'
          ? recommended
          : quizzes;
        return displayQuizzes.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            {user?.role === 'student' && activeTab === 'recommended' ? 'No recommended quizzes yet' : 'No quizzes yet'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayQuizzes.map((quiz, i) => (
              <motion.div key={quiz._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                    <CheckCircle size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    {quiz.tag === 'weak' && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Weak Subject</span>
                    )}
                    {quiz.tag === 'dept' && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Your Dept</span>
                    )}
                    {canManage && (
                      <button onClick={() => handleDelete(quiz._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{quiz.title}</h3>
                {quiz.reason && (
                  <p className="text-xs text-primary-500 mb-2">📌 {quiz.reason}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">{quiz.subject}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs">Sem {quiz.semester}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs">{quiz.department}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>⏱ {quiz.duration} mins</span>
                  <span>📝 {quiz.questions?.length || 0} questions</span>
                  <span>🏆 {quiz.totalMarks} marks</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">By {quiz.createdBy?.name}</p>
                {user?.role === 'student' && (
                  <button onClick={() => startQuiz(quiz._id)}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2">
                    <Play size={15} /> Start Quiz
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        );
      })()}

      {/* Create Quiz Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create Quiz</h3>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Quiz Info */}
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field col-span-2" placeholder="Quiz Title *" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                  <input className="input-field" placeholder="Subject *" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })} required />
                  <input type="number" className="input-field" placeholder="Duration (mins)" value={form.duration}
                    onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
                  <select className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select className="input-field" value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })}>
                    {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>

                {/* AI Generate Button */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={16} className="text-purple-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">AI Question Generator</span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Gemini AI</span>
                  </div>
                  {!showAI ? (
                    <button type="button" onClick={() => setShowAI(true)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium">
                      <Sparkles size={14} /> Generate questions with AI
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input className="input-field" placeholder="Topic (e.g. Binary Trees, SQL Joins) *"
                        value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">No. of Questions</label>
                          <input type="number" className="input-field" min={1} max={20} value={aiNum}
                            onChange={e => setAiNum(Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                          <select className="input-field" value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                            {difficulties.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                          </select>
                        </div>
                      </div>
                      {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={handleAIGenerate} disabled={aiLoading}
                          className="flex items-center gap-2 btn-primary text-sm py-2 disabled:opacity-60">
                          {aiLoading ? <><RefreshCw size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate</>}
                        </button>
                        <button type="button" onClick={() => { setShowAI(false); setAiError(''); }}
                          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Questions ({questions.length})</h4>
                    <button type="button" onClick={addQuestion} className="text-sm text-primary-600 hover:underline">+ Add Question</button>
                  </div>
                  {questions.map((q, qi) => (
                    <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 flex-shrink-0">Q{qi + 1}</span>
                        <input className="input-field flex-1" placeholder="Question *" value={q.question}
                          onChange={e => updateQuestion(qi, 'question', e.target.value)} required />
                        {questions.length > 1 && (
                          <button type="button" onClick={() => removeQuestion(qi)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={16} /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                              onChange={() => updateQuestion(qi, 'correctAnswer', oi)} className="text-primary-600 flex-shrink-0" />
                            <input className="input-field flex-1 text-sm py-1.5" placeholder={`Option ${oi + 1}`}
                              value={opt} onChange={e => updateOption(qi, oi, e.target.value)} required />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">🟢 Select correct answer with radio button</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">{submitting ? 'Creating...' : 'Create Quiz'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attempt Quiz Modal */}
      <AnimatePresence>
        {activeQuiz && !result && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activeQuiz.title}</h3>
                <button onClick={() => setActiveQuiz(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"><X size={16} /></button>
              </div>
              <p className="text-xs text-gray-400 mb-4">⏱ {activeQuiz.duration} mins &nbsp;|&nbsp; 📝 {activeQuiz.questions?.length} questions &nbsp;|&nbsp; 🏆 {activeQuiz.totalMarks} marks</p>

              <div className="space-y-5">
                {activeQuiz.questions?.map((q: any, qi: number) => (
                  <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <p className="font-medium text-gray-800 dark:text-white mb-3">Q{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt: string, oi: number) => (
                        <label key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition
                          ${answers[qi] === oi
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                          <input type="radio" name={`ans-${qi}`} checked={answers[qi] === oi}
                            onChange={() => { const a = [...answers]; a[qi] = oi; setAnswers(a); }}
                            className="text-primary-600" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {answers.filter(a => a !== -1).length}/{activeQuiz.questions?.length} answered
                </p>
                <button onClick={handleAttempt} disabled={submitting} className="btn-primary px-6 py-2.5 disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {result && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="modal-box max-w-sm p-8 text-center">
              <div className="text-6xl mb-4">{result.score >= result.totalMarks * 0.7 ? '🎉' : '📚'}</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Quiz Complete!</h3>
              <p className="text-5xl font-bold text-primary-600 my-4">
                {result.score}<span className="text-2xl text-gray-400">/{result.totalMarks}</span>
              </p>
              <p className="text-gray-500 mb-2">{result.message}</p>
              <p className="text-sm text-gray-400 mb-6">
                {Math.round((result.score / result.totalMarks) * 100)}% score
              </p>
              <button onClick={() => { setResult(null); setActiveQuiz(null); }} className="btn-primary w-full py-3">Done</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
