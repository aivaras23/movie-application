import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CommentSection from '../components/CommentSection';
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
  const [likes, setLikes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

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



    const handleAddToWatchlist = async () => {
      const token = localStorage.getItem('token'); // Get the token from local storage

        if (!token) {
          alert('You must be logged in to add to your Watchlist.');
          return;
        }

        try {
          const response = await fetch('http://localhost:5000/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
            body: JSON.stringify({
              imdbID: movie?.imdbID,
              title: movie?.Title,
              poster: movie?.Poster,
            }),
          });

          if (response.ok) {
            alert(`${movie?.Title} added to your Watchlist!`);
          } else {
            const data = await response.json();
            alert(data.message || 'Failed to add to Watchlist');
          }
        } catch (error) {
          console.error('Error adding movie to watchlist:', error);
          alert('An error occurred. Please try again.');
        }
  };

useEffect(() => {
  if (movie?.imdbID) {
    fetchRatings();
  }
}, [movie?.imdbID]);

const fetchRatings = async () => {
   if (!movie?.imdbID) return;
   try {
     const response = await axios.get(`http://localhost:5000/api/movies/${movie.imdbID}/ratings`);
     const { totalScore, totalVotes } = response.data;
     
     setLikes(totalScore || 0);
     setTotalVotes(totalVotes || 0);

     const avgRating = totalVotes > 0 ? (totalScore / totalVotes).toFixed(1) : '0.0';
     setAverageRating(parseFloat(avgRating));
   } catch (err) {
     console.error(err);
   }
};


const handleVote = async (action: 'like' | 'dislike') => {
  const token = localStorage.getItem('token');
  if (!token) return;

  // If user clicks the currently active vote (unlike or undislike)
  if (userVote === action) {
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${imdbID}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }), // Send the same action again to remove the vote
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(null); // Remove the vote from state
        fetchRatings(); // Refresh the rating summary
        console.log(data.message); // Optionally log the result
      }
    } catch (error) {
      console.error('Error removing vote:', error);
    }
  } else {
    // User is switching or adding a vote
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${imdbID}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(action); // Update the user's vote in the state
        fetchRatings(); // Refresh the rating summary
        console.log(data.message); // Optionally log the result
      }
    } catch (error) {
      console.error('Error voting for the movie:', error);
    }
  }
};

useEffect(() => {
  const fetchUserVote = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/movies/${imdbID}/uservote`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  fetchUserVote();
}, [imdbID]);

  const progressBarPercentage = totalVotes > 0 ? (likes / (totalVotes * 10)) * 100 : 0;
  const averageScore = totalVotes ? (likes / totalVotes).toFixed(1) : 0;


  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-indigo-300 to-purple-500 min-h-screen p-6">
  {movie ? (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Movie Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 text-center">{movie.Title}</h1>
          <div className="flex flex-col lg:flex-row items-center lg:space-x-6">
            <div className="flex flex-col items-center lg:w-1/4">
              <img
                src={
                  movie.Poster !== 'N/A'
                    ? movie.Poster
                    : 'https://via.placeholder.com/300x450?text=No+Image+Available'
                }
                alt={movie.Title}
                className="w-full max-w-xs rounded-lg shadow-md mb-6"
              />
            <div className="flex space-x-2">
                <button
                  onClick={() => handleVote('like')}
                  className={`flex items-center space-x-1 px-4 py-2 font-semibold rounded-lg ${
                    userVote === 'like' ? 'bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                >
                  <span>Like</span>
                </button>
                <button
                  onClick={() => handleVote('dislike')}
                    className={`flex items-center space-x-1 px-4 py-2 font-semibold rounded-lg ${
                    userVote === 'dislike' ? 'bg-red-700' : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                >
                  <span>Dislike</span>
                </button>
              </div>
                <div className="w-full bg-gray-300 rounded-full h-4 mt-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: `${progressBarPercentage}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm">Average Rating: {totalVotes > 0 ? averageScore : '0.0'} / 10 <span className='text-xs text-slate-300'>{totalVotes} voted.</span> </p>
            </div>
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
        <CommentSection movieId={`${movie.imdbID}`}/>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center space-y-4 mt-2">
      <h1 className="text-center text-indigo-700 font-semibold text-5xl mb-5">Loading...</h1>
      <span className="text-indigo-700 font-semibold text-1xl flex flex-col items-center space-y-2">
        Not Loading?
        <a className='mt-2' href="/home">
          <button className="px-6 py-3 bg-gradient-to-br from-purple-400 to-purple-700 rounded-lg text-white font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 w-full md:w-auto text-center">
            Home Page
          </button>
        </a>
      </span>
    </div>

  )}
</div>
  );
}
