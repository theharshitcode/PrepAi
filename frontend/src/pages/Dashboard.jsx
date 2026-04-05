// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast, { Toaster } from 'react-hot-toast'

export default function Dashboard() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [interviews, setInterviews] = useState([])
    const [paymentStatus, setPaymentStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [jobRole, setJobRole] = useState('')
    const [starting, setStarting] = useState(false)
    const [companies, setCompanies] = useState([])
    const [selectedCompany, setSelectedCompany] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [interviewsRes, paymentRes, profileRes] = await Promise.all([
                api.get('/interview/my-interviews'),
                api.get('/payment/status'),
                api.get('/auth/profile')
            ])
            setInterviews(interviewsRes.data)
            setPaymentStatus(paymentRes.data)

            // Companies populated objects hain ab
            setCompanies(profileRes.data.companies || [])
        } catch (err) {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleStartInterview = async (e) => {
        e.preventDefault()
        if (!jobRole) return toast.error('Please enter a job role')
        if (!selectedCompany) return toast.error('Please select a company')

        setStarting(true)
        try {
            const res = await api.post('/interview/start', {
                jobRole,
                companyId: selectedCompany
            })
            navigate(`/interview/${res.data.interviewId}`, {
                state: { questions: res.data.questions, jobRole: res.data.jobRole }
            })
        } catch (err) {
            if (err.response?.status === 403) {
                toast.error('Free limit reached! Please upgrade to continue.')
                navigate('/payment')
            } else {
                toast.error(err.response?.data?.message || 'Failed to start interview')
            }
        } finally {
            setStarting(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const getScoreColor = (score) => {
        if (score >= 80) return 'bg-green-100 text-green-700'
        if (score >= 60) return 'bg-yellow-100 text-yellow-700'
        return 'bg-red-100 text-red-700'
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Loading...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />

            {/* Navbar */}
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-600">PrepAI</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        {user?.name}
                    </span>
                    {paymentStatus?.isPaid ? (
                        <Badge className="bg-green-100 text-green-700">Pro</Badge>
                    ) : (
                        <Badge variant="secondary">
                            {paymentStatus?.remainingFree} free left
                        </Badge>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

                {/* Start Interview Card */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Start New Interview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleStartInterview} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Job Role</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Backend Developer, Data Scientist"
                                    value={jobRole}
                                    onChange={e => setJobRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Company</label>
                                <select
                                    value={selectedCompany}
                                    onChange={e => setSelectedCompany(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select a company</option>
                                    {companies.map(company => (
                                        <option key={company._id} value={company._id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                disabled={starting}
                            >
                                {starting ? 'Starting...' : 'Start Interview'}
                            </Button>
                        </form>

                        {/* Upgrade banner */}
                        {!paymentStatus?.isPaid && paymentStatus?.remainingFree === 0 && (
                            <div className="mt-4 p-4 bg-indigo-50 rounded-lg flex justify-between items-center">
                                <p className="text-sm text-indigo-700 font-medium">
                                    Free limit reached — Upgrade for unlimited interviews
                                </p>
                                <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                    onClick={() => navigate('/payment')}
                                >
                                    Upgrade
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Past Interviews */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Past Interviews</h2>
                    {interviews.length === 0 ? (
                        <Card className="shadow-sm">
                            <CardContent className="py-12 text-center text-gray-400">
                                No interviews yet — start your first one above!
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {interviews.map(interview => (
                                <Card
                                    key={interview._id}
                                    className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/report/${interview._id}`)}
                                >
                                    <CardContent className="py-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{interview.jobRole}</p>
                                            <p className="text-sm text-gray-400">
                                                {interview.company?.name} · {new Date(interview.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={getScoreColor(interview.overallScore)}>
                                                {interview.overallScore ? `${interview.overallScore}/100` : 'In progress'}
                                            </Badge>
                                            <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                                                {interview.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}