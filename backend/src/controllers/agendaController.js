import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const agendaSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start_time: z.string(), // ISO string
  end_time: z.string(), // ISO string
  speaker: z.string().optional()
});

export const addAgendaSession = async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = agendaSchema.parse(req.body);
    const sessionId = crypto.randomUUID();

    await db.query(
      'INSERT INTO agenda_sessions (id, event_id, title, description, start_time, end_time, speaker) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        sessionId,
        eventId,
        validatedData.title,
        validatedData.description || '',
        validatedData.start_time,
        validatedData.end_time,
        validatedData.speaker || ''
      ]
    );

    const newSession = await db.query('SELECT * FROM agenda_sessions WHERE id = $1', [sessionId]);
    res.status(201).json(newSession.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Add agenda session error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getAgendaSessions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await db.query('SELECT * FROM agenda_sessions WHERE event_id = $1 ORDER BY start_time ASC', [eventId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get agenda sessions error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateAgendaSession = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = agendaSchema.partial().parse(req.body);

    const sessionResult = await db.query('SELECT * FROM agenda_sessions WHERE id = $1', [id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agenda session not found.' });
    }

    const session = sessionResult.rows[0];
    const title = validatedData.title !== undefined ? validatedData.title : session.title;
    const description = validatedData.description !== undefined ? validatedData.description : session.description;
    const start_time = validatedData.start_time !== undefined ? validatedData.start_time : session.start_time;
    const end_time = validatedData.end_time !== undefined ? validatedData.end_time : session.end_time;
    const speaker = validatedData.speaker !== undefined ? validatedData.speaker : session.speaker;

    await db.query(
      'UPDATE agenda_sessions SET title = $1, description = $2, start_time = $3, end_time = $4, speaker = $5 WHERE id = $6',
      [title, description, start_time, end_time, speaker, id]
    );

    const updatedSession = await db.query('SELECT * FROM agenda_sessions WHERE id = $1', [id]);
    res.status(200).json(updatedSession.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Update agenda session error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteAgendaSession = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM agenda_sessions WHERE id = $1', [id]);
    res.status(200).json({ message: 'Agenda session deleted successfully.' });
  } catch (error) {
    console.error('Delete agenda session error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
