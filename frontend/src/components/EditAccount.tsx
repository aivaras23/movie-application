import React, { useState, useEffect } from 'react';
import axios from 'axios';
const baseUrl = import.meta.env.VITE_API_BASE_URL;

type Errors = {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
};

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

export default function EditAccount() {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        avatar: '', 
    });
    const [originalUserData, setOriginalUserData] = useState({
        username: '',
        email: '',
        avatar: '',
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [showModal, setShowModal] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null); // File to upload
    const [avatarPreview, setAvatarPreview] = useState(''); // Preview of the avatar
    const [showWatchList, setShowWatchlist] = useState(false);
    const [watchlist, setWatchlist] = useState<Movie[]>([]);

    useEffect(() => {
        // Fetch current user details
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get(`${baseUrl}/api/edit-account`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setUserData({
                    username: response.data.user.username,
                    email: response.data.user.email,
                    avatar: response.data.user.avatar || "https://via.placeholder.com/200x200", // Default avatar
                });
                // Also save the original data for cancel functionality
                setOriginalUserData({
                    username: response.data.user.username,
                    email: response.data.user.email,
                    avatar: response.data.user.avatar || "https://via.placeholder.com/200x200",
                });
                setAvatarPreview(response.data.user.avatar || "https://via.placeholder.com/200x200"); // initial avatar preview
            } catch (err) {
                console.error(err);
            }
        };
        fetchUserDetails();
    }, []);

    const validateInputs = () => {
        const newErrors: Errors = {};

        // Username validation
        if (userData.username.length < 3 || userData.username.length > 20) {
            newErrors.username = 'Username must be between 3 and 20 characters';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }

        // New Password validation (if provided)
        if (newPassword && newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters long';
        }
        if (newPassword && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const cancelChanges = () => {
        // Reset userData to the original values
        setUserData(originalUserData);
        setCurrentPassword('');
        setNewPassword('');
        setAvatarFile(null); // Clear avatar file
        setAvatarPreview(originalUserData.avatar); // Reset avatar preview
        setErrors({});
    };

    const handleAvatarRemove = () => {
        setAvatarPreview('https://via.placeholder.com/200x200');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);

            // Preview the avatar image
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file); // Convert file to base64 string
        }
    };

    const handleSaveChanges = async () => {
        if (!validateInputs()) return;

        try {
            // Use FormData to handle file uploads and regular form data
            const formData = new FormData();

            // Append the standard form data
            formData.append('username', userData.username);
            formData.append('email', userData.email);
            formData.append('currentPassword', currentPassword);
            if (newPassword) formData.append('newPassword', newPassword);

            // If the user uploaded a new avatar, append the file
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            console.log('Sending update request with formData');

            const response = await axios.put(`${baseUrl}/api/edit-account`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });

            
            // Update originalUserData with the new values after successful update
            setOriginalUserData({
                username: userData.username,
                email: userData.email,
                avatar: avatarPreview,
            });


            console.log(response.data.message);

            localStorage.setItem('username', userData.username);
            setShowModal(true); // Show the modal on successful update
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            setErrors((prev) => ({
                ...prev,
                currentPassword: 'Incorrect current password',
            }));
        }
    };


    useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setWatchlist(storedFavorites);
  }, []);

  const handleClearWatchlist = () => {
    localStorage.removeItem('favorites');
    setWatchlist([]);
  };
  
  const handleRemoveFromWatchlist = (imdbID: string) => {
  setWatchlist((prevWatchlist) => prevWatchlist.filter((movie) => movie.imdbID !== imdbID));
};

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-indigo-600">Your Account Details</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username:</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={userData.username}
                            onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                            className={`mt-1 p-2 w-full border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                        />
                    ) : (
                        <p className="mt-1 text-gray-700">{userData.username}</p>
                    )}
                    {errors.username && <span className="text-red-500 text-sm">{errors.username}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email:</label>
                    <p className="mt-1 text-gray-700">{userData.email}</p>
                </div>

                {isEditing && (
                    <>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700">Current Password:</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className={`mt-1 p-2 w-full border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                                required
                            />
                            {errors.currentPassword && <span className="text-red-500 text-sm">{errors.currentPassword}</span>}
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700">New Password (optional):</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`mt-1 p-2 w-full border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                            />
                            {errors.newPassword && <span className="text-red-500 text-sm">{errors.newPassword}</span>}
                        </div>

                        <div className="flex items-center">
                            <input
                                id="show-password"
                                name="show-password"
                                type="checkbox"
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                            />
                            <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">
                                Show password
                            </label>
                        </div>

                        {/* Avatar Upload */}
                        <div className="relative inline-block">
                          <label className="absolute top-2 left-2 text-sm font-medium text-white bg-gray-700 bg-opacity-70 px-2 py-1 rounded">Avatar:</label>
                        <img
                            className="w-48 h-48 p-2 border"
                            src={
                                avatarPreview.startsWith("http://localhost:5000") || avatarPreview.startsWith("data:image")
                                ? avatarPreview
                                : avatarPreview === "https://via.placeholder.com/200x200"
                                ? "https://via.placeholder.com/200x200"
                                : `http://localhost:5000${avatarPreview}`
                            }
                            alt="Avatar placeholder"
                        />

                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />

                            <label
                                htmlFor="avatar-upload"
                                className="mt-1 mr-4 inline-block py-2 px-4 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-200 cursor-pointer"
                            >
                                Upload
                            </label>
                            <button 
                                className="mt-1 inline-block py-2 px-4 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-200 cursor-pointer"
                                onClick={handleAvatarRemove}
                            >
                                Remove 
                            </button>
                        </div>
                    </>
                )}

                {isEditing ? (
                    <div className="flex space-x-4 mt-4">
                        <button
                            onClick={handleSaveChanges}
                            className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                            Save Changes
                        </button>
                        <button
                                onClick={() => {
                                setIsEditing(false);
                                cancelChanges();
                                }}
                            className="py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                        Edit Account
                    </button>
                )}
            </div>

            {/* Success Modal */}
            {showModal && (
             <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Success!</h3>
                        <p>Your account has been updated successfully.</p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showWatchList && (
                <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
                    <h2 className="text-xl font-bold mb-4 text-indigo-600">Watchlist</h2>
                    {watchlist.length === 0 ? (
                    <p className="text-gray-600">Your watchlist is empty.</p>
                    ) : (
                    <ul className="space-y-4">
                        {watchlist.map((movie) => (
                        <li key={movie.imdbID} className="flex justify-between items-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-lg shadow-md">
                            <div className="flex items-center space-x-4">
                            <img src={movie.Poster} alt={movie.Title} width="50" className="rounded" />
                            <span className="text-white font-semibold">{movie.Title}</span>
                            </div>
                            <button
                            onClick={() => handleRemoveFromWatchlist(movie.imdbID)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg shadow"
                            >
                            Delete
                            </button>
                        </li>
                        ))}
                    </ul>
                    )}
                    <div className="mt-4 flex justify-between">
                    <button
                        onClick={handleClearWatchlist}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition"
                    >
                        Clear Watchlist
                    </button>
                    <button
                        onClick={() => setShowWatchlist(false)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition"
                    >
                        Close
                    </button>
                    </div>
                </div>
                )}

            {!isEditing && (
            <div>
                <button
                    className="w-full mt-4 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    onClick={() => setShowWatchlist(true)}
                >
                    My Watchlist
                </button>
                <button
                    onClick={() => (window.location.href = '/home')}
                    className=" mt-2 py-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200"
                >
                    Home page
                </button>
            </div>
            )}
        </div>
    );
}

