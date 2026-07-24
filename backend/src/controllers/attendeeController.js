import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const attendeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  dietary_needs: z.string().optional(),
  invitation_status: z.enum(['sent', 'confirmed', 'declined']).default('sent'),
  check_in_status: z.boolean().default(false),
  seating_info: z.string().optional()
});

export const addAttendee = async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = attendeeSchema.parse(req.body);
    const attendeeId = crypto.randomUUID();

    // Check if user exists with this email to link user_id automatically
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [validatedData.email]);
    const userId = userCheck.rows.length > 0 ? userCheck.rows[0].id : null;

    await db.query(
      `INSERT INTO attendees (id, event_id, user_id, name, email, dietary_needs, invitation_status, check_in_status, seating_info) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        attendeeId,
        eventId,
        userId,
        validatedData.name,
        validatedData.email,
        validatedData.dietary_needs || '',
        validatedData.invitation_status,
        validatedData.check_in_status,
        validatedData.seating_info || ''
      ]
    );

    const newAttendee = await db.query('SELECT * FROM attendees WHERE id = $1', [attendeeId]);
    res.status(201).json(newAttendee.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Add attendee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await db.query('SELECT * FROM attendees WHERE event_id = $1', [eventId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateAttendee = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = attendeeSchema.partial().parse(req.body);

    const attendeeResult = await db.query('SELECT * FROM attendees WHERE id = $1', [id]);
    if (attendeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attendee not found.' });
    }

    const attendee = attendeeResult.rows[0];
    const name = validatedData.name !== undefined ? validatedData.name : attendee.name;
    const email = validatedData.email !== undefined ? validatedData.email : attendee.email;
    const dietary_needs = validatedData.dietary_needs !== undefined ? validatedData.dietary_needs : attendee.dietary_needs;
    const invitation_status = validatedData.invitation_status !== undefined ? validatedData.invitation_status : attendee.invitation_status;
    const check_in_status = validatedData.check_in_status !== undefined ? validatedData.check_in_status : attendee.check_in_status;
    const seating_info = validatedData.seating_info !== undefined ? validatedData.seating_info : attendee.seating_info;

    await db.query(
      `UPDATE attendees 
       SET name = $1, email = $2, dietary_needs = $3, invitation_status = $4, check_in_status = $5, seating_info = $6 
       WHERE id = $7`,
      [name, email, dietary_needs, invitation_status, check_in_status, seating_info, id]
    );

    const updatedAttendee = await db.query('SELECT * FROM attendees WHERE id = $1', [id]);
    res.status(200).json(updatedAttendee.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Update attendee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteAttendee = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM attendees WHERE id = $1', [id]);
    res.status(200).json({ message: 'Attendee deleted successfully.' });
  } catch (error) {
    console.error('Delete attendee error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
