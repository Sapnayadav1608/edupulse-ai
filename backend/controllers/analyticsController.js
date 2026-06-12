const Student    = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks      = require('../models/Marks');
const Placement  = require('../models/Placement');
const Company    = require('../models/Company');
const User       = require('../models/User');

// GET /api/analytics/overview
const getOverview = async (req, res, next) => {
  try {
    const [totalStudents, totalFaculty, totalCompanies, placedStudents] = await Promise.all([
      Student.countDocuments(),
      User.countDocuments({ role: 'faculty' }),
      Company.countDocuments(),
      Placement.countDocuments({ status: 'selected' }),
    ]);

    // Average CGPA
    const cgpaResult = await Student.aggregate([
      { $group: { _id: null, avgCGPA: { $avg: '$cgpa' } } },
    ]);
    const avgCGPA = cgpaResult[0]?.avgCGPA?.toFixed(2) || 0;

    // Average attendance
    const attResult = await Attendance.aggregate([
      { $group: { _id: '$student', total: { $sum: 1 }, present: { $sum: { $cond: [{ $ne: ['$status', 'absent'] }, 1, 0] } } } },
      { $project: { pct: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
      { $group: { _id: null, avgAtt: { $avg: '$pct' } } },
    ]);
    const avgAttendance = Math.round(attResult[0]?.avgAtt || 0);

    res.json({ success: true, overview: { totalStudents, totalFaculty, totalCompanies, placedStudents, avgCGPA, avgAttendance } });
  } catch (error) { next(error); }
};

// GET /api/analytics/department
const getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, avgCGPA: { $avg: '$cgpa' } } },
      { $project: { department: '$_id', count: 1, avgCGPA: { $round: ['$avgCGPA', 2] }, _id: 0 } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, stats });
  } catch (error) { next(error); }
};

// GET /api/analytics/cgpa-distribution
const getCGPADistribution = async (req, res, next) => {
  try {
    const students = await Student.find({}, 'cgpa');
    const dist = { 'Below 5': 0, '5-6': 0, '6-7': 0, '7-8': 0, '8-9': 0, '9-10': 0 };
    students.forEach(s => {
      const c = s.cgpa;
      if (c < 5)       dist['Below 5']++;
      else if (c < 6)  dist['5-6']++;
      else if (c < 7)  dist['6-7']++;
      else if (c < 8)  dist['7-8']++;
      else if (c < 9)  dist['8-9']++;
      else             dist['9-10']++;
    });
    const distribution = Object.entries(dist).map(([range, count]) => ({ range, count }));
    res.json({ success: true, distribution });
  } catch (error) { next(error); }
};

// GET /api/analytics/attendance-trend
const getAttendanceTrend = async (req, res, next) => {
  try {
    const trend = await Attendance.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $ne: ['$status', 'absent'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      { $project: { date: '$_id', pct: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0] }, _id: 0 } },
    ]);
    res.json({ success: true, trend });
  } catch (error) { next(error); }
};

// GET /api/analytics/subject-performance
const getSubjectPerformance = async (req, res, next) => {
  try {
    const perf = await Marks.aggregate([
      { $group: { _id: '$subject', avgMarks: { $avg: { $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100] } } } },
      { $project: { subject: '$_id', avgMarks: { $round: ['$avgMarks', 1] }, _id: 0 } },
      { $sort: { avgMarks: -1 } },
    ]);
    res.json({ success: true, performance: perf });
  } catch (error) { next(error); }
};

// GET /api/analytics/placement-stats
const getPlacementAnalytics = async (req, res, next) => {
  try {
    // Applications by status
    const byStatus = await Placement.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);

    // Top companies by applications
    const topCompanies = await Placement.aggregate([
      { $group: { _id: '$company', applications: { $sum: 1 } } },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      { $project: { name: '$company.name', applications: 1, _id: 0 } },
      { $sort: { applications: -1 } },
      { $limit: 5 },
    ]);

    res.json({ success: true, byStatus, topCompanies });
  } catch (error) { next(error); }
};

module.exports = { getOverview, getDepartmentStats, getCGPADistribution, getAttendanceTrend, getSubjectPerformance, getPlacementAnalytics };
