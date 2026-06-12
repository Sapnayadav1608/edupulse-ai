const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadResume } = require('../middleware/uploadMiddleware');
const {
  getCompanies, createCompany, updateCompany, deleteCompany,
  applyToCompany, getApplications, getMyApplications,
  updateApplicationStatus, getPlacementStats,
} = require('../controllers/placementController');

router.use(protect);

// Stats
router.get('/stats', getPlacementStats);

// Companies
router.get('/companies',      getCompanies);
router.post('/companies',     authorize('admin', 'faculty'), createCompany);
router.put('/companies/:id',  authorize('admin', 'faculty'), updateCompany);
router.delete('/companies/:id', authorize('admin'), deleteCompany);

// Applications
router.post('/apply/:companyId', authorize('student'), uploadResume, applyToCompany);
router.get('/applications',               authorize('admin', 'faculty'), getApplications);
router.get('/my-applications',            authorize('student'), getMyApplications);
router.put('/applications/:id/status',    authorize('admin', 'faculty'), updateApplicationStatus);

module.exports = router;
