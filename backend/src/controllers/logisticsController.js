import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const logisticsSchema = z.object({
  seating_layout: z.string().optional(),
  room_setup: z.string().optional(),
  equipment: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    status: z.enum(['pending', 'secured', 'needed']).default('needed')
  })).optional(),
  staffing: z.array(z.object({
    role: z.string(),
    count: z.number(),
    assigned: z.string().optional()
  })).optional()
});

export const getLogistics = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await db.query('SELECT * FROM logistics_plans WHERE event_id = $1', [eventId]);
    
    if (result.rows.length === 0) {
      // Return default logistics structure
      return res.status(200).json({
        event_id: eventId,
        seating_layout: '',
        room_setup: '',
        equipment: [],
        staffing: []
      });
    }
    
    const logistics = result.rows[0];
    res.status(200).json({
      ...logistics,
      equipment: JSON.parse(logistics.equipment || '[]'),
      staffing: JSON.parse(logistics.staffing || '[]')
    });
  } catch (error) {
    console.error('Get logistics error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const saveLogistics = async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = logisticsSchema.parse(req.body);

    const seating_layout = validatedData.seating_layout || '';
    const room_setup = validatedData.room_setup || '';
    const equipmentJson = JSON.stringify(validatedData.equipment || []);
    const staffingJson = JSON.stringify(validatedData.staffing || []);

    const existingResult = await db.query('SELECT id FROM logistics_plans WHERE event_id = $1', [eventId]);
    
    if (existingResult.rows.length === 0) {
      // Insert
      const logId = crypto.randomUUID();
      await db.query(
        `INSERT INTO logistics_plans (id, event_id, seating_layout, room_setup, equipment, staffing) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [logId, eventId, seating_layout, room_setup, equipmentJson, staffingJson]
      );
    } else {
      // Update
      await db.query(
        `UPDATE logistics_plans 
         SET seating_layout = $1, room_setup = $2, equipment = $3, staffing = $4 
         WHERE event_id = $5`,
        [seating_layout, room_setup, equipmentJson, staffingJson, eventId]
      );
    }

    const updatedLog = await db.query('SELECT * FROM logistics_plans WHERE event_id = $1', [eventId]);
    const responseData = updatedLog.rows[0];
    
    res.status(200).json({
      ...responseData,
      equipment: JSON.parse(responseData.equipment || '[]'),
      staffing: JSON.parse(responseData.staffing || '[]')
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Save logistics error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
