import { getDB } from './db.js';
import { generateId } from '../utils/id.js';

export class SchemaManager {
  static sanitizeIdentifier(name) {
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      throw new Error(`Invalid identifier: "${name}". Only alphanumeric and underscore allowed.`);
    }
    return name;
  }

  static mapFieldToSQLiteType(field) {
    let typeDef = 'TEXT';
    switch (field.type) {
      case 'number':
        typeDef = 'NUMERIC';
        break;
      case 'bool':
        typeDef = 'INTEGER';
        break;
      case 'text':
      case 'email':
      case 'url':
      case 'date':
      case 'select':
      case 'json':
      case 'file':
      case 'relation':
      default:
        typeDef = 'TEXT';
        break;
    }

    const constraints = [];
    if (field.required) {
      // In SQLite, if adding a column to existing table with NOT NULL, default must be provided
      if (field.default !== undefined && field.default !== null) {
        const defVal = typeof field.default === 'string' ? `'${field.default.replace(/'/g, "''")}'` : field.default;
        constraints.push(`DEFAULT ${defVal}`);
      }
    } else if (field.default !== undefined && field.default !== null) {
      const defVal = typeof field.default === 'string' ? `'${field.default.replace(/'/g, "''")}'` : field.default;
      constraints.push(`DEFAULT ${defVal}`);
    }

    return [typeDef, ...constraints].join(' ');
  }

  static syncCollectionTable(collection) {
    const db = getDB();
    const tableName = this.sanitizeIdentifier(collection.name);

    if (collection.type === 'view') {
      const viewQuery = collection.options?.viewQuery || collection.options?.query || '';
      if (!viewQuery) {
        throw new Error('viewQuery option is required for view collections');
      }
      db.exec(`DROP VIEW IF EXISTS "${tableName}";`);
      db.exec(`CREATE VIEW "${tableName}" AS ${viewQuery};`);
      return;
    }

    // Check if table exists
    const tableExists = db.queryOne(
      `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
      [tableName]
    );

    if (!tableExists) {
      // Create new table
      const columns = [
        'id TEXT PRIMARY KEY',
        'created TEXT NOT NULL',
        'updated TEXT NOT NULL',
      ];

      if (collection.type === 'auth') {
        columns.push(
          'email TEXT UNIQUE NOT NULL',
          'passwordHash TEXT NOT NULL',
          'tokenKey TEXT NOT NULL',
          'verified INTEGER NOT NULL DEFAULT 0',
          'emailVisibility INTEGER NOT NULL DEFAULT 0',
          'lastResetSentAt TEXT'
        );
      }

      // Add user-defined schema fields
      for (const field of collection.schema) {
        const colName = this.sanitizeIdentifier(field.name);
        const colDef = this.mapFieldToSQLiteType(field);
        columns.push(`"${colName}" ${colDef}`);
      }

      const createSql = `CREATE TABLE "${tableName}" (\n  ${columns.join(',\n  ')}\n);`;
      db.exec(createSql);

      // Create unique indexes
      for (const field of collection.schema) {
        if (field.unique) {
          const colName = this.sanitizeIdentifier(field.name);
          db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_${tableName}_${colName}" ON "${tableName}"("${colName}");`);
        }
      }

      // Create standard index on created date
      db.exec(`CREATE INDEX IF NOT EXISTS "idx_${tableName}_created" ON "${tableName}"(created DESC);`);
    } else {
      // Table exists: Check missing columns and alter table
      const existingCols = db.queryAll(`PRAGMA table_info("${tableName}")`);
      const existingColNames = new Set(existingCols.map(c => c.name.toLowerCase()));

      // If type is auth, ensure auth columns exist
      if (collection.type === 'auth') {
        const authCols = {
          email: 'TEXT',
          passwordHash: 'TEXT',
          tokenKey: 'TEXT',
          verified: 'INTEGER DEFAULT 0',
          emailVisibility: 'INTEGER DEFAULT 0',
          lastResetSentAt: 'TEXT',
        };

        for (const [colName, colType] of Object.entries(authCols)) {
          if (!existingColNames.has(colName.toLowerCase())) {
            db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${colType};`);
          }
        }
      }

      // Check user schema fields
      for (const field of collection.schema) {
        const colName = this.sanitizeIdentifier(field.name);
        if (!existingColNames.has(colName.toLowerCase())) {
          const colDef = this.mapFieldToSQLiteType(field);
          db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${colDef};`);
        }

        // Add index if unique
        if (field.unique) {
          try {
            db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_${tableName}_${colName}" ON "${tableName}"("${colName}");`);
          } catch {
            // Index might already exist
          }
        }
      }
    }
  }

  static getAllCollections() {
    const db = getDB();
    const rows = db.queryAll(`SELECT * FROM _collections ORDER BY name ASC`);

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      schema: JSON.parse(r.schema || '[]'),
      listRule: r.listRule,
      viewRule: r.viewRule,
      createRule: r.createRule,
      updateRule: r.updateRule,
      deleteRule: r.deleteRule,
      indexes: JSON.parse(r.indexes || '[]'),
      options: JSON.parse(r.options || '{}'),
      created: r.created,
      updated: r.updated,
    }));
  }

  static getCollection(nameOrId) {
    const db = getDB();
    const row = db.queryOne(`SELECT * FROM _collections WHERE id = ? OR name = ?`, [nameOrId, nameOrId]);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      schema: JSON.parse(row.schema || '[]'),
      listRule: row.listRule,
      viewRule: row.viewRule,
      createRule: row.createRule,
      updateRule: row.updateRule,
      deleteRule: row.deleteRule,
      indexes: JSON.parse(row.indexes || '[]'),
      options: JSON.parse(row.options || '{}'),
      created: row.created,
      updated: row.updated,
    };
  }

  static createCollection(data) {
    const db = getDB();

    if (!data.name || !/^[a-zA-Z0-9_]+$/.test(data.name)) {
      throw new Error('Collection name must be non-empty alphanumeric string');
    }

    const existing = this.getCollection(data.name);
    if (existing) {
      throw new Error(`Collection "${data.name}" already exists`);
    }

    const now = new Date().toISOString();
    const id = data.id || generateId();
    const schema = (data.schema || []).map(f => ({
      ...f,
      id: f.id || generateId(8),
    }));

    const collection = {
      id,
      name: data.name,
      type: data.type || 'base',
      schema,
      listRule: data.listRule === undefined ? null : data.listRule,
      viewRule: data.viewRule === undefined ? null : data.viewRule,
      createRule: data.createRule === undefined ? null : data.createRule,
      updateRule: data.updateRule === undefined ? null : data.updateRule,
      deleteRule: data.deleteRule === undefined ? null : data.deleteRule,
      indexes: data.indexes || [],
      options: data.options || {},
      created: now,
      updated: now,
    };

    db.transaction(() => {
      db.run(
        `INSERT INTO _collections (id, name, type, schema, listRule, viewRule, createRule, updateRule, deleteRule, indexes, options, created, updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          collection.id,
          collection.name,
          collection.type,
          JSON.stringify(collection.schema),
          collection.listRule,
          collection.viewRule,
          collection.createRule,
          collection.updateRule,
          collection.deleteRule,
          JSON.stringify(collection.indexes),
          JSON.stringify(collection.options),
          collection.created,
          collection.updated,
        ]
      );

      this.syncCollectionTable(collection);
    });

    return collection;
  }

  static updateCollection(idOrName, data) {
    const db = getDB();
    const existing = this.getCollection(idOrName);
    if (!existing) {
      throw new Error(`Collection "${idOrName}" not found`);
    }

    const now = new Date().toISOString();
    const newName = data.name || existing.name;

    if (newName !== existing.name) {
      const nameTaken = this.getCollection(newName);
      if (nameTaken && nameTaken.id !== existing.id) {
        throw new Error(`Collection name "${newName}" is already taken`);
      }
    }

    const schema = data.schema
      ? data.schema.map(f => ({
          ...f,
          id: f.id || generateId(8),
        }))
      : existing.schema;

    const updatedCollection = {
      ...existing,
      name: newName,
      type: data.type || existing.type,
      schema,
      listRule: data.listRule !== undefined ? data.listRule : existing.listRule,
      viewRule: data.viewRule !== undefined ? data.viewRule : existing.viewRule,
      createRule: data.createRule !== undefined ? data.createRule : existing.createRule,
      updateRule: data.updateRule !== undefined ? data.updateRule : existing.updateRule,
      deleteRule: data.deleteRule !== undefined ? data.deleteRule : existing.deleteRule,
      indexes: data.indexes !== undefined ? data.indexes : existing.indexes,
      options: data.options !== undefined ? data.options : existing.options,
      updated: now,
    };

    db.transaction(() => {
      // If collection was renamed
      if (newName !== existing.name) {
        db.exec(`ALTER TABLE "${this.sanitizeIdentifier(existing.name)}" RENAME TO "${this.sanitizeIdentifier(newName)}";`);
      }

      db.run(
        `UPDATE _collections
         SET name = ?, type = ?, schema = ?, listRule = ?, viewRule = ?, createRule = ?, updateRule = ?, deleteRule = ?, indexes = ?, options = ?, updated = ?
         WHERE id = ?`,
        [
          updatedCollection.name,
          updatedCollection.type,
          JSON.stringify(updatedCollection.schema),
          updatedCollection.listRule,
          updatedCollection.viewRule,
          updatedCollection.createRule,
          updatedCollection.updateRule,
          updatedCollection.deleteRule,
          JSON.stringify(updatedCollection.indexes),
          JSON.stringify(updatedCollection.options),
          updatedCollection.updated,
          updatedCollection.id,
        ]
      );

      this.syncCollectionTable(updatedCollection);
    });

    return updatedCollection;
  }

  static deleteCollection(idOrName) {
    const db = getDB();
    const existing = this.getCollection(idOrName);
    if (!existing) {
      throw new Error(`Collection "${idOrName}" not found`);
    }

    db.transaction(() => {
      db.run(`DELETE FROM _collections WHERE id = ?`, [existing.id]);
      if (existing.type === 'view') {
        db.exec(`DROP VIEW IF EXISTS "${this.sanitizeIdentifier(existing.name)}";`);
      } else {
        db.exec(`DROP TABLE IF EXISTS "${this.sanitizeIdentifier(existing.name)}";`);
      }
    });
  }

  static validateRecordData(collection, data, isCreate, existingRecord) {
    if (collection.type === 'view') {
      throw new Error(`Cannot insert, update or delete records on a view collection ("${collection.name}")`);
    }
    const validated = {};

    for (const field of collection.schema) {
      let val = data[field.name];

      if (val === undefined) {
        if (isCreate) {
          if (field.required) {
            throw new Error(`Field "${field.name}" is required.`);
          }
          val = field.default !== undefined ? field.default : null;
        } else {
          continue; // keep unchanged in partial update
        }
      }

      // Value normalization & type checks
      if (val !== null && val !== undefined) {
        switch (field.type) {
          case 'number':
            val = Number(val);
            if (isNaN(val)) throw new Error(`Field "${field.name}" must be a valid number.`);
            if (field.options?.min !== undefined && val < field.options.min) {
              throw new Error(`Field "${field.name}" must be >= ${field.options.min}.`);
            }
            if (field.options?.max !== undefined && val > field.options.max) {
              throw new Error(`Field "${field.name}" must be <= ${field.options.max}.`);
            }
            break;

          case 'bool':
            val = Boolean(val) ? 1 : 0;
            break;

          case 'email':
            val = String(val).trim();
            if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
              throw new Error(`Field "${field.name}" must be a valid email.`);
            }
            break;

          case 'url':
            val = String(val).trim();
            if (val && !/^https?:\/\/.+/.test(val)) {
              throw new Error(`Field "${field.name}" must be a valid URL starting with http:// or https://.`);
            }
            break;

          case 'select':
            if (field.options?.values && field.options.values.length > 0) {
              if (Array.isArray(val)) {
                for (const item of val) {
                  if (!field.options.values.includes(item)) {
                    throw new Error(`Invalid select value "${item}" for field "${field.name}".`);
                  }
                }
                val = JSON.stringify(val);
              } else if (!field.options.values.includes(val)) {
                throw new Error(`Invalid select value "${val}" for field "${field.name}".`);
              }
            }
            break;

          case 'json':
            if (typeof val === 'object') {
              val = JSON.stringify(val);
            }
            break;

          case 'date':
            if (val instanceof Date) {
              val = val.toISOString();
            } else if (typeof val === 'string') {
              const d = new Date(val);
              if (isNaN(d.getTime())) throw new Error(`Invalid date format for field "${field.name}".`);
              val = d.toISOString();
            }
            break;
        }
      }

      validated[field.name] = val;
    }

    return validated;
  }
}
