import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
const baseUrl = import.meta.env.VITE_API_BASE_URL;


export default function VerifyEmail() {
  const [message, setMessage] = useState('Verifying your email...')
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/verify-email/${token}`)
        setMessage(response.data.message)
        setTimeout(() => navigate('/login'), 3000)
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setMessage(err.response?.data?.message || 'An error occurred')
        } else {
          setMessage('An unexpected error occurred')
        }
      } 
    }

    verifyEmail()
  }, [token, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
          <p className="mt-2 text-sm text-gray-600">{message} <br />
           You will be automatically redirected to the login page in few seconds.
          </p>
        </div>
      </div>
    </div>
  )
}