const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const predictRoutes = require("./routes/predictRoutes");
const interviewRoutes = require('./routes/interview');
const eventRoutes = require('./routes/eventRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const chatRoutes = require('./routes/chatRoutes');
const forumRoutes = require('./routes/forumRoutes');
const sentimentRoutes = require('./routes/sentiment');
const cors = require("cors");

// Load environment variables
dotenv.config();
console.log('Environment loaded. MongoDB URI exists:', !!process.env.MONGO_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Set up a fallback JWT_SECRET if it's not defined
if (!process.env.JWT_SECRET) {
  console.log('Warning: JWT_SECRET is not defined, using a fallback for development');
  process.env.JWT_SECRET = 'default-jwt-secret-for-development-only';
}

// Connect to MongoDB with better error handling
try {
  connectDB();
  console.log('MongoDB connection initiated');
} catch (err) {
  console.error('Failed to connect to MongoDB:', err.message);
  // Continue execution, the app will handle MongoDB errors later
}

const app = express();

// Middleware
app.use(express.json());

// Configure CORS with more specific settings
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

// Add global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api", predictRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/sentiment', sentimentRoutes);

// Add a debug middleware to check auth token format
app.use('/api/debug/*', (req, res, next) => {
  console.log('Debug route - Headers:', JSON.stringify(req.headers));
  console.log('Debug route - User:', req.user);
  
  // Check if we have a user object but the ID is not an ObjectId
  if (req.user && req.user.id && typeof req.user.id === 'string' && !mongoose.Types.ObjectId.isValid(req.user.id)) {
    console.log('Debug route - Converting string user ID to ObjectId');
    try {
      req.user.id = new mongoose.Types.ObjectId('000000000000000000000001');
      console.log('Debug route - User ID converted to ObjectId:', req.user.id);
    } catch (error) {
      console.error('Debug route - Failed to convert user ID to ObjectId:', error);
    }
  }
  
  next();
});

// Debug route to test connection
app.get('/api/debug/connection', (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ 
        status: 'Connected', 
        message: 'MongoDB connection is active',
        database: mongoose.connection.db.databaseName,
        requestHeaders: req.headers,
        auth: req.user || 'No authentication',
        authToken: req.header('x-auth-token') || 'No token'
      });
    } else {
      res.status(500).json({ 
        status: 'Disconnected', 
        message: 'MongoDB is not connected',
        readyState: mongoose.connection.readyState,
        connectionDetails: process.env.MONGO_URI ? 'URI exists but connection failed' : 'No URI provided'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? 'Hidden in production' : error.stack 
    });
  }
});

// Add a special test route for event creation
app.post('/api/debug/test-event', (req, res) => {
  try {
    console.log('Test event creation request received');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));
    console.log('User object:', req.user);
    
    // Make sure we have a user object with a valid ID
    if (!req.user || !req.user.id) {
      console.log('Test event creation - Creating test user object');
      req.user = { id: new mongoose.Types.ObjectId('000000000000000000000001') };
    }
    
    console.log('Test event creation - Using user ID:', req.user.id, 'Type:', typeof req.user.id);
    
    // Simulate successful event creation
    res.status(201).json({
      _id: 'test-event-id-' + Date.now(),
      title: req.body.title || 'Test Event',
      message: 'Test event creation successful',
      requestHeaders: req.headers,
      userId: req.user ? req.user.id : 'No user ID',
      userIdType: req.user ? typeof req.user.id : 'N/A'
    });
  } catch (error) {
    console.error('Error in test event creation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a special test route for resource creation
app.post('/api/debug/test-resource', (req, res) => {
  try {
    console.log('Test resource creation request received');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));
    console.log('User object:', req.user);
    
    // Make sure we have a user object with a valid ID
    if (!req.user || !req.user.id) {
      console.log('Test resource creation - Creating test user object');
      req.user = { id: new mongoose.Types.ObjectId('000000000000000000000001') };
    }
    
    console.log('Test resource creation - Using user ID:', req.user.id, 'Type:', typeof req.user.id);
    
    // Simulate successful resource creation
    res.status(201).json({
      _id: 'test-resource-id-' + Date.now(),
      title: req.body.title || 'Test Resource',
      message: 'Test resource creation successful',
      requestHeaders: req.headers,
      userId: req.user ? req.user.id : 'No user ID',
      userIdType: req.user ? typeof req.user.id : 'N/A'
    });
  } catch (error) {
    console.error('Error in test resource creation:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Debug URL: http://localhost:${PORT}/api/debug/connection`);
});
