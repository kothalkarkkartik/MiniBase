import { Router } from 'express';
import { SchemaManager } from '../core/schema.js';
import { RuleEvaluator } from '../core/rules.js';
import { AuthManager, decodeJwt } from '../core/auth.js';
import { RealtimeHub } from '../core/realtime.js';
import { StorageManager, uploadMiddleware } from '../core/storage.js';
import { Mailer } from '../core/mailer.js';
import { OAuth2Manager } from '../core/oauth2.js';
import { HookManager } from '../core/hooks.js';
import { getDB } from '../core/db.js';
import { generateId, generateTokenKey } from '../utils/id.js';

export const recordsRouter = Router();

const getParam = (val) => {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
};

// Helper to expand relations
function expandRelations(collection, records, expandStr) {
  if (!expandStr || records.length === 0) return records;

  const db = getDB();
  const expandFields = expandStr.split(',').map(s => s.trim()).filter(Boolean);

  for (const fieldName of expandFields) {
    const fieldDef = collection.schema.find(f => f.name === fieldName && f.type === 'relation');
    if (!fieldDef || !fieldDef.options?.collectionId) continue;

    const targetCol = SchemaManager.getCollection(fieldDef.options.collectionId);
    if (!targetCol) continue;

    for (const record of records) {
      const relVal = record[fieldName];
      if (!relVal) continue;

      if (!record.expand) record.expand = {};

      if (Array.isArray(relVal)) {
        // Multi relation
        const placeholders = relVal.map(() => '?').join(',');
        if (placeholders) {
          const targets = db.queryAll(
            `SELECT * FROM "${targetCol.name}" WHERE id IN (${placeholders})`,
            relVal
          );
          record.expand[fieldName] = targets.map(t => cleanRecord(t, targetCol));
        }
      } else {
        // Single relation
        const target = db.queryOne(
          `SELECT * FROM "${targetCol.name}" WHERE id = ?`,
          [relVal]
        );
        if (target) {
          record.expand[fieldName] = cleanRecord(target, targetCol);
        }
      }
    }
  }

  return records;
}

// Clean sensitive auth fields from response
function cleanRecord(record, collection) {
  if (!record) return record;
  const copy = { ...record };

  // Parse JSON and Boolean fields
  for (const field of collection.schema) {
    if (field.type === 'json' && typeof copy[field.name] === 'string') {
      try {
        copy[field.name] = JSON.parse(copy[field.name]);
      } catch {
        // keep string if parse fails
      }
    } else if (field.type === 'bool') {
      copy[field.name] = Boolean(copy[field.name]);
    }
  }

  if (collection.type === 'auth') {
    delete copy.passwordHash;
    delete copy.tokenKey;
    if (!copy.emailVisibility) {
      // Keep email if visible or requested
    }
  }

  return copy;
}

// Helper to build RuleContext
function buildRuleContext(req, data) {
  return {
    isAdmin: req.isAdmin,
    auth: req.auth
      ? {
          id: req.auth.id,
          email: req.auth.email,
          collectionId: req.auth.collectionId,
          collectionName: req.auth.collectionName,
        }
      : null,
    data,
  };
}

// --- AUTH ENDPOINTS FOR AUTH COLLECTIONS ---

// Auth with password for auth collection records
recordsRouter.post('/:name/auth-with-password', async (req, res) => {
  try {
    const { identity, email, password } = req.body;
    const userEmail = (email || identity || '').trim();

    if (!userEmail || !password) {
      res.status(400).json({ code: 400, message: 'Email/Identity and password are required' });
      return;
    }

    const result = await AuthManager.recordAuthWithPassword(getParam(req.params.name), userEmail, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message || 'Authentication failed' });
  }
});

// Refresh token for auth collection
recordsRouter.post('/:name/auth-refresh', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    if (!req.auth || req.auth.collectionName !== colName) {
      res.status(401).json({ code: 401, message: 'Invalid or missing auth token' });
      return;
    }

    const collection = SchemaManager.getCollection(colName);
    if (!collection) {
      res.status(404).json({ code: 404, message: 'Collection not found' });
      return;
    }

    const db = getDB();
    const record = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [req.auth.id]);
    if (!record) {
      res.status(404).json({ code: 404, message: 'User record not found' });
      return;
    }

    const token = AuthManager.createToken({
      id: record.id,
      type: 'user',
      collectionId: collection.id,
      collectionName: collection.name,
      tokenKey: record.tokenKey,
      email: record.email,
    });

    res.json({ token, record: cleanRecord(record, collection) });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Get available auth methods (OAuth2 providers)
