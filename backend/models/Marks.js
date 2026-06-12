const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
  {
    student:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject:    { type: String, required: true },
    department: { type: String, required: true },
    semester:   { type: Number, required: true },
    examType:   { type: String, enum: ['internal1', 'internal2', 'practical', 'assignment', 'final'], required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks:    { type: Number, required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate marks for same student+subject+examType
marksSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
