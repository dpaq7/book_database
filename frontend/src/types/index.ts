export interface Book {
  _id: string;
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
  dateRead?: string;
  dateAdded: string;
  bookshelves: string[];
  bookshelvesWithPositions?: string[];
  exclusiveShelf: 'read' | 'currently-reading' | 'to-read';
  review?: string;
  spoiler?: string;
  privateNotes?: string;
  readCount: number;
  ownedCopies: number;
  createdAt: string;
  updatedAt: string;
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
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface BookStats {
  totalBooks: number;
  readBooks: number;
  readingBooks: number;
  toReadBooks: number;
  totalPagesRead: number;
  averageRating: number;
  topAuthors: {
    author: string;
    count: number;
  }[];
}

export type BookshelfType = 'read' | 'currently-reading' | 'to-read';
