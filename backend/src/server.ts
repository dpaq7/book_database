import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger, httpRequestDurationMicroseconds, httpRequestCounter, register } from './utils/monitoring';
import connectDB from './config/db';
import bookRoutes from './routes/bookRoutes';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware for security headers
app.use(helmet());

// Configure CORS to allow frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://dpaq7.github.io',
  credentials: true
}));

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Monitoring middleware for request metrics
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Record end time and metrics on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.path, res.statusCode.toString())
      .observe(duration);
    
    httpRequestCounter
      .labels(req.method, req.path, res.statusCode.toString())
      .inc();
    
    // Log request
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Metrics endpoint for monitoring
app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Import routes
app.use('/api/books', bookRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error processing request: ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack,
  });
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`, {
    stack: err.stack
  });
  // In production, we might want to gracefully shut down
  // process.exit(1);
});
