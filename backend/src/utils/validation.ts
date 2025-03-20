import { z } from 'zod';

export const filterSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().optional().default(10),
  sort: z.string().optional().default('dateAdded'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  shelf: z.string().optional(),
  search: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  authorByLastName: z.string().optional(),
  additionalAuthors: z.array(z.string()).optional(),
  isbn: z.string().optional(),
  isbn13: z.number().optional(),
  rating: z.number().min(0).max(5).default(0),
  averageRating: z.number().optional(),
  publisher: z.string().optional(),
  binding: z.string().optional(),
  pages: z.number().min(1, "Number of pages is required"),
  beqValue: z.number().default(0),
  editionPublished: z.number().optional(),
  published: z.number().optional(),
  dateRead: z.string().optional().transform(val => val ? new Date(val) : undefined),
  bookshelves: z.array(z.string()).default([]),
  bookshelvesWithPositions: z.array(z.string()).optional(),
  exclusiveShelf: z.enum(['read', 'currently-reading', 'to-read']).default('to-read'),
  review: z.string().optional(),
  spoiler: z.string().optional(),
  privateNotes: z.string().optional(),
  readCount: z.number().default(0),
  ownedCopies: z.number().default(0)
});
