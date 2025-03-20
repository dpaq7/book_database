import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <p className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</p>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
