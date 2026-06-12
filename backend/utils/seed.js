require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('../models/User');
const Student = require('../models/Student');

const users = [
  { name: 'Admin User',    email: 'admin@edupulse.com',   password: 'admin123',   role: 'admin' },
  { name: 'Prof. Sharma',  email: 'faculty@edupulse.com', password: 'faculty123', role: 'faculty' },
  { name: 'Rahul Verma',   email: 'student@edupulse.com', password: 'student123', role: 'student' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');

  await Student.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️  Cleared existing users & students');

  for (const u of users) {
    const created = await User.create(u);
    console.log(`✅ Created: ${u.role} → ${u.email}`);

    // Create Student profile for student role
    if (u.role === 'student') {
      await Student.create({
        user:        created._id,
        rollNumber:  'CS2021001',
        department:  'Computer Science',
        semester:    5,
        batch:       '2021-2025',
        phone:       '9876543210',
        cgpa:        7.2,
      });
      console.log(`✅ Student profile created for ${u.name}`);
    }
  }

  console.log('\n🎉 Seed complete! Test credentials:');
  console.log('   Admin:   admin@edupulse.com   / admin123');
  console.log('   Faculty: faculty@edupulse.com / faculty123');
  console.log('   Student: student@edupulse.com / student123');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
