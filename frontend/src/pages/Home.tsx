import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
  const username = localStorage.getItem('guest') === 'true' ? 'Guest' : localStorage.getItem('username');
  const [isLogged, setIsLogged] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // For search input
  const [expandedMovies, setExpandedMovies] = useState<{ [key: string]: boolean }>({}); // for movie plot paragraphs 

  const [loading, setLoading] = useState(false);

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortCriterion, setSortCriterion] = useState<'Year' | 'imdbRating' | 'Title'>('Title');


  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null); // hold selected movie data

    useEffect(() => {
      // Set login status based on whether a token exists and user is not a guest
      const token = localStorage.getItem('token');
      const guest = localStorage.getItem('guest');
      if (token || guest === 'false') {
        setIsLogged(true);
      }
  }, []);

  const toggleShowMore = (imdbID: string) => {
    setExpandedMovies((prev) => ({
      ...prev,
      [imdbID]: !prev[imdbID], // Toggle the 'showMore' state for the specific movie
    }));
  };

  const sortMovies = (unsortedMovies: Movie[]) => {
  return [...unsortedMovies].sort((a, b) => {
      if (sortCriterion === 'Title') {
          return sortDirection === 'asc'
              ? a[sortCriterion].localeCompare(b[sortCriterion])
              : b[sortCriterion].localeCompare(a[sortCriterion]);
      } else {
          const valA = parseFloat(a[sortCriterion]);
          const valB = parseFloat(b[sortCriterion]);

          if (sortDirection === 'asc') {
              return valA < valB ? -1 : 1;
          } else {
              return valA > valB ? -1 : 1;
          }
      }
   });
  };


 useEffect(() => {
    const fetchMovies = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/home?search=${searchTerm}`);
            if (response.ok) {
                const data = await response.json();
                setMovies(data);
                setLoading(false);
            } 
        } catch (error) {
            console.error('An error occurred while fetching movies.');
        }
    };
    fetchMovies();
}, [searchTerm]); // Re-fetch movies when searchTerm changes


  // Sort when the sortDirection or sortCriterion changes
  useEffect(() => {
        if (movies.length > 0) {
            const sortedMovies = sortMovies(movies);
            setMovies(sortedMovies); // Only sort without modifying the state outside sorting
        }
    }, [sortDirection, sortCriterion]);


 const handlePosterClick = (movie: Movie) => {
    setSelectedMovie(movie); // Set the whole movie object as selected
  };

  const closeModal = () => {
    setSelectedMovie(null); // Close the modal
  };



  return (
    <div className='bg-indigo-100'>
      <header className="w-full bg-gradient-to-br from-blue-500 to-purple-600 p-6">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
    <h1 className="text-2xl md:text-4xl font-bold text-white text-center md:text-left">
      Welcome, {username}!
    </h1>
    <div className="flex flex-col md:flex-row gap-3 md:gap-5 w-full md:w-auto items-center">
      {isLogged ? (
        <>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              localStorage.removeItem('username');
              localStorage.removeItem('email');
              localStorage.removeItem('avatar');
              localStorage.removeItem('guest'); // Also remove guest status
              window.location.href = '/login';
            }}
            className="w-full md:w-auto py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200 text-center"
          >
            Logout
          </button>
          <button
            onClick={() => (window.location.href = '/edit-account')}
            className="w-full md:w-auto py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200 text-center"
          >
            Account
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => {
              localStorage.removeItem('guest');
              window.location.href = '/login'}}
            className="w-full md:w-auto py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 text-center"
          >
            Sign in
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('guest')
              window.location.href = '/register'}
            }
            className="w-full md:w-auto py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200 text-center"
          >
            Sign up
          </button>
        </>
      )}
    </div>
  </div>
</header>

<div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-start md:items-center bg-indigo-100 p-4 rounded-lg shadow-md">
    <select
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full md:w-auto"
    >
        <option value="">Select Year</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
    </select>

    <input
        type="text"
        placeholder="Search for movies..."
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-grow bg-indigo-50 text-indigo-900 placeholder-indigo-400 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm w-full md:w-auto"
    />

      <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
          <select
              onChange={(e) => setSortCriterion(e.target.value as 'Year' | 'imdbRating' | 'Title')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md w-full md:w-auto"
          >
              <option value="Title">Title</option>
              <option value="Year">Year</option>
              <option value="imdbRating">IMDb Rating</option>
          </select>

          <button
              onClick={() => setSortDirection('asc')}
              className={`py-2 px-4 rounded-md w-full md:w-auto ${sortDirection === 'asc' ? 'bg-indigo-500' : 'bg-gray-300'} text-white`}
          >
              Ascending
          </button>

          <button
              onClick={() => setSortDirection('desc')}
              className={`py-2 px-4 rounded-md w-full md:w-auto ${sortDirection === 'desc' ? 'bg-indigo-500' : 'bg-gray-300'} text-white`}
          >
              Descending
          </button>
      </div>
  </div>

          <div className='flex justify-center items-center mx-auto bg-indigo-100 p-4 rounded-lg shadow-md '>
              <h1 className='text-center text-indigo-900 font-semibold text-2xl'>Our recommended movies</h1>
          </div>


          <div className="container mx-auto p-4">
            {loading && <p className="text-center text-indigo-700">Loading movies...</p>}
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
                   onClick={() => handlePosterClick(movie)}
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
                  <p className="text-sm">Type: {movie.Type}</p>
                  <p className="text-sm font-semibold">IMDb Rating: {movie.imdbRating}</p>
                </div>
              </div>
              ))}
          </div>
        </div>
              
              {selectedMovie && (
                movies.map((movie) => (
                <div
                  key={movie.imdbID}
                  className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75" onClick={closeModal}>
                    <div className="relative bg-gradient-to-br from-indigo-200 to-purple-400 p-4 rounded-md">
                      <button
                        onClick={closeModal}
                        className="absolute  w-12 top-0 right-2 m-3 text-3xl text-white bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-colors duration-300 shadow-lg"
                      >
                        &times;
                      </button>
                      <img
                        src={selectedMovie.Poster}
                        alt="Movie Poster"
                        className="max-w-full max-h-screen"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-center space-x-1 mt-4">
              
                        <Link to={`/movie/${selectedMovie.imdbID}`}>
                          <button className="px-6 py-3 text-white bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg font-semibold shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 w-64">
                            View movie
                          </button>
                      </Link>
                      </div>
                    </div>
                </div>
                 ))
            )}

    </div>
    
  )
}


