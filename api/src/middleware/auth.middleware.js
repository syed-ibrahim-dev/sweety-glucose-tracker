const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    // Read token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Verify token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Attach authenticated user's ID to request
    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }

    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    next(error);
  }
};

module.exports = { authenticate };