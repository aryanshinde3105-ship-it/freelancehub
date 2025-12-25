const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();

/* =========================
   Middleware
========================= */

app.use(
  cors({
    origin: true, // ✅ reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);



app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   Health Check
========================= */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/* =========================
   Routes
========================= */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/proposals', require('./routes/proposalRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/users', userRoutes);

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* =========================
   DB Connection (non-blocking)
========================= */
connectDB();
