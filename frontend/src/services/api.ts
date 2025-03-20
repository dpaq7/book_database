import axios from 'axios';
import { Book, BookFilters, PaginatedResponse, BookStats } from '../types';

// Create an axios instance with base URL and default settings
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://book-database-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Book API endpoints
export const bookApi = {
  // Get all books with filtering and pagination
  getBooks: async (filters: BookFilters = {}): Promise<PaginatedResponse<Book>> => {
    const response = await api.get('/books', { params: filters });
    return response.data;
  },

  // Get a single book by ID
  getBook: async (id: number): Promise<Book> => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  // Create a new book
  createBook: async (book: Partial<Book>): Promise<Book> => {
    const response = await api.post('/books', book);
    return response.data;
  },

  // Update a book
  updateBook: async (id: number, book: Partial<Book>): Promise<Book> => {
    const response = await api.put(`/books/${id}`, book);
    return response.data;
  },

  // Delete a book
  deleteBook: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}`);
  },

  // Get book statistics
  getStats: async (): Promise<BookStats> => {
    const response = await api.get('/books/stats');
    return response.data;
  },

  // Get all unique bookshelves (tags)
  getBookshelves: async (): Promise<string[]> => {
    const response = await api.get('/books/bookshelves');
    return response.data;
  },
};

export default api;
