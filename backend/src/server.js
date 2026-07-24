import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';
import { authMiddleware } from './middleware/auth.js';

// Load controllers
import * as authController from './controllers/authController.js';
import * as eventController from './controllers/eventController.js';
import * as agendaController from './controllers/agendaController.js';
import * as taskController from './controllers/taskController.js';
import * as vendorController from './controllers/vendorController.js';
import * as attendeeController from './controllers/attendeeController.js';
import * as logisticsController from './controllers/logisticsController.js';
import * as aiController from './controllers/aiController.js';
import * as learningController from './controllers/learningController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Public health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, message: 'Server is healthy and running.' });
});

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authMiddleware, authController.getProfile);
app.put('/api/auth/profile', authMiddleware, authController.updateProfile);

// Event management routes
app.post('/api/events', authMiddleware, eventController.createEvent);
app.get('/api/events', authMiddleware, eventController.getEvents);
app.get('/api/events/:id', authMiddleware, eventController.getEventById);
app.put('/api/events/:id', authMiddleware, eventController.updateEvent);
app.put('/api/events/:id/archive', authMiddleware, eventController.archiveEvent);
app.post('/api/events/:id/duplicate', authMiddleware, eventController.duplicateEvent);
app.get('/api/events/:id/export', authMiddleware, eventController.exportEvent);
app.delete('/api/events/:id', authMiddleware, eventController.deleteEvent);

// Agenda / Run-of-show routes
app.post('/api/events/:eventId/agenda', authMiddleware, agendaController.addAgendaSession);
app.get('/api/events/:eventId/agenda', authMiddleware, agendaController.getAgendaSessions);
app.put('/api/agenda/:id', authMiddleware, agendaController.updateAgendaSession);
app.delete('/api/agenda/:id', authMiddleware, agendaController.deleteAgendaSession);

// Task management routes
app.post('/api/events/:eventId/tasks', authMiddleware, taskController.addTask);
app.get('/api/events/:eventId/tasks', authMiddleware, taskController.getTasks);
app.put('/api/tasks/:id', authMiddleware, taskController.updateTask);
app.delete('/api/tasks/:id', authMiddleware, taskController.deleteTask);

// Vendor management routes
app.post('/api/events/:eventId/vendors', authMiddleware, vendorController.addVendor);
app.get('/api/events/:eventId/vendors', authMiddleware, vendorController.getVendors);
app.put('/api/vendors/:id', authMiddleware, vendorController.updateVendor);
app.delete('/api/vendors/:id', authMiddleware, vendorController.deleteVendor);

// Attendee registration routes
app.post('/api/events/:eventId/attendees', authMiddleware, attendeeController.addAttendee);
app.get('/api/events/:eventId/attendees', authMiddleware, attendeeController.getAttendees);
app.put('/api/attendees/:id', authMiddleware, attendeeController.updateAttendee);
app.delete('/api/attendees/:id', authMiddleware, attendeeController.deleteAttendee);

// Logistics routes
app.get('/api/events/:eventId/logistics', authMiddleware, logisticsController.getLogistics);
app.post('/api/events/:eventId/logistics', authMiddleware, logisticsController.saveLogistics);

// AI features routes
app.post('/api/ai/plan/:eventId', authMiddleware, aiController.generateEventPlan);
app.get('/api/ai/plan/:eventId', authMiddleware, aiController.getEventPlan);
app.put('/api/ai/plan/:eventId', authMiddleware, aiController.saveApprovedPlan);
app.post('/api/ai/quiz', authMiddleware, aiController.generateQuiz);
app.post('/api/ai/generate-content', authMiddleware, aiController.generateContent);

// Learning Assistant routes
app.post('/api/learning', authMiddleware, learningController.createLearningSession);
app.get('/api/learning', authMiddleware, learningController.getLearningHistory);
app.delete('/api/learning/:id', authMiddleware, learningController.deleteLearningSession);
app.post('/api/learning/quiz-result', authMiddleware, learningController.saveQuizResult);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Express Error handler caught:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.'
  });
});

// Initialize database and start listening
const startServer = async () => {
  try {
    await db.initDb();
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
