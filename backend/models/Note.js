const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    subject:     { type: String, required: true },
    department:  { type: String, required: true },
    semester:    { type: Number, required: true },
    fileUrl:     { type: String },        // Cloudinary or local path
    fileName:    { type: String },
    fileType:    { type: String },        // pdf, ppt, doc etc
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
