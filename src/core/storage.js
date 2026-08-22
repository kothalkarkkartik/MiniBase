import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { config } from '../config.js';
import { generateId } from '../utils/id.js';

export class StorageManager {
  static getStoragePath(collectionId, recordId) {
    const dir = path.join(config.storageDir, collectionId, recordId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static getMulterStorage() {
    return multer.diskStorage({
      destination: (req, _file, cb) => {
        const collection = req.params.name || req.params.collection || 'general';
        // Temporary upload folder before record creation/update
        const tempDir = path.join(config.storageDir, '_temp', collection);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${baseName}_${generateId(8)}${ext}`;
        cb(null, filename);
      },
    });
  }

  static moveTempFilesToRecord(collectionId, recordId, files) {
    const targetDir = this.getStoragePath(collectionId, recordId);
    const savedFilenames = [];

    for (const file of files) {
      const targetPath = path.join(targetDir, file.filename);
      fs.renameSync(file.path, targetPath);
      savedFilenames.push(file.filename);
    }

    return savedFilenames;
  }

  static getFilePath(collectionId, recordId, filename) {
    // Prevent path traversal
    const safeCol = String(collectionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeRec = String(recordId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = path.basename(filename);

    if (!safeCol || !safeRec || !safeFilename) return null;

    const filePath = path.resolve(config.storageDir, safeCol, safeRec, safeFilename);
    if (!filePath.startsWith(path.resolve(config.storageDir))) return null;

    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  static deleteRecordFiles(collectionId, recordId) {
    const safeCol = String(collectionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeRec = String(recordId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeCol || !safeRec) return;

    const recordDir = path.resolve(config.storageDir, safeCol, safeRec);
    if (!recordDir.startsWith(path.resolve(config.storageDir))) return;

    if (fs.existsSync(recordDir)) {
      fs.rmSync(recordDir, { recursive: true, force: true });
    }
  }

  static deleteFile(collectionId, recordId, filename) {
    const safeCol = String(collectionId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeRec = String(recordId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = path.basename(filename);

    if (!safeCol || !safeRec || !safeFilename) return false;

    const filePath = path.resolve(config.storageDir, safeCol, safeRec, safeFilename);
    if (!filePath.startsWith(path.resolve(config.storageDir))) return false;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  static getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  static async getThumbnail(collectionId, recordId, filename, thumbParam) {
    const originalPath = this.getFilePath(collectionId, recordId, filename);
    if (!originalPath) return null;

    const mime = this.getMimeType(originalPath);
    if (!mime.startsWith('image/') || mime.includes('svg')) {
      return originalPath; // only resize raster images
    }

    const parts = thumbParam.toLowerCase().split('x');
    const width = parseInt(parts[0], 10) || undefined;
    const height = parseInt(parts[1], 10) || undefined;

    if (!width && !height) return originalPath;

    const thumbDir = path.join(config.storageDir, '_thumbs', collectionId, recordId);
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    const safeFilename = path.basename(filename);
    const thumbFileName = `${width || 0}x${height || 0}_${safeFilename}.webp`;
    const thumbPath = path.join(thumbDir, thumbFileName);

    if (fs.existsSync(thumbPath)) {
      return thumbPath;
    }

    try {
      const sharp = (await import('sharp')).default;
      await sharp(originalPath)
        .resize(width, height, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 80 })
        .toFile(thumbPath);

      return thumbPath;
    } catch (err) {
      console.error('[Storage] Failed to generate thumbnail:', err);
      return originalPath;
    }
  }
}

export const uploadMiddleware = multer({
  storage: StorageManager.getMulterStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size default
  },
});
