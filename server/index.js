const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Added path module
require('dotenv').config(); // To load environment variables from .env file
const cors = require('cors');

const app = express();

// Trust the first proxy in front of the app (e.g., on Render)
app.set('trust proxy', 1);

// CORS Configuration
const whitelist = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL + '/'
].filter(Boolean); // Filter out undefined values if FRONTEND_URL is not set

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // In development, always allow requests from localhost
        if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
            return callback(null, true);
        }

        // In production, check against the whitelist
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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
