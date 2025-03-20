import React from 'react';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

/**
 * Reusable loading component that displays a spinner and a message
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullPage = false,
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-6 ${
        fullPage ? 'min-h-[80vh]' : ''
      }`}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingState;
