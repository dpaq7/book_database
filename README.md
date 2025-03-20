# Book Database Application

A full-stack web application for tracking and managing your book collection. Keep track of books you've read, are currently reading, or want to read in the future.

## Demo

- **Frontend**: [https://dpaq7.github.io/book-database](https://dpaq7.github.io/book-database)
- **Backend API**: [https://book-database-backend.onrender.com/api](https://book-database-backend.onrender.com/api)

## Features

- **Book Management**: Add, edit, and delete books with detailed information
- **Reading Status**: Track reading status (read, currently reading, to-read)
- **Filtering & Sorting**: Filter books by various criteria (shelf, rating, etc.)
- **Statistics**: View reading statistics and insights
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Frontend
- **React**: UI library for building component-based interfaces
- **TypeScript**: Static type-checking for enhanced development experience
- **React Router**: Client-side routing
- **React Query**: Data fetching, caching, and state management
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vite**: Build tool and development server

### Backend
- **Node.js**: JavaScript runtime for server-side logic
- **Express**: Web framework for handling API requests
- **TypeScript**: Static typing for robust code
- **MongoDB**: NoSQL database for storing book data
- **Mongoose**: MongoDB object modeling
- **Zod**: Runtime validation for data models

### Deployment
- **Frontend**: GitHub Pages
- **Backend**: Render
- **Database**: MongoDB Atlas

## Project Structure

```
book-database/
├── backend/               # Express server and API
│   ├── src/               # Source code
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Utility functions
│   │   └── server.ts      # Express server setup
│   ├── package.json       # Dependencies and scripts
│   └── tsconfig.json      # TypeScript configuration
│
└── frontend/              # React client application
    ├── src/               # Source code
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   ├── styles/        # CSS files
    │   ├── types/         # TypeScript interfaces
    │   ├── App.tsx        # Main application component
    │   └── main.tsx       # Entry point
    ├── package.json       # Dependencies and scripts
    └── tsconfig.json      # TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/dpaq7/book-database.git
   cd book-database
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   ```
   PORT=5000
   MONGO_URI=<your_mongodb_connection_string>
   ```
   - Create a `.env` file in the frontend directory
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Running Locally

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Frontend (GitHub Pages)

1. Update the `vite.config.ts` file:
   ```ts
   base: '/book-database/'
   ```

2. Build the frontend:
   ```
   npm run build
   ```

3. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

### Backend (Render)

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Set the following:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables (MONGO_URI, etc.)

## License

MIT

## Acknowledgements

- [React Icons](https://react-icons.github.io/react-icons/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Query](https://react-query.tanstack.com/)
