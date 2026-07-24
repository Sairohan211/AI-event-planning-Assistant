import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const eventSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  objective: z.string().optional(),
  date: z.string(), // ISO string
  venue: z.string().optional(),
  capacity: z.number().nonnegative().optional().default(0),
  budget: z.number().nonnegative().optional().default(0),
  audience: z.string().optional(),
  organizing_team: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
    permission: z.enum(['edit', 'view']).default('view')
  })).optional()
});

export const createEvent = async (req, res) => {
  try {
    const validatedData = eventSchema.parse(req.body);
    const eventId = crypto.randomUUID();
    const ownerId = req.user.id;

    const organizingTeamJson = JSON.stringify(validatedData.organizing_team || []);

    await db.query(
      `INSERT INTO events (id, owner_id, title, type, objective, date, venue, capacity, budget, audience, organizing_team, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        eventId,
        ownerId,
        validatedData.title,
        validatedData.type,
        validatedData.objective || '',
        validatedData.date,
        validatedData.venue || '',
        validatedData.capacity,
        validatedData.budget,
        validatedData.audience || '',
        organizingTeamJson,
        'active'
      ]
    );

    // Fetch and return the created event
    const newEvent = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    res.status(201).json(newEvent.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    let events = [];

    if (userRole === 'organizer') {
      // Find events where owner_id = userId OR userEmail is in the organizing_team JSON
      // To support both PG and SQLite seamlessly:
      // We can select all events and filter in JS, or write a query compatible with both
      const allEventsResult = await db.query('SELECT * FROM events');
      events = allEventsResult.rows.filter(event => {
        if (event.owner_id === userId) return true;
        try {
          const team = JSON.parse(event.organizing_team || '[]');
          return team.some(member => member.email.toLowerCase() === userEmail.toLowerCase());
        } catch (e) {
          return false;
        }
      });
    } else if (userRole === 'vendor') {
      // Vendors access only events they are bid on
      // Get event IDs from vendors table where contact_email = userEmail or similar
      const vendorEvents = await db.query(
        `SELECT DISTINCT e.* FROM events e 
         JOIN vendors v ON v.event_id = e.id 
         WHERE LOWER(v.contact_email) = LOWER($1)`,
        [userEmail]
      );
      events = vendorEvents.rows;
    } else if (userRole === 'attendee') {
      // Attendees access only events they are registered for
      const attendeeEvents = await db.query(
        `SELECT DISTINCT e.* FROM events e 
         JOIN attendees a ON a.event_id = e.id 
         WHERE LOWER(a.email) = LOWER($1) OR a.user_id = $2`,
        [userEmail, userId]
      );
      events = attendeeEvents.rows;
    }

    res.status(200).json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userRole = req.user.role;

    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventResult.rows[0];

    // Access control check
    let hasAccess = false;
    if (event.owner_id === userId) {
      hasAccess = true;
    } else if (userRole === 'organizer') {
      try {
        const team = JSON.parse(event.organizing_team || '[]');
        hasAccess = team.some(member => member.email.toLowerCase() === userEmail.toLowerCase());
      } catch (e) {
        hasAccess = false;
      }
    } else if (userRole === 'vendor') {
      const vendorResult = await db.query(
        'SELECT id FROM vendors WHERE event_id = $1 AND LOWER(contact_email) = LOWER($2)',
        [id, userEmail]
      );
      hasAccess = vendorResult.rows.length > 0;
    } else if (userRole === 'attendee') {
      const attendeeResult = await db.query(
        'SELECT id FROM attendees WHERE event_id = $1 AND (LOWER(email) = LOWER($2) OR user_id = $3)',
        [id, userEmail, userId]
      );
      hasAccess = attendeeResult.rows.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view this event.' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if event exists
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventResult.rows[0];

    // Enforce edit permission
    let canEdit = event.owner_id === userId;
    if (!canEdit) {
      try {
        const team = JSON.parse(event.organizing_team || '[]');
        const member = team.find(m => m.email.toLowerCase() === userEmail.toLowerCase());
        if (member && member.permission === 'edit') {
          canEdit = true;
        }
      } catch (e) {
        canEdit = false;
      }
    }

    if (!canEdit) {
      return res.status(403).json({ error: 'You do not have permission to update this event.' });
    }

    const validatedData = eventSchema.partial().parse(req.body);

    const title = validatedData.title !== undefined ? validatedData.title : event.title;
    const type = validatedData.type !== undefined ? validatedData.type : event.type;
    const objective = validatedData.objective !== undefined ? validatedData.objective : event.objective;
    const date = validatedData.date !== undefined ? validatedData.date : event.date;
    const venue = validatedData.venue !== undefined ? validatedData.venue : event.venue;
    const capacity = validatedData.capacity !== undefined ? validatedData.capacity : event.capacity;
    const budget = validatedData.budget !== undefined ? validatedData.budget : event.budget;
    const audience = validatedData.audience !== undefined ? validatedData.audience : event.audience;
    const organizingTeamJson = validatedData.organizing_team !== undefined 
      ? JSON.stringify(validatedData.organizing_team) 
      : event.organizing_team;

    await db.query(
      `UPDATE events 
       SET title = $1, type = $2, objective = $3, date = $4, venue = $5, capacity = $6, budget = $7, audience = $8, organizing_team = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10`,
      [title, type, objective, date, venue, capacity, budget, audience, organizingTeamJson, id]
    );

    const updatedEventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    res.status(200).json(updatedEventResult.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const archiveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const eventResult = await db.query('SELECT owner_id FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (eventResult.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the event owner can archive this event.' });
    }

    await db.query("UPDATE events SET status = 'archived' WHERE id = $1", [id]);
    res.status(200).json({ message: 'Event archived successfully.' });
  } catch (error) {
    console.error('Archive event error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const eventResult = await db.query('SELECT owner_id FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (eventResult.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the event owner can delete this event.' });
    }

    await db.query('DELETE FROM events WHERE id = $1', [id]);
    res.status(200).json({ message: 'Event and associated records deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const duplicateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventResult.rows[0];
    if (event.owner_id !== userId) {
      return res.status(403).json({ error: 'Only the event owner can duplicate this event.' });
    }

    const newEventId = crypto.randomUUID();
    const duplicatedTitle = `${event.title} (Copy)`;

    // Insert duplicated event
    await db.query(
      `INSERT INTO events (id, owner_id, title, type, objective, date, venue, capacity, budget, audience, organizing_team, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newEventId,
        userId,
        duplicatedTitle,
        event.type,
        event.objective,
        event.date,
        event.venue,
        event.capacity,
        event.budget,
        event.audience,
        event.organizing_team,
        'active'
      ]
    );

    // Duplicate agenda
    const agendaResult = await db.query('SELECT * FROM agenda_sessions WHERE event_id = $1', [id]);
    for (const session of agendaResult.rows) {
      await db.query(
        'INSERT INTO agenda_sessions (id, event_id, title, description, start_time, end_time, speaker) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [crypto.randomUUID(), newEventId, session.title, session.description, session.start_time, session.end_time, session.speaker]
      );
    }

    // Duplicate tasks
    const tasksResult = await db.query('SELECT * FROM tasks WHERE event_id = $1', [id]);
    // Create mapping of old task IDs to new task IDs for dependency resolution
    const taskMapping = {};
    for (const task of tasksResult.rows) {
      const newTaskId = crypto.randomUUID();
      taskMapping[task.id] = newTaskId;
      await db.query(
        'INSERT INTO tasks (id, event_id, title, description, assignee_id, status, deadline, blocker, approval_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newTaskId, newEventId, task.title, task.description, task.assignee_id, 'todo', task.deadline, task.blocker, 'pending']
      );
    }
    // Update dependencies
    for (const task of tasksResult.rows) {
      if (task.dependency_id && taskMapping[task.dependency_id]) {
        await db.query('UPDATE tasks SET dependency_id = $1 WHERE id = $2', [taskMapping[task.dependency_id], taskMapping[task.id]]);
      }
    }

    // Duplicate vendors
    const vendorsResult = await db.query('SELECT * FROM vendors WHERE event_id = $1', [id]);
    for (const vendor of vendorsResult.rows) {
      await db.query(
        'INSERT INTO vendors (id, event_id, name, category, quotation, payment_status, contact_email, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [crypto.randomUUID(), newEventId, vendor.name, vendor.category, vendor.quotation, 'unpaid', vendor.contact_email, 'pending']
      );
    }

    // Duplicate logistics
    const logisticsResult = await db.query('SELECT * FROM logistics_plans WHERE event_id = $1', [id]);
    for (const log of logisticsResult.rows) {
      await db.query(
        'INSERT INTO logistics_plans (id, event_id, seating_layout, room_setup, equipment, staffing) VALUES ($1, $2, $3, $4, $5, $6)',
        [crypto.randomUUID(), newEventId, log.seating_layout, log.room_setup, log.equipment, log.staffing]
      );
    }

    res.status(201).json({ message: 'Event duplicated successfully.', eventId: newEventId });
  } catch (error) {
    console.error('Duplicate event error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const exportEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventResult.rows[0];
    if (event.owner_id !== userId) {
      return res.status(403).json({ error: 'Only the event owner can export this event.' });
    }

    const agenda = await db.query('SELECT * FROM agenda_sessions WHERE event_id = $1', [id]);
    const tasks = await db.query('SELECT * FROM tasks WHERE event_id = $1', [id]);
    const vendors = await db.query('SELECT * FROM vendors WHERE event_id = $1', [id]);
    const attendees = await db.query('SELECT * FROM attendees WHERE event_id = $1', [id]);
    const logistics = await db.query('SELECT * FROM logistics_plans WHERE event_id = $1', [id]);
    const aiPlans = await db.query('SELECT * FROM ai_plans WHERE event_id = $1', [id]);

    const exportData = {
      event,
      agenda: agenda.rows,
      tasks: tasks.rows,
      vendors: vendors.rows,
      attendees: attendees.rows,
      logistics: logistics.rows,
      aiPlans: aiPlans.rows
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=event-export-${id}.json`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Export event error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