recordsRouter.get('/:name/auth-methods', (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection || collection.type !== 'auth') {
      res.status(404).json({ code: 404, message: `Auth collection "${colName}" not found` });
      return;
    }

    const authProviders = OAuth2Manager.getProviders();
    res.json({
      authProviders,
      usernamePassword: true,
      emailPassword: true,
    });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Auth with OAuth2
recordsRouter.post('/:name/auth-with-oauth2', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection || collection.type !== 'auth') {
      res.status(404).json({ code: 404, message: `Auth collection "${colName}" not found` });
      return;
    }

    const { provider, code, redirectUrl } = req.body;
    if (!provider || !code) {
      res.status(400).json({ code: 400, message: 'Provider and authorization code are required' });
      return;
    }

    const result = await OAuth2Manager.authWithOAuth2(collection, provider, code, redirectUrl);
    res.json(result);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Request password reset email
recordsRouter.post('/:name/request-password-reset', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection || collection.type !== 'auth') {
      res.status(404).json({ code: 404, message: `Auth collection "${colName}" not found` });
      return;
    }

    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) {
      res.status(400).json({ code: 400, message: 'Email is required' });
      return;
    }

    const db = getDB();
    const user = db.queryOne(`SELECT * FROM "${collection.name}" WHERE email = ?`, [email]);
    if (user) {
      const token = Mailer.createActionToken({
        type: 'password_reset',
        id: user.id,
        email: user.email,
        collectionName: collection.name,
        tokenKey: user.tokenKey || '',
      });
      await Mailer.sendPasswordResetEmail(email, token, collection.name);
    }

    res.status(200).json({ message: 'Password reset email sent if account exists' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Confirm password reset
recordsRouter.post('/:name/confirm-password-reset', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection || collection.type !== 'auth') {
      res.status(404).json({ code: 404, message: `Auth collection "${colName}" not found` });
      return;
    }

    const { token, password, passwordConfirm } = req.body;
    if (!token || !password) {
      res.status(400).json({ code: 400, message: 'Token and new password are required' });
      return;
    }

    if (passwordConfirm && password !== passwordConfirm) {
      res.status(400).json({ code: 400, message: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ code: 400, message: 'Password must be at least 8 characters' });
      return;
    }

    const db = getDB();
    const decodedUnsafe = decodeJwt(token);
    if (!decodedUnsafe?.id) {
      res.status(400).json({ code: 400, message: 'Invalid token' });
      return;
    }

    const user = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [decodedUnsafe.id]);
    if (!user) {
      res.status(404).json({ code: 404, message: 'User record not found' });
      return;
    }

    Mailer.verifyActionToken(token, 'password_reset', user.tokenKey || '');

    const newHash = await AuthManager.hashPassword(password);
    const newTokenKey = generateTokenKey();
    const now = new Date().toISOString();

    db.run(
      `UPDATE "${collection.name}" SET passwordHash = ?, tokenKey = ?, updated = ? WHERE id = ?`,
      [newHash, newTokenKey, now, user.id]
    );

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message || 'Password reset failed' });
  }
});

// Request email verification
recordsRouter.post('/:name/request-verification', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection || collection.type !== 'auth') {
      res.status(404).json({ code: 404, message: `Auth collection "${colName}" not found` });
      return;
    }

    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) {
      res.status(400).json({ code: 400, message: 'Email is required' });
      return;
    }

    const db = getDB();
    const user = db.queryOne(`SELECT * FROM "${collection.name}" WHERE email = ?`, [email]);
    if (user && !user.verified) {
      const token = Mailer.createActionToken({
        type: 'verification',
        id: user.id,
        email: user.email,
        collectionName: collection.name,
        tokenKey: user.tokenKey || '',
      });
      await Mailer.sendVerificationEmail(email, token, collection.name);
    }

    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// Confirm email verification
