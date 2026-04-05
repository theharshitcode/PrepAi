// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Register from '@/pages/Register'
import Login from '@/pages/Login'
import CompleteProfile from '@/pages/CompleteProfile'
import Dashboard from '@/pages/Dashboard'
import Interview from '@/pages/Interview'
import Report from '@/pages/Report'

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
    if (!user) return <Navigate to="/login" />
    return children
}

const ProfileRoute = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
    if (!user) return <Navigate to="/login" />
    if (user.isProfileComplete) return <Navigate to="/dashboard" />
    return children
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/complete-profile" element={
                    <ProfileRoute>
                        <CompleteProfile />
                    </ProfileRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/interview/:id" element={
                    <ProtectedRoute>
                        <Interview />
                    </ProtectedRoute>
                } />
                <Route path="/report/:id" element={
                    <ProtectedRoute>
                        <Report />
                    </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App