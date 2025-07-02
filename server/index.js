const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Added path module
require('dotenv').config(); // To load environment variables from .env file
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/signature-app';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import Auth Routes
const authRoutes = require('./routes/authRoutes');
// Import Doc Routes
const docRoutes = require('./routes/docRoutes');
// Import Signature Routes
const signatureRoutes = require('./routes/signatureRoutes');
// Import Audit Routes
const auditRoutes = require('./routes/auditRoutes');

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/audit', auditRoutes);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Add a basic start script to server/package.json
// "start": "node index.js"
