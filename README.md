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
    npm install
    ```
3. **Run the Application:**:
    ```bash
    npm run dev
    ```

## Authors

Aivaras: [Profile](https://github.com/aivaras23)

## Other resources

No other resources.
