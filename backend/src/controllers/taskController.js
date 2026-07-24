import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignee_id: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'approved', 'completed']).default('todo'),
  dependency_id: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  blocker: z.string().nullable().optional(),
  approval_status: z.enum(['pending', 'approved']).default('pending')
});

export const addTask = async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = taskSchema.parse(req.body);
    const taskId = crypto.randomUUID();

    await db.query(
      `INSERT INTO tasks (id, event_id, title, description, assignee_id, status, dependency_id, deadline, blocker, approval_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        taskId,
        eventId,
        validatedData.title,
        validatedData.description || '',
        validatedData.assignee_id || null,
        validatedData.status,
        validatedData.dependency_id || null,
        validatedData.deadline || null,
        validatedData.blocker || '',
        validatedData.approval_status
      ]
    );

    const newTask = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    res.status(201).json(newTask.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Add task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await db.query('SELECT * FROM tasks WHERE event_id = $1', [eventId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = taskSchema.partial().parse(req.body);

    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = taskResult.rows[0];
    const title = validatedData.title !== undefined ? validatedData.title : task.title;
    const description = validatedData.description !== undefined ? validatedData.description : task.description;
    const assignee_id = validatedData.assignee_id !== undefined ? validatedData.assignee_id : task.assignee_id;
    const status = validatedData.status !== undefined ? validatedData.status : task.status;
    const dependency_id = validatedData.dependency_id !== undefined ? validatedData.dependency_id : task.dependency_id;
    const deadline = validatedData.deadline !== undefined ? validatedData.deadline : task.deadline;
    const blocker = validatedData.blocker !== undefined ? validatedData.blocker : task.blocker;
    const approval_status = validatedData.approval_status !== undefined ? validatedData.approval_status : task.approval_status;

    await db.query(
      `UPDATE tasks 
       SET title = $1, description = $2, assignee_id = $3, status = $4, dependency_id = $5, deadline = $6, blocker = $7, approval_status = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9`,
      [title, description, assignee_id, status, dependency_id, deadline, blocker, approval_status, id]
    );

    const updatedTask = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    res.status(200).json(updatedTask.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
