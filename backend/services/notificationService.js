const Notification = require('../models/Notification');
const { sendEmail, sendBulkEmail } = require('./emailService');

// Create single in-app notification
const createNotification = async ({ recipient, title, message, type = 'general', link = '' }) => {
  return await Notification.create({ recipient, title, message, type, link });
};

// Create notifications for multiple users
const createBulkNotifications = async (recipients, { title, message, type, link }) => {
  const notifications = recipients.map(recipient => ({ recipient, title, message, type, link }));
  return await Notification.insertMany(notifications);
};

// Notify when new assignment is created
const notifyNewAssignment = async (assignment, studentUsers) => {
  const title   = `New Assignment: ${assignment.title}`;
  const message = `${assignment.subject} assignment due on ${new Date(assignment.dueDate).toLocaleDateString()}`;

  await createBulkNotifications(studentUsers.map(u => u._id), {
    title, message, type: 'assignment', link: '/lms',
  });

  // Send emails
  const emails = studentUsers.map(u => u.email).filter(Boolean);
  if (emails.length > 0) {
    await sendBulkEmail(emails, title, title,
      `<p>${message}</p><p><strong>Subject:</strong> ${assignment.subject}</p><p><strong>Max Marks:</strong> ${assignment.maxMarks}</p><a href="http://localhost:3000/lms" class="btn">View Assignment</a>`
    );
  }
};

// Notify when new placement drive is added
const notifyPlacementDrive = async (company, studentUsers) => {
  const title   = `New Placement Drive: ${company.name}`;
  const message = `${company.name} is hiring for ${company.jobRole} — ${company.package}. Drive date: ${new Date(company.driveDate).toLocaleDateString()}`;

  await createBulkNotifications(studentUsers.map(u => u._id), {
    title, message, type: 'placement', link: '/placement',
  });

  const emails = studentUsers.map(u => u.email).filter(Boolean);
  if (emails.length > 0) {
    await sendBulkEmail(emails, title, title,
      `<p><strong>Company:</strong> ${company.name}</p><p><strong>Role:</strong> ${company.jobRole}</p><p><strong>Package:</strong> ${company.package}</p><p><strong>Drive Date:</strong> ${new Date(company.driveDate).toLocaleDateString()}</p><p><strong>Min CGPA:</strong> ${company.eligibility?.minCGPA}</p><a href="http://localhost:3000/placement" class="btn">Apply Now</a>`
    );
  }
};

// Notify attendance defaulters
const notifyDefaulters = async (defaulters) => {
  for (const d of defaulters) {
    if (!d.student?.user?._id) continue;
    await createNotification({
      recipient: d.student.user._id,
      title:     '⚠️ Low Attendance Alert',
      message:   `Your attendance is ${d.percentage}% which is below the required 75%. Please attend classes regularly to avoid detention.`,
      type:      'attendance',
      link:      '/attendance',
    });

    if (d.student.user.email) {
      await sendEmail({
        to:      d.student.user.email,
        subject: '⚠️ Low Attendance Alert — EduPulse AI',
        title:   'Low Attendance Warning',
        body:    `<p>Dear <strong>${d.student.user.name}</strong>,</p><p>Your current attendance is <strong style="color:red">${d.percentage}%</strong>, which is below the required <strong>75%</strong>.</p><p>Please attend classes regularly to avoid being detained from examinations.</p><p>Contact your faculty advisor immediately for guidance.</p>`,
      }).catch(err => console.error('Email failed for', d.student.user.email, err.message));
    }
  }
};

module.exports = { createNotification, createBulkNotifications, notifyNewAssignment, notifyPlacementDrive, notifyDefaulters };
