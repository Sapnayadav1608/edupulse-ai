const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  markAttendance, getAttendanceReport, getDefaulters,
  getStudentAttendance, addMarks, getStudentMarks,
  getMyAttendance, getMyMarks,
} = require('../controllers/attendanceController');

router.use(protect);

// Student: own attendance & marks
router.get('/my',              authorize('student'), getMyAttendance);
router.get('/my/marks',        authorize('student'), getMyMarks);

// Attendance
router.post('/mark',                    authorize('admin', 'faculty'), markAttendance);
router.get('/report',                   authorize('admin', 'faculty'), getAttendanceReport);
router.get('/defaulters',               authorize('admin', 'faculty'), getDefaulters);
router.get('/student/:studentId',       getStudentAttendance);

// Marks
router.post('/marks',                   authorize('admin', 'faculty'), addMarks);
router.get('/marks/:studentId',         getStudentMarks);

module.exports = router;
