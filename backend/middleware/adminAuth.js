const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // ✅ No fallback secret — will throw if JWT_SECRET is missing in env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fixed: was decoded.userId, JWT is signed with { id }
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = adminAuth;
