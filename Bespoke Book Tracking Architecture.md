# Book Database Application: Architecture & Implementation Guide

## System Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │◄────►│  Express API    │◄────►│  MongoDB        │
│  (GitHub Pages) │      │  (Render)       │      │  (Atlas)        │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│ Cloudflare CDN  │      │ Monitoring      │      │ Database        │
│ & Edge Workers  │      │ (Prometheus/    │      │ Migrations &    │
│                 │      │  Grafana)       │      │ Backups         │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

This document outlines the complete architecture for a production-grade book tracking application. The system leverages TypeScript throughout the stack to provide type safety and improve maintainability. 

The architecture follows modern best practices for full-stack applications, with a particular focus on:

1. **Security**: Authentication, input validation, CSRF protection, and proper HTTP security headers
2. **Performance**: Database optimizations, caching strategies, and frontend optimizations
3. **Scalability**: Edge caching, database indexing, and connection pooling
4. **Maintainability**: TypeScript, database migrations, comprehensive monitoring
5. **Mobile-First Design**: Responsive components with progressive enhancement

## Database Design

### MongoDB Schema

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface BookDocument extends Book, Document {}

const BookSchema = new Schema<BookDocument>(
  {
    bookId: { type: Number, required: true, unique: true },
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    authorByLastName: String,
    additionalAuthors: [String],
    isbn: String,
    isbn13: Number,
    rating: { type: Number, min: 0, max: 5, default: 0 },
    averageRating: Number,
    publisher: String,
    binding: String,
    pages: { type: Number, min: 0, required: true },
    beqValue: { type: Number, default: 0 },  // Simplified from array to single value
    editionPublished: Number,
    published: Number,
    dateRead: Date,
    dateAdded: { type: Date, default: Date.now },
    bookshelves: [String],
    bookshelvesWithPositions: [String],
    exclusiveShelf: {
      type: String,
      enum: ['read', 'currently-reading', 'to-read'],
      default: 'to-read'
    },
    review: String,
    spoiler: String,
    privateNotes: String,
    readCount: { type: Number, default: 0 },
    ownedCopies: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Optimized compound indices for common query patterns
BookSchema.index({ exclusiveShelf: 1, dateRead: -1 });
BookSchema.index({ author: 1, title: 1 });
BookSchema.index({ dateAdded: -1 });
BookSchema.index({ "bookshelves": 1 }, { sparse: true });

export default mongoose.model<BookDocument>('Book', BookSchema);
```

### Database Connection Management

```typescript
import mongoose from 'mongoose';
import { logger } from './monitoring';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, {
      maxPoolSize: 50,  // Optimize based on workload
      minPoolSize: 10,  // Keep minimum connections open
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4  // Force IPv4
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set up event listeners for connection issues
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting to reconnect');
    });
    
  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

## Backend Implementation

### Core Type Definitions

```typescript
// src/types/index.ts
export interface Book {
  bookId: number;
  title: string;
  author: string;
  authorByLastName?: string;
  additionalAuthors?: string[];
  isbn?: string;
  isbn13?: number;
  rating: number;
  averageRating?: number;
  publisher?: string;
  binding?: string;
  pages: number;
  beqValue: number;
  editionPublished?: number;
  published?: number;
  dateRead?: Date;
  dateAdded: Date;
  bookshelves: string[];
  bookshelvesWithPositions?: string[];
  exclusiveShelf: 'read' | 'currently-reading' | 'to-read';
  review?: string;
  spoiler?: string;
  privateNotes?: string;
  readCount: number;
  ownedCopies: number;
}

export interface BookFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  shelf?: string;
  search?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface ImportStats {
  added: number;
  updated: number;
  failed: number;
  errors?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

// Request augmentation for auth
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
```

### Server Setup with Security

```typescript
// src/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import connectDB from './config/db';
import monitoring from './utils/monitoring';
import authenticate from './middleware/auth';
import bookRoutes from './routes/books';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourusername.github.io', 'https://bookapps.pages.dev']
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Security middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(monitoring.metricsMiddleware);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

// CSRF protection for non-GET requests
const csrfProtection = csurf({ 
  cookie: { 
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});

// Routes
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// API routes with versioning
app.use('/api/v1/books', authenticate, csrfProtection, bookRoutes);

// Monitoring & health check endpoints
app.get('/metrics', monitoring.metricsRoute);
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  monitoring.logger.error(`Error processing request: ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip
    }
  });
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation error', errors: err });
  }

  // Handle CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  // Generic error response
  res.status(500).json({
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  monitoring.logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  monitoring.logger.error(`Unhandled Rejection: ${reason.message || reason}`);
  // Don't crash in production, but log extensively
});
```

### Authentication Middleware

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as User;
    
    // Add user to request
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authenticate;
```

