import mongoose, { Document, Schema } from 'mongoose';
import { Book } from '../types';

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
