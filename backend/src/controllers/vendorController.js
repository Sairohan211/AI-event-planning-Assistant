import { z } from 'zod';
import crypto from 'crypto';
import db from '../db.js';

const vendorSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quotation: z.number().nonnegative().optional().default(0),
  payment_status: z.enum(['unpaid', 'partially_paid', 'paid']).default('unpaid'),
  contact_email: z.string().email().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending')
});

export const addVendor = async (req, res) => {
  try {
    const { eventId } = req.params;
    const validatedData = vendorSchema.parse(req.body);
    const vendorId = crypto.randomUUID();

    await db.query(
      `INSERT INTO vendors (id, event_id, name, category, quotation, payment_status, contact_email, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        vendorId,
        eventId,
        validatedData.name,
        validatedData.category,
        validatedData.quotation,
        validatedData.payment_status,
        validatedData.contact_email || '',
        validatedData.status
      ]
    );

    const newVendor = await db.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
    res.status(201).json(newVendor.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Add vendor error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getVendors = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await db.query('SELECT * FROM vendors WHERE event_id = $1', [eventId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = vendorSchema.partial().parse(req.body);

    const vendorResult = await db.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }

    const vendor = vendorResult.rows[0];
    const name = validatedData.name !== undefined ? validatedData.name : vendor.name;
    const category = validatedData.category !== undefined ? validatedData.category : vendor.category;
    const quotation = validatedData.quotation !== undefined ? validatedData.quotation : vendor.quotation;
    const payment_status = validatedData.payment_status !== undefined ? validatedData.payment_status : vendor.payment_status;
    const contact_email = validatedData.contact_email !== undefined ? validatedData.contact_email : vendor.contact_email;
    const status = validatedData.status !== undefined ? validatedData.status : vendor.status;

    await db.query(
      `UPDATE vendors 
       SET name = $1, category = $2, quotation = $3, payment_status = $4, contact_email = $5, status = $6 
       WHERE id = $7`,
      [name, category, quotation, payment_status, contact_email, status, id]
    );

    const updatedVendor = await db.query('SELECT * FROM vendors WHERE id = $1', [id]);
    res.status(200).json(updatedVendor.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM vendors WHERE id = $1', [id]);
    res.status(200).json({ message: 'Vendor deleted successfully.' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
