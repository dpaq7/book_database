import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { bookApi } from '../services/api';
import BookForm from '../components/BookForm';
import { Book } from '../types';

const AddBook: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Create book mutation
  const createBookMutation = useMutation(
    (bookData: Partial<Book>) => bookApi.createBook(bookData),
    {
      onSuccess: (data) => {
        // Invalidate books query to refetch the list
        queryClient.invalidateQueries('books');
        // Navigate to the book detail page
        navigate(`/books/${data.bookId}`);
      },
    }
  );
  
  // Handle form submission
  const handleSubmit = (data: Partial<Book>) => {
    createBookMutation.mutate(data);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Book</h1>
      
      {createBookMutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>Error adding book. Please try again.</p>
        </div>
      )}
      
      <BookForm 
        onSubmit={handleSubmit} 
        isSubmitting={createBookMutation.isLoading}
      />
    </div>
  );
};

export default AddBook;