recordsRouter.post('/:name/confirm-verification', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection || collection.type !== 'auth') {
      res.status(404).json({ code: 404, message: `Auth collection "${colName}" not found` });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ code: 400, message: 'Verification token is required' });
      return;
    }

    const db = getDB();
    const decodedUnsafe = decodeJwt(token);
    if (!decodedUnsafe?.id) {
      res.status(400).json({ code: 400, message: 'Invalid token' });
      return;
    }

    const user = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [decodedUnsafe.id]);
    if (!user) {
      res.status(404).json({ code: 404, message: 'User found' });
      return;
    }

    Mailer.verifyActionToken(token, 'verification', user.tokenKey || '');

    const now = new Date().toISOString();
    db.run(`UPDATE "${collection.name}" SET verified = 1, updated = ? WHERE id = ?`, [now, user.id]);

    res.json({ message: 'Email successfully verified' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message || 'Verification failed' });
  }
});

// --- CRUD RECORD ENDPOINTS ---

// 1. List records with pagination, sorting, filtering, searching, expanding
recordsRouter.get('/:name/records', (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection) {
      res.status(404).json({ code: 404, message: `Collection "${colName}" not found` });
      return;
    }

    // Evaluate access rule
    const ruleContext = buildRuleContext(req);
    const ruleEval = RuleEvaluator.evaluate(collection.listRule, ruleContext);
    if (!ruleEval.allowed) {
      res.status(403).json({ code: 403, message: 'Access denied by collection list rule' });
      return;
    }

    const db = getDB();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(500, Math.max(1, parseInt(req.query.perPage || '30', 10)));
    const offset = (page - 1) * perPage;

    const whereConditions = [];
    const queryParams = [];

    // Rule filter condition
    if (ruleEval.sqlFilter) {
      whereConditions.push(ruleEval.sqlFilter);
      if (ruleEval.params) queryParams.push(...ruleEval.params);
    }

    // User query filter
    const userFilter = (req.query.filter || '').trim();
    if (userFilter) {
      const allowedFields = collection.schema.map(f => f.name);
      if (collection.type === 'auth') allowedFields.push('email', 'verified');
      const parsed = RuleEvaluator.parseFilter(userFilter, allowedFields);
      if (parsed.sql) {
        whereConditions.push(parsed.sql);
        queryParams.push(...parsed.params);
      }
    }

    // Quick text search
    const search = (req.query.search || '').trim();
    if (search) {
      const textFields = collection.schema
        .filter(f => f.type === 'text' || f.type === 'email' || f.type === 'url')
        .map(f => `"${f.name}" LIKE ?`);

      if (collection.type === 'auth') textFields.push('"email" LIKE ?');

      if (textFields.length > 0) {
        whereConditions.push(`(${textFields.join(' OR ')})`);
        for (let i = 0; i < textFields.length; i++) {
          queryParams.push(`%${search}%`);
        }
      }
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total items
    const countRow = db.queryOne(
      `SELECT COUNT(*) as count FROM "${collection.name}" ${whereSql}`,
      queryParams
    );
    const totalItems = countRow?.count || 0;

    // Sorting
    let orderBySql = 'ORDER BY created DESC';
    const sort = (req.query.sort || '').trim();
    if (sort) {
      const sortParts = sort.split(',').map(s => s.trim()).filter(Boolean);
      const validSorts = [];
      const schemaFieldNames = new Set([
        'id',
        'created',
        'updated',
        'email',
        ...collection.schema.map(f => f.name),
      ]);

      for (const part of sortParts) {
        const isDesc = part.startsWith('-');
        const rawField = isDesc || part.startsWith('+') ? part.slice(1) : part;
        if (schemaFieldNames.has(rawField)) {
          validSorts.push(`"${rawField}" ${isDesc ? 'DESC' : 'ASC'}`);
        }
      }
      if (validSorts.length > 0) {
        orderBySql = `ORDER BY ${validSorts.join(', ')}`;
      }
    }

    // Query records
    const records = db.queryAll(
      `SELECT * FROM "${collection.name}" ${whereSql} ${orderBySql} LIMIT ? OFFSET ?`,
      [...queryParams, perPage, offset]
    );

    const cleanedRecords = records.map(r => cleanRecord(r, collection));
    const expandedRecords = expandRelations(collection, cleanedRecords, req.query.expand);

    const result = {
      page,
      perPage,
      totalPages: Math.ceil(totalItems / perPage),
      totalItems,
      items: expandedRecords,
    };

    res.json(result);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 2. Get single record
recordsRouter.get('/:name/records/:id', (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const recId = getParam(req.params.id);
    const collection = SchemaManager.getCollection(colName);
    if (!collection) {
      res.status(404).json({ code: 404, message: `Collection "${colName}" not found` });
      return;
    }

    const ruleContext = buildRuleContext(req);
    const ruleEval = RuleEvaluator.evaluate(collection.viewRule, ruleContext);
    if (!ruleEval.allowed) {
      res.status(403).json({ code: 403, message: 'Access denied by collection view rule' });
      return;
    }

    const db = getDB();
    const whereConditions = [`id = ?`];
    const queryParams = [recId];

    if (ruleEval.sqlFilter) {
      whereConditions.push(ruleEval.sqlFilter);
      if (ruleEval.params) queryParams.push(...ruleEval.params);
    }

    const record = db.queryOne(
      `SELECT * FROM "${collection.name}" WHERE ${whereConditions.join(' AND ')}`,
      queryParams
    );

    if (!record) {
      res.status(404).json({ code: 404, message: 'Record not found' });
      return;
    }

    let cleaned = cleanRecord(record, collection);
    if (req.query.expand) {
      [cleaned] = expandRelations(collection, [cleaned], req.query.expand);
    }

    res.json(cleaned);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 3. Create record
recordsRouter.post('/:name/records', uploadMiddleware.any(), async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const collection = SchemaManager.getCollection(colName);
    if (!collection) {
      res.status(404).json({ code: 404, message: `Collection "${colName}" not found` });
      return;
    }

    const ruleContext = buildRuleContext(req, req.body);
    const ruleEval = RuleEvaluator.evaluate(collection.createRule, ruleContext);
    if (!ruleEval.allowed) {
      res.status(403).json({ code: 403, message: 'Access denied by collection create rule' });
      return;
    }

    const rawData = { ...req.body };
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        if (!rawData[f.fieldname]) rawData[f.fieldname] = f.originalname;
      });
    }
    const validatedData = SchemaManager.validateRecordData(collection, rawData, true);

    const now = new Date().toISOString();
    const recordId = rawData.id || generateId();
    validatedData.id = recordId;
    validatedData.created = now;
    validatedData.updated = now;

    // Handle Auth fields
    if (collection.type === 'auth') {
      if (!rawData.password || rawData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      validatedData.email = (rawData.email || '').toLowerCase().trim();
      if (!validatedData.email) throw new Error('Email is required for auth collection');

      // Check unique email
      const db = getDB();
      const existing = db.queryOne(`SELECT id FROM "${collection.name}" WHERE email = ?`, [validatedData.email]);
      if (existing) {
        throw new Error('Email is already registered');
      }

      validatedData.passwordHash = await AuthManager.hashPassword(rawData.password);
      validatedData.tokenKey = generateTokenKey();
      validatedData.verified = rawData.verified ? 1 : 0;
      validatedData.emailVisibility = rawData.emailVisibility ? 1 : 0;
    }

    // Handle Uploaded Files
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const fileFields = collection.schema.filter(f => f.type === 'file');
      for (const field of fileFields) {
        const matchedFiles = req.files.filter(f => f.fieldname === field.name);
        if (matchedFiles.length > 0) {
          const savedNames = StorageManager.moveTempFilesToRecord(collection.id, recordId, matchedFiles);
          validatedData[field.name] = (field.options?.maxFiles || 1) > 1 ? JSON.stringify(savedNames) : savedNames[0];
        }
      }
    }

    // Run BeforeCreate Hook
    await HookManager.triggerBeforeCreate({
      collection,
      data: validatedData,
      auth: req.auth,
    });

    // Insert into DB
    const db = getDB();
    const columns = Object.keys(validatedData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(validatedData);

    db.run(
      `INSERT INTO "${collection.name}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
      values
    );

    const newRecord = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recordId]);
    const cleaned = cleanRecord(newRecord, collection);

    // Run AfterCreate Hook
    await HookManager.triggerAfterCreate({
      collection,
      record: newRecord,
      auth: req.auth,
    });

    // Dispatch realtime event
    RealtimeHub.dispatch('create', collection.name, cleaned);

    res.status(201).json(cleaned);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 4. Update record (PATCH)
recordsRouter.patch('/:name/records/:id', uploadMiddleware.any(), async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const recId = getParam(req.params.id);
    const collection = SchemaManager.getCollection(colName);
    if (!collection) {
      res.status(404).json({ code: 404, message: `Collection "${colName}" not found` });
      return;
    }

    const db = getDB();
    const existing = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recId]);
    if (!existing) {
      res.status(404).json({ code: 404, message: 'Record not found' });
      return;
    }

    const ruleContext = buildRuleContext(req, { ...existing, ...req.body });
    const ruleEval = RuleEvaluator.evaluate(collection.updateRule, ruleContext);
    if (!ruleEval.allowed) {
      res.status(403).json({ code: 403, message: 'Access denied by collection update rule' });
      return;
    }

    const rawData = { ...req.body };
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        if (!rawData[f.fieldname]) rawData[f.fieldname] = f.originalname;
      });
    }
    const validatedData = SchemaManager.validateRecordData(collection, rawData, false, existing);
    validatedData.updated = new Date().toISOString();

    // Handle auth collection password/email updates
    if (collection.type === 'auth') {
      if (rawData.email && rawData.email !== existing.email) {
        validatedData.email = rawData.email.toLowerCase().trim();
      }
      if (rawData.password) {
        if (rawData.password.length < 8) throw new Error('Password must be at least 8 characters');
        validatedData.passwordHash = await AuthManager.hashPassword(rawData.password);
        validatedData.tokenKey = generateTokenKey(); // invalidate older sessions
      }
      if (rawData.verified !== undefined) validatedData.verified = rawData.verified ? 1 : 0;
      if (rawData.emailVisibility !== undefined) validatedData.emailVisibility = rawData.emailVisibility ? 1 : 0;
    }

    // Handle Uploaded Files
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const fileFields = collection.schema.filter(f => f.type === 'file');
      for (const field of fileFields) {
        const matchedFiles = req.files.filter(f => f.fieldname === field.name);
        if (matchedFiles.length > 0) {
          const savedNames = StorageManager.moveTempFilesToRecord(collection.id, recId, matchedFiles);
          validatedData[field.name] = (field.options?.maxFiles || 1) > 1 ? JSON.stringify(savedNames) : savedNames[0];
        }
      }
    }

    // Run BeforeUpdate Hook
    await HookManager.triggerBeforeUpdate({
      collection,
      id: recId,
      existing,
      data: validatedData,
      auth: req.auth,
    });

    const setClauses = [];
    const values = [];

    for (const [col, val] of Object.entries(validatedData)) {
      setClauses.push(`"${col}" = ?`);
      values.push(val);
    }
    values.push(recId);

    db.run(`UPDATE "${collection.name}" SET ${setClauses.join(', ')} WHERE id = ?`, values);

    const updatedRecord = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recId]);
    const cleaned = cleanRecord(updatedRecord, collection);

    // Run AfterUpdate Hook
    await HookManager.triggerAfterUpdate({
      collection,
      id: recId,
      existing,
      record: updatedRecord,
      auth: req.auth,
    });

    // Dispatch realtime event
    RealtimeHub.dispatch('update', collection.name, cleaned);

    res.json(cleaned);
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});

// 5. Delete record
recordsRouter.delete('/:name/records/:id', async (req, res) => {
  try {
    const colName = getParam(req.params.name);
    const recId = getParam(req.params.id);
    const collection = SchemaManager.getCollection(colName);
    if (!collection) {
      res.status(404).json({ code: 404, message: `Collection "${colName}" not found` });
      return;
    }

    const db = getDB();
    const existing = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recId]);
    if (!existing) {
      res.status(404).json({ code: 404, message: 'Record not found' });
      return;
    }

    const ruleContext = buildRuleContext(req, existing);
    const ruleEval = RuleEvaluator.evaluate(collection.deleteRule, ruleContext);
    if (!ruleEval.allowed) {
      res.status(403).json({ code: 403, message: 'Access denied by collection delete rule' });
      return;
    }

    // Run BeforeDelete Hook
    await HookManager.triggerBeforeDelete({
      collection,
      id: recId,
      existing,
      auth: req.auth,
    });

    db.run(`DELETE FROM "${collection.name}" WHERE id = ?`, [recId]);

    // Clean files
    StorageManager.deleteRecordFiles(collection.id, recId);

    const cleaned = cleanRecord(existing, collection);

    // Run AfterDelete Hook
    await HookManager.triggerAfterDelete({
      collection,
      id: recId,
      existing,
      auth: req.auth,
    });

    RealtimeHub.dispatch('delete', collection.name, cleaned);

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message });
  }
});
