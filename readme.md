# 📊 DSA Mentor

A full-stack DSA preparation tracker with MongoDB cloud storage, spaced repetition revision scheduling, and real-time analytics.

**Live Demo:** [https://willowy-pixie-081b90.netlify.app]

---

## ✨ Features

- Add, delete, and review DSA problems
- Spaced repetition revision scheduler (1→7→30→Mastered)
- Topic coverage chart
- Weak topic detection
- Stats (Total solved, Streak, Readiness)
- Dark/Light mode
- Search, Share, Export CSV

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Deployment:** Railway (Backend), Netlify (Frontend)

---


---

## 🚀 How to Run Locally

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dsa-mentor.git
cd dsa-mentor
2. Backend Setup
bash
cd backend
npm install
Create a .env file in the backend/ folder:
PORT=5000
MONGO_URI=your_mongodb_connection_string
Start the backend server:

bash
npm run dev
The server will run at: http://localhost:5000

3. Frontend Setup
Open frontend/index.html in your browser or use Live Server in VS Code.

Update the API_BASE in index.html:

javascript
const API_BASE = 'http://localhost:5000/api';
4. Test the Application
Open http://localhost:5500 (frontend).


