import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Logging Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*', // In production, replace with specific domain(s)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes & Rate Limiting
app.use('/api', apiRateLimiter, apiRoutes);

// Fallbacks & Exception Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Launch Express Server
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  Sabi Return Gifts API Server Running Online  `);
  console.log(`  Port: ${PORT}                               `);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'} `);
  console.log(`=============================================`);
});

export default app;