### Book Controller with Validation & Type Safety

```typescript
// src/controllers/bookController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import Book from '../models/Book';
import { PaginatedResponse, BookFilters, Book as BookType } from '../types';
import { measureDatabaseOperation, logger } from '../utils/monitoring';

// Input validation schemas
const bookBaseSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  author: z.string().min(1).max(255).trim(),
  authorByLastName: z.string().optional(),
  additionalAuthors: z.array(z.string()).optional(),
  isbn: z.string().optional(),
  isbn13: z.number().optional(),
  rating: z.number().min(0).max(5).default(0),
  averageRating: z.number().optional(),
  publisher: z.string().optional(),
  binding: z.string().optional(),
  pages: z.number().int().positive(),
  editionPublished: z.number().optional(),
  published: z.number().optional(),
  dateRead: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  bookshelves: z.array(z.string()).default([]),
  bookshelvesWithPositions: z.array(z.string()).optional(),
  exclusiveShelf: z.enum(['read', 'currently-reading', 'to-read']).default('to-read'),
  review: z.string().optional(),
  spoiler: z.string().optional(),
  privateNotes: z.string().optional(),
  readCount: z.number().int().min(0).default(0),
  ownedCopies: z.number().int().min(0).default(0)
});

const createBookSchema = bookBaseSchema.extend({
  bookId: z.number().int().positive()
});

const updateBookSchema = bookBaseSchema.partial();

const filterSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('25'),
  sort: z.string().default('dateRead'),
  order: z.enum(['asc', 'desc']).default('desc'),
  shelf: z.string().optional(),
  search: z.string().optional(),
  minRating: z.string().transform(Number).default('0'),
  maxRating: z.string().transform(Number).default('5'),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

// Cached average pages service
const averagePagesService = {
  value: 300,
  lastUpdated: new Date(0),
  
  async getAverage(): Promise<number> {
    const now = new Date();
    if (now.getTime() - this.lastUpdated.getTime() > 3600000) { // Update hourly
      try {
        const result = await Book.aggregate([
          { $group: { _id: null, averagePages: { $avg: '$pages' } } }
        ]);
        this.value = result[0]?.averagePages || this.value;
        this.lastUpdated = now;
      } catch (error) {
        logger.error('Error calculating average pages', error);
      }
    }
    return this.value;
  }
};

// Controller methods
export const getBooks = async (req: Request, res: Response) => {
  try {
    // Validate and parse query parameters
    const validatedParams = filterSchema.parse(req.query);
    const { 
      page, 
      limit,
      sort,
      order,
      shelf,
      search,
      minRating,
      maxRating,
      startDate,
      endDate
    } = validatedParams;
    
    // Build filter
    const filter: any = {};
    
    if (shelf) filter.exclusiveShelf = shelf;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    
    filter.rating = { $gte: minRating, $lte: maxRating };
    
    if (startDate && endDate) {
      filter.dateRead = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.dateRead = { $gte: startDate };
    } else if (endDate) {
      filter.dateRead = { $lte: endDate };
    }
    
    // Execute query with pagination using measureDatabaseOperation for metrics
    const books = await measureDatabaseOperation(
      'find', 
      'books',
      () => Book.find(filter)
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .select('bookId title author rating pages dateRead beqValue exclusiveShelf')
    );
      
    // Get total count
    const total = await measureDatabaseOperation(
      'count',
      'books',
      () => Book.countDocuments(filter)
    );
    
    const response: PaginatedResponse<BookType> = {
      data: books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total
    };
    
    // Add cache control headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    logger.error('Error fetching books', error);
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
};

export const getBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await measureDatabaseOperation(
      'findOne',
      'books',
      () => Book.findOne({ bookId }).lean()
    );
    
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    // Add cache control headers for individual book
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    res.json(book);
  } catch (error: any) {
    logger.error(`Error fetching book ${req.params.id}`, error);
    res.status(500).json({ message: 'Error fetching book', error: error.message });
  }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createBookSchema.parse(req.body);
    
    // Check if book already exists
    const existingBook = await Book.findOne({ bookId: validatedData.bookId });
    if (existingBook) {
      return res.status(400).json({ message: 'Book with this ID already exists' });
    }
    
    // Calculate BEq
    const averagePages = await averagePagesService.getAverage();
    const beqValue = validatedData.pages / averagePages;
    
    // Create book
    const book = new Book({
      ...validatedData,
      beqValue,
      dateAdded: new Date()
    });
    
    await book.save();
    res.status(201).json(book);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    logger.error('Error creating book', error);
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    // Validate input
    const validatedData = updateBookSchema.parse(req.body);
    
    // If pages are updated, recalculate BEq
    if (validatedData.pages) {
      const averagePages = await averagePagesService.getAverage();
      validatedData.beqValue = validatedData.pages / averagePages;
    }
    
    const book = await Book.findOneAndUpdate(
      { bookId },
      validatedData,
      { new: true, runValidators: true }
    );
    
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    res.json(book);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    logger.error(`Error updating book ${req.params.id}`, error);
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await Book.findOneAndDelete({ bookId });
    
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error: any) {
    logger.error(`Error deleting book ${req.params.id}`, error);
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
};

// Bulk import with transaction
export const importBooks = async (req: Request, res: Response) => {
  const session = await Book.startSession();
  
  try {
    session.startTransaction();
    
    const { books } = req.body;
    if (!Array.isArray(books)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    
    // Calculate average pages
    const averagePages = await averagePagesService.getAverage();
    
    // Prepare books with BEq values
    const validatedBooks = [];
    const errors = [];
    
    for (let i = 0; i < books.length; i++) {
      try {
        const validatedBook = createBookSchema.parse(books[i]);
        const beqValue = validatedBook.pages / averagePages;
        validatedBooks.push({
          ...validatedBook,
          beqValue,
          dateAdded: validatedBook.dateAdded || new Date()
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            index: i,
            bookId: books[i].bookId,
            errors: error.errors
          });
        }
      }
    }
    
    if (errors.length > 0 && errors.length === books.length) {
      // All books failed validation
      return res.status(400).json({ 
        message: 'All books failed validation',
        errors 
      });
    }
    
    // Process in chunks to avoid overwhelming the database
    const CHUNK_SIZE = 100;
    const results = {
      added: 0,
      updated: 0,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
    for (let i = 0; i < validatedBooks.length; i += CHUNK_SIZE) {
      const chunk = validatedBooks.slice(i, i + CHUNK_SIZE);
      
      // Use bulkWrite for efficient processing
      const bulkOperations = chunk.map(book => ({
        updateOne: {
          filter: { bookId: book.bookId },
          update: { $set: book },
          upsert: true
        }
      }));
      
      const result = await Book.bulkWrite(bulkOperations, { session });
      results.added += result.upsertedCount;
      results.updated += result.modifiedCount;
    }
    
    await session.commitTransaction();
    res.status(200).json({ 
      message: `Processed ${validatedBooks.length} books successfully`,
      results 
    });
  } catch (error: any) {
    await session.abortTransaction();
    logger.error('Error importing books', error);
    res.status(500).json({ message: 'Error importing books', error: error.message });
  } finally {
    session.endSession();
  }
};

// Export books
export const exportBooks = async (req: Request, res: Response) => {
  try {
    // Parse filters if provided
    const filters: any = {};
    
    if (req.query.shelf) {
      filters.exclusiveShelf = req.query.shelf;
    }
    
    // For large datasets, use streaming
    const cursor = Book.find(filters).lean().cursor();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=books-export.json');
    
    // Stream the response
    res.write('[');
    
    let first = true;
    for await (const doc of cursor) {
      if (!first) {
        res.write(',');
      } else {
        first = false;
      }
      res.write(JSON.stringify(doc));
    }
    
    res.write(']');
    res.end();
  } catch (error: any) {
    logger.error('Error exporting books', error);
    res.status(500).json({ message: 'Error exporting books', error: error.message });
  }
};
```

