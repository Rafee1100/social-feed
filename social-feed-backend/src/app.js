import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { globalLimiter } from './config/rateLimitConfig.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import postRoutes from './routes/posts.js';

const app = express();

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


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
