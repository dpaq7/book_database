import express from 'express';
import * as bookController from '../controllers/bookController';

const router = express.Router();

// GET /api/books - Get all books with filtering and pagination
router.get('/', bookController.getBooks);

// GET /api/books/stats - Get book statistics
router.get('/stats', bookController.getBookStats);

// GET /api/books/bookshelves - Get all unique bookshelves (tags)
router.get('/bookshelves', bookController.getBookshelves);

// GET /api/books/:id - Get a single book by ID
router.get('/:id', bookController.getBookById);

// POST /api/books - Create a new book
router.post('/', bookController.createBook);

// PUT /api/books/:id - Update a book
router.put('/:id', bookController.updateBook);

// DELETE /api/books/:id - Delete a book
router.delete('/:id', bookController.deleteBook);

export default router;