## Database Migrations

### Migration Manager

```typescript
// src/migrations/index.ts
import { MongoClient, Db } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/monitoring';

interface Migration {
  version: number;
  name: string;
  up: (db: Db) => Promise<void>;
  down: (db: Db) => Promise<void>;
}

export class MigrationManager {
  private client: MongoClient;
  private db: Db | null = null;
  private migrations: Migration[] = [];

  constructor(private connectionUri: string, private dbName: string) {
    this.client = new MongoClient(connectionUri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    logger.info('Connected to database for migrations');
  }

  async close(): Promise<void> {
    await this.client.close();
    logger.info('Closed database connection');
  }

  register(migration: Migration): void {
    this.migrations.push(migration);
    // Sort by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async getMigrationCollection() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    
    const collections = await this.db.listCollections({ name: 'migrations' }).toArray();
    if (collections.length === 0) {
      await this.db.createCollection('migrations');
    }
    return this.db.collection('migrations');
  }

  async getAppliedMigrations() {
    const collection = await this.getMigrationCollection();
    return await collection.find().sort({ version: 1 }).toArray();
  }

  async migrate(targetVersion?: number): Promise<void> {
    await this.connect();
    
    try {
      const collection = await this.getMigrationCollection();
      const applied = await this.getAppliedMigrations();
      const appliedVersions = new Set(applied.map(m => m.version));
      
      // Determine which migrations to apply
      let migrationsToApply = this.migrations.filter(m => !appliedVersions.has(m.version));
      
      if (targetVersion !== undefined) {
        // If target version specified, only include migrations up to that version
        migrationsToApply = migrationsToApply.filter(m => m.version <= targetVersion);
      }
      
      if (migrationsToApply.length === 0) {
        logger.info('No migrations to apply');
        return;
      }
      
      logger.info(`Applying ${migrationsToApply.length} migrations`);
      
      for (const migration of migrationsToApply) {
        logger.info(`Applying migration ${migration.version}: ${migration.name}`);
        
        const startTime = Date.now();
        await migration.up(this.db!);
        const duration = Date.now() - startTime;
        
        await collection.insertOne({
          version: migration.version,
          name: migration.name,
          appliedAt: new Date(),
          duration
        });
        
        logger.info(`Migration ${migration.version} applied (${duration}ms)`);
      }
      
      logger.info('All migrations applied successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    await this.connect();
    
    try {
      const collection = await this.getMigrationCollection();
      const applied = await this.getAppliedMigrations();
      
      if (applied.length === 0) {
        logger.info('No migrations to roll back');
        return;
      }
      
      // Take the last 'steps' migrations
      const toRollback = applied.slice(-steps);
      
      logger.info(`Rolling back ${toRollback.length} migrations`);
      
      for (const migration of toRollback.reverse()) {
        const migrationScript = this.migrations.find(m => m.version === migration.version);
        
        if (!migrationScript) {
          throw new Error(`Migration script for version ${migration.version} not found`);
        }
        
        logger.info(`Rolling back migration ${migration.version}: ${migration.name}`);
        
        const startTime = Date.now();
        await migrationScript.down(this.db!);
        const duration = Date.now() - startTime;
        
        await collection.deleteOne({ version: migration.version });
        
        logger.info(`Migration ${migration.version} rolled back (${duration}ms)`);
      }
      
      logger.info('Rollback completed successfully');
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }

  static loadFromDirectory(dirPath: string, connectionUri: string, dbName: string): MigrationManager {
    const manager = new MigrationManager(connectionUri, dbName);
    
    // Load all migration files from the directory
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .sort(); // Sort to ensure order
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const migration = require(filePath).default;
      manager.register(migration);
    }
    
    return manager;
  }
}
```

