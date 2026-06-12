const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    type:       { type: String, enum: ['assignment', 'placement', 'attendance', 'marks', 'general'], default: 'general' },
    isRead:     { type: Boolean, default: false },
    link:       { type: String, default: '' }, // frontend route to navigate
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
