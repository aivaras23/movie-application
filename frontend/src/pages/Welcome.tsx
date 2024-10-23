// src/pages/Welcome.tsx
import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg z-10">
        <div className="text-center">
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Welcome to SnackFlix!
          </h2>
        </div>
        <div className="flex flex-col space-y-4">
          <Link
            to="/register"
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="py-2 px-4 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 focus:ring-offset-purple-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
          >
            Login
          </Link>
          <Link
          to="/home"
            className="py-2 px-4 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
            onClick={() => localStorage.setItem('guest', 'true')}
          >
            Proceed as guest
          </Link>
        </div>
      </div>
    </div>
  )
}
