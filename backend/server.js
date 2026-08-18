require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorMiddleware = require('./middleware/errorMiddleware');

// Connect to MongoDB
connectDB();

const app = express();

// ── Security & Utility Middleware ──────────────────────────
app.use(helmet());                          // Sets secure HTTP headers
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());                    // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev')); // HTTP request logger

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/students',      require('./routes/studentRoutes'));
app.use('/api/faculty',       require('./routes/facultyRoutes'));
app.use('/api/lms',           require('./routes/lmsRoutes'));
app.use('/api/attendance',    require('./routes/attendanceRoutes'));
app.use('/api/placement',     require('./routes/placementRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));
app.use('/api/chatbot',       require('./routes/chatbotRoutes'));
app.use('/api/ai',            require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Serve uploaded files statically
app.use('/uploads', require('express').static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'EduPulse AI Backend Running ✅' }));

// Temporary seed route
app.get('/api/seed-now', async (req, res) => {
  try {
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Attendance = require('./models/Attendance');
    const Marks = require('./models/Marks');
    const Company = require('./models/Company');
    const Placement = require('./models/Placement');

    // Seed admin & faculty
    await Student.deleteMany({});
    await User.deleteMany({});
    const adminUser = await User.create({ name: 'Admin User', email: 'admin@edupulse.com', password: 'admin123', role: 'admin' });
    await User.create({ name: 'Prof. Sharma', email: 'faculty@edupulse.com', password: 'faculty123', role: 'faculty' });

    // Seed students
    const sampleStudents = [
      { name: 'Rahul Verma',  email: 'rahul@edupulse.com',  roll: 'CS21001', dept: 'Computer Science', sem: 4, batch: '2021-2025', phone: '9876543210', cgpa: 8.5 },
      { name: 'Priya Sharma', email: 'priya@edupulse.com',  roll: 'CS21002', dept: 'Computer Science', sem: 4, batch: '2021-2025', phone: '9876543211', cgpa: 9.1 },
      { name: 'Amit Kumar',   email: 'amit@edupulse.com',   roll: 'CS21003', dept: 'Computer Science', sem: 4, batch: '2021-2025', phone: '9876543212', cgpa: 7.2 },
      { name: 'Sneha Patel',  email: 'sneha@edupulse.com',  roll: 'IT21001', dept: 'Information Technology', sem: 4, batch: '2021-2025', phone: '9876543213', cgpa: 8.8 },
      { name: 'Rohan Singh',  email: 'rohan@edupulse.com',  roll: 'IT21002', dept: 'Information Technology', sem: 4, batch: '2021-2025', phone: '9876543214', cgpa: 6.9 },
      { name: 'Anjali Gupta', email: 'anjali@edupulse.com', roll: 'EC21001', dept: 'Electronics', sem: 3, batch: '2021-2025', phone: '9876543215', cgpa: 7.8 },
      { name: 'Vikram Yadav', email: 'vikram@edupulse.com', roll: 'EC21002', dept: 'Electronics', sem: 3, batch: '2021-2025', phone: '9876543216', cgpa: 8.0 },
      { name: 'Neha Joshi',   email: 'neha@edupulse.com',   roll: 'ME21001', dept: 'Mechanical', sem: 5, batch: '2021-2025', phone: '9876543217', cgpa: 7.5 },
      { name: 'Karan Mehta',  email: 'karan@edupulse.com',  roll: 'CS21004', dept: 'Computer Science', sem: 6, batch: '2020-2024', phone: '9876543218', cgpa: 9.3 },
      { name: 'Pooja Mishra', email: 'pooja@edupulse.com',  roll: 'IT21003', dept: 'Information Technology', sem: 6, batch: '2020-2024', phone: '9876543219', cgpa: 8.1 },
    ];
    const students = [];
    for (const s of sampleStudents) {
      const user = await User.create({ name: s.name, email: s.email, password: 'student123', role: 'student' });
      const student = await Student.create({ user: user._id, rollNumber: s.roll, department: s.dept, semester: s.sem, batch: s.batch, phone: s.phone, cgpa: s.cgpa });
      students.push(student);
    }

    // Seed attendance & marks
    await Attendance.deleteMany({});
    await Marks.deleteMany({});
    const subjects = ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering'];
    for (const student of students) {
      for (const subject of subjects) {
        for (let d = 29; d >= 0; d--) {
          const date = new Date(); date.setDate(date.getDate() - d); date.setHours(0,0,0,0);
          const rand = Math.random();
          const status = rand > 0.8 ? 'absent' : rand > 0.75 ? 'late' : 'present';
          await Attendance.create({ student: student._id, subject, department: student.department, semester: student.semester, date, status, markedBy: adminUser._id });
        }
        for (const exam of [{ examType: 'internal1', total: 30 }, { examType: 'internal2', total: 30 }, { examType: 'practical', total: 25 }, { examType: 'assignment', total: 15 }]) {
          await Marks.create({ student: student._id, subject, department: student.department, semester: student.semester, examType: exam.examType, marksObtained: Math.floor(Math.random() * (exam.total * 0.4) + exam.total * 0.6), totalMarks: exam.total, recordedBy: adminUser._id });
        }
      }
    }

    // Seed placement
    await Company.deleteMany({});
    await Placement.deleteMany({});
    const companies = [
      { name: 'TCS', industry: 'IT Services', jobRole: 'Software Engineer', package: '3.5-4.5 LPA', location: 'Pan India', website: 'https://tcs.com', description: 'Tata Consultancy Services', driveDate: new Date(Date.now() + 7*24*60*60*1000), lastDateToApply: new Date(Date.now() + 5*24*60*60*1000), eligibility: { minCGPA: 6.0, departments: ['Computer Science', 'Information Technology', 'Electronics'], maxBacklogs: 0 }, status: 'upcoming' },
      { name: 'Infosys', industry: 'IT Services', jobRole: 'Systems Engineer', package: '3.6-5 LPA', location: 'Bangalore', website: 'https://infosys.com', description: 'Infosys — Global leader', driveDate: new Date(Date.now() + 14*24*60*60*1000), lastDateToApply: new Date(Date.now() + 10*24*60*60*1000), eligibility: { minCGPA: 6.5, departments: ['Computer Science', 'Information Technology'], maxBacklogs: 0 }, status: 'upcoming' },
      { name: 'Amazon', industry: 'E-Commerce / Cloud', jobRole: 'SDE-1', package: '18-24 LPA', location: 'Bangalore', website: 'https://amazon.com', description: 'Amazon — Global tech giant', driveDate: new Date(Date.now() + 21*24*60*60*1000), lastDateToApply: new Date(Date.now() + 18*24*60*60*1000), eligibility: { minCGPA: 8.0, departments: ['Computer Science', 'Information Technology'], maxBacklogs: 0 }, status: 'upcoming' },
    ];
    for (const c of companies) await Company.create({ ...c, createdBy: adminUser._id });

    res.json({ success: true, message: '🎉 All seed data inserted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Global Error Handler ───────────────────────────────────
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