### Example Migration

```typescript
// src/migrations/001-initial-schema.ts
import { Db } from 'mongodb';

export default {
  version: 1,
  name: 'Initial schema setup',
  
  async up(db: Db): Promise<void> {
    // Create books collection with validation
    await db.createCollection('books', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['bookId', 'title', 'author', 'pages'],
          properties: {
            bookId: { bsonType: 'number' },
            title: { bsonType: 'string' },
            author: { bsonType: 'string' },
            pages: { bsonType: 'number', minimum: 0 },
            beqValue: { bsonType: 'number' },
            // Additional fields
            dateRead: { bsonType: ['date', 'null'] },
            exclusiveShelf: { enum: ['read', 'currently-reading', 'to-read'] }
          }
        }
      }
    });

    // Create indices
    await db.collection('books').createIndex({ 'exclusiveShelf': 1, 'dateRead': -1 });
    await db.collection('books').createIndex({ 'author': 1, 'title': 1 });
    await db.collection('books').createIndex({ 'dateAdded': -1 });
    await db.collection('books').createIndex({ 'bookshelves': 1 }, { sparse: true });
    
    // Create users collection
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: { bsonType: 'string' },
            email: { bsonType: 'string' },
            password: { bsonType: 'string' },
            roles: { bsonType: 'array', items: { bsonType: 'string' } }
          }
        }
      }
    });
    
    // Create user indices
    await db.collection('users').createIndex({ 'username': 1 }, { unique: true });
    await db.collection('users').createIndex({ 'email': 1 }, { unique: true });
  },
  
  async down(db: Db): Promise<void> {
    // Drop collections
    await db.collection('books').drop();
    await db.collection('users').drop();
  }
};
```

