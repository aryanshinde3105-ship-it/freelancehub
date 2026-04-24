const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const socketAuthMiddleware = require('./sockets/socketAuth');
const registerChatSocketHandlers = require('./sockets/chatSocketHandlers');
const socketState = require('./sockets/socketState');

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
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

/* ✅ Socket.io Configuration */
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);
registerChatSocketHandlers(io, socketState);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
