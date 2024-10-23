import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = () => {
  const token = localStorage.getItem('token')
  const isGuest = localStorage.getItem('guest') === 'true' // Check guest status
  
  if (!token && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute