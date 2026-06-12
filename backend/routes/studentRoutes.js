const express = require('express');
const router = express.Router();
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile, updateMyProfile, updateInterests } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Student can fetch/update their own profile
router.get('/me', getMyProfile);
router.patch('/me/profile',   authorize('student'), updateMyProfile);
router.patch('/me/interests', authorize('student'), updateInterests);

router.route('/')
  .get(authorize('admin', 'faculty'), getStudents)
  .post(authorize('admin'), createStudent);

router.route('/:id')
  .get(authorize('admin', 'faculty'), getStudent)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
