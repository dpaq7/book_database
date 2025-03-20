import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookApi } from '../services/api';
import BookForm from '../components/BookForm';
import { Book } from '../types';

const EditBook: React.FC = () => {
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
  
  // Update book mutation
  const updateBookMutation = useMutation(
    (bookData: Partial<Book>) => bookApi.updateBook(bookId, bookData),
    {
      onSuccess: (data) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries(['book', bookId]);
        queryClient.invalidateQueries('books');
        // Navigate to the book detail page
        navigate(`/books/${data.bookId}`);
      },
    }
  );
  
  // Handle form submission
  const handleSubmit = (data: Partial<Book>) => {
    updateBookMutation.mutate(data);
  };
  
  if (isLoading) {
    return <div className="text-center py-12">Loading book details...</div>;
  }
  
  if (isError || !book) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading book details.</p>
        <button 
          onClick={() => navigate('/books')}
          className="btn btn-primary"
        >
          Return to Book List
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Book: {book.title}</h1>
      
      {updateBookMutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>Error updating book. Please try again.</p>
        </div>
      )}
      
      <BookForm 
        book={book}
        onSubmit={handleSubmit} 
        isSubmitting={updateBookMutation.isLoading}
      />
    </div>
  );
};

export default EditBook;
