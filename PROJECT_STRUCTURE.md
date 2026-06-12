# EduPulse AI - Complete Project Structure

```
edupulse-ai/
├── frontend/                          # React.js Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/                # Reusable UI Components
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   └── Modal.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardCard.jsx
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   └── ChartContainer.jsx
│   │   │   ├── student/
│   │   │   │   ├── StudentProfile.jsx
│   │   │   │   ├── StudentList.jsx
│   │   │   │   └── StudentForm.jsx
│   │   │   ├── faculty/
│   │   │   │   ├── FacultyProfile.jsx
│   │   │   │   └── FacultyDashboard.jsx
│   │   │   ├── lms/
│   │   │   │   ├── NotesUpload.jsx
│   │   │   │   ├── AssignmentForm.jsx
│   │   │   │   └── QuizBuilder.jsx
│   │   │   ├── attendance/
│   │   │   │   ├── AttendanceMarker.jsx
│   │   │   │   └── AttendanceReport.jsx
│   │   │   ├── placement/
│   │   │   │   ├── CompanyForm.jsx
│   │   │   │   └── ApplicationTracker.jsx
│   │   │   ├── analytics/
│   │   │   │   ├── PerformanceChart.jsx
│   │   │   │   └── PredictionDisplay.jsx
│   │   │   └── chatbot/
│   │   │       └── ChatInterface.jsx
│   │   ├── pages/                     # Main Page Components
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── FacultyDashboard.jsx
│   │   │   │   └── StudentDashboard.jsx
│   │   │   ├── student/
│   │   │   │   ├── StudentManagement.jsx
│   │   │   │   ├── StudentProfile.jsx
│   │   │   │   └── AcademicRecords.jsx
│   │   │   ├── lms/
│   │   │   │   ├── Notes.jsx
│   │   │   │   ├── Assignments.jsx
│   │   │   │   └── Quiz.jsx
│   │   │   ├── attendance/
│   │   │   │   ├── AttendanceManagement.jsx
│   │   │   │   └── AttendanceReports.jsx
│   │   │   ├── placement/
│   │   │   │   ├── PlacementDashboard.jsx
│   │   │   │   └── CompanyManagement.jsx
│   │   │   ├── analytics/
│   │   │   │   └── AnalyticsDashboard.jsx
│   │   │   └── chatbot/
│   │   │       └── ChatbotPage.jsx
│   │   ├── layouts/                   # Layout Components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── routes/                    # Routing Configuration
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleBasedRoute.jsx
│   │   ├── services/                  # API Services
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── studentService.js
│   │   │   ├── facultyService.js
│   │   │   ├── lmsService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── placementService.js
│   │   │   ├── analyticsService.js
│   │   │   └── chatbotService.js
│   │   ├── context/                   # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── hooks/                     # Custom Hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useApi.js
│   │   │   ├── useLocalStorage.js
│   │   │   └── useNotification.js
│   │   ├── utils/                     # Utility Functions
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   ├── validators.js
│   │   │   └── formatters.js
│   │   ├── assets/                    # Static Assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── styles/
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
├── backend/                           # Node.js Backend
│   ├── controllers/                   # Route Controllers
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── facultyController.js
│   │   ├── lmsController.js
│   │   ├── attendanceController.js
│   │   ├── placementController.js
│   │   ├── analyticsController.js
│   │   └── chatbotController.js
│   ├── models/                        # MongoDB Models
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Course.js
│   │   ├── Assignment.js
│   │   ├── Quiz.js
│   │   ├── Attendance.js
│   │   ├── Placement.js
│   │   ├── Company.js
│   │   └── Notification.js
│   ├── routes/                        # API Routes
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── facultyRoutes.js
│   │   ├── lmsRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── placementRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── chatbotRoutes.js
│   ├── middleware/                    # Custom Middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validationMiddleware.js
│   ├── config/                        # Configuration Files
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   ├── email.js
│   │   └── gemini.js
│   ├── services/                      # Business Logic Services
│   │   ├── emailService.js
│   │   ├── fileService.js
│   │   ├── notificationService.js
│   │   ├── analyticsService.js
│   │   └── aiService.js
│   ├── utils/                         # Utility Functions
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── logger.js
│   ├── uploads/                       # File Upload Directory
│   │   ├── notes/
│   │   ├── assignments/
│   │   └── resumes/
│   ├── server.js
│   ├── package.json
│   └── .env
├── ai-service/                        # Python AI Service
│   ├── models/                        # ML Models
│   │   ├── performance_predictor.py
│   │   ├── attendance_analyzer.py
│   │   └── placement_predictor.py
│   ├── data/                          # Sample Datasets
│   │   ├── student_data.csv
│   │   ├── attendance_data.csv
│   │   └── placement_data.csv
│   ├── api/                           # Flask API
│   │   ├── app.py
│   │   ├── routes.py
│   │   └── utils.py
│   ├── training/                      # Model Training Scripts
│   │   ├── train_performance.py
│   │   ├── train_attendance.py
│   │   └── train_placement.py
│   ├── requirements.txt
│   └── .env
├── docs/                              # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── USER_MANUAL.md
│   └── VIVA_QUESTIONS.md
├── README.md
├── .gitignore
└── docker-compose.yml
```