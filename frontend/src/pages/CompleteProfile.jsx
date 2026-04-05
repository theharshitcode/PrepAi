// src/pages/CompleteProfile.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast, { Toaster } from 'react-hot-toast'

export default function CompleteProfile() {
    const navigate = useNavigate()
    const { user, login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCompanies, setSelectedCompanies] = useState([])
    const [selectedRole, setSelectedRole] = useState('')

    // Companies search
    useEffect(() => {
        const delay = setTimeout(async () => {
            try {
                const res = await api.get(`/companies/search?q=${searchQuery}`)
                setCompanies(res.data)
            } catch {
                toast.error('Failed to load companies')
            }
        }, 400)
        return () => clearTimeout(delay)
    }, [searchQuery])

    const toggleCompany = (company) => {
        const exists = selectedCompanies.find(c => c._id === company._id)
        if (exists) {
            setSelectedCompanies(selectedCompanies.filter(c => c._id !== company._id))
        } else {
            setSelectedCompanies([...selectedCompanies, company])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedRole) return toast.error('Please select a role')
        if (selectedCompanies.length === 0) return toast.error('Please select at least one company')

        setLoading(true)
        try {
            const res = await api.post('/auth/complete-profile', {
                role: selectedRole,
                companies: selectedCompanies.map(c => c._id)
            })
            login(res.data.user, localStorage.getItem('token'))
            toast.success('Profile completed!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to complete profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <Toaster position="top-right" />
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-indigo-600">
                        Complete Your Profile
                    </CardTitle>
                    <CardDescription>
                        This can only be set once — choose carefully
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Role</label>
                            <div className="flex gap-3">
                                {['candidate', 'admin'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setSelectedRole(role)}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 capitalize font-medium transition-all ${
                                            selectedRole === role
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                                : 'border-gray-200 text-gray-500 hover:border-indigo-300'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Company search */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Companies</label>
                            <input
                                type="text"
                                placeholder="Search companies... (e.g. Tata, Infosys)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                            {/* Search results */}
                            {companies.length > 0 && (
                                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                                    {companies.map(company => {
                                        const isSelected = selectedCompanies.find(c => c._id === company._id)
                                        return (
                                            <div
                                                key={company._id}
                                                onClick={() => toggleCompany(company)}
                                                className={`px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors ${
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

                            {/* Selected companies */}
                            {selectedCompanies.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedCompanies.map(company => (
                                        <Badge
                                            key={company._id}
                                            variant="secondary"
                                            className="cursor-pointer bg-indigo-100 text-indigo-700 hover:bg-red-100 hover:text-red-600"
                                            onClick={() => toggleCompany(company)}
                                        >
                                            {company.name} ×
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Complete Profile'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}