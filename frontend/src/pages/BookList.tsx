import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FaPlus, FaFilter, FaSort, FaTimes, FaSearch } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { bookApi } from '../services/api';
import { BookFilters } from '../types';

const BookList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  // Get filter parameters from URL
  const initialFilters: BookFilters = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 10,
    sort: searchParams.get('sort') || 'dateAdded',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    shelf: searchParams.get('shelf') || undefined,
    search: searchParams.get('search') || undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    maxRating: searchParams.get('maxRating') ? Number(searchParams.get('maxRating')) : undefined,
  };

  const [filters, setFilters] = useState<BookFilters>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Fetch books with current filters
  const { data, isLoading, isError } = useQuery(
    ['books', filters],
    () => bookApi.getBooks(filters),
    { keepPreviousData: true }
  );
  
  // Fetch available bookshelves for filter options
  const { data: bookshelves } = useQuery('bookshelves', () => 
    bookApi.getBookshelves()
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      // Reset to page 1 when filters change
      page: 1,
    });
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    const newOrder = 
      filters.sort === field && filters.order === 'desc' ? 'asc' : 'desc';
    
    setFilters({
      ...filters,
      sort: field,
      order: newOrder,
      page: 1,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort: 'dateAdded',
      order: 'desc',
    });
    setIsFilterOpen(false);
  };

  // Toggle filter panel on mobile
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Books</h1>
        <Link to="/books/add" className="btn btn-primary flex items-center gap-2">
          <FaPlus /> Add Book
        </Link>
      </div>
      
      {/* Search and filter controls */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              name="search"
              value={filters.search || ''}
              onChange={handleFilterChange}
              placeholder="Search books..."
              className="input pl-10"
            />
          </div>
          
          {/* Mobile filter toggle */}
          {isMobile && (
            <button
              onClick={toggleFilter}
              className="btn btn-outline flex items-center gap-2"
              aria-expanded={isFilterOpen}
            >
              <FaFilter /> Filters
            </button>
          )}
          
          {/* Desktop filters (always visible) */}
          {!isMobile && (
            <div className="flex items-center gap-4">
              <select
                name="shelf"
                value={filters.shelf || ''}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Shelves</option>
                <option value="read">Read</option>
                <option value="currently-reading">Currently Reading</option>
                <option value="to-read">To Read</option>
              </select>
              
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="input"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              {(filters.search || filters.shelf || filters.minRating) && (
                <button
                  onClick={clearFilters}
                  className="btn btn-outline flex items-center gap-2 text-sm"
                >
                  <FaTimes /> Clear
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile filters (expandable) */}
        {isMobile && isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div>
              <label htmlFor="mobile-shelf" className="label">Shelf</label>
              <select
                id="mobile-shelf"
                name="shelf"
                value={filters.shelf || ''}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Shelves</option>
                <option value="read">Read</option>
                <option value="currently-reading">Currently Reading</option>
                <option value="to-read">To Read</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="mobile-minRating" className="label">Minimum Rating</label>
              <select
                id="mobile-minRating"
                name="minRating"
                value={filters.minRating || ''}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">Any Rating</option>
                <option value="1">★ and up</option>
                <option value="2">★★ and up</option>
                <option value="3">★★★ and up</option>
                <option value="4">★★★★ and up</option>
                <option value="5">★★★★★ only</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="mobile-limit" className="label">Books per page</label>
              <select
                id="mobile-limit"
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="input"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={clearFilters}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
              <button
                onClick={toggleFilter}
                className="btn btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Books grid/list */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading books...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-600">
          <p>Error loading books. Please try again later.</p>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No books found. Try adjusting your filters or add some books!</p>
          <Link to="/books/add" className="btn btn-primary mt-4">
            Add Your First Book
          </Link>
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div className="flex justify-end mb-4 text-sm">
            <span className="mr-2 text-gray-600">Sort by:</span>
            <button
              onClick={() => handleSortChange('title')}
              className={`mr-3 ${filters.sort === 'title' ? 'font-bold' : ''}`}
            >
              Title
              {filters.sort === 'title' && (
                <FaSort className="inline-block ml-1" />
              )}
            </button>
            <button
              onClick={() => handleSortChange('author')}
              className={`mr-3 ${filters.sort === 'author' ? 'font-bold' : ''}`}
            >
              Author
              {filters.sort === 'author' && (
                <FaSort className="inline-block ml-1" />
              )}
            </button>
            <button
              onClick={() => handleSortChange('dateRead')}
              className={`mr-3 ${filters.sort === 'dateRead' ? 'font-bold' : ''}`}
            >
              Date Read
              {filters.sort === 'dateRead' && (
                <FaSort className="inline-block ml-1" />
              )}
            </button>
            <button
              onClick={() => handleSortChange('rating')}
              className={`${filters.sort === 'rating' ? 'font-bold' : ''}`}
            >
              Rating
              {filters.sort === 'rating' && (
                <FaSort className="inline-block ml-1" />
              )}
            </button>
          </div>
          
          {/* Book grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={data?.currentPage || 1}
            totalPages={data?.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default BookList;
