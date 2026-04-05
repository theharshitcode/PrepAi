// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast, { Toaster } from 'react-hot-toast'

export default function Settings() {
    const navigate = useNavigate()
    const { user, login } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')

    const [name, setName] = useState(user?.name || '')
    const [jobPreference, setJobPreference] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [savingPassword, setSavingPassword] = useState(false)

    const [companies, setCompanies] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [savingCompanies, setSavingCompanies] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    useEffect(() => {
        const delay = setTimeout(() => {
            fetchCompanySearch(searchQuery)
        }, 400)
        return () => clearTimeout(delay)
    }, [searchQuery])

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile')
            setName(res.data.name)
            setJobPreference(res.data.jobPreference || '')
            setCompanies(res.data.companies || [])
        } catch {
            toast.error('Failed to load profile')
        }
    }

    const fetchCompanySearch = async (query) => {
        try {
            const res = await api.get(`/companies/search?q=${query}&t=${Date.now()}`)
            setSearchResults(res.data)
        } catch {
            toast.error('Failed to search companies')
        }
    }

    const toggleCompany = (company) => {
        const exists = companies.find(c => c._id === company._id)
        if (exists) {
            setCompanies(companies.filter(c => c._id !== company._id))
        } else {
            setCompanies([...companies, company])
        }
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        if (!name.trim()) return toast.error('Name is required')
        setSavingProfile(true)
        try {
            const res = await api.put('/auth/update-profile', { name, jobPreference })
            login(res.data.user, localStorage.getItem('token'))
            toast.success('Profile updated!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setSavingProfile(false)
        }
    }

    const handleSavePassword = async (e) => {
        e.preventDefault()
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('Passwords do not match')
        }
        if (passwords.newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters')
        }
        setSavingPassword(true)
        try {
            await api.put('/auth/update-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            })
            toast.success('Password updated!')
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password')
        } finally {
            setSavingPassword(false)
        }
    }

    const handleSaveCompanies = async () => {
        if (companies.length === 0) return toast.error('Select at least one company')
        setSavingCompanies(true)
        try {
            const res = await api.put('/auth/update-companies', {
                companies: companies.map(c => c._id)
            })
            login(res.data.user, localStorage.getItem('token'))
            toast.success('Companies updated!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update companies')
        } finally {
            setSavingCompanies(false)
        }
    }

    const tabs = ['profile', 'password', 'companies']

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-600">PrepAI</h1>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </Button>
            </nav>

            <div className="max-w-2xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>

                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                                activeTab === tab
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="space-y-1">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Email</Label>
                                    <Input
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-gray-50 text-gray-400"
                                    />
                                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                                </div>
                                <div className="space-y-1">
                                    <Label>App Role</Label>
                                    <Input
                                        value={user?.role || ''}
                                        disabled
                                        className="bg-gray-50 text-gray-400 capitalize"
                                    />
                                    <p className="text-xs text-gray-400">Role cannot be changed</p>
                                </div>
                                <div className="space-y-1">
                                    <Label>Job Preference</Label>
                                    <select
                                        value={jobPreference}
                                        onChange={e => setJobPreference(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">-- Select job role --</option>
                                        <option value="Backend Developer">Backend Developer</option>
                                        <option value="Frontend Developer">Frontend Developer</option>
                                        <option value="Full Stack Developer">Full Stack Developer</option>
                                        <option value="Data Scientist">Data Scientist</option>
                                        <option value="Data Analyst">Data Analyst</option>
                                        <option value="DevOps Engineer">DevOps Engineer</option>
                                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                                        <option value="Mobile Developer">Mobile Developer</option>
                                        <option value="UI/UX Designer">UI/UX Designer</option>
                                        <option value="Product Manager">Product Manager</option>
                                        <option value="QA Engineer">QA Engineer</option>
                                        <option value="Cloud Engineer">Cloud Engineer</option>
                                        <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                                        <option value="Business Analyst">Business Analyst</option>
                                    </select>
                                    <p className="text-xs text-gray-400">Dashboard mein auto-fill hoga</p>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSavePassword} className="space-y-4">
                                <div className="space-y-1">
                                    <Label>Current Password</Label>
                                    <Input
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Confirm New Password</Label>
                                    <Input
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        placeholder="Repeat new password"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                    disabled={savingPassword}
                                >
                                    {savingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Companies Tab */}
                {activeTab === 'companies' && (
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Target Companies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchResults.length > 0 && (
                                <div
                                    className="border border-gray-200 rounded-lg overflow-y-auto bg-white"
                                    style={{ maxHeight: '200px' }}
                                >
                                    {searchResults.map(company => {
                                        const isSelected = companies.find(c => c._id === company._id)
                                        return (
                                            <div
                                                key={company._id}
                                                onClick={() => toggleCompany(company)}
                                                className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                                                    isSelected ? 'bg-indigo-50' : ''
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{company.name}</p>
                                                    <p className="text-xs text-gray-400">{company.industry}</p>
                                                </div>
                                                {isSelected && (
                                                    <span className="text-indigo-600 text-xs font-medium">Selected</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {companies.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {companies.map(company => (
                                        <Badge
                                            key={company._id}
                                            className="cursor-pointer bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-600"
                                            onClick={() => toggleCompany(company)}
                                        >
                                            {company.name} ×
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <Button
                                onClick={handleSaveCompanies}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                disabled={savingCompanies}
                            >
                                {savingCompanies ? 'Saving...' : 'Save Companies'}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}