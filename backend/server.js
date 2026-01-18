const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');


dotenv.config();


connectDB();


const app = express();
const server = http.createServer(app);


/* ✅ FIXED CORS (PRODUCTION SAFE) */
app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);


/* ✅ FIXED preflight handling for Node 22 */
app.options(/.*/, cors());


app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', require('./routes/ratingRoutes')); // ✅ NEW: Rating routes


/* ✅ Socket.io Configuration */
const io = socketIO(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room for a project
  socket.on('joinRoom', (projectId, userId) => {
    socket.join(`project_${projectId}`);
    connectedUsers.set(socket.id, { projectId, userId });
    io.to(`project_${projectId}`).emit('userJoined', { userId, socketId: socket.id });
  });

  // Handle real-time messages
  socket.on('sendMessage', (data) => {
    io.to(`project_${data.projectId}`).emit('receiveMessage', data);
  });

  // Leave room
  socket.on('leaveRoom', (projectId) => {
    socket.leave(`project_${projectId}`);
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      io.to(`project_${projectId}`).emit('userLeft', { userId: userData.userId });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      io.to(`project_${userData.projectId}`).emit('userLeft', { userId: userData.userId });
    }
    connectedUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