## Monitoring and Observability

### Prometheus/Grafana Integration

```typescript
// src/utils/monitoring.ts
import express from 'express';
import client from 'prom-client';
import winston from 'winston';

// Create a registry to register metrics
const register = new client.Registry();

// Add default metrics (Node.js process metrics)
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

const httpRequestsTotalCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseOperationDurationMs = new client.Histogram({
  name: 'database_operation_duration_ms',
  help: 'Duration of database operations in ms',
  labelNames: ['operation', 'collection'],
  buckets: [1, 5, 15, 50, 100, 250, 500, 1000, 2500, 5000]
});

const failedDatabaseOperationsCounter = new client.Counter({
  name: 'database_operations_failed_total',
  help: 'Total number of failed database operations',
  labelNames: ['operation', 'collection', 'error_code']
});

// Active user gauge
const activeUsersGauge = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotalCounter);
register.registerMetric(databaseOperationDurationMs);
register.registerMetric(failedDatabaseOperationsCounter);
register.registerMetric(activeUsersGauge);

// Express middleware for recording HTTP metrics
export const metricsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  
  // Increment active users for non-metric routes
  if (!req.path.includes('/metrics') && !req.path.includes('/health')) {
    activeUsersGauge.inc();
  }
  
  // Get original end method
  const end = res.end;
  
  // Override end method to capture metrics
  res.end = function(chunk?: any, encoding?: any, cb?: any): any {
    const responseTime = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(responseTime);
      
    httpRequestsTotalCounter
      .labels(req.method, route, res.statusCode.toString())
      .inc();
      
    // Decrement active users
    if (!req.path.includes('/metrics') && !req.path.includes('/health')) {
      activeUsersGauge.dec();
    }
    
    return end.call(this, chunk, encoding, cb);
  };
  
  next();
};

// Metrics endpoint for Prometheus to scrape
export const metricsRoute = async (_req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Database operation timing wrapper
export const measureDatabaseOperation = async <T>(
  operation: string,
  collection: string,
  callback: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await callback();
    const duration = Date.now() - start;
    databaseOperationDurationMs.labels(operation, collection).observe(duration);
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    databaseOperationDurationMs.labels(operation, collection).observe(duration);
    failedDatabaseOperationsCounter.labels(operation, collection, error.code || 'unknown').inc();
    throw error;
  }
};

// Create logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'book-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add console logging during development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default {
  metricsMiddleware,
  metricsRoute,
  measureDatabaseOperation,
  logger
};
```

## Frontend Implementation

### Core Component Types

```typescript
// src/types/components.ts
import { Book, BookFilters } from './index';

export interface BookListProps {
  books: Book[];
  loading: boolean;
  onBookSelect: (book: Book) => void;
  onSortChange: (sort: string, order: 'asc' | 'desc') => void;
  filters: BookFilters;
  view: 'list' | 'card';
}

export interface FilterPanelProps {
  filters: BookFilters;
  onFilterChange: (filters: Partial<BookFilters>) => void;
}

export interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export interface BookFormProps {
  book?: Book;
  onSubmit: (book: Book) => Promise<void>;
  onCancel: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface ImportExportProps {
  onImportComplete: () => void;
}

export interface LayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}
```

### Mobile-First Design Components

#### Responsive Layout

```tsx
// src/components/Layout.tsx
import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { LayoutProps } from '../types/components';

const Layout: React.FC<LayoutProps> = ({ sidebar, main }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery({ minWidth: 768 });
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-blue-600 text-white p-4 md:hidden flex justify-between items-center">
        <h1 className="text-xl font-bold">Book Database</h1>
        <button 
          className="p-2 rounded bg-blue-700" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Responsive */}
        <div 
          className={`
            ${isDesktop ? 'w-64' : 'w-64 absolute inset-y-0 left-0 z-30 transform bg-white shadow-lg'} 
            ${sidebarOpen || isDesktop ? 'translate-x-0' : '-translate-x-full'}
            transition-transform duration-300 ease-in-out
          `}
        >
          {sidebar}
        </div>
        
        {/* Main Content - Responsive */}
        <main className="flex-1 overflow-auto p-4">
          {main}
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && !isDesktop && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
```

#### Responsive Book List with Virtualization

