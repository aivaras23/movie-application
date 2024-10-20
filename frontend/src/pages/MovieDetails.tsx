// MovieDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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

export default function MovieDetails() {
  const { imdbID } = useParams<{ imdbID: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/movie/${imdbID}`);
        if (response.ok) {
          const data = await response.json();
          setMovie(data);
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }
    };

    fetchMovieDetails();
  }, [imdbID]);


  return (

      <div className="flex items-center justify-center bg-gradient-to-br from-indigo-300 to-purple-500 min-h-screen p-6">
    {movie ? (
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-4xl font-bold mb-4 text-center">{movie.Title}</h1>
        <div className="flex flex-col lg:flex-row items-center lg:space-x-6">
          <img
            src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image+Available"}
            alt={movie.Title}
            className="w-full lg:w-1/3 rounded-lg shadow-md mb-6 lg:mb-0"
          />
          <div className="flex flex-col text-sm lg:text-lg">
            <p className="font-semibold mb-1">Plot:</p>
            <p className='text-base px-1'>{movie.Plot}</p>
            <p className="font-semibold mb-1">Director:</p>
            <p className='text-base px-1'>{movie.Director}</p>
            <p className="font-semibold mb-1">Actors:</p>
            <p className='text-base px-1'>{movie.Actors}</p>
            <p className="font-semibold mb-1">IMDb Rating:</p>
            <p className='text-base px-1'>{movie.imdbRating}</p>
            <p className="font-semibold mb-1">Genre:</p>
            <p className='text-base px-1'>{movie.Genre}</p>
            <p className="font-semibold mb-1">Year:</p>
            <p className='text-base px-1'>{movie.Year}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <button className="px-6 py-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-300">
            Play Now
          </button>
          <button className="px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white font-semibold shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300">
            + Add to Watchlist
          </button>
          <a href="/home">
            <button className="px-6 py-3 bg-gradient-to-br from-purple-400 to-purple-700 rounded-lg text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300">
              Home Page
            </button>
          </a>
        </div>
      </div>
    ) : (
      <p className="text-center text-indigo-700 font-semibold text-2xl">Movie not found.</p>
    )}
  </div>
  );
}
