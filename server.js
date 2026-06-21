require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());

// Test Route
app.get('/api/test', (req, res) => {
  console.log('✅ /api/test was hit!');
  res.json({ message: 'Backend is running' });
});

// Root Route
app.get('/', (req, res) => {
  res.send('DSA Mentor API is alive!');
});

// MongoDB (optional, but keep if you want to test connection)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa-mentor';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err.message));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});