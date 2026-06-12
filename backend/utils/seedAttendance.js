require('dotenv').config();
const mongoose   = require('mongoose');
const Student    = require('../models/Student');
const User       = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks      = require('../models/Marks');

const subjects = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering'];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');

  await Attendance.deleteMany({});
  await Marks.deleteMany({});

  const admin    = await User.findOne({ role: 'admin' });
  const students = await Student.find().limit(10);

  if (!students.length) { console.log('❌ No students found. Run seed:students first'); process.exit(1); }

  // Generate 30 days of attendance for each student & subject
  for (const student of students) {
    for (const subject of subjects) {
      for (let d = 29; d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);

        // Random attendance — 80% present probability
        const rand   = Math.random();
        const status = rand > 0.8 ? 'absent' : rand > 0.75 ? 'late' : 'present';

        await Attendance.create({
          student: student._id, subject,
          department: student.department,
          semester: student.semester,
          date, status, markedBy: admin._id,
        });
      }

      // Add marks for each subject
      const examTypes = [
        { examType: 'internal1',  total: 30 },
        { examType: 'internal2',  total: 30 },
        { examType: 'practical',  total: 25 },
        { examType: 'assignment', total: 15 },
      ];

      for (const exam of examTypes) {
        const obtained = Math.floor(Math.random() * (exam.total * 0.4) + exam.total * 0.6);
        await Marks.create({
          student: student._id, subject,
          department: student.department,
          semester: student.semester,
          examType: exam.examType,
          marksObtained: obtained,
          totalMarks: exam.total,
          recordedBy: admin._id,
        });
      }
    }
    console.log(`✅ Seeded attendance & marks for: ${student.rollNumber}`);
  }

  console.log('\n🎉 Attendance & Marks seeded successfully!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
