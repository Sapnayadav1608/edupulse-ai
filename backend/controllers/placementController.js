const Company   = require('../models/Company');
const Placement = require('../models/Placement');
const Student   = require('../models/Student');

// ─── COMPANIES ────────────────────────────────────────────

// GET /api/placement/companies
const getCompanies = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const companies = await Company.find(filter)
      .populate('createdBy', 'name')
      .sort({ driveDate: 1 });
    res.json({ success: true, companies });
  } catch (error) { next(error); }
};

// POST /api/placement/companies
const createCompany = async (req, res, next) => {
  try {
    const company = await Company.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, company });
  } catch (error) { next(error); }
};

// PUT /api/placement/companies/:id
const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) { next(error); }
};

// DELETE /api/placement/companies/:id
const deleteCompany = async (req, res, next) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    await Placement.deleteMany({ company: req.params.id });
    res.json({ success: true, message: 'Company drive deleted' });
  } catch (error) { next(error); }
};

// ─── APPLICATIONS ─────────────────────────────────────────

// POST /api/placement/apply/:companyId  (student applies)
const applyToCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Check application deadline
    if (new Date() > new Date(company.lastDateToApply)) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    // Get student profile for eligibility check
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    // Check CGPA eligibility
    if (student.cgpa < company.eligibility.minCGPA) {
      return res.status(400).json({
        success: false,
        message: `Minimum CGPA required: ${company.eligibility.minCGPA}. Your CGPA: ${student.cgpa}`,
      });
    }

    const application = await Placement.create({
      student:   student._id,
      company:   company._id,
      resumeUrl: req.file ? `/uploads/resumes/${req.file.filename}` : (req.body.resumeUrl || ''),
    });

    // Update student placement status
    await Student.findByIdAndUpdate(student._id, { placementStatus: 'applied' });

    res.status(201).json({ success: true, application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already applied to this company' });
    }
    next(error);
  }
};

// GET /api/placement/applications  (admin/faculty sees all)
const getApplications = async (req, res, next) => {
  try {
    const { companyId, status } = req.query;
    const filter = {};
    if (companyId) filter.company = companyId;
    if (status)    filter.status  = status;

    const applications = await Placement.find(filter)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('company', 'name jobRole package')
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) { next(error); }
};

// GET /api/placement/my-applications  (student sees own)
const getMyApplications = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json({ success: true, applications: [] });

    const applications = await Placement.find({ student: student._id })
      .populate('company', 'name jobRole package driveDate location industry status')
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) { next(error); }
};

// PUT /api/placement/applications/:id/status  (admin updates status)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, interviewDate, interviewMode, package: pkg, feedback } = req.body;
    const application = await Placement.findByIdAndUpdate(
      req.params.id,
      { status, interviewDate, interviewMode, package: pkg, feedback },
      { new: true }
    ).populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
     .populate('company', 'name');

    // If selected, update student placement status
    if (status === 'selected') {
      await Student.findByIdAndUpdate(application.student._id, { placementStatus: 'placed' });
    }

    res.json({ success: true, application });
  } catch (error) { next(error); }
};

// GET /api/placement/stats  (dashboard stats)
const getPlacementStats = async (req, res, next) => {
  try {
    const totalDrives    = await Company.countDocuments();
    const upcomingDrives = await Company.countDocuments({ status: 'upcoming' });
    const totalApplied   = await Placement.countDocuments();
    const totalSelected  = await Placement.countDocuments({ status: 'selected' });
    const totalStudents  = await Student.countDocuments();

    const companiesList = await Company.find().sort({ driveDate: 1 }).limit(5);

    res.json({
      success: true,
      stats: { totalDrives, upcomingDrives, totalApplied, totalSelected, totalStudents,
        placementRate: totalStudents > 0 ? Math.round((totalSelected / totalStudents) * 100) : 0,
      },
      recentDrives: companiesList,
    });
  } catch (error) { next(error); }
};

module.exports = {
  getCompanies, createCompany, updateCompany, deleteCompany,
  applyToCompany, getApplications, getMyApplications,
  updateApplicationStatus, getPlacementStats,
};
