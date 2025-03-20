import { Request, Response } from 'express';
import { ZodError } from 'zod';
import Book from '../models/Book';
import { filterSchema, bookSchema } from '../utils/validation';
import { PaginatedResponse, BookFilters } from '../types';
import { logger, mongoOperationDurationMicroseconds } from '../utils/monitoring';

// Get all books with filtering and pagination
export const getBooks = async (req: Request, res: Response) => {
  try {
    // Validate and parse query parameters
    const validatedParams = filterSchema.parse(req.query);
    const { 
      page = 1, 
      limit = 10, 
      sort = 'dateAdded', 
      order = 'desc', 
      shelf, 
      search,
      minRating,
      maxRating,
      startDate,
      endDate
    } = validatedParams;

    // Build filter object
    const filter: any = {};
    
    // Add shelf filter if provided
    if (shelf) {
      filter.exclusiveShelf = shelf;
    }
    
    // Add rating range filter if provided
    if (minRating !== undefined || maxRating !== undefined) {
      filter.rating = {};
      if (minRating !== undefined) {
        filter.rating.$gte = minRating;
      }
      if (maxRating !== undefined) {
        filter.rating.$lte = maxRating;
      }
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.dateRead = {};
      if (startDate) {
        filter.dateRead.$gte = startDate;
      }
      if (endDate) {
        filter.dateRead.$lte = endDate;
      }
    }
    
    // Add search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { publisher: searchRegex },
        { review: searchRegex }
      ];
    }
    
    // Start timing DB operation
    const startTime = Date.now();
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Fetch total count for pagination
    const total = await Book.countDocuments(filter);
    
    // Fetch books with filtering, sorting, and pagination
    const books = await Book.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);
    
    // Record DB operation duration
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('find', 'books')
      .observe(duration);
    
    // Prepare pagination response
    const response: PaginatedResponse<typeof books[0]> = {
      data: books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalItems: total
    };
    
    res.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    
    logger.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single book by ID
export const getBookById = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    const startTime = Date.now();
    const book = await Book.findOne({ bookId });
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('findOne', 'books')
      .observe(duration);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    logger.error(`Error fetching book with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new book
export const createBook = async (req: Request, res: Response) => {
  try {
    const validatedData = bookSchema.parse(req.body);
    
    // Generate a new bookId (you might want to implement a better strategy)
    const startTime = Date.now();
    const maxIdBook = await Book.findOne().sort({ bookId: -1 });
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('findOne', 'books')
      .observe(duration);
    
    const newBookId = maxIdBook ? maxIdBook.bookId + 1 : 1;
    
    const newBook = new Book({
      ...validatedData,
      bookId: newBookId,
      dateAdded: new Date()
    });
    
    const saveStart = Date.now();
    const savedBook = await newBook.save();
    const saveDuration = Date.now() - saveStart;
    mongoOperationDurationMicroseconds
      .labels('save', 'books')
      .observe(saveDuration);
    
    res.status(201).json(savedBook);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid book data', errors: error.errors });
    }
    
    logger.error('Error creating book:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a book
export const updateBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    const validatedData = bookSchema.parse(req.body);
    
    const startTime = Date.now();
    const book = await Book.findOneAndUpdate(
      { bookId },
      validatedData,
      { new: true, runValidators: true }
    );
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('findOneAndUpdate', 'books')
      .observe(duration);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Invalid book data', errors: error.errors });
    }
    
    logger.error(`Error updating book with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a book
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    const startTime = Date.now();
    const book = await Book.findOneAndDelete({ bookId });
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('findOneAndDelete', 'books')
      .observe(duration);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json({ message: 'Book removed' });
  } catch (error) {
    logger.error(`Error deleting book with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available bookshelves (tags)
export const getBookshelves = async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const bookshelves = await Book.distinct('bookshelves');
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('distinct', 'books')
      .observe(duration);
    
    res.json(bookshelves);
  } catch (error) {
    logger.error('Error fetching bookshelves:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get book statistics
export const getBookStats = async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    const totalBooks = await Book.countDocuments();
    const readBooks = await Book.countDocuments({ exclusiveShelf: 'read' });
    const readingBooks = await Book.countDocuments({ exclusiveShelf: 'currently-reading' });
    const toReadBooks = await Book.countDocuments({ exclusiveShelf: 'to-read' });
    
    const totalPages = await Book.aggregate([
      { $match: { exclusiveShelf: 'read' } },
      { $group: { _id: null, totalPages: { $sum: '$pages' } } }
    ]);
    
    const averageRating = await Book.aggregate([
      { $match: { rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    const topAuthors = await Book.aggregate([
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const duration = Date.now() - startTime;
    mongoOperationDurationMicroseconds
      .labels('aggregate', 'books')
      .observe(duration);
    
    res.json({
      totalBooks,
      readBooks,
      readingBooks,
      toReadBooks,
      totalPagesRead: totalPages.length > 0 ? totalPages[0].totalPages : 0,
      averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0,
      topAuthors: topAuthors.map(a => ({ author: a._id, count: a.count }))
    });
  } catch (error) {
    logger.error('Error fetching book statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
