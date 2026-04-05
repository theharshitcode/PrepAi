// src/pages/Report.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import toast, { Toaster } from 'react-hot-toast'

export default function Report() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/interview/report/${id}`)
            .then(res => setReport(res.data))
            .catch(() => toast.error('Failed to load report'))
            .finally(() => setLoading(false))
    }, [id])

    const getScoreColor = (score) => {
        if (score >= 80) return 'bg-green-100 text-green-700'
        if (score >= 60) return 'bg-yellow-100 text-yellow-700'
        return 'bg-red-100 text-red-700'
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Loading report...</p>
        </div>
    )

    if (!report) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500">Report not found</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <Toaster position="top-right" />
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-indigo-600">PrepAI</h1>
                        <p className="text-sm text-gray-500">Interview Report</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>

                {/* Overall Score */}
                <Card className="shadow-md">
                    <CardContent className="pt-6 text-center space-y-3">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Overall Score</p>
                        <div className="text-6xl font-bold text-indigo-600">
                            {report.overallScore}
                            <span className="text-2xl text-gray-400">/100</span>
                        </div>
                        <Progress value={report.overallScore} className="h-3" />
                        <div className="flex justify-center gap-3 pt-2">
                            <Badge className={getScoreColor(report.overallScore)}>
                                {report.overallScore >= 80 ? 'Excellent' : report.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                            </Badge>
                            <Badge variant="secondary">{report.jobRole}</Badge>
                            <Badge variant="outline">{report.company?.name}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Q&A Breakdown */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Question Breakdown</h2>
                    {report.qna.map((q, i) => (
                        <Card key={i} className="shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-sm font-medium text-gray-500">
                                        Question {i + 1}
                                    </CardTitle>
                                    <Badge className={getScoreColor(q.score)}>
                                        {q.score}/100
                                    </Badge>
                                </div>
                                <p className="text-base font-semibold">{q.question}</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1 font-medium">Your Answer</p>
                                    <p className="text-sm text-gray-700">{q.answer}</p>
                                    {q.audioUrl && (
                                        <audio controls src={q.audioUrl} className="w-full mt-2"/>
                                    )}
                                    {q.videoUrl && (
                                        <video controls src={q.videoUrl} className="w-full mt-2 rounded-lg"/>
                                    )}
                                </div>
                                <div className="bg-indigo-50 rounded-lg p-3">
                                    <p className="text-xs text-indigo-400 mb-1 font-medium">AI Feedback</p>
                                    <p className="text-sm text-indigo-700">{q.feedback}</p>
                                </div>
                                <Progress value={q.score} className="h-1.5" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-8">
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => navigate('/dashboard')}
                    >
                        Practice Again
                    </Button>
                </div>
            </div>
        </div>
    )
}