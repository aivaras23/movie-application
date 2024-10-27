const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const axios = require('axios')
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Configure multer to save files locally
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars'); // Folder where avatars will be stored
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Save with unique name
    }
});
const upload = multer({ storage: storage });


const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Registration route
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });

        const result = await pool.query(
            'INSERT INTO users (username, email, password, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, email, hashedPassword, false, verificationToken]
        );

        // Send verification email
        await transporter.sendMail({
            from: '"My App" <youremail@example.com>',
            to: email,
            subject: 'Verify Your Email',
            text: `Click this link to verify your email: http://localhost:5173/verify-email/${verificationToken}`,
            html: `<p>Click this link to verify your email: <a href="http://localhost:5173/verify-email/${verificationToken}">Verify Email</a></p>`
        });

        res.json({ success: true, message: 'User registered. Please check your email to verify your account.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

// Email verification route
app.get('/api/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await pool.query('UPDATE users SET is_verified = true, verification_token = null WHERE email = $1', [decoded.email]);
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        if (!user.rows[0].is_verified) {
            return res.status(400).json({ success: false, message: 'Please verify your email before logging in' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);

        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            userId: user.rows[0].id,
            username: user.rows[0].username,
            email: user.rows[0].email,
            avatar: user.rows[0].avatar
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error during login' });
    }
});

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

// Password reset request
app.post('/api/reset-password-request', async (req, res) => {
    console.log("Request body:", req.body)
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });

        await transporter.sendMail({
            from: '"My App" <youremail@example.com>',
            to: email,
            subject: 'Password Reset',
            text: `Click this link to reset your password: http://localhost:5173/reset-password/${resetToken}`,
            html: `<p>Click this link to reset your password: <a href="http://localhost:5173/reset-password/${resetToken}">Reset Password</a></p>`
        });

        res.json({ message: 'Password reset email sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error sending password reset email' });
    }
});

// Password reset
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.userId]);

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});


// Edit account route
app.get('/api/edit-account', verifyToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await pool.query('SELECT username, email, avatar FROM users WHERE id = $1', [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                username: user.rows[0].username,
                email: user.rows[0].email,
                avatar: user.rows[0].avatar,
            }
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ success: false, message: 'Error fetching user details' });
    }
});

// Edit account endpoint
app.put('/api/edit-account', verifyToken, upload.single('avatar'), async (req, res) => {
    const userId = req.user.userId;
    const { username, email, currentPassword, newPassword } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    try {
        // Fetch the user by ID from the database
        const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the username already exists (excluding the current user)
        const existingUsername = await pool.query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, userId]);
        if (existingUsername.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Username is already taken' });
        }

        const dbPassword = userQuery.rows[0].password;

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, dbPassword);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        // Update password if a new one is provided
        let updatedPassword = dbPassword;
        if (newPassword) {
            updatedPassword = await bcrypt.hash(newPassword, 10);
        }

        await pool.query(
            'UPDATE users SET username = $1, email = $2, password = $3, avatar = $4 WHERE id = $5',
            [username || userQuery.rows[0].username, email || userQuery.rows[0].email, updatedPassword, avatar, userId]
        );

        res.json({ success: true, message: 'Account updated successfully', avatar });
    } catch (err) {
        console.error('Error updating account:', err);
        res.status(500).json({ success: false, message: 'Error updating account' });
    }
});


