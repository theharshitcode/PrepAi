// controllers/interview.controller.js
require('dotenv').config();
const Groq = require('groq-sdk');
const Interview = require('../models/interview.model');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---- Whisper transcription via Groq ----
const transcribeAudio = async (fileUrl) => {
    // Cloudinary se file download karo
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Temp file banao
    const tempPath = `./temp_${Date.now()}.mp3`;
    fs.writeFileSync(tempPath, buffer);

    try {
        const transcription = await getGroqClient().audio.transcriptions.create({
            file: fs.createReadStream(tempPath),
            model: 'whisper-large-v3',
            language: 'en'
        });
        return transcription.text;
    } finally {
        // Temp file delete karo
        fs.unlinkSync(tempPath);
    }
};

// ---- Start Interview ----
exports.startInterview = async (req, res) => {
    const { jobRole, companyId } = req.body;

    if (!jobRole || !companyId) {
        return res.status(400).json({ message: 'jobRole and companyId are required' });
    }

    try {

        // Limit check karo
        const user = await require('../models/user.model').findById(req.user._id);

        if (!user.isPaid && user.interviewCount >= 3) {
            return res.status(403).json({
                message: 'Free limit reached. Please upgrade to continue.',
                interviewCount: user.interviewCount,
                isPaid: user.isPaid
            });
        }



        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert technical interviewer. Generate exactly 5 interview questions for the given job role.
                    Return ONLY a JSON array of strings. No explanation, no markdown, just the JSON array.
                    Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`
                },
                {
                    role: 'user',
                    content: `Generate 5 interview questions for: ${jobRole}`
                }
            ],
            temperature: 0.7,
        });

        const raw = completion.choices[0]?.message?.content || '[]';

        let questions;
        try {
            questions = JSON.parse(raw);
        } catch {
            return res.status(500).json({ message: 'AI response parse failed', raw });
        }

        const qna = questions.map(q => ({
            question: q,
            answer: null,
            audioUrl: null,
            videoUrl: null,
            aiScore: null,
            aiFeedback: null
        }));

        const interview = await Interview.create({
            candidate: req.user._id,
            company: companyId,
            jobRole,
            status: 'in-progress',
            qna
        });

        // Interview count increment karo
        await require('../models/user.model').findByIdAndUpdate(
            req.user._id,
            { $inc: { interviewCount: 1 } }
        );

        res.status(201).json({
            message: 'Interview started',
            interviewId: interview._id,
            jobRole: interview.jobRole,
            interviewCount: user.interviewCount + 1,   // updated count
            questions: interview.qna.map((q, i) => ({
                index: i,
                question: q.question
            }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ---- Submit Answer (text + audio + video) ----
exports.submitAnswer = async (req, res) => {
    // const { interviewId, questionIndex, answer } = req.body;

    // form-data mein body aur files alag aate hain
    const interviewId = req.body.interviewId?.trim();
    const questionIndex = req.body.questionIndex?.trim();
    const answer = req.body.answer?.trim();

    // console.log('Body:', req.body);        // debug
    // console.log('Files:', req.files);      // debug
    // console.log('User ID:', req.user._id);

    // // Ye add karo temporarily
    // console.log('User ID:', req.user._id);
    // console.log('Interview ID:', interviewId);

    try {
        const interview = await Interview.findOne({
            _id: interviewId,
            candidate: req.user._id
        });

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        if (interview.status === 'completed') {
            return res.status(400).json({ message: 'Interview already completed' });
        }

        const qIndex = parseInt(questionIndex);
        const qna = interview.qna[qIndex];
        if (!qna) {
            return res.status(400).json({ message: 'Invalid question index' });
        }

        let finalAnswer = answer || null;
        let audioUrl = null;
        let videoUrl = null;

        // Audio file aaya hai
        if (req.files?.audio?.[0]) {
            audioUrl = req.files.audio[0].path;          // Cloudinary URL
            interview.qna[qIndex].audioUrl = audioUrl;

            // Whisper se transcribe karo
            const transcript = await transcribeAudio(audioUrl);
            finalAnswer = transcript;
            console.log('Transcript:', transcript);
        }

        // Video file aaya hai
        if (req.files?.video?.[0]) {
            videoUrl = req.files.video[0].path;           // Cloudinary URL
            interview.qna[qIndex].videoUrl = videoUrl;

            // Agar audio nahi aaya toh video se bhi transcribe kar sakte hain
            if (!finalAnswer) {
                const transcript = await transcribeAudio(videoUrl);
                finalAnswer = transcript;
            }
        }

        // Kuch bhi answer nahi aaya
        if (!finalAnswer || finalAnswer.trim().length < 5) {
            return res.status(400).json({ message: 'Answer too short or empty — please try again' });
        }

        // AI scoring
        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert interviewer. Evaluate the candidate's answer.
                    Return ONLY a JSON object with this format:
                    {"score": <number 0-100>, "feedback": "<one line feedback>"}`
                },
                {
                    role: 'user',
                    content: `Question: ${qna.question}\nAnswer: ${finalAnswer}`
                }
            ],
            temperature: 0.3,
        });

        const rawEval = completion.choices[0]?.message?.content || '{}';
        let evaluation;
        try {
            evaluation = JSON.parse(rawEval);
        } catch {
            evaluation = { score: 50, feedback: 'Could not evaluate answer.' };
        }

        // Save everything
        interview.qna[qIndex].answer = finalAnswer;
        interview.qna[qIndex].aiScore = evaluation.score;
        interview.qna[qIndex].aiFeedback = evaluation.feedback;

        // Sab answers ho gaye?
        const allAnswered = interview.qna.every(q => q.answer !== null);
        if (allAnswered) {
            interview.status = 'completed';
            interview.completedAt = new Date();
        }

        await interview.save();

        res.json({
            questionIndex: qIndex,
            answer: finalAnswer,
            audioUrl,
            videoUrl,
            score: evaluation.score,
            feedback: evaluation.feedback,
            interviewStatus: interview.status,
            overallScore: allAnswered ? interview.overallScore : null
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ---- Get Report ----
exports.getReport = async (req, res) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            candidate: req.user._id
        }).populate('company', 'name industry');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        res.json({
            interviewId: interview._id,
            jobRole: interview.jobRole,
            company: interview.company,
            status: interview.status,
            overallScore: interview.overallScore,
            completedAt: interview.completedAt,
            qna: interview.qna.map((q, i) => ({
                index: i,
                question: q.question,
                answer: q.answer,
                audioUrl: q.audioUrl,
                videoUrl: q.videoUrl,
                score: q.aiScore,
                feedback: q.aiFeedback
            }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};