const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  fileUrl:       { type: String },
  fileName:      { type: String },
  submittedAt:   { type: Date, default: Date.now },
  status:        { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' },
  marksObtained: { type: Number, default: null },
  feedback:      { type: String, default: '' },
});

const assignmentSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    subject:     { type: String, required: true },
    department:  { type: String, required: true },
    semester:    { type: Number, required: true },
    dueDate:     { type: Date, required: true },
    maxMarks:    { type: Number, default: 100 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
