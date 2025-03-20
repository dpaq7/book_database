import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar, FaCalendarAlt, FaBook } from 'react-icons/fa';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ book, compact = false }) => {
  // Helper function to render star rating
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>
          {i <= rating ? (
            <FaStar className="text-yellow-400" />
          ) : (
            <FaRegStar className="text-gray-400" />
          )}
        </span>
      );
    }
    return <div className="flex space-x-1">{stars}</div>;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Determine card border class based on shelf
  const cardBorderClass = 
    book.exclusiveShelf === 'read' 
      ? 'book-card-read' 
      : book.exclusiveShelf === 'currently-reading' 
        ? 'book-card-reading' 
        : 'book-card-to-read';

  return (
    <div className={`card ${cardBorderClass} hover:shadow-lg transition-shadow duration-200`}>
      {compact ? (
        // Compact view for grid or list with limited space
        <div className="p-4">
          <Link to={`/books/${book.bookId}`} className="hover:text-primary-600">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{book.title}</h3>
          </Link>
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">by {book.author}</p>
          <div className="flex justify-between items-center">
            <div className="text-xs">{renderRating(book.rating)}</div>
            <span className="text-xs text-gray-500">{book.pages} pages</span>
          </div>
        </div>
      ) : (
        // Full view with more details
        <div className="p-5">
          <Link to={`/books/${book.bookId}`} className="hover:text-primary-600">
            <h3 className="font-semibold text-xl mb-2">{book.title}</h3>
          </Link>
          <p className="text-gray-600 mb-3">by {book.author}</p>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">{renderRating(book.rating)}</div>
            <span className="text-sm text-gray-500">{book.pages} pages</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            {book.dateRead && (
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-primary-500" />
                <span>Read on: {formatDate(book.dateRead)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <FaBook className="text-primary-500" />
              <span>
                Status:{' '}
                <span className="font-medium capitalize">
                  {book.exclusiveShelf.replace('-', ' ')}
                </span>
              </span>
            </div>
          </div>
          
          {book.bookshelves.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-1">
                {book.bookshelves.map((shelf) => (
                  <span
                    key={shelf}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {shelf}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <Link
              to={`/books/edit/${book.bookId}`}
              className="btn btn-outline text-sm"
            >
              Edit Book
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCard;
