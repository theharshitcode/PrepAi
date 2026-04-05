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

    const [questions] = useState(location.state?.questions || [])
    const [jobRole] = useState(location.state?.jobRole || '')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answerMode, setAnswerMode] = useState('text')
    const [textAnswer, setTextAnswer] = useState('')
    const [recording, setRecording] = useState(false)
    const [mediaBlob, setMediaBlob] = useState(null)
    const [mediaMimeType, setMediaMimeType] = useState('')
    const [mediaUrl, setMediaUrl] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [scores, setScores] = useState([])
    const [completed, setCompleted] = useState(false)
    const [muted, setMuted] = useState(false)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const liveVideoRef = useRef(null)

    const currentQuestion = questions[currentIndex]
    const progress = (currentIndex / questions.length) * 100

    const speakQuestion = (text) => {
        if (muted) return
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = 0.9
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
    }

    const toggleMute = () => {
        if (!muted) window.speechSynthesis.cancel()
        setMuted(prev => !prev)
    }

    useEffect(() => {
        if (currentQuestion?.question) speakQuestion(currentQuestion.question)
        return () => window.speechSynthesis.cancel()
    }, [currentIndex, muted])

    // Cleanup mediaUrl on unmount
    useEffect(() => {
        return () => {
            if (mediaUrl) URL.revokeObjectURL(mediaUrl)
        }
    }, [mediaUrl])

    const startRecording = async () => {
        try {
            // Cleanup previous
            if (mediaUrl) {
                URL.revokeObjectURL(mediaUrl)
                setMediaUrl(null)
            }
            setMediaBlob(null)

            const constraints = answerMode === 'video'
                ? { video: { facingMode: 'user' }, audio: true }
                : { audio: true }

            const stream = await navigator.mediaDevices.getUserMedia(constraints)

            // Live preview
            if (answerMode === 'video' && liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream
                liveVideoRef.current.play()
            }

            chunksRef.current = []

            // Best supported format choose karo
            let mimeType = ''
            if (answerMode === 'video') {
                if (MediaRecorder.isTypeSupported('video/mp4')) {
                    mimeType = 'video/mp4'
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                    mimeType = 'video/webm;codecs=vp9,opus'
                } else {
                    mimeType = 'video/webm'
                }
            } else {
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4'
                } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    mimeType = 'audio/webm;codecs=opus'
                } else {
                    mimeType = 'audio/webm'
                }
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType })
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop())
                if (liveVideoRef.current) {
                    liveVideoRef.current.srcObject = null
                }
                const blob = new Blob(chunksRef.current, { type: mimeType })
                const url = URL.createObjectURL(blob)
                setMediaBlob(blob)
                setMediaMimeType(mimeType)
                setMediaUrl(url)
            }

            mediaRecorder.start(100) // 100ms chunks
            setRecording(true)
            toast.success('Recording started')
        } catch (err) {
            console.error(err)
            toast.error('Microphone/Camera access denied')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        setRecording(false)
        toast.success('Recording stopped')
    }

    const resetRecording = () => {
        if (mediaUrl) URL.revokeObjectURL(mediaUrl)
        setMediaBlob(null)
        setMediaUrl(null)
        setMediaMimeType('')
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
            formData.append('questionIndex', String(currentIndex))

            if (answerMode === 'text') {
                formData.append('answer', textAnswer)
            } else if (answerMode === 'audio') {
                const ext = mediaMimeType.includes('mp4') ? 'mp4' : 'webm'
                formData.append('audio', mediaBlob, `answer.${ext}`)
            } else {
                const ext = mediaMimeType.includes('mp4') ? 'mp4' : 'webm'
                formData.append('video', mediaBlob, `answer.${ext}`)
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
                resetRecording()
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit answer')
        } finally {
            setSubmitting(false)
        }
    }

    if (completed) return (
        <div className="flex items-center justify-center h-screen flex-col gap-4">
            <div className="text-5xl">🎉</div>
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMute}
                            className={`p-2 rounded-full transition-all text-lg ${
                                muted
                                    ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-indigo-50'
                            }`}
                            title={muted ? 'Unmute AI voice' : 'Mute AI voice'}
                        >
                            {muted ? '🔇' : '🔊'}
                        </button>
                        <Badge variant="secondary">
                            {currentIndex + 1} / {questions.length}
                        </Badge>
                    </div>
                </div>

                {/* Progress */}
                <Progress value={progress} className="h-2" />

                {/* Question */}
                <Card className="shadow-md border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-500 uppercase tracking-wide">
                            Question {currentIndex + 1} of {questions.length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-gray-800">
                            {currentQuestion?.question}
                        </p>
                    </CardContent>
                </Card>

                {/* Answer Mode Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {[
                        { key: 'text', label: 'Text' },
                        { key: 'audio', label: 'Audio' },
                        { key: 'video', label: 'Video' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setAnswerMode(key)
                                resetRecording()
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                answerMode === key
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Answer Input */}
                <Card className="shadow-md">
                    <CardContent className="pt-6 space-y-4">

                        {/* TEXT */}
                        {answerMode === 'text' && (
                            <textarea
                                value={textAnswer}
                                onChange={e => setTextAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        )}

                        {/* AUDIO */}
                        {answerMode === 'audio' && (
                            <div className="space-y-4">
                                {/* Not recording, no blob */}
                                {!recording && !mediaUrl && (
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl">
                                            🎙
                                        </div>
                                        <p className="text-sm text-gray-500">Click to start recording your answer</p>
                                        <Button
                                            onClick={startRecording}
                                            className="bg-indigo-600 hover:bg-indigo-700 px-8"
                                        >
                                            Start Recording
                                        </Button>
                                    </div>
                                )}

                                {/* Recording */}
                                {recording && (
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                            <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse" />
                                        </div>
                                        <p className="text-sm text-red-500 font-medium">Recording in progress...</p>
                                        <Button onClick={stopRecording} variant="outline" className="border-red-300 text-red-500 hover:bg-red-50">
                                            Stop Recording
                                        </Button>
                                    </div>
                                )}

                                {/* Recorded — playback */}
                                {!recording && mediaUrl && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-gray-600">Preview your answer:</p>
                                        <audio
                                            controls
                                            src={mediaUrl}
                                            className="w-full"
                                            preload="auto"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetRecording}
                                            className="w-full"
                                        >
                                            Re-record
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VIDEO */}
                        {answerMode === 'video' && (
                            <div className="space-y-4">
                                {/* Not recording, no blob */}
                                {!recording && !mediaUrl && (
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl">
                                            🎥
                                        </div>
                                        <p className="text-sm text-gray-500">Click to start video recording</p>
                                        <Button
                                            onClick={startRecording}
                                            className="bg-indigo-600 hover:bg-indigo-700 px-8"
                                        >
                                            Start Video
                                        </Button>
                                    </div>
                                )}

                                {/* Live preview — mirror effect for selfie */}
                                {recording && (
                                    <div className="space-y-3">
                                        <video
                                            ref={liveVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full rounded-xl bg-black"
                                            style={{ transform: 'scaleX(-1)' }}
                                        />
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-sm text-red-500 font-medium">Recording...</span>
                                        </div>
                                        <Button
                                            onClick={stopRecording}
                                            variant="outline"
                                            className="w-full border-red-300 text-red-500 hover:bg-red-50"
                                        >
                                            Stop Recording
                                        </Button>
                                    </div>
                                )}

                                {/* Recorded playback — no mirror */}
                                {!recording && mediaUrl && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-gray-600">Preview your answer:</p>
                                        <video
                                            controls
                                            src={mediaUrl}
                                            className="w-full rounded-xl"
                                            preload="auto"
                                            style={{ transform: 'scaleX(1)' }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={resetRecording}
                                            className="w-full"
                                        >
                                            Re-record
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleSubmit}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Answer →'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Previous scores */}
                {scores.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Previous Answers</h3>
                        {scores.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Question {s.index + 1}</span>
                                    <p className="text-xs text-gray-400 mt-0.5">{s.feedback}</p>
                                </div>
                                <Badge className={`ml-3 shrink-0 ${
                                    s.score >= 80
                                        ? 'bg-green-100 text-green-700'
                                        : s.score >= 60
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                }`}>
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