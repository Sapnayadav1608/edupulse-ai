const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty, getMyProfile, updateMyProfile,
} = require('../controllers/facultyController');

router.use(protect);

// Faculty can access their own profile
router.get('/me',   authorize('faculty', 'admin'), getMyProfile);
router.patch('/me', authorize('faculty', 'admin'), updateMyProfile);

router.use(authorize('admin'));

router.route('/')
  .get(getFaculty)
  .post(createFaculty);

router.route('/:id')
  .get(getFacultyById)
  .put(updateFaculty)
  .delete(deleteFaculty);

module.exports = router;
