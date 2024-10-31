# 🎬 Movie Application

## Overview

This is a full-stack movie application designed to provide a seamless movie exploration experience, complete with user authentication, movie search, and social interaction features. Users can explore a wide range of movies, search by title, sort by year, title, or IMDb rating, rate, and favorite movies, and interact with each other through comments, upvotes, and downvotes.

## Features

### Authentication and User Management

-   **Login & Registration**: Secure user authentication.
-   **Email Verification**: Users must verify their email addresses after registration.
-   **Password Reset**: Reset link sent via email if the user forgets their password.
-   **User Profile Management**: Users can update their username, password, and avatar, but the email remains locked for security.

### Movie Exploration

-   **Fetch Movies**: Movies are fetched from the OMDB API.
-   **Sorting Options**: Sort movies by year, title, or IMDb rating (ascending/descending).
-   **Search Functionality**: Search for specific movies by title.
-   **Individual Movie Pages**: Each movie has a dedicated page with the following features:
    -   **Upvote/Downvote**: Users can upvote or downvote a movie.
    -   **Add to Favorites**: Save favorite movies for easy access.

### Comments and Interactions

-   **Comment on Movies**: Users can leave comments on movie pages.
-   **Comment Interactions**:
    -   **Upvote/Downvote Comments**: Other users can upvote or downvote comments.
    -   **Edit and Delete Comments**: Comment owners can edit or delete their comments.
-   **Comment Restrictions**:
    -   **Rate Limits**: Users can post one comment per minute.

## Tech Stack

-   **Frontend**: React, TypeScript
-   **Backend**: Node.js, Express
-   **Database**: PostgreSQL
-   **API**: OMDB API

## Project Setup

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/aivaras23/movie-application.git
    cd movie-application
    ```
2. **Install Dependencies:**:
    ```bash
    cd frontend
    npm install
    cd backend
    npm install
    ```
3. **Run the Application:**:
    ```bash
    cd frontend
    npm run dev
    cd backend
    npm run dev
    ```
4. **Create a .env file in backend directory and add the following environment viariables:**
    ```bash
    DB_USER=your_db_user         # e.g., postgres
    DB_PASSWORD=your_db_password  # e.g., postgres
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=moviedb
    JWT_SECRET=your_jwt_secret
    OMDB_API_KEY=your_omdb_api_key
    ```
5. **Create a .env file in frontend directory and add the following environment viariables:**
    ```bash
        VITE_API_BASE_URL=http://localhost:5000
        VITE_YOUTUBE_API_KEY=your_youtube_api_key
    ```
6. **PostgreSQL Database Setup:**

    ```bash
         CREATE DATABASE moviedb

         CREATE TABLE users (
         id SERIAL PRIMARY KEY,
         username VARCHAR(50),
         email VARCHAR(255) UNIQUE,
         password VARCHAR(255),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         is_verified BOOLEAN,
         verification_token VARCHAR(255),
         avatar TEXT
         );

         CREATE TABLE user_favorites (
         id SERIAL PRIMARY KEY,
         user_id INT REFERENCES users(id),
         imdb_id VARCHAR(50) NOT NULL,
         title VARCHAR(255),
         poster TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         );

         CREATE TABLE likes (
         id SERIAL PRIMARY KEY,
         user_id INT REFERENCES users(id) ON DELETE CASCADE,
         movie_id VARCHAR(50) NOT NULL,
         score INT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         UNIQUE(user_id, movie_id)
         );

         CREATE TABLE movie_votes (
         movie_id VARCHAR(50) PRIMARY KEY,
         total_score INT NOT NULL DEFAULT 0,
         total_votes INT NOT NULL DEFAULT 0
         );

         CREATE TABLE comments (
         id SERIAL PRIMARY KEY,
         user_id INT REFERENCES users(id) ON DELETE CASCADE,
         movie_id VARCHAR(50) NOT NULL,
         content TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP,
         UNIQUE(user_id, movie_id, content)
         );

         CREATE TABLE comment_votes (
         id SERIAL PRIMARY KEY,
         user_id INT REFERENCES users(id) ON DELETE CASCADE,
         comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
         score INT NOT NULL
         vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         UNIQUE(user_id, comment_id)
         );
    ```

## Authors

Aivaras: [Profile](https://github.com/aivaras23)

## Other resources

No other resources.
