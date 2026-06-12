const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const Student  = require('../models/Student');
const User     = require('../models/User');
const Attendance = require('../models/Attendance');

// GET /api/notifications  — get logged in user's notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) { next(error); }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) { next(error); }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) { next(error); }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
};

// DELETE /api/notifications/clear-all
const clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ success: true });
  } catch (error) { next(error); }
};

// POST /api/notifications/send-defaulter-alerts  (admin triggers)
const sendDefaulterAlerts = async (req, res, next) => {
  try {
    const { department, semester } = req.body;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester   = Number(semester);

    const records = await Attendance.find(filter).populate({
      path: 'student',
      populate: { path: 'user', select: 'name email _id' },
    });

    const studentMap = {};
    records.forEach(r => {
      if (!r.student || !r.student.user) return;
      const sid = r.student._id.toString();
      if (!studentMap[sid]) studentMap[sid] = { student: r.student, total: 0, present: 0 };
      studentMap[sid].total++;
      if (r.status !== 'absent') studentMap[sid].present++;
    });

    const defaulters = Object.values(studentMap)
      .map(s => ({ ...s, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 }))
      .filter(s => s.percentage < 75);

    if (defaulters.length === 0) {
      return res.json({ success: true, message: 'No defaulters found — no alerts sent' });
    }

    await notificationService.notifyDefaulters(defaulters);
    res.json({ success: true, message: `Alerts sent to ${defaulters.length} defaulters` });
  } catch (error) { next(error); }
};

// POST /api/notifications/broadcast  (admin sends to all students)
const broadcast = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    const students = await User.find({ role: 'student' }, '_id');
    await notificationService.createBulkNotifications(
      students.map(s => s._id),
      { title, message, type: type || 'general', link: '' }
    );
    res.json({ success: true, message: `Broadcast sent to ${students.length} students` });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAll, sendDefaulterAlerts, broadcast };
