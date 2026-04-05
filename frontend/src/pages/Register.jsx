// src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import toast, { Toaster } from 'react-hot-toast'

export default function Register() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Register.jsx mein handleSubmit mein navigate fix karo
            const res = await api.post('/auth/register', form)
            login(res.data.user, res.data.token)
            toast.success('Account created successfully!')
            navigate('/complete-profile') // naya user — hamesha complete-profile pe
        } catch (err) {
            const errors = err.response?.data?.errors
            if (errors) {
                errors.forEach(e => toast.error(e.message))
            } else {
                toast.error(err.response?.data?.message || 'Registration failed')
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
                        Create your account to start practicing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Harshit Saxena"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
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
                                placeholder="Min 6 characters"
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
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                                Login
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}