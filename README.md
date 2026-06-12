# EduPulse AI 🎓

An intelligent college management system that combines role-based access control, real-time analytics, a learning management system, and a dedicated AI microservice — all working together to help institutions monitor, predict, and improve student outcomes.

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

## Architecture Overview

EduPulse AI is built as a **3-service architecture**:

```
edupulse-ai/
├── frontend/        # React + TypeScript — UI for Admin, Faculty, Student
├── backend/         # Node.js + Express — REST API, business logic, DB
└── ai-service/      # Python + Flask — ML prediction microservice
```

The **frontend** communicates only with the **backend** over REST API. The **backend** internally calls the **AI service** for predictions. This separation ensures the ML models can be updated or scaled independently without touching the main app.

---

## Features — In Depth

### 🔐 Role-Based Authentication
Three roles — **Admin**, **Faculty**, and **Student** — each with distinct permissions enforced at both the route level (Express middleware) and the UI level (protected routes in React).

- JWT tokens are issued on login and attached to every API request via Axios interceptors.
- Token expiry is handled globally — on a 401 response, the user is automatically redirected to login.

---

### 👨‍🏫 Admin Panel
The admin has full control over the system:
- **User Management** — Create, update, delete Faculty and Student accounts.
- **Department & Batch Management** — Organize students by department, semester, and batch.
- **System Analytics** — View institution-wide performance, attendance trends, and placement stats.
- **Notifications** — Send announcements to specific roles or all users.

---

### 🏫 Faculty Dashboard
Faculty get a real-time class monitoring panel:
- **Student Overview** — View all students with attendance %, CGPA, and risk status.
- **AI At-Risk Detection** — The dashboard automatically calls the AI service for every attendance defaulter and displays their predicted performance label (excellent/good/average/poor), performance score, and placement readiness score.
- **Subject-wise Analytics** — Bar charts showing average marks per subject; pie chart for grade distribution.
- **Attendance Defaulters Table** — Students below 75% attendance are flagged with Critical/Warning/Safe badges.
- **AI Teaching Recommendations** — Dynamic suggestions generated based on live data (e.g., "5 subjects below 60% avg — conduct revision classes").
- **LMS Integration** — View assignments posted and total submission counts.

---

### 🎓 Student Dashboard
Students get a personalized view of their academic progress:
- Attendance percentage with subject-wise breakdown.
- Internal marks, assignment scores, and CGPA tracking.
- AI-predicted performance and placement readiness.
- Access to LMS — download notes, submit assignments, attempt quizzes.
- Notification inbox for alerts from faculty/admin.

---

### 📅 Attendance Management
- Faculty can mark attendance subject-wise for their class.
- The system auto-calculates each student's attendance percentage.
- Defaulters (below 75%) are flagged and listed separately.
- Attendance reports can be filtered by department, semester, or date range.
- Email alerts are sent to defaulters via Nodemailer.

---

### 📝 LMS (Learning Management System)
Three modules:
- **Notes** — Faculty upload study material (PDF/DOCX); students can download.
- **Assignments** — Faculty post assignments with deadlines; students submit files; faculty can view all submissions.
- **Quizzes** — Faculty create MCQ quizzes; students attempt them; scores are recorded automatically.

---

### 🤖 AI Microservice (Python + Flask)
A standalone Flask app running on port `8000` with three ML models trained on student data:

| Model | Input Features | Output |
|-------|---------------|--------|
| Performance Model | Attendance %, Internal marks, Assignment avg, CGPA, Study hours, Backlogs | Label (excellent/good/average/poor) + Score |
| Placement Model | CGPA, Performance score, Attendance %, Backlogs | Placement readiness score + Badge |
| Attendance Risk Model | Attendance % | Risk level (low/medium/high) |

- Models are pre-trained using `scikit-learn` and stored as `.pkl` files.
- The backend calls `/predict/full` to get all three predictions in one request.
- If the AI service is offline, the frontend degrades gracefully showing "Local Mode" — no crash.

---

### 📈 Analytics Dashboard
- Institution-wide charts: department-wise performance, semester-wise CGPA trends, placement statistics.
- Subject performance heatmaps.
- All charts built with **Recharts** (BarChart, PieChart, LineChart).

---

### 🏢 Placement Management
- Companies can be added with details (name, package, eligibility criteria).
- Students can view and apply for placement drives.
- Admin tracks application status per student.
- AI placement score is shown alongside each student's profile for quick shortlisting.

---

### 🔔 Notifications
- Admin/Faculty can send notifications to all users or specific roles.
- Students receive alerts for low attendance, assignment deadlines, quiz reminders, and placement drives.
- Notifications are stored in MongoDB and shown in a real-time inbox on the UI.

---

## Data Flow

```
User Action (React UI)
        ↓
Axios API Call (with JWT)
        ↓
Express Backend (auth + role check)
        ↓
MongoDB (data read/write)
        ↓  (for AI features)
Flask AI Service (ML prediction)
        ↓
Response back to UI
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
node utils/seed.js           # Admin & Faculty
node utils/seedStudents.js   # Students
node utils/seedAttendance.js
node utils/seedPlacement.js
```

---

## License
MIT

---

## Developer
Developed by **Sapna Yadav** — [GitHub](https://github.com/xSapna)
