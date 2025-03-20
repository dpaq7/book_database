import React from 'react';
import { useQuery } from 'react-query';
import { bookApi } from '../services/api';
import { FaBookOpen, FaClock, FaStar, FaUserAlt } from 'react-icons/fa';

const Stats: React.FC = () => {
  // Fetch book statistics
  const { data: stats, isLoading, isError } = useQuery('bookStats', () => 
    bookApi.getStats()
  );
  
  // Calculate read percentage
  const calculateReadPercentage = () => {
    if (!stats || stats.totalBooks === 0) return 0;
    return Math.round((stats.readBooks / stats.totalBooks) * 100);
  };
  
  if (isLoading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }
  
  if (isError || !stats) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading statistics. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Reading Statistics</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Books */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-primary-100 p-3 mr-4 text-primary-600">
              <FaBookOpen size={24} />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Total Books</h3>
              <p className="text-2xl font-bold">{stats.totalBooks}</p>
            </div>
          </div>
        </div>
        
        {/* Pages Read */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4 text-green-600">
              <FaBookOpen size={24} />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Pages Read</h3>
              <p className="text-2xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Average Rating */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4 text-yellow-600">
              <FaStar size={24} />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Average Rating</h3>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
            </div>
          </div>
        </div>
        
        {/* Completion Rate */}
        <div className="card p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4 text-blue-600">
              <FaClock size={24} />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Completion Rate</h3>
              <p className="text-2xl font-bold">{calculateReadPercentage()}%</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reading Status */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Reading Status</h2>
        
        <div className="flex flex-col md:flex-row justify-around">
          <div className="text-center mb-4 md:mb-0">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-xl font-bold mb-2">
              {stats.readBooks}
            </div>
            <p className="text-gray-700">Read</p>
          </div>
          
          <div className="text-center mb-4 md:mb-0">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 text-xl font-bold mb-2">
              {stats.readingBooks}
            </div>
            <p className="text-gray-700">Currently Reading</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 text-xl font-bold mb-2">
              {stats.toReadBooks}
            </div>
            <p className="text-gray-700">To Read</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="flex h-full"
              role="progressbar"
              aria-valuenow={stats.readBooks}
              aria-valuemin={0}
              aria-valuemax={stats.totalBooks}
            >
              <div 
                className="bg-green-500 h-full"
                style={{ width: `${(stats.readBooks / stats.totalBooks) * 100}%` }}
                title={`Read: ${stats.readBooks}`}
              ></div>
              <div 
                className="bg-blue-500 h-full"
                style={{ width: `${(stats.readingBooks / stats.totalBooks) * 100}%` }}
                title={`Currently Reading: ${stats.readingBooks}`}
              ></div>
              <div 
                className="bg-yellow-500 h-full"
                style={{ width: `${(stats.toReadBooks / stats.totalBooks) * 100}%` }}
                title={`To Read: ${stats.toReadBooks}`}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Read ({Math.round((stats.readBooks / stats.totalBooks) * 100)}%)</span>
            <span>Currently Reading ({Math.round((stats.readingBooks / stats.totalBooks) * 100)}%)</span>
            <span>To Read ({Math.round((stats.toReadBooks / stats.totalBooks) * 100)}%)</span>
          </div>
        </div>
      </div>
      
      {/* Top Authors */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Top Authors</h2>
        
        {stats.topAuthors.length === 0 ? (
          <p className="text-gray-500">No author data available yet.</p>
        ) : (
          <div className="space-y-4">
            {stats.topAuthors.map((author, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3">
                  <FaUserAlt />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{author.author}</span>
                    <span className="text-gray-500 text-sm">{author.count} books</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(author.count / stats.topAuthors[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
