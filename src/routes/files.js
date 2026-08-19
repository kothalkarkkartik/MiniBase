import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { SchemaManager } from '../core/schema.js';
import { StorageManager } from '../core/storage.js';

export const filesRouter = Router();

// Stream or download a stored file
filesRouter.get('/:collection/:recordId/:filename', async (req, res) => {
  const { collection: colNameOrId, recordId, filename } = req.params;
  const collection = SchemaManager.getCollection(colNameOrId);
  const collectionId = collection ? collection.id : colNameOrId;

  let filePath = StorageManager.getFilePath(collectionId, recordId, filename);
  if (!filePath) {
    res.status(404).json({ code: 404, message: 'File not found' });
    return;
  }

  // Handle on-the-fly thumbnail resizing if requested (e.g. ?thumb=100x100)
  if (req.query.thumb && typeof req.query.thumb === 'string') {
    const thumbPath = await StorageManager.getThumbnail(collectionId, recordId, filename, req.query.thumb);
    if (thumbPath && fs.existsSync(thumbPath)) {
      filePath = thumbPath;
    }
  }

  const mimeType = StorageManager.getMimeType(filePath);
  const stat = fs.statSync(filePath);

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  if (req.query.download === '1' || req.query.download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
  } else {
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filename)}"`);
  }

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Delete file
filesRouter.delete('/:collection/:recordId/:filename', (req, res) => {
  const { collection: colNameOrId, recordId, filename } = req.params;
  const collection = SchemaManager.getCollection(colNameOrId);
  const collectionId = collection ? collection.id : colNameOrId;

  const deleted = StorageManager.deleteFile(collectionId, recordId, filename);
  if (deleted) {
    res.json({ message: 'File deleted successfully' });
  } else {
    res.status(404).json({ code: 404, message: 'File not found' });
  }
});