```tsx
// src/components/BookList.tsx
import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { BookListProps } from '../types/components';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import BookCard from './BookCard';
import Pagination from './Pagination';

const BookList: React.FC<BookListProps> = ({ 
  books, 
  loading, 
  onBookSelect,
  onSortChange,
  filters,
  view
}) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [currentSort, setCurrentSort] = useState<{field: string, order: 'asc' | 'desc'}>({
    field: filters.sort || 'dateRead',
    order: filters.order || 'desc'
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (books.length === 0) {
    return (
      <div className="text-center text-gray-500 p-8 bg-white rounded-lg shadow">
        <p className="text-xl mb-2">No books found</p>
        <p>Try adjusting your filters or adding some books</p>
      </div>
    );
  }
  
  const handleSort = (field: string) => {
    const newOrder = currentSort.field === field && currentSort.order === 'desc' ? 'asc' : 'desc';
    setCurrentSort({ field, order: newOrder });
    onSortChange(field, newOrder);
  };
  
  const SortIndicator = ({ field }: { field: string }) => {
    if (currentSort.field !== field) return null;
    
    return (
      <span className="ml-1">
        {currentSort.order === 'asc' ? '↑' : '↓'}
      </span>
    );
  };
  
  // Force card view on mobile
  const effectiveView = isMobile ? 'card' : view;
  
  // Card view
  if (effectiveView === 'card') {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map(book => (
            <BookCard 
              key={book.bookId} 
              book={book} 
              onClick={() => onBookSelect(book)} 
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Table view with virtualization for larger datasets
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table header */}
      <div className="flex border-b bg-gray-100 text-gray-700 font-medium">
        <div 
          className="px-4 py-3 w-5/12 flex items-center cursor-pointer hover:bg-gray-200"
          onClick={() => handleSort('title')}
        >
          Title <SortIndicator field="title" />
        </div>
        <div 
          className="px-4 py-3 w-3/12 flex items-center cursor-pointer hover:bg-gray-200"
          onClick={() => handleSort('author')}
        >
          Author <SortIndicator field="author" />
        </div>
        <div 
          className="px-4 py-3 w-1/12 flex items-center justify-center cursor-pointer hover:bg-gray-200"
          onClick={() => handleSort('rating')}
        >
          Rating <SortIndicator field="rating" />
        </div>
        <div 
          className="px-4 py-3 w-1/12 text-center cursor-pointer hover:bg-gray-200"
          onClick={() => handleSort('pages')}
        >
          Pages <SortIndicator field="pages" />
        </div>
        <div 
          className="px-4 py-3 w-2/12 text-center cursor-pointer hover:bg-gray-200"
          onClick={() => handleSort('dateRead')}
        >
          Date Read <SortIndicator field="dateRead" />
        </div>
      </div>
      
      {/* Virtualized list for performance with large datasets */}
      <div className="h-[70vh]">
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={books.length}
              itemSize={60}
              overscanCount={5}
            >
              {({ index, style }) => {
                const book = books[index];
                return (
                  <div 
                    style={style} 
                    className={`flex items-center border-b hover:bg-gray-50 cursor-pointer ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                    onClick={() => onBookSelect(book)}
                  >
                    <div className="px-4 py-2 w-5/12 truncate">{book.title}</div>
                    <div className="px-4 py-2 w-3/12 truncate">{book.author}</div>
                    <div className="px-4 py-2 w-1/12 flex justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className={`${star <= book.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="px-4 py-2 w-1/12 text-center">{book.pages}</div>
                    <div className="px-4 py-2 w-2/12 text-center">
                      {book.dateRead 
                        ? new Date(book.dateRead).toLocaleDateString() 
                        : '-'}
                    </div>
                  </div>
                );
              }}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default BookList;
```

### Frontend Data Fetching with React Query

```tsx
// src/hooks/useBooks.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Book, BookFilters, PaginatedResponse } from '../types';
import * as api from '../services/api';

// Fetch books with filters
export const useBooks = (filters: BookFilters) => {
  return useQuery<PaginatedResponse<Book>>(['books', filters], 
    () => api.fetchBooks(filters),
    {
      keepPreviousData: true, // Keep previous data while fetching new data
      staleTime: 60000 // Cache for 1 minute
    }
  );
};

// Fetch single book
export const useBook = (id: number | null) => {
  return useQuery<Book>(
    ['book', id], 
    () => api.fetchBook(id!),
    {
      enabled: !!id, // Only fetch when id is provided
      staleTime: 300000 // Cache for 5 minutes
    }
  );
};

// Create book mutation
export const useCreateBook = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (book: Book) => api.createBook(book),
    {
      onSuccess: () => {
        // Invalidate books query to refetch
        queryClient.invalidateQueries('books');
      }
    }
  );
};

