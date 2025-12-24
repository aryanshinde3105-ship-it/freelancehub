const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id comes from when we signed the token
    const user = await User.findById(decoded.id).select('role');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // now every route can see both id and role
    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
