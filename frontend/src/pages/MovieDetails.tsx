import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  Genre: string;
  Plot: string;
  Director: string;
  Actors: string;
  imdbRating: string;
}

interface YouTubeVideo {
  videoId: string;
}

export default function MovieDetails() {
  const { imdbID } = useParams<{ imdbID: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [trailer, setTrailer] = useState<YouTubeVideo | null>(null);

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

    // Check if the user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsLogged(true);
    }

    fetchMovieDetails();
  }, [imdbID]);

  useEffect(() => {
    const fetchTrailer = async (movieTitle: string) => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            movieTitle + ' trailer'
          )}&type=video&key=${apiKey}`
        );
        const data = await response.json();
        if (data.items.length > 0) {
          setTrailer({ videoId: data.items[0].id.videoId });
        }
      } catch (error) {
        console.error('Error fetching trailer:', error);
      }
    };

    if (movie) {
      fetchTrailer(movie.Title);
    }
  }, [movie]);



    const handleAddToWatchlist = () => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorite = {
      Title: movie?.Title,
      imdbID: movie?.imdbID,
      Poster: movie?.Poster
    };
    // Check if movie is already in the watchlist
    if (!storedFavorites.some((fav: Movie) => fav.imdbID === movie?.imdbID)) {
      storedFavorites.push(newFavorite);
      localStorage.setItem('favorites', JSON.stringify(storedFavorites));
      alert(`${movie?.Title} added to your Watchlist!`);
    } else {
      alert(`${movie?.Title} is already in your Watchlist!`);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-indigo-300 to-purple-500 min-h-screen p-6">
  {movie ? (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Movie Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 text-center">{movie.Title}</h1>
          <div className="flex flex-col lg:flex-row items-center lg:space-x-6">
            <img
              src={
                movie.Poster !== 'N/A'
                  ? movie.Poster
                  : 'https://via.placeholder.com/300x450?text=No+Image+Available'
              }
              alt={movie.Title}
              className="w-full lg:w-1/3 rounded-lg shadow-md mb-6 lg:mb-0"
            />
            <div className="flex flex-col text-sm lg:text-lg w-full lg:w-2/3 space-y-4">
              <div>
                <p className="font-semibold">Plot:</p>
                <p className="text-base px-1">{movie.Plot}</p>
              </div>
              <div>
                <p className="font-semibold">Director:</p>
                <p className="text-base px-1">{movie.Director}</p>
              </div>
              <div>
                <p className="font-semibold">Actors:</p>
                <p className="text-base px-1">{movie.Actors}</p>
              </div>
              <div>
                <p className="font-semibold">IMDb Rating:</p>
                <p className="text-base px-1">{movie.imdbRating}</p>
              </div>
              <div>
                <p className="font-semibold">Genre:</p>
                <p className="text-base px-1">{movie.Genre}</p>
              </div>
              <div>
                <p className="font-semibold">Year:</p>
                <p className="text-base px-1">{movie.Year}</p>
              </div>
            </div>
          </div>

          {/* Trailer Section */}
          {trailer ? (
            <div className="mt-6 flex justify-center">
              <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${trailer.videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${movie.Title} Trailer`}
              ></iframe>
            </div>
          ) : (
            <p className="text-center text-white mt-4">Trailer not available.</p>
          )}

          <div className="mt-6 flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4">
            <button className="px-6 py-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 w-full md:w-auto text-center">
              Play Now
            </button>
            <button
            onClick={handleAddToWatchlist}
            className="px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white font-semibold shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 w-full md:w-auto text-center">
              + Add to Watchlist
            </button>
            <a href="/home">
              <button className="px-6 py-3 bg-gradient-to-br from-purple-400 to-purple-700 rounded-lg text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 w-full md:w-auto text-center">
                Home Page
              </button>
            </a>
          </div>
        </div>

        {/* Comment Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-indigo-700">Comments</h2>

          {isLogged ? (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Add a comment..."
                className="w-full px-4 py-2 rounded-lg border border-indigo-300 text-gray-700 focus:outline-none focus:border-indigo-500"
              />
              <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300">
                Post Comment
              </button>
            </div>
          ) : (
            <p className="text-red-500 mb-3">You must be logged in to post a comment.</p>
          )}

          {/* Comment List */}
          <div className="space-y-4">
            {/* Comment Item */}
            <div className="flex items-start space-x-4">
              <img
                src="https://via.placeholder.com/40"
                alt="User avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Username</h3>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <p className="text-gray-600">
                  This is a comment about the movie. Great movie, really enjoyed it!
                </p>
                {/* Upvote/Downvote */}
                <div className="flex items-center space-x-2 mt-2">
                  <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span>12</span>
                  </button>
                  <button className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>3</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    <p className="text-center text-indigo-700 font-semibold text-2xl">Movie not found.</p>
  )}
</div>
  );
}
