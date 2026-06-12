const express = require('express');
const router  = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const { sendMessage } = require('../controllers/chatbotController');

router.use(protect);
router.post('/message', sendMessage);

module.exports = router;
