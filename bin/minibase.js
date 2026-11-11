#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0] || 'serve';

function printHelp() {
  console.log(`
\x1b[38;2;16;185;129m⚡ MiniBase CLI — Ultra-lightweight Backend-as-a-Service (BaaS)\x1b[0m

\x1b[1mUSAGE:\x1b[0m
  $ minibase [command] [options]
  $ npx minibase [command] [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[36mserve\x1b[0m                            Start the MiniBase server & Admin Studio (default)
  \x1b[36mstatus\x1b[0m                           Show database health, storage size & collections
  \x1b[36mbackup [path]\x1b[0m                    Create an instant SQLite hot backup
  \x1b[36msql "<query>"\x1b[0m                    Run direct SQLite queries and print table

  \x1b[36madmin list\x1b[0m                       List all Super-Admin accounts
  \x1b[36madmin create <email> <password>\x1b[0m  Create a new Super-Admin
  \x1b[36madmin passwd <email> <password>\x1b[0m  Reset password for an admin
  \x1b[36madmin delete <email>\x1b[0m             Remove an admin account

  \x1b[36mcollections list\x1b[0m                 List all collections and record counts
  \x1b[36mcollections create <name> [--auth]\x1b[0m Create a new collection
  \x1b[36mcollections delete <name>\x1b[0m        Delete a collection

  \x1b[36mexport <collection> [file]\x1b[0m       Export collection records to CSV or JSON
  \x1b[36mimport <collection> <file>\x1b[0m       Bulk import CSV or JSON file into collection

  \x1b[36mversion, -v\x1b[0m                      Show MiniBase version
  \x1b[36mhelp, --help, -h\x1b[0m                 Show this help message

\x1b[1mOPTIONS:\x1b[0m
  \x1b[33m--port <number>\x1b[0m                  Set server port (default: 8090)
  \x1b[33m--host <address>\x1b[0m                 Set server host (default: 0.0.0.0)
  \x1b[33m--dir <path>\x1b[0m                     Set data directory (default: ./minibase_data)
  \x1b[33m--open\x1b[0m                           Automatically open Admin UI in browser
  \x1b[33m--no-open\x1b[0m                        Do not launch browser on start
  \x1b[33m--tunnel\x1b[0m                         Create instant public HTTPS tunnel
`);
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {}
}

