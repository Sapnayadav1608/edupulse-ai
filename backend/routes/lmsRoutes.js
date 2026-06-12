const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadNote, uploadAssignment } = require('../middleware/uploadMiddleware');
const {
  getNotes, createNote, deleteNote,
  getAssignments, createAssignment, deleteAssignment, submitAssignment, markSubmission,
  getQuizzes, getQuizById, createQuiz, attemptQuiz, deleteQuiz, generateAIQuiz, getRecommendedQuizzes,
  generateInterestQuiz,
} = require('../controllers/lmsController');

router.use(protect);

// ── Notes ──────────────────────────────────────────────────
router.get('/notes',        getNotes);
router.post('/notes',       authorize('admin', 'faculty'), uploadNote, createNote);
router.delete('/notes/:id', authorize('admin', 'faculty'), deleteNote);

// ── Assignments ────────────────────────────────────────────
router.get('/assignments',              getAssignments);
router.post('/assignments',             authorize('admin', 'faculty'), createAssignment);
router.delete('/assignments/:id',       authorize('admin', 'faculty'), deleteAssignment);
router.post('/assignments/:id/submit',  authorize('student'), uploadAssignment, submitAssignment);
router.put('/assignments/:id/submissions/:studentId/mark', authorize('admin', 'faculty'), markSubmission);

// ── Quizzes ────────────────────────────────────────────────
router.get('/quizzes/recommended',      authorize('student'), getRecommendedQuizzes);
router.post('/quizzes/interest-quiz',   authorize('student'), generateInterestQuiz);
router.get('/quizzes',                  getQuizzes);
router.post('/quizzes/generate-ai',     authorize('admin', 'faculty'), generateAIQuiz);
router.post('/quizzes',                 authorize('admin', 'faculty'), createQuiz);
router.get('/quizzes/:id',              getQuizById);
router.post('/quizzes/:id/attempt',     authorize('student'), attemptQuiz);
router.delete('/quizzes/:id',           authorize('admin', 'faculty'), deleteQuiz);

module.exports = router;
