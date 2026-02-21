const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // ✅ No fallback secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Select id, role, name, email — so all routes can use req.user.name/email
    const user = await User.findById(decoded.id).select('role name email');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,   // ✅ Added
      email: user.email, // ✅ Added
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
