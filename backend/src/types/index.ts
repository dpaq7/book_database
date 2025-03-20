// src/types/index.ts
import { Request } from 'express';

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
