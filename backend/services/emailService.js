const nodemailer = require('nodemailer');

// Create transporter — uses Gmail SMTP
const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// HTML email template
const emailTemplate = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p  { color: #bfdbfe; margin: 5px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .body h2 { color: #1e3a8a; margin-top: 0; }
    .body p  { color: #4b5563; line-height: 1.6; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 EduPulse AI</h1>
      <p>Intelligent Student Lifecycle Platform</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      <p>© 2024 EduPulse AI — All rights reserved</p>
      <p>This is an automated notification. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

// Send single email
const sendEmail = async ({ to, subject, title, body }) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      console.log(`📧 [Email Skipped - Not Configured] To: ${to} | Subject: ${subject}`);
      return { success: true, skipped: true };
    }
    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"EduPulse AI" <${process.env.EMAIL_USER}>`,
      to, subject,
      html: emailTemplate(title, body),
    });
    console.log(`📧 Email sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Email Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
const sendBulkEmail = async (recipients, subject, title, body) => {
  const results = await Promise.allSettled(
    recipients.map(to => sendEmail({ to, subject, title, body }))
  );
  return results;
};

module.exports = { sendEmail, sendBulkEmail };
