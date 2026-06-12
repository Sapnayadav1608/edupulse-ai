const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema(
  {
    student:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    resumeUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'],
      default: 'applied',
    },
    interviewDate: { type: Date },
    interviewMode: { type: String, enum: ['online', 'offline', ''], default: '' },
    offerLetter:   { type: String, default: '' },
    package:       { type: String, default: '' },
    feedback:      { type: String, default: '' },
  },
  { timestamps: true }
);

// One student can apply to one company only once
placementSchema.index({ student: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('Placement', placementSchema);
