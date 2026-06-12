const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  predictPerformance,
  predictAttendance,
  predictPlacement,
  predictFull,
  checkHealth,
} = require('../controllers/aiController');

// All routes require authentication
router.use(protect);

router.get ('/health',              checkHealth);
router.post('/predict/performance', predictPerformance);
router.post('/predict/attendance',  predictAttendance);
router.post('/predict/placement',   predictPlacement);
router.post('/predict/full',        predictFull);       // ← used by frontend

module.exports = router;
