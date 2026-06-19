const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- ENVIRONMENT VARIABLES ----------
const MONGO_URI = 'mongodb://prgsr76_db_user:R2jG9hdcjID0wSpi@ac-pdq95xu-shard-00-00.yxgj8ef.mongodb.net:27017,ac-pdq95xu-shard-00-01.yxgj8ef.mongodb.net:27017,ac-pdq95xu-shard-00-02.yxgj8ef.mongodb.net:27017/?ssl=true&replicaSet=atlas-x3pnc1-shard-0&authSource=admin&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_later';

// ---------- DATABASE CONNECTION ----------
console.log("⏳ Connecting to MongoDB...");
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ MongoDB Connection ERROR:', err.message));

// ---------- SCHEMAS ----------

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Problem Schema (with userId)
const problemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  date: { type: String, required: true },
  nextRevisionDate: { type: String, default: null },
  revisionLevel: { type: Number, default: 0 }
});

const Problem = mongoose.model('Problem', problemSchema);

// ---------- AUTH MIDDLEWARE ----------
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// ---------- AUTH ROUTES ----------

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      message: 'Account created successfully!'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      message: 'Login successful!'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// ---------- PROTECTED PROBLEM ROUTES ----------

// Get user's problems
app.get('/api/problems', authMiddleware, async (req, res) => {
  try {
    const problems = await Problem.find({ userId: req.userId }).sort({ date: -1 });
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a problem
app.post('/api/problems', authMiddleware, async (req, res) => {
  try {
    const { name, topic, difficulty, date } = req.body;

    if (!name || !topic || !date) {
      return res.status(400).json({ error: 'Name, Topic, and Date are required.' });
    }

    // Calculate next revision date (1 day from now)
    const addedDate = new Date(date);
    const nextDate = new Date(addedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextRevisionDate = nextDate.toISOString().split('T')[0];

    const newProblem = new Problem({
      userId: req.userId,
      name,
      topic,
      difficulty,
      date,
      nextRevisionDate,
      revisionLevel: 1
    });

    const saved = await newProblem.save();
    res.status(201).json(saved);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a problem
app.delete('/api/problems/:id', authMiddleware, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, userId: req.userId });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }
    await Problem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Problem deleted.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Review a problem (revision scheduler)
app.put('/api/problems/:id/review', authMiddleware, async (req, res) => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, userId: req.userId });
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

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

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});