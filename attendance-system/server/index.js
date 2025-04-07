const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Database setup (placeholder - we'll use in-memory storage for now)
const attendanceRecords = [];
const students = [];
const admins = [
  { id: 1, username: 'admin', password: 'admin123' } // This should be hashed in production
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Server is running' });
});

// API endpoint for ESP32 to send attendance data
app.post('/api/attendance', (req, res) => {
  const { studentId, timestamp, deviceId } = req.body;
  
  if (!studentId || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newRecord = {
    id: attendanceRecords.length + 1,
    studentId,
    timestamp,
    deviceId: deviceId || 'unknown',
    recordedAt: new Date().toISOString()
  };
  
  attendanceRecords.push(newRecord);
  
  // Notify connected clients about new attendance
  io.emit('new-attendance', newRecord);
  
  res.status(201).json({ success: true, data: newRecord });
});

// Get all attendance records
app.get('/api/attendance', (req, res) => {
  res.json(attendanceRecords);
});

// Register a new student
app.post('/api/students', (req, res) => {
  const { name, studentId, rfidTag } = req.body;
  
  if (!name || !studentId || !rfidTag) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newStudent = {
    id: students.length + 1,
    name,
    studentId,
    rfidTag,
    registeredAt: new Date().toISOString()
  };
  
  students.push(newStudent);
  res.status(201).json({ success: true, data: newStudent });
});

// Get all students
app.get('/api/students', (req, res) => {
  res.json(students);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the attendance system`);
});