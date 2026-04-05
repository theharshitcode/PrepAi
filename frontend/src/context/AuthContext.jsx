// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            api.get('/auth/profile')
                .then(res => setUser(res.data))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

const login = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData)
}

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            localStorage.removeItem('token')
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)