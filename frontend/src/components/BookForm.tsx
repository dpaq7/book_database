import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { Book } from '../types';

interface BookFormProps {
  book?: Partial<Book>;
  onSubmit: (data: Partial<Book>) => void;
  isSubmitting: boolean;
}

const BookForm: React.FC<BookFormProps> = ({ book = {}, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<Partial<Book>>({
    defaultValues: {
      title: book.title || '',
      author: book.author || '',
      pages: book.pages || 0,
      rating: book.rating || 0,
      exclusiveShelf: book.exclusiveShelf || 'to-read',
      dateRead: book.dateRead ? new Date(book.dateRead).toISOString().split('T')[0] : '',
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      binding: book.binding || '',
      published: book.published || undefined,
      editionPublished: book.editionPublished || undefined,
      bookshelves: book.bookshelves || [],
      review: book.review || '',
      privateNotes: book.privateNotes || '',
      readCount: book.readCount || 0,
      ownedCopies: book.ownedCopies || 0,
    }
  });

  // Watch current shelf value to show/hide date read field
  const currentShelf = watch('exclusiveShelf');
  
  // Handle star rating selection
  const handleRatingClick = (rating: number, onChange: any) => {
    onChange(rating);
  };
  
  // Convert comma-separated string to array for bookshelves
  const handleBookshelvesChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: any) => {
    const shelves = e.target.value.split(',').map(shelf => shelf.trim()).filter(Boolean);
    onChange(shelves);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-full">
            <label htmlFor="title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className={`input ${errors.title ? 'border-red-500' : ''}`}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          {/* Author */}
          <div className="col-span-full md:col-span-1">
            <label htmlFor="author" className="label">
              Author <span className="text-red-500">*</span>
            </label>
            <input
              id="author"
              type="text"
              className={`input ${errors.author ? 'border-red-500' : ''}`}
              {...register('author', { required: 'Author is required' })}
            />
            {errors.author && (
              <p className="mt-1 text-sm text-red-500">{errors.author.message}</p>
            )}
          </div>
          
          {/* Pages */}
          <div>
            <label htmlFor="pages" className="label">
              Pages <span className="text-red-500">*</span>
            </label>
            <input
              id="pages"
              type="number"
              min="1"
              className={`input ${errors.pages ? 'border-red-500' : ''}`}
              {...register('pages', { 
                required: 'Page count is required',
                min: { value: 1, message: 'Must be at least 1' },
                valueAsNumber: true
              })}
            />
            {errors.pages && (
              <p className="mt-1 text-sm text-red-500">{errors.pages.message}</p>
            )}
          </div>
          
          {/* Rating */}
          <div>
            <label className="label">Rating</label>
            <Controller
              name="rating"
              control={control}
              render={({ field: { value, onChange } }) => (
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star, onChange)}
                      className="text-xl focus:outline-none"
                    >
                      {star <= (value || 0) ? (
                        <FaStar className="text-yellow-400" />
                      ) : (
                        <FaRegStar className="text-gray-400" />
                      )}
                    </button>
                  ))}
                  <span className="ml-2 text-gray-500">{value || 0}/5</span>
                </div>
              )}
            />
          </div>
          
          {/* Exclusive Shelf */}
          <div>
            <label htmlFor="exclusiveShelf" className="label">
              Shelf <span className="text-red-500">*</span>
            </label>
            <select
              id="exclusiveShelf"
              className="input"
              {...register('exclusiveShelf', { required: true })}
            >
              <option value="read">Read</option>
              <option value="currently-reading">Currently Reading</option>
              <option value="to-read">To Read</option>
            </select>
          </div>
          
          {/* Date Read (only show if shelf is 'read') */}
          {currentShelf === 'read' && (
            <div>
              <label htmlFor="dateRead" className="label">Date Read</label>
              <input
                id="dateRead"
                type="date"
                className="input"
                {...register('dateRead')}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Details Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Publisher */}
          <div>
            <label htmlFor="publisher" className="label">Publisher</label>
            <input
              id="publisher"
              type="text"
              className="input"
              {...register('publisher')}
            />
          </div>
          
          {/* ISBN */}
          <div>
            <label htmlFor="isbn" className="label">ISBN</label>
            <input
              id="isbn"
              type="text"
              className="input"
              {...register('isbn')}
            />
          </div>
          
          {/* Binding */}
          <div>
            <label htmlFor="binding" className="label">Binding</label>
            <input
              id="binding"
              type="text"
              className="input"
              {...register('binding')}
              placeholder="Hardcover, Paperback, etc."
            />
          </div>
          
          {/* Original Publication Year */}
          <div>
            <label htmlFor="published" className="label">Original Publication Year</label>
            <input
              id="published"
              type="number"
              className="input"
              {...register('published', { valueAsNumber: true })}
            />
          </div>
          
          {/* Edition Publication Year */}
          <div>
            <label htmlFor="editionPublished" className="label">Edition Publication Year</label>
            <input
              id="editionPublished"
              type="number"
              className="input"
              {...register('editionPublished', { valueAsNumber: true })}
            />
          </div>
          
          {/* Read Count */}
          <div>
            <label htmlFor="readCount" className="label">Read Count</label>
            <input
              id="readCount"
              type="number"
              min="0"
              className="input"
              {...register('readCount', { valueAsNumber: true })}
            />
          </div>
          
          {/* Owned Copies */}
          <div>
            <label htmlFor="ownedCopies" className="label">Owned Copies</label>
            <input
              id="ownedCopies"
              type="number"
              min="0"
              className="input"
              {...register('ownedCopies', { valueAsNumber: true })}
            />
          </div>
          
          {/* Bookshelves (Tags) */}
          <div className="col-span-full">
            <label htmlFor="bookshelves" className="label">Bookshelves/Tags</label>
            <Controller
              name="bookshelves"
              control={control}
              render={({ field: { value, onChange } }) => (
                <>
                  <input
                    id="bookshelves"
                    type="text"
                    className="input"
                    placeholder="Enter comma-separated tags (e.g. fantasy, favorites, sci-fi)"
                    value={value?.join(', ') || ''}
                    onChange={(e) => handleBookshelvesChange(e, onChange)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate tags with commas
                  </p>
                </>
              )}
            />
          </div>
        </div>
      </div>
      
      {/* Review & Notes Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Review & Notes</h2>
        
        <div className="space-y-6">
          {/* Review */}
          <div>
            <label htmlFor="review" className="label">Review</label>
            <textarea
              id="review"
              rows={5}
              className="input"
              {...register('review')}
              placeholder="Write your review here..."
            />
          </div>
          
          {/* Private Notes */}
          <div>
            <label htmlFor="privateNotes" className="label">Private Notes</label>
            <textarea
              id="privateNotes"
              rows={3}
              className="input"
              {...register('privateNotes')}
              placeholder="Private notes only visible to you..."
            />
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Saving...' : book.bookId ? 'Update Book' : 'Add Book'}
        </button>
      </div>
    </form>
  );
};

export default BookForm;
