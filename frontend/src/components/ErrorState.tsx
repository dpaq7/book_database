import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
  status?: number;
}

/**
 * Reusable error component that displays an error message
 * and optionally provides a retry button
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'An error occurred. Please try again later.',
  retry,
  status,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 mb-4">
        <FaExclamationTriangle size={48} />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">Error</h2>
      
      {status && (
        <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
          Status: {status}
        </div>
      )}
      
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      
      {retry && (
        <button
          onClick={retry}
          className="btn btn-primary"
          aria-label="Retry"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
