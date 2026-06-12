const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @route  POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @route  POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOTP       = otp;
    user.resetOTPExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    // Send email
    await sendEmail({
      to:      email,
      subject: 'EduPulse AI — Password Reset OTP',
      title:   'Password Reset Request',
      body:    `<p>Hello <strong>${user.name}</strong>,</p>
                <p>Your password reset OTP is:</p>
                <h1 style="text-align:center;letter-spacing:8px;color:#2563eb;font-size:36px">${otp}</h1>
                <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                <p>If you did not request this, please ignore this email.</p>`,
    });

    // In development, log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Password Reset OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) { next(error); }
};

// @route  POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetOTP:       otp,
      resetOTPExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password       = newPassword;
    user.resetOTP       = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (error) { next(error); }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };

