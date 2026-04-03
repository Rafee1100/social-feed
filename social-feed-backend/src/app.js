import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { globalLimiter } from './config/rateLimitConfig.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import postRoutes from './routes/posts.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, 
  })
);


app.use(globalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); 

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

app.use(errorHandler);

export default app;
