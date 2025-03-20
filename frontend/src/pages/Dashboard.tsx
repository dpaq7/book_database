import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FaBook, FaBookOpen, FaBookReader, FaChartPie } from 'react-icons/fa';
import { bookApi } from '../services/api';

const Dashboard: React.FC = () => {
  // Fetch book statistics
  const { data: stats, isLoading: statsLoading } = useQuery('bookStats', () => 
    bookApi.getStats()
  );
  
  // Fetch recent books (limited to 5)
  const { data: recentBooks, isLoading: booksLoading } = useQuery('recentBooks', () => 
    bookApi.getBooks({ page: 1, limit: 5, sort: 'dateAdded', order: 'desc' })
  );
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Books */}
        <div className="card p-6 flex items-center">
          <div className="rounded-full bg-primary-100 p-3 mr-4 text-primary-600">
            <FaBook size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Total Books</h3>
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalBooks}
            </p>
          </div>
        </div>
        
        {/* Read Books */}
        <div className="card p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4 text-green-600">
            <FaBookOpen size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Read</h3>
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.readBooks}
            </p>
          </div>
        </div>
        
        {/* Currently Reading */}
        <div className="card p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4 text-blue-600">
            <FaBookReader size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">Reading</h3>
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.readingBooks}
            </p>
          </div>
        </div>
        
        {/* To Read */}
        <div className="card p-6 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4 text-yellow-600">
            <FaChartPie size={24} />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm">To Read</h3>
            <p className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.toReadBooks}
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/books/add" className="btn btn-primary">
            Add New Book
          </Link>
          <Link to="/books" className="btn btn-outline">
            View All Books
          </Link>
          <Link to="/stats" className="btn btn-outline">
            View Statistics
          </Link>
        </div>
      </div>
      
      {/* Recently Added Books */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recently Added Books</h2>
          <Link to="/books" className="text-primary-600 hover:underline text-sm">
            View All
          </Link>
        </div>
        
        {booksLoading ? (
          <p>Loading recent books...</p>
        ) : (
          <div className="space-y-4">
            {recentBooks?.data.length === 0 ? (
              <p className="text-gray-500">No books added yet.</p>
            ) : (
              recentBooks?.data.map((book) => (
                <div key={book.bookId} className="border-b pb-3 last:border-b-0">
                  <Link 
                    to={`/books/${book.bookId}`} 
                    className="text-lg font-medium hover:text-primary-600"
                  >
                    {book.title}
                  </Link>
                  <p className="text-sm text-gray-600">by {book.author}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      Added: {new Date(book.dateAdded).toLocaleDateString()}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                      {book.exclusiveShelf.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
