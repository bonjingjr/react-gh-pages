import React, { useState, useEffect, useCallback } from 'react';

// TMDB API Configuration
const API_KEY = 'b6d3f18c82a0088b85d7072a1e16dfa5';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Movie Card Component
function MovieCard({ movie }) {
  const posterPath = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : null;
  
  const rating = movie.vote_average
    ? movie.vote_average.toFixed(1)
    : 'N/A';

  return (
    <div className="movie-card">
      {posterPath ? (
        <img src={posterPath} alt={movie.title} className="movie-poster" />
      ) : (
        <div className="no-poster">No Poster</div>
      )}
      <div className="movie-info">
        <div className="movie-title">{movie.title}</div>
        <div className="movie-details">
          <div className="release-date">Release Date: {movie.release_date || 'N/A'}</div>
          <div className="rating">Rating: {rating}</div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url;
      if (debouncedSearchQuery) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(debouncedSearchQuery)}&page=${currentPage}`;
      } else {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${currentPage}&sort_by=popularity.desc`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      let movieResults = data.results || [];
      
      // Apply sorting
      if (sortBy) {
        movieResults = sortMovies([...movieResults], sortBy);
      }
      
      setMovies(movieResults.slice(0, 20));
    } catch (err) {
      setError('Error loading movies. Please check your API key.');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, sortBy]);

  // Sort movies based on criteria
  const sortMovies = (movieList, sortOption) => {
    return movieList.sort((a, b) => {
      if (sortOption === 'release_date_asc') {
        const dateA = new Date(a.release_date || '1900-01-01');
        const dateB = new Date(b.release_date || '1900-01-01');
        return dateA - dateB;
      } else if (sortOption === 'release_date_desc') {
        const dateA = new Date(a.release_date || '1900-01-01');
        const dateB = new Date(b.release_date || '1900-01-01');
        return dateB - dateA;
      } else if (sortOption === 'rating_asc') {
        return (a.vote_average || 0) - (b.vote_average || 0);
      } else if (sortOption === 'rating_desc') {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      return 0;
    });
  };

  // Fetch movies when dependencies change
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value.trim());
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  // Handle page change
  const changePage = (direction) => {
    setCurrentPage((prev) => Math.max(1, prev + direction));
  };

  return (
    <div className="container">
      <header>
        <h1>Movie Explorer</h1>
        <div className="controls">
          <input
            type="text"
            id="searchInput"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <select id="sortSelect" value={sortBy} onChange={handleSort}>
            <option value="">Sort By</option>
            <option value="release_date_asc">Release Date (Asc)</option>
            <option value="release_date_desc">Release Date (Desc)</option>
            <option value="rating_asc">Rating (Asc)</option>
            <option value="rating_desc">Rating (Desc)</option>
          </select>
        </div>
      </header>

      <div id="movieGrid" className="movie-grid">
        {loading && <div className="loading">Loading movies...</div>}
        {error && <div className="loading">{error}</div>}
        {!loading && !error && movies.length === 0 && (
          <div className="loading">No movies found.</div>
        )}
        {!loading && !error && movies.length > 0 && (
          movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
        )}
      </div>

      <div className="pagination">
        <button id="prevBtn" className="page-btn" onClick={() => changePage(-1)}>
          Previous
        </button>
        <span id="pageInfo">Page {currentPage} of 48693</span>
        <button id="nextBtn" className="page-btn" onClick={() => changePage(1)}>
          Next
        </button>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Arial', sans-serif;
          background-color: #f0f0f0;
          color: #000000;
          min-height: 100vh;
        }

        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }

        header {
          text-align: center;
          margin-bottom: 0;
          background: linear-gradient(180deg, #3d4f5c 0%, #4a5f6f 100%);
          padding: 40px 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        h1 {
          font-size: 3.5rem;
          margin-bottom: 30px;
          color: #ffffff;
          font-weight: bold;
          letter-spacing: 1px;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        #searchInput {
          padding: 14px 20px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background-color: #ffffff;
          color: #000000;
          width: 320px;
          transition: border-color 0.3s;
        }

        #searchInput::placeholder {
          color: #888;
        }

        #searchInput:focus {
          outline: none;
          border-color: #5a9fd4;
        }

        #sortSelect {
          padding: 14px 20px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background-color: #ffffff;
          color: #000000;
          cursor: pointer;
          transition: border-color 0.3s;
          width: 200px;
        }

        #sortSelect:focus {
          outline: none;
          border-color: #5a9fd4;
        }

        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 30px;
          padding: 40px 30px;
          min-height: 400px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .movie-card {
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          border: 3px solid #e0e0e0;
        }

        .movie-poster {
          width: 100%;
          height: 360px;
          object-fit: cover;
          display: block;
          border: 3px solid #e0e0e0;
          border-bottom: none;
        }

        .movie-info {
          padding: 20px;
          text-align: center;
        }

        .movie-title {
          font-size: 1.4rem;
          font-weight: bold;
          margin-bottom: 15px;
          line-height: 1.3;
          min-height: 2.6em;
          color: #000000;
        }

        .movie-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 1rem;
          color: #000;
        }

        .release-date {
          color: #000000;
          font-weight: 400;
        }

        .rating {
          color: #000000;
          font-weight: 400;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 20px;
          margin-bottom: 40px;
          padding: 20px;
        }

        .page-btn {
          padding: 14px 35px;
          font-size: 16px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.2s;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .page-btn:hover {
          background-color: #357abd;
          transform: scale(1.05);
        }

        #pageInfo {
          font-size: 1.2rem;
          font-weight: 600;
          min-width: 180px;
          text-align: center;
          color: #000000;
        }

        .loading {
          text-align: center;
          font-size: 1.5rem;
          color: #4a90e2;
          padding: 50px;
        }

        .no-poster {
          width: 100%;
          height: 360px;
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .movie-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
            padding: 30px 20px;
          }

          h1 {
            font-size: 2.5rem;
          }

          .controls {
            flex-direction: column;
            align-items: center;
          }

          #searchInput {
            width: 100%;
            max-width: 400px;
          }

          #sortSelect {
            width: 100%;
            max-width: 400px;
          }

          .movie-poster {
            height: 280px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;