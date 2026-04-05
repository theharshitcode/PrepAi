// src/pages/Interview.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import toast, { Toaster } from 'react-hot-toast'

export default function Interview() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    const [questions, setQuestions] = useState(location.state?.questions || [])
    const [jobRole] = useState(location.state?.jobRole || '')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answerMode, setAnswerMode] = useState('text') // text | audio | video
    const [textAnswer, setTextAnswer] = useState('')
    const [recording, setRecording] = useState(false)
    const [mediaBlob, setMediaBlob] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [scores, setScores] = useState([])
    const [completed, setCompleted] = useState(false)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const videoRef = useRef(null)
    const streamRef = useRef(null)

    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex) / questions.length) * 100

    // Start recording
    const startRecording = async () => {
        try {
            const constraints = answerMode === 'video'
                ? { video: true, audio: true }
                : { audio: true }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (answerMode === 'video' && videoRef.current) {
                videoRef.current.srcObject = stream
            }

            chunksRef.current = []
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const mimeType = answerMode === 'video' ? 'video/webm' : 'audio/webm'
                const blob = new Blob(chunksRef.current, { type: mimeType })
                setMediaBlob(blob)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setRecording(true)
            toast.success('Recording started')
        } catch (err) {
            toast.error('Microphone/Camera access denied')
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop()
        setRecording(false)
        toast.success('Recording stopped — ready to submit')
    }

    const handleSubmit = async () => {
        if (answerMode === 'text' && !textAnswer.trim()) {
            return toast.error('Please enter your answer')
        }
        if ((answerMode === 'audio' || answerMode === 'video') && !mediaBlob) {
            return toast.error('Please record your answer first')
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('interviewId', id)
            formData.append('questionIndex', currentIndex)

            if (answerMode === 'text') {
                formData.append('answer', textAnswer)
            } else if (answerMode === 'audio') {
                formData.append('audio', mediaBlob, 'answer.webm')
            } else {
                formData.append('video', mediaBlob, 'answer.webm')
            }

            const res = await api.post('/interview/answer', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setScores(prev => [...prev, {
                index: currentIndex,
                score: res.data.score,
                feedback: res.data.feedback
            }])

            toast.success(`Score: ${res.data.score}/100`)

            if (res.data.interviewStatus === 'completed') {
                setCompleted(true)
                setTimeout(() => navigate(`/report/${id}`), 2000)
            } else {
                setCurrentIndex(prev => prev + 1)
                setTextAnswer('')
                setMediaBlob(null)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit answer')
        } finally {
            setSubmitting(false)
        }
    }

    if (completed) return (
        <div className="flex items-center justify-center h-screen flex-col gap-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-2xl font-bold text-indigo-600">Interview Completed!</h2>
            <p className="text-gray-500">Redirecting to your report...</p>
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
                        <p className="text-sm text-gray-500">{jobRole}</p>
                    </div>
                    <Badge variant="secondary">
                        {currentIndex + 1} / {questions.length}
                    </Badge>
                </div>

                {/* Progress */}
                <Progress value={progress} className="h-2" />

                {/* Question */}
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-gray-700">
                            Question {currentIndex + 1}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {currentQuestion?.question}
                        </p>
                    </CardContent>
                </Card>

                {/* Answer Mode Select */}
                <div className="flex gap-2">
                    {['text', 'audio', 'video'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => { setAnswerMode(mode); setMediaBlob(null) }}
                            className={`flex-1 py-2 px-3 rounded-lg border-2 capitalize text-sm font-medium transition-all ${
                                answerMode === mode
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-200 text-gray-500 hover:border-indigo-300'
                            }`}
                        >
                            {mode === 'text' ? 'Text' : mode === 'audio' ? 'Audio' : 'Video'}
                        </button>
                    ))}
                </div>

                {/* Answer Input */}
                <Card className="shadow-md">
                    <CardContent className="pt-6 space-y-4">
                        {answerMode === 'text' && (
                            <textarea
                                value={textAnswer}
                                onChange={e => setTextAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        )}

                        {answerMode === 'audio' && (
                            <div className="text-center space-y-3">
                                {!recording && !mediaBlob && (
                                    <Button onClick={startRecording} className="bg-indigo-600 hover:bg-indigo-700">
                                        Start Recording
                                    </Button>
                                )}
                                {recording && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"/>
                                            <span className="text-sm text-red-500">Recording...</span>
                                        </div>
                                        <Button onClick={stopRecording} variant="outline">
                                            Stop Recording
                                        </Button>
                                    </div>
                                )}
                                {mediaBlob && !recording && (
                                    <div className="space-y-2">
                                        <audio controls src={URL.createObjectURL(mediaBlob)} className="w-full"/>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setMediaBlob(null)}
                                        >
                                            Re-record
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {answerMode === 'video' && (
                            <div className="text-center space-y-3">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    className="w-full rounded-lg bg-black"
                                    style={{ display: recording ? 'block' : 'none' }}
                                />
                                {mediaBlob && !recording && (
                                    <video controls src={URL.createObjectURL(mediaBlob)} className="w-full rounded-lg"/>
                                )}
                                {!recording && !mediaBlob && (
                                    <Button onClick={startRecording} className="bg-indigo-600 hover:bg-indigo-700">
                                        Start Video
                                    </Button>
                                )}
                                {recording && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"/>
                                            <span className="text-sm text-red-500">Recording...</span>
                                        </div>
                                        <Button onClick={stopRecording} variant="outline">
                                            Stop Recording
                                        </Button>
                                    </div>
                                )}
                                {mediaBlob && (
                                    <Button variant="outline" size="sm" onClick={() => setMediaBlob(null)}>
                                        Re-record
                                    </Button>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Answer'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Previous scores */}
                {scores.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500">Previous answers</h3>
                        {scores.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-white rounded-lg px-4 py-2 shadow-sm">
                                <span className="text-sm text-gray-600">Q{s.index + 1}</span>
                                <Badge className={s.score >= 80 ? 'bg-green-100 text-green-700' : s.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                                    {s.score}/100
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}