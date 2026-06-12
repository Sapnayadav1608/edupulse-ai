const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getOverview, getDepartmentStats, getCGPADistribution,
  getAttendanceTrend, getSubjectPerformance, getPlacementAnalytics,
} = require('../controllers/analyticsController');

router.use(protect);
router.use(authorize('admin', 'faculty'));

router.get('/overview',             getOverview);
router.get('/department',           getDepartmentStats);
router.get('/cgpa-distribution',    getCGPADistribution);
router.get('/attendance-trend',     getAttendanceTrend);
router.get('/subject-performance',  getSubjectPerformance);
router.get('/placement',            getPlacementAnalytics);

module.exports = router;
