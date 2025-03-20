import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    // Show fewer buttons on mobile
    const isMobile = window.innerWidth < 640;
    const visiblePages = isMobile ? 3 : maxVisiblePages;
    
    if (totalPages <= visiblePages) {
      // Show all pages if totalPages is less than maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Calculate which pages to show
      let startPage = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
      const endPage = Math.min(startPage + visiblePages - 1, totalPages);
      
      // Adjust startPage if we're near the end
      if (endPage - startPage + 1 < visiblePages) {
        startPage = Math.max(endPage - visiblePages + 1, 1);
      }
      
      // Add first page
      if (startPage > 1) {
        pageNumbers.push(1);
        // Add ellipsis if there's a gap
        if (startPage > 2) {
          pageNumbers.push('ellipsis-start');
        }
      }
      
      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add last page
      if (endPage < totalPages) {
        // Add ellipsis if there's a gap
        if (endPage < totalPages - 1) {
          pageNumbers.push('ellipsis-end');
        }
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex justify-center mt-6">
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`btn ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed'
              : 'btn-outline hover:bg-gray-100'
          }`}
          aria-label="Previous page"
        >
          <FaChevronLeft />
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-1 text-gray-500"
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={`page-${page}`}
              onClick={() => handlePageChange(page as number)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
        
        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`btn ${
            currentPage === totalPages
              ? 'opacity-50 cursor-not-allowed'
              : 'btn-outline hover:bg-gray-100'
          }`}
          aria-label="Next page"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
