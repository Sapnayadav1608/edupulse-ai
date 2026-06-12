const Note       = require('../models/Note');
const Assignment = require('../models/Assignment');
const Quiz       = require('../models/Quiz');
const axios      = require('axios');
const path       = require('path');
const fs         = require('fs');

// ─── NOTES ────────────────────────────────────────────────

// GET /api/lms/notes
const getNotes = async (req, res, next) => {
  try {
    const { department, semester, subject } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);
    if (subject)    filter.subject    = new RegExp(subject, 'i');

    const notes = await Note.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, notes });
  } catch (error) { next(error); }
};

// POST /api/lms/notes
const createNote = async (req, res, next) => {
  try {
    const { title, description, subject, department, semester } = req.body;
    const noteData = {
      title, description, subject, department,
      semester: Number(semester),
      uploadedBy: req.user._id,
    };

    // If file uploaded via multer
    if (req.file) {
      noteData.fileUrl  = `/uploads/notes/${req.file.filename}`;
      noteData.fileName = req.file.originalname;
      noteData.fileType = path.extname(req.file.originalname).slice(1);
    }

    const note = await Note.create(noteData);
    await note.populate('uploadedBy', 'name');
    res.status(201).json({ success: true, note });
  } catch (error) { next(error); }
};

// DELETE /api/lms/notes/:id
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    // Delete local file if exists
    if (note.fileUrl) {
      const filePath = path.join(__dirname, '..', note.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) { next(error); }
};

// ─── ASSIGNMENTS ──────────────────────────────────────────

// GET /api/lms/assignments
const getAssignments = async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);

    const assignments = await Assignment.find(filter)
      .populate('createdBy', 'name')
      .populate({ path: 'submissions.student', populate: { path: 'user', select: 'name' } })
      .sort({ dueDate: 1 });
    res.json({ success: true, assignments });
  } catch (error) { next(error); }
};

// POST /api/lms/assignments
const createAssignment = async (req, res, next) => {
  try {
    const { title, description, subject, department, semester, dueDate, maxMarks } = req.body;
    const assignment = await Assignment.create({
      title, description, subject, department,
      semester: Number(semester),
      dueDate: new Date(dueDate),
      maxMarks: Number(maxMarks) || 100,
      createdBy: req.user._id,
    });
    await assignment.populate('createdBy', 'name');
    res.status(201).json({ success: true, assignment });
  } catch (error) { next(error); }
};

// DELETE /api/lms/assignments/:id
const deleteAssignment = async (req, res, next) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) { next(error); }
};

// POST /api/lms/assignments/:id/submit  (student submits)
const submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Check if already submitted
    const alreadySubmitted = assignment.submissions.find(
      s => s.student.toString() === req.user._id.toString()
    );
    if (alreadySubmitted) return res.status(400).json({ success: false, message: 'Already submitted' });

    // Get student profile
    const Student = require('../models/Student');
    const studentProfile = await Student.findOne({ user: req.user._id });
    if (!studentProfile) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const isLate = new Date() > new Date(assignment.dueDate);
    const submission = {
      student: studentProfile._id,
      status: isLate ? 'late' : 'submitted',
      ...(req.file && { fileUrl: `/uploads/assignments/${req.file.filename}`, fileName: req.file.originalname }),
    };

    assignment.submissions.push(submission);
    await assignment.save();
    res.json({ success: true, message: isLate ? 'Submitted (late)' : 'Submitted successfully' });
  } catch (error) { next(error); }
};

// ─── QUIZZES ──────────────────────────────────────────────

