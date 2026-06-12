require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');

const sampleStudents = [
  { name: 'Rahul Verma',    email: 'rahul@edupulse.com',   roll: 'CS21001', dept: 'Computer Science', sem: 4, batch: '2021-2025', phone: '9876543210', cgpa: 8.5 },
  { name: 'Priya Sharma',   email: 'priya@edupulse.com',   roll: 'CS21002', dept: 'Computer Science', sem: 4, batch: '2021-2025', phone: '9876543211', cgpa: 9.1 },
  { name: 'Amit Kumar',     email: 'amit@edupulse.com',    roll: 'CS21003', dept: 'Computer Science', sem: 4, batch: '2021-2025', phone: '9876543212', cgpa: 7.2 },
  { name: 'Sneha Patel',    email: 'sneha@edupulse.com',   roll: 'IT21001', dept: 'Information Technology', sem: 4, batch: '2021-2025', phone: '9876543213', cgpa: 8.8 },
  { name: 'Rohan Singh',    email: 'rohan@edupulse.com',   roll: 'IT21002', dept: 'Information Technology', sem: 4, batch: '2021-2025', phone: '9876543214', cgpa: 6.9 },
  { name: 'Anjali Gupta',   email: 'anjali@edupulse.com',  roll: 'EC21001', dept: 'Electronics', sem: 3, batch: '2021-2025', phone: '9876543215', cgpa: 7.8 },
  { name: 'Vikram Yadav',   email: 'vikram@edupulse.com',  roll: 'EC21002', dept: 'Electronics', sem: 3, batch: '2021-2025', phone: '9876543216', cgpa: 8.0 },
  { name: 'Neha Joshi',     email: 'neha@edupulse.com',    roll: 'ME21001', dept: 'Mechanical', sem: 5, batch: '2021-2025', phone: '9876543217', cgpa: 7.5 },
  { name: 'Karan Mehta',    email: 'karan@edupulse.com',   roll: 'CS21004', dept: 'Computer Science', sem: 6, batch: '2020-2024', phone: '9876543218', cgpa: 9.3 },
  { name: 'Pooja Mishra',   email: 'pooja@edupulse.com',   roll: 'IT21003', dept: 'Information Technology', sem: 6, batch: '2020-2024', phone: '9876543219', cgpa: 8.1 },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');

  // Remove existing students (keep admin/faculty users)
  await Student.deleteMany({});
  await User.deleteMany({ role: 'student' });
  console.log('🗑️  Cleared existing students');

  for (const s of sampleStudents) {
    const user = await User.create({ name: s.name, email: s.email, password: 'student123', role: 'student' });
    await Student.create({ user: user._id, rollNumber: s.roll, department: s.dept, semester: s.sem, batch: s.batch, phone: s.phone, cgpa: s.cgpa });
    console.log(`✅ Created: ${s.name} (${s.roll})`);
  }

  console.log('\n🎉 10 students seeded successfully!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
