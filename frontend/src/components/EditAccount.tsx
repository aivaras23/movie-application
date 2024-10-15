import React, { useState, useEffect } from 'react';
import axios from 'axios';
const baseUrl = import.meta.env.VITE_API_BASE_URL;

type Errors = {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
};

export default function EditAccount() {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
    });
    const [originalUserData, setOriginalUserData] = useState({
        username: '',
        email: '',
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<{
        username?: string;
        currentPassword?: string;
        newPassword?: string;
    }>({
        username: undefined,
        currentPassword: undefined,
        newPassword: undefined,
    });
    const [showModal, setShowModal] = useState(false);

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
                });
                // Also save the original data for cancel functionality
                setOriginalUserData({
                    username: response.data.user.username,
                    email: response.data.user.email,
                });
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
        setErrors({});
    };

    const handleSaveChanges = async () => {
        if (!validateInputs()) return;

        try {
            const requestData = {
                username: userData.username,
                email: userData.email,
                currentPassword,
                newPassword,
            };

            console.log('Sending update request with data:', requestData);

            const response = await axios.put(
                `${baseUrl}/api/edit-account`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log(response.data.message);
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
                    </>
                )}
            </div>

            <div className="mt-6 flex justify-between">
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="py-2 w-full bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-200"
                    >
                        Edit
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleSaveChanges}
                            className="py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-200"
                        >
                            Save Changes
                        </button>
                        <button
                           onClick={() => {
                            setIsEditing(false);
                            cancelChanges();}}
                            className="py-2 px-4 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-200"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>

            {/* Modal for Success */}
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

            {!isEditing && (
                <button
                    onClick={() => (window.location.href = '/home')}
                    className=" mt-2 py-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200"
                >
                    Home page
                </button>
            )}
        </div>
    );
}

