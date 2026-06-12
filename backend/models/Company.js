const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    logo:         { type: String, default: '' },
    description:  { type: String },
    industry:     { type: String, required: true },
    website:      { type: String, default: '' },
    driveDate:    { type: Date, required: true },
    lastDateToApply: { type: Date, required: true },
    package:      { type: String, required: true },   // e.g. "6-8 LPA"
    location:     { type: String, required: true },
    eligibility: {
      minCGPA:      { type: Number, default: 6.0 },
      departments:  [{ type: String }],
      maxBacklogs:  { type: Number, default: 0 },
    },
    jobRole:      { type: String, required: true },
    status:       { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