app.get('/api/movie/:imdbID', async (req, res) => {
    const { imdbID } = req.params;
    const apiKey = process.env.OMDB_API_KEY;

    try {
        // Make a request to OMDB API using the imdbID
        const response = await axios.get(`http://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`);

        if (response.data.Response === "True") {
            // Return the movie details if found
            res.status(200).json(response.data);
        } else {
            // If the movie is not found, return a 404 status
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        console.error('Error fetching data from OMDB API:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})


const getAllMovies = async (req, res) => {
    try {
        const apiKey = process.env.OMDB_API_KEY;

        // Default search queries: harry potter, batman, superman, evil dead
        const searchQueries = req.query.search
            ? [req.query.search]
            : ['harry potter', 'superman', 'evil dead'];

        let allMovies = [];

        // Loop through each query
        for (const query of searchQueries) {
            let movies = [];
            let page = 1;

            // Fetch up to 30 movies in batches of 10
            while (movies.length < 30) {
                const response = await axios.get(`http://www.omdbapi.com/?s=${query}&page=${page}&apikey=${apiKey}`);

                if (response.data.Response === "True") {
                    movies = movies.concat(response.data.Search);

                    // Break if we’ve reached fewer than 10 results on the current page
                    if (response.data.Search.length < 10) break;
                } else {
                    console.error(`Error fetching movies for query "${query}": ${response.data.Error}`);
                    break;
                }
                page++;
            }

            // Slice results based on the range of 10-30 results
            const movieDetails = await Promise.all(
                movies.slice(0, Math.max(10, Math.min(movies.length, 30))).map(async (movie) => {
                    const detailedResponse = await axios.get(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
                    return detailedResponse.data;
                })
            );

            allMovies = allMovies.concat(movieDetails);
        }

        if (allMovies.length > 0) {
            res.status(200).json(allMovies);
        } else {
            res.status(404).json({ message: 'No movies found for the given queries.' });
        }
    } catch (error) {
        console.error('Error fetching data from OMDB API:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Route for fetching movies
app.get('/api/home', getAllMovies);


// Save favorite movie for the logged-in user
app.post('/api/favorites', verifyToken, async (req, res) => {
    const { imdbID, title, poster } = req.body;
    const userId = req.user.userId;

    try {
        const favoriteExists = await pool.query(
            'SELECT * FROM user_favorites WHERE user_id = $1 AND imdb_id = $2',
            [userId, imdbID]
        );

        if (favoriteExists.rows.length > 0) {
            return res.status(400).json({ message: 'Movie is already in your watchlist' });
        }

        await pool.query(
            'INSERT INTO user_favorites (user_id, imdb_id, title, poster) VALUES ($1, $2, $3, $4)',
            [userId, imdbID, title, poster]
        );

        res.json({ message: `${title} added to your watchlist!` });
    } catch (error) {
        console.error('Error adding movie to watchlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/favorites', verifyToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query('SELECT imdb_id AS "imdbID", title, poster FROM user_favorites WHERE user_id = $1', [userId]);
        res.json({ favorites: result.rows });
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to clear all favorite movies from the user's watchlist
app.delete('/api/favorites/clear', verifyToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        await pool.query('DELETE FROM user_favorites WHERE user_id = $1', [userId]);
        res.json({ message: 'Watchlist cleared successfully' });
    } catch (error) {
        console.error('Error clearing watchlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to remove a specific movie from the user's watchlist
app.delete('/api/favorites/:imdbID', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const { imdbID } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM user_favorites WHERE user_id = $1 AND imdb_id = $2 RETURNING *',
            [userId, imdbID]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Movie not found in your watchlist' });
        }

        res.json({ message: `Movie with imdbID ${imdbID} removed from your watchlist` });
    } catch (error) {
        console.error('Error removing movie from watchlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Add or change like/dislike vote, or remove vote if clicking the same action
app.post('/api/movies/:id/like', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'dislike'
    const userId = req.user.userId;
    const score = action === 'like' ? 10 : 1;

    try {
        const existingVote = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND movie_id = $2', [userId, id]);

        if (existingVote.rows.length > 0) {
            const currentScore = existingVote.rows[0].score;
            if ((currentScore === 10 && action === 'like') || (currentScore === 1 && action === 'dislike')) {
                // Remove vote
                await pool.query('DELETE FROM likes WHERE user_id = $1 AND movie_id = $2', [userId, id]);
                await pool.query('UPDATE movie_votes SET total_score = total_score - $1, total_votes = total_votes - 1 WHERE movie_id = $2', [currentScore, id]);
                return res.json({ message: 'Vote removed successfully' });
            } else {
                // Update vote
                await pool.query('UPDATE likes SET score = $1 WHERE user_id = $2 AND movie_id = $3', [score, userId, id]);
                await pool.query('UPDATE movie_votes SET total_score = total_score + $1 - $2 WHERE movie_id = $3', [score, currentScore, id]);
                return res.json({ message: 'Vote updated successfully' });
            }
        } else {
            // Insert new vote
            await pool.query('INSERT INTO likes (user_id, movie_id, score) VALUES ($1, $2, $3)', [userId, id, score]);
            await pool.query('INSERT INTO movie_votes (movie_id, total_score, total_votes) VALUES ($1, $2, 1) ON CONFLICT (movie_id) DO UPDATE SET total_score = movie_votes.total_score + $2, total_votes = movie_votes.total_votes + 1', [id, score]);
            return res.json({ message: 'Vote recorded successfully' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error voting for the movie' });
    }
});




// Get the current user's vote for a movie
app.get('/api/movies/:id/uservote', verifyToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const result = await pool.query('SELECT score FROM likes WHERE user_id = $1 AND movie_id = $2', [userId, id]);

        if (result.rows.length > 0) {
            const userVote = result.rows[0].score === 10 ? 'like' : 'dislike';
            return res.json({ userVote });
        } else {
            return res.json({ userVote: null }); // User hasn't voted yet
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching user vote' });
    }
});



// Get movie likes/dislikes summary
app.get('/api/movies/:id/ratings', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT total_score, total_votes FROM movie_votes WHERE movie_id = $1', [id]);
        if (result.rows.length > 0) {
            const { total_score, total_votes } = result.rows[0];
            res.json({ totalScore: total_score, totalVotes: total_votes });
        } else {
            res.json({ totalScore: 0, totalVotes: 0 });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching movie ratings' });
    }
});








// Backend: Posting a Comment with Cooldown (1 min)
app.post('/api/movies/:id/comment', verifyToken, async (req, res) => {
    const { id } = req.params; // Movie ID
    const { content } = req.body; // Comment content
    const userId = req.user.userId;
    const cooldownMinutes = 1;
    console.log(userId)

    try {
        // Check if the user has posted within the last minute
        const recentComment = await pool.query(
            'SELECT created_at FROM comments WHERE user_id = $1 AND movie_id = $2 ORDER BY created_at DESC LIMIT 1',
            [userId, id]
        );

        if (recentComment.rows.length > 0) {
            const lastCommentTime = new Date(recentComment.rows[0].created_at);
            const now = new Date();
            const timeDiff = (now - lastCommentTime) / 1000 / 60; // Difference in minutes

            if (timeDiff < cooldownMinutes) {
                return res.status(429).json({ message: `Please wait ${Math.ceil(cooldownMinutes - timeDiff)} minute(s) before commenting again.` });
            }
        }

        // Insert the new comment and return the newly inserted comment
        const newComment = await pool.query(
            'INSERT INTO comments (user_id, movie_id, content) VALUES ($1, $2, $3) RETURNING id, content, created_at',
            [userId, id, content]
        );

        return res.json({
            ...newComment.rows[0],
            userId: userId
        }); // Return the new comment details
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error posting comment' });
    }
});

// Updating a Comment (only for the comment owner):

app.put('/api/comments/:commentId', verifyToken, async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    try {
        const comment = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'You are not allowed to edit this comment.' });
        }

        await pool.query('UPDATE comments SET content = $1 WHERE id = $2', [content, commentId]);
        return res.json({ message: 'Comment updated successfully.' });
    } catch (err) {
        console.error('Error updating comment:', err);
        return res.status(500).json({ message: 'Error updating comment' });
    }
});

// Deleting a Comment (only for the comment owner):

app.delete('/api/comments/:commentId', verifyToken, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.userId;

    try {
        const comment = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.rows[0].user_id !== userId) {
            return res.status(403).json({ message: 'You are not allowed to delete this comment.' });
        }

        await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
        return res.json({ message: 'Comment deleted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error deleting comment' });
    }
});

// Upvoting/Downvoting Comments:

app.post('/api/comments/:commentId/vote', verifyToken, async (req, res) => {
    const { commentId } = req.params;
    const { action } = req.body;
    const userId = req.user.userId;

    try {
        const existingVote = await pool.query(
            'SELECT * FROM comment_votes WHERE user_id = $1 AND comment_id = $2',
            [userId, commentId]
        );

        console.log('Existing Vote:', existingVote.rows); // Debug existing vote

        if (existingVote.rows.length > 0) {
            const currentVote = existingVote.rows[0].vote_type;

            if (currentVote === action.replace('remove-', '')) {
                // Remove vote
                await pool.query('DELETE FROM comment_votes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
                return res.json({ message: 'Vote removed successfully' });
            } else {
                // Update vote
                await pool.query(
                    'UPDATE comment_votes SET vote_type = $1 WHERE user_id = $2 AND comment_id = $3',
                    [action.replace('switch-to-', ''), userId, commentId]
                );
                return res.json({ message: 'Vote updated successfully' });
            }
        } else {
            // Insert new vote
            await pool.query(
                'INSERT INTO comment_votes (user_id, comment_id, vote_type) VALUES ($1, $2, $3)',
                [userId, commentId, action.replace('switch-to-', '')]
            );
            return res.json({ message: 'Vote recorded successfully' });
        }
    } catch (err) {
        console.error('Error processing vote:', err); // More specific error logging
        return res.status(500).json({ message: 'Error voting for comment' });
    }
});



// Fetching Comments for a Movie:
app.get('/api/movies/:id/comments', async (req, res) => {
    const { id } = req.params;

    try {
        const comments = await pool.query(`
  SELECT 
    comments.id, 
    comments.content, 
    comments.created_at, 
    comments.updated_at, 
    users.username,
    users.avatar,
    comments.user_id, 
    COALESCE(SUM(CASE WHEN comment_votes.vote_type = 'upvote' THEN 1 ELSE 0 END), 0) AS upvotes,
    COALESCE(SUM(CASE WHEN comment_votes.vote_type = 'downvote' THEN 1 ELSE 0 END), 0) AS downvotes
  FROM comments 
  LEFT JOIN users ON comments.user_id = users.id 
  LEFT JOIN comment_votes ON comments.id = comment_votes.comment_id 
  WHERE comments.movie_id = $1 
  GROUP BY comments.id, users.username, users.avatar, comments.user_id
`, [id]);

        return res.json(comments.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching comments' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));