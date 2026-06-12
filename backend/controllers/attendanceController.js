const Attendance = require('../models/Attendance');
const Marks      = require('../models/Marks');

// @route  POST /api/attendance/mark
const markAttendance = async (req, res, next) => {
  try {
    const { subject, department, semester, date, records } = req.body;

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const ops = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, subject, date: dateObj },
        update: {
          $set: {
            student: r.studentId, subject, department,
            semester: Number(semester), date: dateObj,
            status: r.status, markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.json({ success: true, message: `Attendance marked for ${records.length} students` });
  } catch (error) { next(error); }
};

// @route  GET /api/attendance/report
const getAttendanceReport = async (req, res, next) => {
  try {
    const { department, semester, subject } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);
    if (subject)    filter.subject    = subject;

    const records = await Attendance.find(filter).populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    });

    const studentMap = {};
    records.forEach(r => {
      if (!r.student || !r.student._id) return;
      const sid = r.student._id.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = { student: r.student, total: 0, present: 0, absent: 0, late: 0 };
      }
      studentMap[sid].total++;
      if (r.status === 'present') studentMap[sid].present++;
      else if (r.status === 'absent') studentMap[sid].absent++;
      else if (r.status === 'late') studentMap[sid].late++;
    });

    const report = Object.values(studentMap).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0,
    }));

    res.json({ success: true, report });
  } catch (error) { next(error); }
};

// @route  GET /api/attendance/defaulters
const getDefaulters = async (req, res, next) => {
  try {
    const { department, semester, withMarks } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);

    const records = await Attendance.find(filter).populate({
      path: 'student',
      populate: { path: 'user', select: 'name email _id' },
    });

    const studentMap = {};
    records.forEach(r => {
      if (!r.student) return;
      const sid = r.student._id.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = { student: r.student, total: 0, present: 0 };
      }
      studentMap[sid].total++;
      if (r.status === 'present' || r.status === 'late') studentMap[sid].present++;
    });

    let defaulters = Object.values(studentMap)
      .map(s => ({
        ...s,
        percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      }))
      .filter(s => s.percentage < 75)
      .sort((a, b) => a.percentage - b.percentage);

    // If withMarks=true, attach real marks data for AI prediction
    if (withMarks === 'true') {
      const studentIds = defaulters.map(d => d.student._id);
      const allMarks   = await Marks.find({ student: { $in: studentIds } });

      defaulters = defaulters.map(d => {
        const sid   = d.student._id.toString();
        const marks = allMarks.filter(m => m.student.toString() === sid);

        const i1 = marks.find(m => m.examType === 'internal1');
        const i2 = marks.find(m => m.examType === 'internal2');
        const asgList = marks.filter(m => m.examType === 'assignment');

        const internal1 = i1 ? Math.round((i1.marksObtained / i1.totalMarks) * 30) : null;
        const internal2 = i2 ? Math.round((i2.marksObtained / i2.totalMarks) * 30) : null;
        const assignmentAvg = asgList.length > 0
          ? Math.round(asgList.reduce((s, m) => s + (m.marksObtained / m.totalMarks) * 10, 0) / asgList.length)
          : null;

        return {
          ...d,
          marksData: {
            internal1_marks: internal1,
            internal2_marks: internal2,
            assignment_avg:  assignmentAvg,
            cgpa:            d.student.cgpa || null,
            hasRealData:     !!(i1 || i2),
          },
        };
      });
    }

    res.json({ success: true, defaulters });
  } catch (error) { next(error); }
};

// @route  GET /api/attendance/student/:studentId
const getStudentAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.params.studentId }).sort({ date: -1 });

    const subjectMap = {};
    records.forEach(r => {
      if (!subjectMap[r.subject]) {
        subjectMap[r.subject] = { subject: r.subject, total: 0, present: 0 };
      }
      subjectMap[r.subject].total++;
      if (r.status !== 'absent') subjectMap[r.subject].present++;
    });

    const summary = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: Math.round((s.present / s.total) * 100),
    }));

    res.json({ success: true, records, summary });
  } catch (error) { next(error); }
};

// @route  POST /api/attendance/marks
const addMarks = async (req, res, next) => {
  try {
    const { student, subject, department, semester, examType, marksObtained, totalMarks } = req.body;
    const marks = await Marks.findOneAndUpdate(
      { student, subject, examType },
      {
        student, subject, department,
        semester: Number(semester), examType,
        marksObtained: Number(marksObtained),
        totalMarks: Number(totalMarks),
        recordedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, marks });
  } catch (error) { next(error); }
};

// @route  GET /api/attendance/marks/:studentId
const getStudentMarks = async (req, res, next) => {
  try {
    const marks = await Marks.find({ student: req.params.studentId }).sort({ subject: 1 });
    res.json({ success: true, marks });
  } catch (error) { next(error); }
};

// @route  GET /api/attendance/my  (student fetches own attendance)
const getMyAttendance = async (req, res, next) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const records = await Attendance.find({ student: student._id }).sort({ date: -1 });

    const subjectMap = {};
    records.forEach(r => {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { subject: r.subject, total: 0, present: 0 };
      subjectMap[r.subject].total++;
      if (r.status !== 'absent') subjectMap[r.subject].present++;
    });

    const summary = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: Math.round((s.present / s.total) * 100),
    }));

    res.json({ success: true, records, summary, studentId: student._id });
  } catch (error) { next(error); }
};

// @route  GET /api/attendance/my/marks  (student fetches own marks)
const getMyMarks = async (req, res, next) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const marks = await Marks.find({ student: student._id }).sort({ subject: 1 });
    res.json({ success: true, marks });
  } catch (error) { next(error); }
};

module.exports = {
  markAttendance, getAttendanceReport, getDefaulters,
  getStudentAttendance, addMarks, getStudentMarks,
  getMyAttendance, getMyMarks,
};
