import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FaStar, FaRegStar, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { bookApi } from '../services/api';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Convert id to number
  const bookId = id ? parseInt(id) : 0;
  
  // Fetch book details
  const { data: book, isLoading, isError } = useQuery(
    ['book', bookId],
    () => bookApi.getBook(bookId),
    {
      enabled: !!bookId,
      refetchOnWindowFocus: false,
    }
  );
  
  // Delete book mutation
  const deleteBookMutation = useMutation(
    () => bookApi.deleteBook(bookId),
    {
      onSuccess: () => {
        // Invalidate books query and navigate back to the list
        queryClient.invalidateQueries('books');
        navigate('/books');
      },
    }
  );
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Render star rating
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className="text-xl">
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
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      deleteBookMutation.mutate();
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-12">Loading book details...</div>;
  }
  
  if (isError || !book) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading book details.</p>
        <Link to="/books" className="btn btn-primary">
          Return to Book List
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {/* Back navigation */}
      <Link to="/books" className="inline-flex items-center text-primary-600 hover:underline mb-6">
        <FaArrowLeft className="mr-1" /> Back to Books
      </Link>
      
      <div className="card">
        <div className="p-6">
          {/* Book header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
            </div>
            <div className="flex space-x-2">
              <Link 
                to={`/books/edit/${book.bookId}`}
                className="btn btn-outline flex items-center gap-1"
              >
                <FaEdit /> Edit
              </Link>
              <button 
                onClick={handleDelete}
                className="btn btn-outline text-red-600 hover:bg-red-50 flex items-center gap-1"
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
          
          {/* Book status badge */}
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium 
              ${book.exclusiveShelf === 'read' 
                ? 'bg-green-100 text-green-800' 
                : book.exclusiveShelf === 'currently-reading'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {book.exclusiveShelf.replace('-', ' ')}
            </span>
          </div>
          
          {/* Book details in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Rating</h3>
              <div className="flex items-center">
                {renderRating(book.rating)}
                <span className="ml-2 text-gray-600">({book.rating}/5)</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pages</h3>
              <p>{book.pages}</p>
            </div>
            
            {book.dateRead && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date Read</h3>
                <p>{formatDate(book.dateRead)}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date Added</h3>
              <p>{formatDate(book.dateAdded)}</p>
            </div>
            
            {book.publisher && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Publisher</h3>
                <p>{book.publisher}</p>
              </div>
            )}
            
            {(book.published || book.editionPublished) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Published</h3>
                <p>
                  {book.editionPublished ? `${book.editionPublished} (edition)` : ''}
                  {book.editionPublished && book.published ? ' / ' : ''}
                  {book.published ? `${book.published} (original)` : ''}
                </p>
              </div>
            )}
            
            {book.isbn && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">ISBN</h3>
                <p>{book.isbn}</p>
              </div>
            )}
            
            {book.binding && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Binding</h3>
                <p>{book.binding}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Read Count</h3>
              <p>{book.readCount}</p>
            </div>
            
            {book.additionalAuthors && book.additionalAuthors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Additional Authors</h3>
                <p>{book.additionalAuthors.join(', ')}</p>
              </div>
            )}
          </div>
          
          {/* Bookshelves / Tags */}
          {book.bookshelves && book.bookshelves.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bookshelves</h3>
              <div className="flex flex-wrap gap-2">
                {book.bookshelves.map((shelf) => (
                  <span
                    key={shelf}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {shelf}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Review */}
          {book.review && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Review</h3>
              <div className="p-4 bg-gray-50 rounded-md prose">
                {book.review}
              </div>
            </div>
          )}
          
          {/* Private Notes */}
          {book.privateNotes && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Private Notes</h3>
              <div className="p-4 bg-gray-50 rounded-md prose">
                {book.privateNotes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
