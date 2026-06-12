const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Helper — forward request to Python Flask service
const callAIService = async (endpoint, data) => {
  const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, {
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// POST /api/ai/predict/performance
const predictPerformance = async (req, res, next) => {
  try {
    const result = await callAIService('/predict/performance', req.body);
    res.json(result);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'AI service is not running. Start it with: python api/app.py' });
    }
    next(error);
  }
};

// POST /api/ai/predict/attendance
const predictAttendance = async (req, res, next) => {
  try {
    const result = await callAIService('/predict/attendance', req.body);
    res.json(result);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'AI service is not running.' });
    }
    next(error);
  }
};

// POST /api/ai/predict/placement
const predictPlacement = async (req, res, next) => {
  try {
    const result = await callAIService('/predict/placement', req.body);
    res.json(result);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'AI service is not running.' });
    }
    next(error);
  }
};

// POST /api/ai/predict/full  ← main endpoint used by frontend
const predictFull = async (req, res, next) => {
  try {
    const result = await callAIService('/predict/full', req.body);
    res.json(result);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service offline. Run: cd ai-service && python api/app.py',
      });
    }
    next(error);
  }
};

// GET /api/ai/health
const checkHealth = async (req, res, next) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({ success: true, aiService: response.data });
  } catch {
    res.json({ success: false, message: 'AI service is offline', aiService: null });
  }
};

module.exports = { predictPerformance, predictAttendance, predictPlacement, predictFull, checkHealth };
