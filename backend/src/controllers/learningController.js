import crypto from 'crypto';
import db from '../db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to get Gemini Client or return null
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const createLearningSession = async (req, res) => {
  const { topic } = req.body;
  const userId = req.user.id;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  try {
    const client = getGeminiClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    let studyContent = '';
    let quizQuestions = [];

    if (client) {
      const model = client.getGenerativeModel({ model: modelName });
      
      // 1. Generate study notes
      const notesPrompt = `
        You are an expert professor in Event Coordination and Management.
        Provide a concise, premium lecture/study notes about the topic: "${topic}".
        Include 3-4 distinct sub-sections covering best practices, risk considerations, and real-world examples.
        Format it nicely using markdown.
      `;
      const notesResponse = await model.generateContent(notesPrompt);
      studyContent = notesResponse.response.text();

      // 2. Generate quiz questions (JSON format)
      const quizPrompt = `
        Based on the study notes, generate a multiple-choice quiz of 5 questions.
        Return a single JSON array where each object has this exact structure:
        {
          "question": "The question?",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answerIndex": 0,
          "explanation": "Explanation of correct choice"
        }
        Do not add code blocks or wrappers. Return raw JSON.
      `;
      const quizResponse = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: quizPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      try {
        quizQuestions = JSON.parse(quizResponse.response.text());
      } catch (err) {
        // Fallback parse
        const match = quizResponse.response.text().match(/```json\s*([\s\S]*?)\s*```/) || quizResponse.response.text().match(/```\s*([\s\S]*?)\s*```/);
        quizQuestions = JSON.parse(match ? match[1].trim() : quizResponse.response.text().trim());
      }
    } else {
      // Mock Fallback
      studyContent = `
# Event Management Guide: ${topic}

Learning how to excel at event operations requires mastering coordination workflows, team management, and risk minimization.

## 1. Key Objectives & Milestones
Establish strict deadlines for vendor quotes and guest invitations. Always ensure layout approvals are finalized 14 days in advance.

## 2. Resource Management
Establish an estimated budget allocations. Factor in seating, equipment, decor, and AV support as separate line-items.

## 3. Communication Protocols
Send clear templates to speakers, vendors, and sponsors. Maintain transparent dashboards where organizers can view blockers and dependencies.
      `;

      quizQuestions = [
        {
          question: `In standard event planning, when should layout approvals be finalized?`,
          options: ["1 day before the event", "14 days before the event", "On the morning of the event", "After all vendors are fully paid"],
          answerIndex: 1,
          explanation: "Finalizing layout plans 14 days in advance ensures proper room setup and allows time for decor tweaks."
        },
        {
          question: `Which of the following describes a dependency blocker?`,
          options: ["A vendor who charges too much", "A predecessor task that halts subsequent stages until completed", "An attendee who has not confirmed dietary needs", "A presentation slide deck formatted in widescreen"],
          answerIndex: 1,
          explanation: "Dependency blockers are precursor tasks that halt downstream actions until they are resolved."
        },
        {
          question: `How should estimated budget categories be mapped?`,
          options: ["As a single lump sum", "As separate line-items covering AV, seating, catering, and decor", "Ignored until the post-event invoice is received", "Split equally between attendees"],
          answerIndex: 1,
          explanation: "Granular categories prevent overruns and highlight exactly where money is spent."
        },
        {
          question: `What is the role of an organizer invitation draft?`,
          options: ["To delay attendance approvals", "To gather guest registration, confirmations, and dietary details", "To negotiate pricing with sponsors", "To request design permissions"],
          answerIndex: 1,
          explanation: "Invitations communicate dates and agendas while capturing guest details for budget/logistics planning."
        },
        {
          question: `Which is the best post-event review metric?`,
          options: ["Total count of task modifications", "Attendee feedback and checklist completion ratios", "Total word count in contingency plan drafts", "Speed of cleaning the venue"],
          answerIndex: 1,
          explanation: "Feedback metrics combined with checklist completion ratios indicate true organizational success."
        }
      ];
    }

    // Save learning session in DB
    const sessionId = crypto.randomUUID();
    await db.query(
      'INSERT INTO learning_sessions (id, user_id, topic, content) VALUES ($1, $2, $3, $4)',
      [sessionId, userId, topic, studyContent]
    );

    // Save quiz in DB
    const quizId = crypto.randomUUID();
    await db.query(
      'INSERT INTO quizzes (id, session_id, questions) VALUES ($1, $2, $3)',
      [quizId, sessionId, JSON.stringify(quizQuestions)]
    );

    res.status(201).json({
      sessionId,
      quizId,
      topic,
      studyContent,
      questions: quizQuestions.map(({ question, options }) => ({ question, options })) // hide answers/explanations initially
    });
  } catch (error) {
    console.error('Create learning session error:', error);
    res.status(500).json({ error: 'Failed to create learning session: ' + error.message });
  }
};

export const getLearningHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const sessionsResult = await db.query(
      `SELECT ls.id as session_id, ls.topic, ls.created_at as session_date, 
              qr.score, qr.total_questions, qr.created_at as quiz_date
       FROM learning_sessions ls
       LEFT JOIN quizzes q ON q.session_id = ls.id
       LEFT JOIN quiz_results qr ON qr.quiz_id = q.id AND qr.user_id = $1
       WHERE ls.user_id = $1
       ORDER BY ls.created_at DESC`,
      [userId]
    );

    res.status(200).json(sessionsResult.rows);
  } catch (error) {
    console.error('Get learning history error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteLearningSession = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    // Check ownership
    const sessionCheck = await db.query('SELECT user_id FROM learning_sessions WHERE id = $1', [id]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Learning session not found.' });
    }

    if (sessionCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied. You do not own this session.' });
    }

    await db.query('DELETE FROM learning_sessions WHERE id = $1', [id]);
    res.status(200).json({ message: 'Learning session and associated quiz records deleted.' });
  } catch (error) {
    console.error('Delete learning session error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const saveQuizResult = async (req, res) => {
  const { quizId, score, total_questions, answers } = req.body;
  const userId = req.user.id;

  if (!quizId || score === undefined || !total_questions || !answers) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // Check if quiz exists
    const quizCheck = await db.query('SELECT questions FROM quizzes WHERE id = $1', [quizId]);
    if (quizCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    const resultId = crypto.randomUUID();
    await db.query(
      'INSERT INTO quiz_results (id, user_id, quiz_id, score, total_questions, answers) VALUES ($1, $2, $3, $4, $5, $6)',
      [resultId, userId, quizId, score, total_questions, JSON.stringify(answers)]
    );

    // Retrieve original quiz with explanations to display to the user
    const questions = JSON.parse(quizCheck.rows[0].questions);

    res.status(201).json({
      message: 'Quiz result saved successfully.',
      score,
      total_questions,
      detailedResults: questions
    });
  } catch (error) {
    console.error('Save quiz result error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
