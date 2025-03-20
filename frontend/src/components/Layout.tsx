import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FaBook, FaChartBar, FaTachometerAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      {/* Sidebar */}
      <aside
        className={`bg-primary-800 text-white w-64 flex-shrink-0 fixed inset-y-0 z-10 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-primary-700">
            <h2 className="text-xl font-bold text-white">Book Database</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/"
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                isActive('/') ? 'bg-primary-900' : 'hover:bg-primary-700'
              }`}
              onClick={closeSidebar}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/books"
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                location.pathname.includes('/books') ? 'bg-primary-900' : 'hover:bg-primary-700'
              }`}
              onClick={closeSidebar}
            >
              <FaBook />
              <span>Books</span>
            </Link>
            
            <Link
              to="/stats"
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                isActive('/stats') ? 'bg-primary-900' : 'hover:bg-primary-700'
              }`}
              onClick={closeSidebar}
            >
              <FaChartBar />
              <span>Statistics</span>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-primary-700 text-sm text-primary-300">
            <p>© {new Date().getFullYear()} Book Database</p>
          </div>
        </div>
      </aside>
      
      {/* Content area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Layout;
