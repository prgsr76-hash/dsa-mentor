const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa-mentor';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err.message));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running' });
});

app.get('/', (req, res) => {
  res.send('DSA Mentor API is running');
});

module.exports = app;