// GET /api/lms/quizzes/recommended  (personalized for student based on marks & department)
const getRecommendedQuizzes = async (req, res, next) => {
  try {
    const Student = require('../models/Student');
    const Marks   = require('../models/Marks');

    // Get student profile
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    // Get student marks to find weak subjects
    const marks = await Marks.find({ student: student._id });

    // Calculate subject-wise percentage
    const subjectMap = {};
    marks.forEach(m => {
      if (!subjectMap[m.subject]) subjectMap[m.subject] = { total: 0, obtained: 0 };
      subjectMap[m.subject].obtained += m.marksObtained;
      subjectMap[m.subject].total    += m.totalMarks;
    });

    const weakSubjects = Object.entries(subjectMap)
      .map(([subject, v]) => ({ subject, pct: Math.round((v.obtained / v.total) * 100) }))
      .filter(s => s.pct < 70)
      .sort((a, b) => a.pct - b.pct)
      .map(s => s.subject);

    // Find quizzes: weak subjects first, then department match
    let quizzes = [];

    // 1. Weak subject quizzes
    if (weakSubjects.length > 0) {
      const weakQuizzes = await Quiz.find({
        isActive: true,
        subject: { $in: weakSubjects },
      }).populate('createdBy', 'name').select('-questions.correctAnswer -attempts').limit(3);
      quizzes.push(...weakQuizzes.map(q => ({ ...q.toObject(), reason: `Weak subject: ${q.subject}`, tag: 'weak' })));
    }

    // 2. Department quizzes (fill remaining slots up to 5)
    if (quizzes.length < 5) {
      const existingIds = quizzes.map(q => q._id.toString());
      const deptQuizzes = await Quiz.find({
        isActive:   true,
        department: student.department,
        semester:   student.semester,
        _id:        { $nin: existingIds },
      }).populate('createdBy', 'name').select('-questions.correctAnswer -attempts').limit(5 - quizzes.length);
      quizzes.push(...deptQuizzes.map(q => ({ ...q.toObject(), reason: `${student.department} • Sem ${student.semester}`, tag: 'dept' })));
    }

    // 3. Any quizzes if still empty
    if (quizzes.length === 0) {
      const anyQuizzes = await Quiz.find({ isActive: true })
        .populate('createdBy', 'name').select('-questions.correctAnswer -attempts').limit(5);
      quizzes.push(...anyQuizzes.map(q => ({ ...q.toObject(), reason: 'Explore & Learn', tag: 'general' })));
    }

    res.json({ success: true, quizzes, weakSubjects });
  } catch (error) { next(error); }
};

const getQuizzes = async (req, res, next) => {
  try {
    const { department, semester } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name')
      .select('-questions.correctAnswer -attempts')
      .sort({ createdAt: -1 });
    res.json({ success: true, quizzes });
  } catch (error) { next(error); }
};

// GET /api/lms/quizzes/:id  (full quiz with questions for attempt)
const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).select('-attempts');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, quiz });
  } catch (error) { next(error); }
};

// POST /api/lms/quizzes
const createQuiz = async (req, res, next) => {
  try {
    const { title, subject, department, semester, duration, questions } = req.body;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const quiz = await Quiz.create({
      title, subject, department,
      semester: Number(semester),
      duration: Number(duration),
      questions, totalMarks,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, quiz });
  } catch (error) { next(error); }
};

// POST /api/lms/quizzes/:id/attempt  (student attempts quiz)
const attemptQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const alreadyAttempted = quiz.attempts.find(
      a => a.student.toString() === req.user._id.toString()
    );
    if (alreadyAttempted) return res.status(400).json({ success: false, message: 'Already attempted' });

    const { answers } = req.body; // array of selected option indexes
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score += q.marks;
    });

    quiz.attempts.push({ student: req.user._id, score, answers });
    await quiz.save();
    res.json({ success: true, score, totalMarks: quiz.totalMarks, message: `You scored ${score}/${quiz.totalMarks}` });
  } catch (error) { next(error); }
};

// DELETE /api/lms/quizzes/:id
const deleteQuiz = async (req, res, next) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) { next(error); }
};

// PUT /api/lms/assignments/:id/submissions/:studentId/mark  (faculty gives marks)
const markSubmission = async (req, res, next) => {
  try {
    const { marksObtained } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const sub = assignment.submissions.find(
      s => s.student.toString() === req.params.studentId
    );
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });

    sub.marksObtained = Number(marksObtained);
    await assignment.save();
    res.json({ success: true, message: 'Marks saved' });
  } catch (error) { next(error); }
};

// POST /api/lms/quizzes/generate-ai  (faculty generates quiz using NLP Python service)
const generateAIQuiz = async (req, res, next) => {
  try {
    const { topic, subject, numQuestions = 5, difficulty = 'medium' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
      topic, subject, numQuestions, difficulty,
    }, { timeout: 15000 });

    res.json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'AI service is not running. Start it with: python api/app.py' });
    }
    console.error('NLP Quiz Generation Error:', error.message);
    res.status(500).json({ success: false, message: 'Quiz generation failed. Try again.' });
  }
};

// POST /api/lms/quizzes/interest-quiz  (student generates quiz based on their interests)
const generateInterestQuiz = async (req, res, next) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const { topic, numQuestions = 5, difficulty = 'medium' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
      topic, subject: topic, numQuestions, difficulty,
    }, { timeout: 15000 });

    res.json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED')
      return res.status(503).json({ success: false, message: 'AI service is not running.' });
    next(error);
  }
};

module.exports = {
  getNotes, createNote, deleteNote,
  getAssignments, createAssignment, deleteAssignment, submitAssignment, markSubmission,
  getQuizzes, getQuizById, createQuiz, attemptQuiz, deleteQuiz, generateAIQuiz, getRecommendedQuizzes,
  generateInterestQuiz,
};
