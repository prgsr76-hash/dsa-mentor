const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = 'mongodb://prgsr76_db_user:R2jG9hdcjID0wSpi@ac-pdq95xu-shard-00-00.yxgj8ef.mongodb.net:27017,ac-pdq95xu-shard-00-01.yxgj8ef.mongodb.net:27017,ac-pdq95xu-shard-00-02.yxgj8ef.mongodb.net:27017/?ssl=true&replicaSet=atlas-x3pnc1-shard-0&authSource=admin&appName=Cluster0';

console.log("⏳ Connecting to MongoDB...");
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.log('❌ MongoDB Connection ERROR:');
    console.log(err.message);
  });

// Database Schema (WITH Revision Scheduler)
const problemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  date: { type: String, required: true },
  nextRevisionDate: { type: String, default: null },
  revisionLevel: { type: Number, default: 0 } // 0=Just Added, 1=1 day, 2=7 days, 3=30 days, 4=Mastered
});

const Problem = mongoose.model('Problem', problemSchema);

// ---------- API ROUTES ----------

// GET all problems (YEH MISSING THA!)
app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem.find().sort({ date: -1 });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new problem (WITH Revision Scheduling)
app.post('/api/problems', async (req, res) => {
  try {
    const { name, topic, difficulty, date } = req.body;
    if (!name || !topic || !date) {
      return res.status(400).json({ error: 'Name, Topic, and Date are required' });
    }

    // Calculate next revision date (1 day from now)
    const addedDate = new Date(date);
    const nextDate = new Date(addedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextRevisionDate = nextDate.toISOString().split('T')[0];

    const newProblem = new Problem({
      name,
      topic,
      difficulty,
      date,
      nextRevisionDate,
      revisionLevel: 1
    });

    const saved = await newProblem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a problem (SIRF EK BAAR)
app.delete('/api/problems/:id', async (req, res) => {
  try {
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Problem deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Review a problem (Revision Scheduler)
app.put('/api/problems/:id/review', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    let nextLevel = problem.revisionLevel + 1;
    let nextDate = new Date();

    if (nextLevel === 1) {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (nextLevel === 2) {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (nextLevel === 3) {
      nextDate.setDate(nextDate.getDate() + 30);
    } else {
      nextLevel = 4;
      nextDate = null;
    }

    problem.revisionLevel = nextLevel;
    problem.nextRevisionDate = nextDate ? nextDate.toISOString().split('T')[0] : null;

    await problem.save();
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});