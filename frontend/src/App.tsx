import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BookList from './pages/BookList';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import EditBook from './pages/EditBook';
import Stats from './pages/Stats';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  // The basePath is defined directly in the basename prop
  // No need for a separate variable

  return (
    <BrowserRouter basename="/book-database">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="books">
            <Route index element={<BookList />} />
            <Route path=":id" element={<BookDetail />} />
            <Route path="add" element={<AddBook />} />
            <Route path="edit/:id" element={<EditBook />} />
          </Route>
          <Route path="stats" element={<Stats />} />
          <Route path="404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
