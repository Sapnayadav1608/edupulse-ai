const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rollNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    batch: { type: String, required: true }, // e.g. "2022-2026"
    phone: { type: String },
    address: { type: String },
    cgpa: { type: Number, default: 0, min: 0, max: 10 },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    placementStatus: {
      type: String,
      enum: ['not_applied', 'applied', 'placed'],
      default: 'not_applied',
    },
    interests: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
