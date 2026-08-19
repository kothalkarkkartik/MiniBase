import { Router } from 'express';
import { getDB } from '../core/db.js';
import { SchemaManager } from '../core/schema.js';
import { RuleEvaluator } from '../core/rules.js';
import { RealtimeHub } from '../core/realtime.js';
import { generateId } from '../utils/id.js';

export const batchRouter = Router();

batchRouter.post('/', async (req, res) => {
  const { requests } = req.body;

  if (!Array.isArray(requests) || requests.length === 0) {
    res.status(400).json({ code: 400, message: 'Batch requests array is required' });
    return;
  }

  if (requests.length > 100) {
    res.status(400).json({ code: 400, message: 'Batch size exceeds maximum limit of 100 operations' });
    return;
  }

  const db = getDB();
  const responses = [];
  const realtimeEventsToDispatch = [];

  try {
    db.transaction(() => {
      for (const subReq of requests) {
        const method = (subReq.method || 'GET').toUpperCase();
        const url = subReq.url || '';

        // Match /api/collections/:name/records or /api/collections/:name/records/:id
        const match = url.match(/\/api\/collections\/([a-zA-Z0-9_]+)\/records(?:\/([a-zA-Z0-9_]+))?/);
        if (!match) {
          throw new Error(`Unsupported batch operation URL "${url}". Only collection record endpoints are supported.`);
        }

        const colName = match[1];
        const recordId = match[2];

        const collection = SchemaManager.getCollection(colName);
        if (!collection) {
          throw new Error(`Collection "${colName}" in batch operation not found`);
        }

        const ruleContext = {
          isAdmin: req.isAdmin,
          auth: req.auth ? { id: req.auth.id, email: req.auth.email, collectionId: req.auth.collectionId, collectionName: req.auth.collectionName } : null,
          data: subReq.body,
        };

        if (method === 'POST') {
          // Create record
          const ruleEval = RuleEvaluator.evaluate(collection.createRule, ruleContext);
          if (!ruleEval.allowed) {
            throw new Error(`Access denied by create rule on collection "${colName}"`);
          }

          const rawData = { ...(subReq.body || {}) };
          const validated = SchemaManager.validateRecordData(collection, rawData, true);
          const newId = rawData.id || generateId();
          const now = new Date().toISOString();
          validated.id = newId;
          validated.created = now;
          validated.updated = now;

          const cols = Object.keys(validated);
          const placeholders = cols.map(() => '?').join(', ');
          db.run(
            `INSERT INTO "${collection.name}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
            Object.values(validated)
          );

          const inserted = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [newId]);
          responses.push({ status: 201, body: inserted });
          realtimeEventsToDispatch.push({ action: 'create', collection: collection.name, record: inserted });

        } else if (method === 'PATCH') {
          // Update record
          if (!recordId) throw new Error(`Missing record ID for PATCH operation on "${colName}"`);

          const existing = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recordId]);
          if (!existing) throw new Error(`Record "${recordId}" in collection "${colName}" not found`);

          ruleContext.data = { ...existing, ...subReq.body };
          const ruleEval = RuleEvaluator.evaluate(collection.updateRule, ruleContext);
          if (!ruleEval.allowed) {
            throw new Error(`Access denied by update rule on collection "${colName}"`);
          }

          const rawData = { ...(subReq.body || {}) };
          const validated = SchemaManager.validateRecordData(collection, rawData, false, existing);
          validated.updated = new Date().toISOString();

          const setClauses = [];
          const values = [];
          for (const [col, val] of Object.entries(validated)) {
            setClauses.push(`"${col}" = ?`);
            values.push(val);
          }
          values.push(recordId);

          db.run(`UPDATE "${collection.name}" SET ${setClauses.join(', ')} WHERE id = ?`, values);
          const updated = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recordId]);
          responses.push({ status: 200, body: updated });
          realtimeEventsToDispatch.push({ action: 'update', collection: collection.name, record: updated });

        } else if (method === 'DELETE') {
          // Delete record
          if (!recordId) throw new Error(`Missing record ID for DELETE operation on "${colName}"`);

          const existing = db.queryOne(`SELECT * FROM "${collection.name}" WHERE id = ?`, [recordId]);
          if (!existing) throw new Error(`Record "${recordId}" in collection "${colName}" not found`);

          ruleContext.data = existing;
          const ruleEval = RuleEvaluator.evaluate(collection.deleteRule, ruleContext);
          if (!ruleEval.allowed) {
            throw new Error(`Access denied by delete rule on collection "${colName}"`);
          }

          db.run(`DELETE FROM "${collection.name}" WHERE id = ?`, [recordId]);
          responses.push({ status: 200, body: { message: 'Deleted successfully' } });
          realtimeEventsToDispatch.push({ action: 'delete', collection: collection.name, record: existing });

        } else {
          throw new Error(`Method "${method}" is not supported in atomic batch requests`);
        }
      }
    });

    // After transaction commits successfully, dispatch realtime events
    for (const evt of realtimeEventsToDispatch) {
      RealtimeHub.dispatch(evt.action, evt.collection, evt.record);
    }

    res.json({ responses });
  } catch (err) {
    res.status(400).json({
      code: 400,
      message: `Batch transaction aborted: ${err.message}`,
      data: {},
    });
  }
});