// Update book mutation
export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: number, data: Partial<Book> }) => api.updateBook(id, data),
    {
      onSuccess: (updatedBook) => {
        // Update the book in the cache
        queryClient.setQueryData(['book', updatedBook.bookId], updatedBook);
        
        // Invalidate books list query to refetch
        queryClient.invalidateQueries('books');
      }
    }
  );
};

// Delete book mutation
export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: number) => api.deleteBook(id),
    {
      onSuccess: (_data, variables) => {
        // Remove the book from the cache
        queryClient.removeQueries(['book', variables]);
        
        // Invalidate books list query to refetch
        queryClient.invalidateQueries('books');
      }
    }
  );
};

// Import books mutation
export const useImportBooks = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (books: Book[]) => api.importBooks(books),
    {
      onSuccess: () => {
        // Invalidate all book queries
        queryClient.invalidateQueries('books');
      }
    }
  );
};
```

## Edge Caching with Cloudflare Workers

### Cloudflare Worker for Edge Caching

```typescript
// worker.ts
interface Env {
  BACKEND_URL: string;
  BOOKS_API_CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Pass through non-GET requests
    if (method !== 'GET') {
      return await forwardToOrigin(request, env.BACKEND_URL);
    }
    
    // Cache static assets
    if (isStaticAsset(path)) {
      return await handleStaticAsset(request, env);
    }
    
    // Handle API requests
    if (path.startsWith('/api/')) {
      return await handleApiRequest(request, env);
    }
    
    // SPA fallback - serve index.html for all other paths
    if (!path.includes('.')) {
      const indexRequest = new Request(`${new URL(request.url).origin}/index.html`, {
        headers: request.headers
      });
      return await handleStaticAsset(indexRequest, env);
    }
    
    // Forward other requests
    return await forwardToOrigin(request, env.BACKEND_URL);
  }
};

async function handleStaticAsset(request: Request, env: Env): Promise<Response> {
  const cacheKey = new URL(request.url).toString();
  const cache = caches.default;
  
  // Check cache
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // Get fresh response
    response = await forwardToOrigin(request, env.BACKEND_URL);
    
    if (response.status === 200) {
      const responseToCache = new Response(response.body, response);
      
      // Set appropriate cache TTL based on asset type
      let cacheTtl = 86400; // 1 day default
      
      if (cacheKey.includes('.js') || cacheKey.includes('.css') || cacheKey.includes('/static/')) {
        // Long cache for immutable assets (use content hashing in build)
        cacheTtl = 31536000; // 1 year
        responseToCache.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (cacheKey.includes('index.html')) {
        // Short cache for main HTML
        cacheTtl = 60; // 1 minute
        responseToCache.headers.set('Cache-Control', 'public, max-age=60');
      } else {
        responseToCache.headers.set('Cache-Control', 'public, max-age=86400');
      }
      
      await cache.put(cacheKey, responseToCache, { expirationTtl: cacheTtl });
    }
  }
  
  return response;
}

async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only cache read-only endpoints
  const isCacheable = 
    path.startsWith('/api/v1/books') && 
    !path.includes('/import') && 
    !path.includes('/export') && 
    !path.includes('/create') && 
    !path.includes('/update') && 
    !path.includes('/delete');
  
  if (isCacheable) {
    // Create cache key
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const tokenHash = token ? await hashToken(token) : 'anonymous';
    const cacheKey = `api:${tokenHash}:${url.pathname}${url.search}`;
    
    // Check KV cache
    const cachedData = await env.BOOKS_API_CACHE.get(cacheKey);
    
    if (cachedData) {
      return new Response(cachedData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'CF-Cache-Status': 'HIT'
        }
      });
    }
    
    // Get fresh data
    const response = await forwardToOrigin(request, env.BACKEND_URL);
    
    if (response.status === 200) {
      const responseText = await response.clone().text();
      
      // Cache time based on endpoint
      let cacheTtl = 300; // 5 minutes default
      
      // Individual book details can be cached longer
      if (path.match(/\/api\/v1\/books\/\d+$/)) {
        cacheTtl = 3600; // 1 hour
      }
      
      await env.BOOKS_API_CACHE.put(cacheKey, responseText, { expirationTtl: cacheTtl });
      
      const newResponse = new Response(responseText, response);
      newResponse.headers.set('CF-Cache-Status', 'MISS');
      return newResponse;
    }
    
    return response;
  }
  
  return await forwardToOrigin(request, env.BACKEND_URL);
}

