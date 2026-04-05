// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ email: '', password: '' })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    // Login.jsx mein handleSubmit fix karo
const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
        const res = await api.post('/auth/login', form)
        login(res.data.user, res.data.token)
        toast.success('Welcome back!')

        // Profile complete check
        if (res.data.user.isProfileComplete) {
            navigate('/dashboard')        // already complete — dashboard pe jao
        } else {
            navigate('/complete-profile') // complete nahi — profile fill karo
        }
    } catch (err) {
        const errors = err.response?.data?.errors
        if (errors) {
            errors.forEach(e => toast.error(e.message))
        } else {
            toast.error(err.response?.data?.message || 'Login failed')
        }
    } finally {
        setLoading(false)
    }
}

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Toaster position="top-right" />
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-indigo-600">
                        PrepAI
                    </CardTitle>
                    <CardDescription>
                        Login to continue your practice
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="harshit@gmail.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                        <p className="text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
                                Register
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}