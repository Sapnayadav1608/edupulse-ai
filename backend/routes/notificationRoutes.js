const express = require('express');
const router  = express.Router();
const { protect }   = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, clearAll, sendDefaulterAlerts, broadcast,
} = require('../controllers/notificationController');

router.use(protect);

router.get('/',                   getNotifications);
router.put('/read-all',           markAllAsRead);
router.delete('/clear-all',       clearAll);
router.put('/:id/read',           markAsRead);
router.delete('/:id',             deleteNotification);
router.post('/send-defaulter-alerts', authorize('admin', 'faculty'), sendDefaulterAlerts);
router.post('/broadcast',         authorize('admin'), broadcast);

module.exports = router;
