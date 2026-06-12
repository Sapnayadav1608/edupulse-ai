require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorMiddleware = require('./middleware/errorMiddleware');

// Connect to MongoDB
connectDB();

const app = express();

// ── Security & Utility Middleware ──────────────────────────
app.use(helmet());                          // Sets secure HTTP headers
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());                    // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev')); // HTTP request logger

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/students',      require('./routes/studentRoutes'));
app.use('/api/faculty',       require('./routes/facultyRoutes'));
app.use('/api/lms',           require('./routes/lmsRoutes'));
app.use('/api/attendance',    require('./routes/attendanceRoutes'));
app.use('/api/placement',     require('./routes/placementRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));
app.use('/api/chatbot',       require('./routes/chatbotRoutes'));
app.use('/api/ai',            require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Serve uploaded files statically
app.use('/uploads', require('express').static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'EduPulse AI Backend Running ✅' }));

// ── Global Error Handler ───────────────────────────────────
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
