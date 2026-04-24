const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractToken = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) return authToken;

  const header = socket.handshake?.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  return null;
};

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = extractToken(socket);

    if (!token) {
      return next(new Error('Unauthorized: token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return next(new Error('Unauthorized: invalid token payload'));
    }

    const user = await User.findById(userId).select('name email role');
    if (!user) {
      return next(new Error('Unauthorized: user not found'));
    }

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      email: user.email,
    };

    return next();
  } catch (error) {
    return next(new Error('Unauthorized: invalid or expired token'));
  }
};

module.exports = socketAuthMiddleware;