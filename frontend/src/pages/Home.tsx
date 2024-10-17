import React, { useEffect, useState } from 'react';

interface Movie {
    Title: string;
    Year: string;
    imdbID: string;
    Type: string;
    Poster: string;
    Genre: string,
    Plot: string,
    Director: string,
    Actors: string,
    imdbRating: string
}

export default function Home() {
  const username = localStorage.getItem('username')
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // For search input
  const [expandedMovies, setExpandedMovies] = useState<{ [key: string]: boolean }>({}); // for movie plot paragraphs 

  const toggleShowMore = (imdbID: string) => {
    setExpandedMovies((prev) => ({
      ...prev,
      [imdbID]: !prev[imdbID], // Toggle the 'showMore' state for the specific movie
    }));
  };

  useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/home?search=${searchTerm}`);
                if (response.ok) {
                    const data = await response.json();
                    setMovies(data);
                } else {
                    console.error('Error fetching movies:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        };

        fetchMovies();
    }, [searchTerm]); // Re-fetch movies when searchTerm changes

  return (
    <div className='bg-indigo-100'>
    <header className="w-full bg-gradient-to-br from-blue-500 to-purple-600 p-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">
          Welcome, {username}!
        </h1>
        <div className="flex gap-5">
        <button
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('userId')
            localStorage.removeItem('username')
            localStorage.removeItem('email')
            window.location.href = '/login'
          }}
          className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200"
        >
          Logout
        </button>
        <button
            onClick={() => (window.location.href = '/edit-account')}
            className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200">
        Edit Account
        </button>
        </div>
      </div>
    </header>

          <div className="flex space-x-4 items-center bg-indigo-100 p-4 rounded-lg shadow-md">
                <select
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    <option value="">All</option>
                    <option value="Movies">Movies</option>
                    <option value="TV Shows">TV Shows</option>
                </select>
                <input
                    type="text"
                    placeholder="Search for movies..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow bg-indigo-50 text-indigo-900 placeholder-indigo-400 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                />
          </div>

          <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <div
                    key={movie.imdbID}
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                <img
                   src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image+Available"}
                  alt={movie.Title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 text-white">
                  <h3 className="text-xl font-semibold mb-2">{movie.Title}</h3>
                  <p className="text-sm">Year: {movie.Year}</p>
                  <p className="text-sm">Genre: {movie.Genre}</p>
                    <div className="relative">
                      <p className={`text-sm transition-all duration-300 ${expandedMovies[movie.imdbID] ? 'line-clamp-none' : 'line-clamp-2'}`}>
                        Plot: {movie.Plot}
                      </p>
                      <button
                        onClick={() => toggleShowMore(movie.imdbID)}
                        className="text-indigo-300 hover:text-indigo-100 mb-2 focus:outline-none"
                      >
                      {expandedMovies[movie.imdbID] ? 'Show Less' : 'Read More'}
                      </button>
                  </div>
                  <p className="text-sm">Director: {movie.Director}</p>
                  <p className="text-sm">Actors: {movie.Actors}</p>
                  <p className="text-sm font-semibold">IMDb Rating: {movie.imdbRating}</p>
                </div>
              </div>
              ))}
          </div>
        </div>



    </div>
  )
}

