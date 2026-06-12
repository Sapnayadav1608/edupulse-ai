require('dotenv').config();
const mongoose  = require('mongoose');
const User      = require('../models/User');
const Student   = require('../models/Student');
const Company   = require('../models/Company');
const Placement = require('../models/Placement');

const companies = [
  {
    name: 'TCS', industry: 'IT Services', jobRole: 'Software Engineer',
    package: '3.5-4.5 LPA', location: 'Pan India', website: 'https://tcs.com',
    description: 'Tata Consultancy Services — India\'s largest IT company',
    driveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastDateToApply: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    eligibility: { minCGPA: 6.0, departments: ['Computer Science', 'Information Technology', 'Electronics'], maxBacklogs: 0 },
    status: 'upcoming',
  },
  {
    name: 'Infosys', industry: 'IT Services', jobRole: 'Systems Engineer',
    package: '3.6-5 LPA', location: 'Bangalore, Pune, Hyderabad', website: 'https://infosys.com',
    description: 'Infosys — Global leader in next-generation digital services',
    driveDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    lastDateToApply: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    eligibility: { minCGPA: 6.5, departments: ['Computer Science', 'Information Technology'], maxBacklogs: 0 },
    status: 'upcoming',
  },
  {
    name: 'Wipro', industry: 'IT Services', jobRole: 'Project Engineer',
    package: '3.5 LPA', location: 'Multiple Locations', website: 'https://wipro.com',
    description: 'Wipro — Leading global IT, consulting and business process services company',
    driveDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastDateToApply: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    eligibility: { minCGPA: 6.0, departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'], maxBacklogs: 1 },
    status: 'ongoing',
  },
  {
    name: 'Cognizant', industry: 'IT Services', jobRole: 'Programmer Analyst',
    package: '4-5 LPA', location: 'Chennai, Pune, Kolkata', website: 'https://cognizant.com',
    description: 'Cognizant — One of the world\'s leading professional services companies',
    driveDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastDateToApply: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    eligibility: { minCGPA: 7.0, departments: ['Computer Science', 'Information Technology'], maxBacklogs: 0 },
    status: 'completed',
  },
  {
    name: 'Amazon', industry: 'E-Commerce / Cloud', jobRole: 'SDE-1',
    package: '18-24 LPA', location: 'Bangalore, Hyderabad', website: 'https://amazon.com',
    description: 'Amazon — Global technology and e-commerce giant',
    driveDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    lastDateToApply: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    eligibility: { minCGPA: 8.0, departments: ['Computer Science', 'Information Technology'], maxBacklogs: 0 },
    status: 'upcoming',
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');

  await Company.deleteMany({});
  await Placement.deleteMany({});
  console.log('🗑️  Cleared existing placement data');

  const admin    = await User.findOne({ role: 'admin' });
  const students = await Student.find().populate('user').limit(6);

  // Create companies
  const createdCompanies = [];
  for (const c of companies) {
    const company = await Company.create({ ...c, createdBy: admin._id });
    createdCompanies.push(company);
    console.log(`✅ Created company: ${company.name}`);
  }

  // Create sample applications
  const appData = [
    { studentIdx: 0, companyIdx: 0, status: 'shortlisted' },
    { studentIdx: 1, companyIdx: 0, status: 'applied' },
    { studentIdx: 2, companyIdx: 0, status: 'applied' },
    { studentIdx: 0, companyIdx: 2, status: 'interview_scheduled', interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { studentIdx: 1, companyIdx: 3, status: 'selected', package: '4.5 LPA' },
    { studentIdx: 3, companyIdx: 1, status: 'applied' },
    { studentIdx: 4, companyIdx: 2, status: 'rejected' },
  ];

  for (const app of appData) {
    if (!students[app.studentIdx] || !createdCompanies[app.companyIdx]) continue;
    await Placement.create({
      student: students[app.studentIdx]._id,
      company: createdCompanies[app.companyIdx]._id,
      status:  app.status,
      interviewDate: app.interviewDate || null,
      package: app.package || '',
    });
    console.log(`✅ Application: ${students[app.studentIdx].user.name} → ${createdCompanies[app.companyIdx].name} (${app.status})`);
  }

  console.log('\n🎉 Placement data seeded successfully!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
