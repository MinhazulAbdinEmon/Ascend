import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Guard for protected routes.
// Reads the JWT from the HTTP-only cookie, verifies it, and loads the user.
// If anything is wrong -> 401 and the request never reaches the controller.
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user; // controllers can now read req.user
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
};