if (command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'version' || command === '-v' || command === '--version') {
  const pkgPath = path.resolve(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  console.log(`MiniBase v${pkg.version}`);
  process.exit(0);
}

// 1. STATUS COMMAND
if (command === 'status') {
  const { getDB } = await import('../src/core/db.js');
  const { config } = await import('../src/config.js');
  const db = getDB();

  let dbSizeBytes = 0;
  try {
    const stat = fs.statSync(config.dbPath);
    dbSizeBytes = stat.size;
  } catch {}

  const collections = db.queryAll('SELECT id, name, type FROM _collections');
  const admins = db.queryAll('SELECT id, email, created FROM _admins');
  const logsCount = db.queryOne('SELECT COUNT(*) as c FROM _logs')?.c || 0;

  console.log(`\n\x1b[38;2;16;185;129m⚡ MiniBase System Status\x1b[0m`);
  console.log(`─────────────────────────────────────────────`);
  console.log(`Database Path   : \x1b[90m${config.dbPath}\x1b[0m`);
  console.log(`Database Size   : \x1b[1m${(dbSizeBytes / (1024 * 1024)).toFixed(2)} MB\x1b[0m`);
  console.log(`Server Port     : \x1b[32m${config.port}\x1b[0m`);
  console.log(`Admin Accounts  : \x1b[36m${admins.length}\x1b[0m`);
  console.log(`Collections     : \x1b[36m${collections.length}\x1b[0m`);
  console.log(`Total API Logs  : \x1b[90m${logsCount}\x1b[0m`);
  console.log(`─────────────────────────────────────────────\n`);

  if (collections.length > 0) {
    console.log(`\x1b[1mCollections Overview:\x1b[0m`);
    const overview = collections.map(col => {
      let count = 0;
      try {
        count = db.queryOne(`SELECT COUNT(*) as c FROM "${col.name}"`)?.c || 0;
      } catch {}
      return { Name: col.name, Type: col.type, Records: count };
    });
    console.table(overview);
  }
  process.exit(0);
}

// 2. BACKUP COMMAND
if (command === 'backup') {
  const backupDest = args[1] || `./minibase_backup_${Date.now()}.db`;
  const { config } = await import('../src/config.js');

  console.log(`\x1b[36m➜\x1b[0m Creating SQLite hot backup from \x1b[90m${config.dbPath}\x1b[0m...`);
  try {
    const destPath = path.resolve(backupDest);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    fs.copyFileSync(config.dbPath, destPath);
    console.log(`\x1b[32m✔ Backup created successfully:\x1b[0m ${destPath}`);
  } catch (err) {
    console.error(`\x1b[31m✖ Backup failed:\x1b[0m`, err.message);
  }
  process.exit(0);
}

// 3. SQL QUERY COMMAND
if (command === 'sql') {
  const query = args[1];
  if (!query) {
    console.error('\x1b[31mError:\x1b[0m Please provide a SQL query. Example: minibase sql "SELECT * FROM _admins"');
    process.exit(1);
  }

  const { getDB } = await import('../src/core/db.js');
  const db = getDB();

  try {
    const isSelect = query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('PRAGMA');
    if (isSelect) {
      const rows = db.queryAll(query);
      console.log(`\x1b[32m✔ Results (${rows.length} rows):\x1b[0m`);
      if (rows.length > 0) console.table(rows);
    } else {
      db.run(query);
      console.log(`\x1b[32m✔ Query executed successfully.\x1b[0m`);
    }
  } catch (err) {
    console.error(`\x1b[31m✖ SQL Error:\x1b[0m`, err.message);
  }
  process.exit(0);
}

// 4. ADMIN MANAGEMENT COMMANDS
if (command === 'admin') {
  const sub = args[1];
  const { getDB } = await import('../src/core/db.js');
  const { AuthManager } = await import('../src/core/auth.js');
  const { generateId, generateTokenKey } = await import('../src/utils/id.js');
  const db = getDB();

  if (sub === 'list') {
    const admins = db.queryAll('SELECT id, email, created, updated FROM _admins ORDER BY created ASC');
    console.log(`\x1b[38;2;16;185;129mSuper-Admin Accounts (${admins.length}):\x1b[0m`);
    console.table(admins);
    process.exit(0);
  }

  if (sub === 'create' || sub === 'add') {
    const email = args[2];
    const password = args[3];
    if (!email || !password || password.length < 8) {
      console.error('\x1b[31mError:\x1b[0m Email and password (min 8 chars) required. Example: minibase admin add user@example.com pass12345');
      process.exit(1);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.queryOne('SELECT id FROM _admins WHERE email = ?', [cleanEmail]);
    if (existing) {
      console.error(`\x1b[31m✖ Error:\x1b[0m Admin with email "${cleanEmail}" already exists.`);
      process.exit(1);
    }

    const now = new Date().toISOString();
    const id = generateId();
    const passwordHash = await AuthManager.hashPassword(password);
    const tokenKey = generateTokenKey();

    db.run(
      'INSERT INTO _admins (id, email, passwordHash, tokenKey, avatar, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, cleanEmail, passwordHash, tokenKey, null, now, now]
    );

    console.log(`\x1b[32m✔ Super-Admin created:\x1b[0m ${cleanEmail} (ID: ${id})`);
    process.exit(0);
  }

  if (sub === 'passwd' || sub === 'password') {
    const email = args[2];
    const newPass = args[3];
    if (!email || !newPass || newPass.length < 8) {
      console.error('\x1b[31mError:\x1b[0m Email and new password (min 8 chars) required. Example: minibase admin passwd user@example.com newPass123');
      process.exit(1);
    }

    const cleanEmail = email.toLowerCase().trim();
    const admin = db.queryOne('SELECT id FROM _admins WHERE email = ?', [cleanEmail]);
    if (!admin) {
      console.error(`\x1b[31m✖ Error:\x1b[0m Admin "${cleanEmail}" not found.`);
      process.exit(1);
    }

    const passwordHash = await AuthManager.hashPassword(newPass);
    const tokenKey = generateTokenKey();
    const now = new Date().toISOString();

    db.run('UPDATE _admins SET passwordHash = ?, tokenKey = ?, updated = ? WHERE id = ?', [passwordHash, tokenKey, now, admin.id]);
    console.log(`\x1b[32m✔ Password successfully updated for:\x1b[0m ${cleanEmail}`);
    process.exit(0);
  }

  if (sub === 'delete' || sub === 'remove') {
    const email = args[2];
    if (!email) {
      console.error('\x1b[31mError:\x1b[0m Please specify email. Example: minibase admin delete user@example.com');
      process.exit(1);
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminsCount = db.queryOne('SELECT COUNT(*) as c FROM _admins')?.c || 0;
    if (adminsCount <= 1) {
      console.error(`\x1b[31m✖ Cannot delete the only existing Super-Admin!\x1b[0m`);
      process.exit(1);
    }

    const res = db.run('DELETE FROM _admins WHERE email = ?', [cleanEmail]);
    console.log(`\x1b[32m✔ Admin removed:\x1b[0m ${cleanEmail}`);
    process.exit(0);
  }

  console.error('\x1b[31mUnknown admin command.\x1b[0m Run "minibase help" for usage.');
  process.exit(1);
}

// 5. COLLECTIONS COMMANDS
if (command === 'collections') {
  const sub = args[1];
  const { getDB } = await import('../src/core/db.js');
  const { SchemaManager } = await import('../src/core/schema.js');
  const db = getDB();

  if (sub === 'list') {
    const collections = SchemaManager.getAllCollections();
    if (collections.length === 0) {
      console.log('No collections found. Run "minibase collections create <name>" to create one.');
      process.exit(0);
    }

    const tableData = collections.map(c => {
      let count = 0;
      try { count = db.queryOne(`SELECT COUNT(*) as c FROM "${c.name}"`)?.c || 0; } catch {}
      return {
        Name: c.name,
        Type: c.type,
        Fields: c.schema.length,
        Records: count,
        Created: new Date(c.created).toLocaleDateString()
      };
    });
    console.table(tableData);
    process.exit(0);
  }

  if (sub === 'create') {
    const name = args[2];
    const isAuth = args.includes('--auth');
    if (!name) {
      console.error('\x1b[31mError:\x1b[0m Please provide collection name. Example: minibase collections create products');
      process.exit(1);
    }

    try {
      const col = SchemaManager.createCollection({
        name,
        type: isAuth ? 'auth' : 'base',
        schema: isAuth ? [{ name: 'name', type: 'text' }] : [{ name: 'title', type: 'text' }],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log(`\x1b[32m✔ Created collection:\x1b[0m ${col.name} (type: ${col.type})`);
    } catch (err) {
      console.error(`\x1b[31m✖ Error:\x1b[0m`, err.message);
    }
    process.exit(0);
  }

  if (sub === 'delete') {
    const name = args[2];
    if (!name) {
      console.error('\x1b[31mError:\x1b[0m Please provide collection name to delete. Example: minibase collections delete products');
      process.exit(1);
    }

    try {
      SchemaManager.deleteCollection(name);
      console.log(`\x1b[32m✔ Deleted collection:\x1b[0m ${name}`);
    } catch (err) {
      console.error(`\x1b[31m✖ Error:\x1b[0m`, err.message);
    }
    process.exit(0);
  }

  console.error('\x1b[31mUnknown collections command.\x1b[0m Run "minibase help" for usage.');
  process.exit(1);
}

// 6. EXPORT COMMAND
if (command === 'export') {
  const colName = args[1];
  const destFile = args[2] || `./${colName}_export.csv`;

  if (!colName) {
    console.error('\x1b[31mError:\x1b[0m Please provide collection name. Example: minibase export users ./my_users.csv');
    process.exit(1);
  }

  const { getDB } = await import('../src/core/db.js');
  const { SchemaManager } = await import('../src/core/schema.js');
  const { recordsToCsv } = await import('../src/utils/csv.js');

  const col = SchemaManager.getCollection(colName);
  if (!col) {
    console.error(`\x1b[31m✖ Collection "${colName}" does not exist.\x1b[0m`);
    process.exit(1);
  }

  const db = getDB();
  const records = db.queryAll(`SELECT * FROM "${col.name}" ORDER BY created DESC`);

  const isJson = destFile.toLowerCase().endsWith('.json');
  let output;

  if (isJson) {
    output = JSON.stringify(records, null, 2);
  } else {
    const schemaFields = col.schema.map(f => f.name);
    const columns = ['id', 'created', 'updated'];
    if (col.type === 'auth') columns.push('email', 'verified', 'emailVisibility');
    schemaFields.forEach(f => { if (!columns.includes(f)) columns.push(f); });
    output = recordsToCsv(records, columns);
  }

  fs.writeFileSync(destFile, output, 'utf-8');
  console.log(`\x1b[32m✔ Exported ${records.length} record(s) from "${col.name}" to:\x1b[0m ${destFile}`);
  process.exit(0);
}

// 7. IMPORT COMMAND
if (command === 'import') {
  const colName = args[1];
  const srcFile = args[2];

  if (!colName || !srcFile) {
    console.error('\x1b[31mError:\x1b[0m Please specify collection and file. Example: minibase import users ./users.csv');
    process.exit(1);
  }

  if (!fs.existsSync(srcFile)) {
    console.error(`\x1b[31m✖ File "${srcFile}" not found.\x1b[0m`);
    process.exit(1);
  }

  const { getDB } = await import('../src/core/db.js');
  const { SchemaManager } = await import('../src/core/schema.js');
  const { AuthManager } = await import('../src/core/auth.js');
  const { generateId, generateTokenKey } = await import('../src/utils/id.js');
  const { parseCsv } = await import('../src/utils/csv.js');

  const col = SchemaManager.getCollection(colName);
  if (!col) {
    console.error(`\x1b[31m✖ Collection "${colName}" not found.\x1b[0m`);
    process.exit(1);
  }

  const content = fs.readFileSync(srcFile, 'utf-8');
  let rows = [];

  if (srcFile.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(content);
    rows = Array.isArray(parsed) ? parsed : (parsed.records || parsed.items || [parsed]);
  } else {
    rows = parseCsv(content);
  }

  const db = getDB();
  const now = new Date().toISOString();
  const schemaMap = new Map(col.schema.map(f => [f.name.toLowerCase(), f]));
  let count = 0;

  let defaultHash = null;
  if (col.type === 'auth') defaultHash = await AuthManager.hashPassword('changeMe123');

  db.transaction(() => {
    for (const raw of rows) {
      const clean = {
        id: raw.id || generateId(),
        created: raw.created || now,
        updated: raw.updated || now,
      };

      for (const k of Object.keys(raw)) {
        const field = schemaMap.get(k.toLowerCase().trim());
        if (!field) continue;
        const val = raw[k];
        if (val === undefined || val === '') {
          clean[field.name] = null;
        } else if (field.type === 'number') {
          const n = Number(val);
          clean[field.name] = isNaN(n) ? null : n;
        } else if (field.type === 'bool') {
          clean[field.name] = val === true || val === 'true' || val === '1' || val === 1 ? 1 : 0;
        } else {
          clean[field.name] = String(val);
        }
      }

      if (col.type === 'auth') {
        clean.email = (raw.email || '').toLowerCase().trim();
        clean.passwordHash = defaultHash;
        clean.tokenKey = generateTokenKey();
        clean.verified = raw.verified === true || raw.verified === 'true' || raw.verified === 1 || raw.verified === '1' ? 1 : 0;
        clean.emailVisibility = 0;
      }

      const cols = Object.keys(clean).map(c => `"${c}"`).join(',');
      const placeholders = Object.keys(clean).map(() => '?').join(',');
      db.run(`INSERT OR REPLACE INTO "${col.name}" (${cols}) VALUES (${placeholders})`, Object.values(clean));
      count++;
    }
  });

  console.log(`\x1b[32m✔ Successfully imported ${count} record(s) into "${col.name}"!\x1b[0m`);
  process.exit(0);
}

// 8. SERVE COMMAND (DEFAULT)
try {
  const { app } = await import('../src/index.js');
  const { config } = await import('../src/config.js');

  const shouldOpen = !args.includes('--no-open');
  if (shouldOpen) {
    setTimeout(() => {
      openBrowser(`http://localhost:${config.port}/_/`);
    }, 600);
  }

  if (args.includes('--tunnel') || args.includes('--public') || args.includes('--subdomain') || process.env.MINIBASE_TUNNEL === 'true') {
    const { TunnelManager } = await import('../src/core/tunnel.js');

    const getArgValue = (flag) => {
      const idx = args.indexOf(flag);
      return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
    };

    const subdomain = getArgValue('--subdomain') || process.env.MINIBASE_SUBDOMAIN;
    const token = getArgValue('--token') || process.env.CLOUDFLARE_TUNNEL_TOKEN;
    const domain = getArgValue('--domain') || process.env.MINIBASE_DOMAIN;

    try {
      const publicUrl = await TunnelManager.start(config.port, { subdomain, token, domain });
      console.log(`
  \x1b[38;2;16;185;129m┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │   🌍 MiniBase is LIVE Worldwide (${subdomain ? `Custom Subdomain: ${subdomain}` : 'Public Tunnel'})
  │                                                                  │
  │   📱 Mobile / Flutter API URL:                                   │
  │   \x1b[1m\x1b[32m${publicUrl}\x1b[0m\x1b[38;2;16;185;129m
  │                                                                  │
  │   🖥️ Admin Studio (Anywhere in World):                           │
  │   \x1b[36m${publicUrl}/_/\x1b[0m\x1b[38;2;16;185;129m
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘\x1b[0m
`);
    } catch (err) {
      console.error('Failed to start public tunnel:', err.message);
    }
  }
} catch (err) {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n\x1b[33m➜ Server is already running on port 8090. Opening Admin Studio in browser...\x1b[0m`);
    openBrowser(`http://localhost:8090/_/`);
  } else {
    console.error('\x1b[31mError starting MiniBase:\x1b[0m', err.message);
  }
}
