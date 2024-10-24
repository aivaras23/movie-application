import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Comment {
  id: number;
  username: string;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  userVoted: boolean; // Tracks whether the current user has voted
  userId: number; // To check if the comment belongs to the logged-in user
}

interface CommentSectionProps {
  movieId: string; // Identify which movie's comments are being displayed
}

export default function CommentSection({ movieId }: CommentSectionProps) {
  const username = localStorage.getItem('username');
  const [isLogged, setIsLogged] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [canPost, setCanPost] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLogged(true);
    }
    // Fetch comments from backend by movieId
    axios.get(`http://localhost:5000/api/movies/${movieId}/comments`).then((res) => setComments(res.data));
  }, [movieId]);

  // Post new comment with cooldown
  const handleCommentPost = () => {
    if (!newComment.trim() || !canPost) return;

    const token = localStorage.getItem('token');
    axios.post(
      `http://localhost:5000/api/movies/${movieId}/comment`,
      { content: newComment, movieId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((res) => {
      setComments([...comments, res.data]);
      setNewComment(''); // Clear input
      setCanPost(false); // Prevent immediate next post
      setTimeout(() => setCanPost(true), 60); // 1 minute cooldown
    });
  };

  // Upvote comment
  const handleUpvote = (id: number) => {
    const token = localStorage.getItem('token');
    axios
      .post(`http://localhost:5000/api/comments/${movieId}/vote`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setComments(comments.map(comment =>
          comment.id === id ? { ...comment, upvotes: comment.upvotes + 1, userVoted: true } : comment
        ));
      });
  };

  // Downvote comment
  const handleDownvote = (id: number) => {
    const token = localStorage.getItem('token');
    axios
      .post(`http://localhost:5000/api/comments/${id}/vote`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setComments(comments.map(comment =>
          comment.id === id ? { ...comment, downvotes: comment.downvotes + 1, userVoted: true } : comment
        ));
      });
  };

  // Delete your own comment
  const handleDeleteComment = (id: number) => {
    const token = localStorage.getItem('token');
    axios
      .delete(`http://localhost:5000/api/comments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setComments(comments.filter(comment => comment.id !== id));
      });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-10">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-indigo-700">Comments</h2>

      {isLogged ? (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-indigo-300 text-gray-700 focus:outline-none focus:border-indigo-500"
            disabled={!canPost}
          />
          <button
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300"
            onClick={handleCommentPost}
            disabled={!canPost}
          >
            {canPost ? "Post Comment" : "Please wait..."}
          </button>
        </div>
      ) : (
        <p className="text-red-500 mb-3">You must be logged in to post a comment.</p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-4">
            <img
              src="https://via.placeholder.com/40"
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{comment.username}</h3>
                <p className="text-sm text-gray-500">{comment.timestamp}</p>
              </div>
              <p className="text-gray-600">{comment.content}</p>
              
              <div className="flex items-center space-x-2 mt-2">
                <button
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-all duration-300"
                  onClick={() => handleUpvote(comment.id)}
                  disabled={comment.userVoted}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>{comment.upvotes}</span>
                </button>
                <button
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-all duration-300"
                  onClick={() => handleDownvote(comment.id)}
                  disabled={comment.userVoted}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{comment.downvotes}</span>
                </button>
             
                  <button
                    className="ml-4 text-red-600 hover:text-red-800 transition-all duration-300"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </button>
             
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


