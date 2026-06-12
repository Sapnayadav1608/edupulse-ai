# EduPulse AI 🎓

An intelligent college management system with AI-powered student performance prediction, attendance tracking, placement readiness analysis, and more.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| AI Service | Python, Flask, scikit-learn |
| Auth | JWT |

---

## Features

- 🔐 Role-based authentication (Admin, Faculty, Student)
- 📊 AI-powered performance & placement prediction
- 📅 Attendance tracking & defaulter alerts
- 📝 LMS — Assignments, Notes, Quizzes
- 📈 Analytics dashboard
- 🤖 AI Chatbot (Gemini)
- 🔔 Notifications system
- 🏢 Placement management

---

## Project Structure

```
edupulse-ai/
├── frontend/        # React + TypeScript app
├── backend/         # Node.js + Express API
└── ai-service/      # Python Flask AI microservice
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- Python >= 3.9
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/xSapna/edupulse-ai.git
cd edupulse-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file (see Environment Variables section)
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
python api/app.py
```

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/edupulse_ai
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key
AI_SERVICE_URL=http://localhost:8000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=EduPulse AI
```

---

## Seed Data
```bash
cd backend
node utils/seed.js          # Admin & Faculty
node utils/seedStudents.js  # Students
node utils/seedAttendance.js
node utils/seedPlacement.js
```

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@edupulse.com | admin123 |
| Faculty | faculty@edupulse.com | faculty123 |
| Student | rahul@edupulse.com | student123 |

---

## License
MIT
