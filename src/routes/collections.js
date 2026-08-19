import { Router } from 'express';
import { SchemaManager } from '../core/schema.js';
import { requireAdmin } from '../middleware/auth.js';

export const collectionsRouter = Router();

// Collections schema management is admin-only (applied per route to avoid blocking recordsRouter)

// List all collections
collectionsRouter.get('/', requireAdmin, (_req, res) => {
  try {
    const collections = SchemaManager.getAllCollections();
    res.json({ items: collections });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// Get single collection schema
collectionsRouter.get('/:name', requireAdmin, (req, res) => {
  try {
    const collection = SchemaManager.getCollection(req.params.name);
    if (!collection) {
      res.status(404).json({ code: 404, message: 'Collection not found' });
      return;
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// Create collection
collectionsRouter.post('/', requireAdmin, (req, res) => {
  try {
    const collection = SchemaManager.createCollection(req.body);
    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Update collection
collectionsRouter.patch('/:name', requireAdmin, (req, res) => {
  try {
    const collection = SchemaManager.updateCollection(req.params.name, req.body);
    res.json(collection);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Delete collection
collectionsRouter.delete('/:name', requireAdmin, (req, res) => {
  try {
    SchemaManager.deleteCollection(req.params.name);
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});
