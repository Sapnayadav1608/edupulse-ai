const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options:       [{ type: String, required: true }],  // 4 options
  correctAnswer: { type: Number, required: true },     // index 0-3
  marks:         { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    subject:     { type: String, required: true },
    department:  { type: String, required: true },
    semester:    { type: Number, required: true },
    duration:    { type: Number, required: true },   // in minutes
    totalMarks:  { type: Number, default: 0 },
    questions:   [questionSchema],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive:    { type: Boolean, default: true },
    attempts: [{
      student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score:     { type: Number },
      answers:   [{ type: Number }],
      attemptedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
