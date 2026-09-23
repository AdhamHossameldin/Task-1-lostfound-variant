import { Item } from '../models/Item.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  category: Joi.string().valid(`electronics`, `clothing`, `documents`, `accessories`, `other`).default(`other`),
  status: Joi.string().valid(`lost`, `found`, `claimed`).default(`lost`),
  location: Joi.string().optional(),
  reportedBy: Joi.string().optional()
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  category: Joi.string().valid(`electronics`, `clothing`, `documents`, `accessories`, `other`).default(`other`),
  status: Joi.string().valid(`lost`, `found`, `claimed`),
  location: Joi.string().allow(null),
  reportedBy: Joi.string().allow(null)
}).min(1);

function isDuplicateKeyError(err) {
  return err?.code === 11000;
}

const filterSchema = Joi.object({
  status: Joi.string().valid(`lost`, `found`, `claimed`),
  category: Joi.string().valid(`electronics`, `clothing`, `documents`, `accessories`, `other`)
}).unknown(false);

// GET /api/items
// TODO: implement per README.md section 3.
export async function getAllItems(req, res, next) {
  try {
    const { value, error } = filterSchema.validate(req.query, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const items = await Item.find(value).sort({ createdAt: -1 }).populate('reportedBy', 'name email').lean();
    res.json({ items });
  } catch (err) { next(err); }
}

// GET /api/items/:id
// TODO: implement per README.md section 3.
export async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email').lean();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
// TODO: implement per README.md section 3.
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Item.findOne({ title: value.title, location: value.location });
    if (existing) return res.status(409).json({ message: 'Item with the same title and location already exists' });
    
    const item = await Item.create(value);
    res.status(201).json({ item });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: 'Item with the same title and location already exists' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
// TODO: implement per README.md section 3.
export async function updateItem(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Item.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: doc });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ message: 'Item with the same title and location already exists' });
    }
    next(err);
  }
}

// DELETE /api/items/:id
// TODO: implement per README.md section 3.
export async function deleteItem(req, res, next) {
  try {
    const doc = await Item.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
