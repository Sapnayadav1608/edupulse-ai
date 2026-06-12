const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true },
    password:    { type: String, required: true, minlength: 6 },
    role:        { type: String, enum: ['admin', 'faculty', 'student'], default: 'student' },
    avatar:      { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
    // Faculty-specific fields
    department:  { type: String, default: '' },
    designation: { type: String, default: '' },
    phone:       { type: String, default: '' },
    // Password reset
    resetOTP:        { type: String },
    resetOTPExpiry:  { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