async function forwardToOrigin(request: Request, backendUrl: string): Promise<Response> {
  const url = new URL(request.url);
  const originUrl = `${backendUrl}${url.pathname}${url.search}`;
  
  // Clone request with same headers
  const originRequest = new Request(originUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  });
  
  return await fetch(originRequest);
}

function isStaticAsset(path: string): boolean {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.map', '.json', '.webp'
  ];
  return staticExtensions.some(ext => path.endsWith(ext));
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

## Backup Strategy

```typescript
// src/scripts/backup.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../utils/monitoring';

const execAsync = promisify(exec);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');
  const filename = `backup-${timestamp}.gz`;
  const filepath = path.join(backupDir, filename);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    logger.info('Starting database backup');
    
    // Create MongoDB dump
    await execAsync(`mongodump --uri="${process.env.MONGO_URI}" --gzip --archive=${filepath}`);
    logger.info(`Backup created at: ${filepath}`);
    
    // Upload to S3
    if (process.env.AWS_BACKUP_ENABLED === 'true') {
      const fileContent = fs.readFileSync(filepath);
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.BACKUP_BUCKET_NAME!,
        Key: `mongodb-backups/${filename}`,
        Body: fileContent
      }));
      
      logger.info(`Backup uploaded to S3: ${process.env.BACKUP_BUCKET_NAME}/mongodb-backups/${filename}`);
    }
    
    // Rotate local backups (keep last 5)
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.gz'))
      .sort()
      .reverse();
    
    if (files.length > 5) {
      const filesToDelete = files.slice(5);
      for (const file of filesToDelete) {
        fs.unlinkSync(path.join(backupDir, file));
        logger.info(`Deleted old backup: ${file}`);
      }
    }
    
    logger.info('Backup process completed successfully');
  } catch (error) {
    logger.error('Backup failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  createBackup().catch(error => {
    logger.error('Backup script failed:', error);
    process.exit(1);
  });
}

export default createBackup;
```

## Security Implementation

### Authentication Logic

```typescript
// src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User';
import { logger } from '../utils/monitoring';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: validatedData.email },
        { username: validatedData.username }
      ]
    });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user with hashed password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    user = new User({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      roles: ['user']
    });
    
    await user.save();
    
    // Create JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1d' }
    );
    
    // Set HTTP-only secure cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    logger.error('Error registering user', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    
    // Check if user exists
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(validatedData.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1d' }
    );
    
    // Set HTTP-only secure cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    logger.error('Error logging in user', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout user
export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
```

## Implementation Strategy

### Deployment Workflow

1. **Database Setup**
   - Create MongoDB Atlas cluster
   - Set up network access and connection strings
   - Run initial database migrations

2. **Backend Deployment on Render**
   - Set environment variables
   - Configure automatic deployments from GitHub
   - Set up health checks and monitoring

3. **Frontend Deployment on GitHub Pages**
   - Configure GitHub workflow for automatic builds
   - Set up custom domain with Cloudflare
   - Configure Cloudflare Workers for edge caching

4. **CI/CD Pipeline**
   - Implement GitHub Actions for testing and deployment
   - Set up automated database backups
   - Configure monitoring alerts

### Development and Testing Strategy

1. **Development Environment**
   - Local MongoDB instance with Docker
   - Hot-reloading for frontend and backend
   - Environment variable management for different contexts

2. **Testing Framework**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - End-to-end tests for critical flows
   - Performance testing for key operations

3. **QA Process**
   - Feature branch testing before merging
   - Automated smoke tests after deployment
   - Security scanning and vulnerability analysis

## Security Best Practices

- Implement proper authentication and authorization
- Use HTTPS for all connections
- Secure HTTP headers with Helmet
- CSRF protection for state-changing operations
- Input validation for all user inputs
- Sanitize database queries
- Rate limiting to prevent abuse
- Content Security Policy for frontend
- Regular security audits and updates

## Performance Optimizations

- Database connection pooling
- Query optimization with proper indexing
- Caching at multiple levels (application, CDN, edge)
- Frontend optimization with code splitting
- Image optimization and lazy loading
- Virtualized lists for large datasets
- Optimistic UI updates for better user experience

## Production Checklist

- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented and tested
- [ ] Error handling and logging comprehensive
- [ ] Documentation updated
- [ ] GDPR compliance verified (if applicable)
- [ ] Accessibility standards met
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness tested

This architecture provides a robust, scalable foundation for your book database application with a focus on type safety, performance, security, and maintainability.
