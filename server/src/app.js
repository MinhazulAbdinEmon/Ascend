import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import seasonRoutes from './routes/seasonRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Behind a hosting proxy (Render/Railway), Express must trust the proxy
// or it refuses to set `secure` cookies - logins would silently fail in prod.
app.set('trust proxy', 1);

// CORS: only our frontend(s) may call this API, and credentials:true
// lets the browser send the HTTP-only auth cookie along.
// CLIENT_URL supports a comma-separated list, e.g. "https://app.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json()); // parse JSON request bodies
app.use(cookieParser()); // parse cookies into req.cookies

// Quick way to check the API is alive (also used by hosting health checks).
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/seasons', seasonRoutes);

// These two must come LAST: unmatched routes, then errors.
app.use(notFound);
app.use(errorHandler);

export default app;
