import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Comment {
  id: number;
  username: string;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  userUpvoted: boolean;
  userDownvoted: boolean; // Tracks whether the current user has voted
  user_id: number; // To check if the comment belongs to the logged-in user
  avatar: string; 
}

interface CommentSectionProps {
  movieId: string; // Identify which movie's comments are being displayed
}

const COOLDOWN_SECONDS = 1;

export default function CommentSection({ movieId }: CommentSectionProps) {
  const username = localStorage.getItem('username');
  const storedUserId = parseInt(localStorage.getItem('userId')!, 10);
  const [isLogged, setIsLogged] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [canPost, setCanPost] = useState(true);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<number | null>(null); // Track editing comment ID
  const [editedCommentContent, setEditedCommentContent] = useState<string>('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLogged(true);
    }
    // Fetch comments from backend by movieId
    axios.get(`http://localhost:5000/api/movies/${movieId}/comments`).then((res) => {
      console.log('Comments:', res.data); 
      setComments(res.data)});

    const lastPostTime = localStorage.getItem('lastPostTime');
    if (lastPostTime) {
      const elapsed = Math.floor((Date.now() - parseInt(lastPostTime)) / 1000);
      if (elapsed < COOLDOWN_SECONDS) {
        startCooldown(COOLDOWN_SECONDS - elapsed);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Clear the interval when the component unmounts
      }
    };

  }, [movieId]);

  

    // Start cooldown timer
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    setCanPost(false);

    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setCanPost(true);
           localStorage.removeItem('lastPostTime');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
        const postedComment = {
        ...res.data,
        avatar: localStorage.getItem('avatar'),
        username,
        upvotes: 0,
        downvotes: 0,
        userVoted: false,
         user_id: storedUserId,
        };
      setComments((prevComments) => [postedComment, ...prevComments]); 
      setNewComment(''); // Clear input
      localStorage.setItem('lastPostTime', Date.now().toString()); // Save the time of posting
      startCooldown(COOLDOWN_SECONDS)
    });
  };

const handleVote = async (id: number, type: 'upvote' | 'downvote') => {
  const token = localStorage.getItem('token');
  const currentComment = comments.find((comment) => comment.id === id);
  if (!currentComment) return;

  let action = '';
  if (type === 'upvote') {
    action = currentComment.userUpvoted ? 'remove-upvote' : currentComment.userDownvoted ? 'switch-to-upvote' : 'upvote';
  } else if (type === 'downvote') {
    action = currentComment.userDownvoted ? 'remove-downvote' : currentComment.userUpvoted ? 'switch-to-downvote' : 'downvote';
  }

  try {
    await axios.post(
      `http://localhost:5000/api/comments/${id}/vote`,
      { action },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setComments((comments) =>
      comments.map((comment) => {
        if (comment.id === id) {
          const updatedUpvotes =
            action === 'upvote' || action === 'switch-to-upvote'
              ? Number(comment.upvotes) + 1
              : action === 'remove-upvote'
              ? Number(comment.upvotes) - 1
              : Number(comment.upvotes);
          const updatedDownvotes =
            action === 'downvote' || action === 'switch-to-downvote'
              ? Number(comment.downvotes) - 1
              : action === 'remove-downvote'
              ? Number(comment.downvotes) + 1
              : Number(comment.downvotes);
          return {
            ...comment,
            upvotes: updatedUpvotes,
            downvotes: updatedDownvotes,
            userUpvoted: action === 'upvote' || action === 'switch-to-upvote',
            userDownvoted: action === 'downvote' || action === 'switch-to-downvote',
          };
        }
        return comment;
      })
    );
  } catch (error) {
    console.error("Error handling vote:", error);
  }
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

    const handleEditComment = (id: number) => {
      const commentToEdit = comments.find((comment) => comment.id === id);
      if (commentToEdit) {
        setIsEditing(id);
        setEditedCommentContent(commentToEdit.content);
      }
    };

  const saveEditedComment = (id: number) => {
    const token = localStorage.getItem('token');
    axios
      .put(
        `http://localhost:5000/api/comments/${id}`,
        { content: editedCommentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setComments((comments) =>
          comments.map((comment) => (comment.id === id ? { ...comment, content: editedCommentContent } : comment))
        );
        setIsEditing(null);
        setEditedCommentContent('');
      })
      .catch((error) => {
        console.error('Error editing comment:', error);
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
            {canPost ? "Post Comment" : `Please wait... ${cooldown}s`}
          </button>
        </div>
      ) : (
        <p className="text-red-500 mb-3">You must be logged in to post a comment.</p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-4">
            <img
              src={`http://localhost:5000${comment.avatar}` || "https://via.placeholder.com/40"}
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{comment.username}</h3>
                <p className="text-sm text-gray-500">{comment.timestamp}</p>
              </div>

              {isEditing === comment.id ? (
                <div>
                  <input
                    type="text"
                    value={editedCommentContent}
                    onChange={(e) => setEditedCommentContent(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-indigo-300 text-gray-700 focus:outline-none focus:border-indigo-500"
                  />
                  <button onClick={() => saveEditedComment(comment.id)} className="text-green-600 ml-2">
                    Save
                  </button>
                  <button onClick={() => setIsEditing(null)} className="text-red-600 ml-2">
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">{comment.content}</p>
              )}
              
              <div className="flex items-center space-x-2 mt-2">
                <button
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-all duration-300"
                  onClick={() => handleVote(comment.id, 'upvote')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>{comment.upvotes}</span>
                </button>
                <button
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-all duration-300"
                  onClick={() => handleVote(comment.id, 'downvote')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{comment.downvotes}</span>
                </button>
             
             <div className="flex items-center space-x-2">
               {comment.user_id === storedUserId && (
                <>
                  <button
                    className="text-blue-600 hover:text-blue-800 transition-all duration-300"
                    onClick={() => handleEditComment(comment.id)}
                  >
                    Edit
                  </button>
                  <button
                  className="text-red-600 hover:text-red-800 transition-all duration-300"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Delete
                </button>
                </>
               )}
              </div>
             
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


