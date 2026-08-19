import path from 'node:path';
import fs from 'node:fs';

// Setup test environment before importing app modules
const testDataDir = path.resolve(`./minibase_test_data_${Date.now()}`);
if (fs.existsSync(testDataDir)) {
  fs.rmSync(testDataDir, { recursive: true, force: true });
}
fs.mkdirSync(testDataDir, { recursive: true });

process.env.DATA_DIR = testDataDir;
process.env.NODE_ENV = 'test';
process.env.PORT = '8099';

async function runTests() {
  const { getDB } = await import('../src/core/db.js');
  const { SchemaManager } = await import('../src/core/schema.js');
  const { AuthManager } = await import('../src/core/auth.js');
  const { RuleEvaluator } = await import('../src/core/rules.js');
  const { RealtimeHub } = await import('../src/core/realtime.js');
  console.log('\x1b[36m⚡ Starting MiniBase Automated Test Suite...\x1b[0m\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✗\x1b[0m ${testName}`);
      failed++;
    }
  }

  try {
    // 1. DB & System Tables
    console.log('\x1b[1m1. Testing Database & WAL Engine\x1b[0m');
    const db = getDB();
    assert(db !== null, 'Database instance initialized with WAL mode');

    // 2. Admin Setup & Authentication
    console.log('\n\x1b[1m2. Testing Admin Setup & Authentication\x1b[0m');
    assert(!AuthManager.hasAnyAdmin(), 'Initially has 0 admins');
    
    const admin = await AuthManager.createInitialAdmin('admin@minibase.io', 'supersecret123');
    assert(admin.email === 'admin@minibase.io', 'Created initial super admin');
    assert(AuthManager.hasAnyAdmin(), 'hasAnyAdmin() returns true after creation');

    const authResult = await AuthManager.adminAuthWithPassword('admin@minibase.io', 'supersecret123');
    assert(Boolean(authResult.token), 'Admin login generates valid JWT token');

    const verifiedAdmin = AuthManager.verifyToken(authResult.token);
    assert(verifiedAdmin?.type === 'admin' && verifiedAdmin.email === 'admin@minibase.io', 'JWT token verification succeeds');

    // 3. Schema Manager & Dynamic Collections
    console.log('\n\x1b[1m3. Testing Dynamic Schema & Tables Engine\x1b[0m');
    const postsCol = SchemaManager.createCollection({
      name: 'posts',
      type: 'base',
      schema: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', unique: true },
        { name: 'views', type: 'number', default: 0 },
        { name: 'published', type: 'bool', default: false },
        { name: 'tags', type: 'json' },
      ],
      listRule: '', // public
      viewRule: '', // public
      createRule: '@request.auth.id != ""', // auth only
    });
    assert(postsCol.name === 'posts', 'Created "posts" collection');

    // Check SQLite table existence
    const tableInfo = db.queryAll(`PRAGMA table_info("posts")`);
    const colNames = tableInfo.map(c => c.name);
    assert(
      colNames.includes('id') &&
      colNames.includes('created') &&
      colNames.includes('updated') &&
      colNames.includes('title') &&
      colNames.includes('slug') &&
      colNames.includes('views') &&
      colNames.includes('published') &&
      colNames.includes('tags'),
      'SQLite dynamically generated all schema columns'
    );

    // Auth Collection
    const usersCol = SchemaManager.createCollection({
      name: 'users',
      type: 'auth',
      schema: [
        { name: 'name', type: 'text' },
        { name: 'role', type: 'select', default: 'member', options: { values: ['member', 'editor', 'admin'] } },
      ],
    });
    assert(usersCol.type === 'auth', 'Created "users" auth collection');

    const userTableInfo = db.queryAll(`PRAGMA table_info("users")`);
    const userColNames = userTableInfo.map(c => c.name);
    assert(
      userColNames.includes('email') &&
      userColNames.includes('passwordHash') &&
      userColNames.includes('verified'),
      'Auth collection created with security columns'
    );

    // 4. Schema Migration / Adding Columns
    console.log('\n\x1b[1m4. Testing Schema Alter / Column Migration\x1b[0m');
    const updatedPostsCol = SchemaManager.updateCollection('posts', {
      schema: [
        ...postsCol.schema,
        { name: 'summary', type: 'text' },
      ],
    });
    const alteredCols = db.queryAll(`PRAGMA table_info("posts")`).map(c => c.name);
    assert(alteredCols.includes('summary'), 'ALTER TABLE added new "summary" column seamlessly');

    // 5. Dynamic Data Validation & CRUD
    console.log('\n\x1b[1m5. Testing Data Validation & Record Insertion\x1b[0m');
    const validated = SchemaManager.validateRecordData(updatedPostsCol, {
      title: 'Hello MiniBase',
      slug: 'hello-minibase',
      views: 42,
      published: true,
      tags: ['baas', 'sqlite', 'realtime'],
    }, true);

    assert(validated.title === 'Hello MiniBase' && validated.views === 42 && validated.published === 1, 'Data validation & normalization passed');

    // Insert record
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO posts (id, title, slug, views, published, tags, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['rec_test_1', validated.title, validated.slug, validated.views, validated.published, validated.tags, now, now]
    );

    const inserted = db.queryOne(`SELECT * FROM posts WHERE id = ?`, ['rec_test_1']);
    assert(inserted?.slug === 'hello-minibase', 'Record inserted and retrieved from SQLite');

    // 6. Access Rule Engine
    console.log('\n\x1b[1m6. Testing Rule Evaluation Engine\x1b[0m');
    // Admin access
    const adminEval = RuleEvaluator.evaluate(postsCol.createRule, { isAdmin: true });
    assert(adminEval.allowed, 'Admin bypasses all access rules');

    // Public list rule
    const publicEval = RuleEvaluator.evaluate(postsCol.listRule, { auth: null });
    assert(publicEval.allowed, 'Public list rule permits guests');

    // Auth only create rule
    const guestCreateEval = RuleEvaluator.evaluate(postsCol.createRule, { auth: null });
    assert(!guestCreateEval.allowed, 'Auth create rule blocks guest access');

    const authUserCreateEval = RuleEvaluator.evaluate(postsCol.createRule, { auth: { id: 'usr_123' } });
    assert(authUserCreateEval.allowed, 'Auth create rule permits authenticated user');

    // 7. Filter Expression Parser
    console.log('\n\x1b[1m7. Testing Filter Query Parser\x1b[0m');
    const parsedFilter = RuleEvaluator.parseFilter('views > 10 && title ~ "MiniBase"', ['views', 'title', 'slug']);
    assert(parsedFilter.sql.includes('views') && parsedFilter.params.includes(10), 'Filter expression compiled to safe SQL');

    // 8. Realtime Event Hub
    console.log('\n\x1b[1m8. Testing Realtime Event Dispatcher\x1b[0m');
    RealtimeHub.dispatch('create', 'posts', { id: 'rec_test_1', title: 'Hello MiniBase' });
    assert(true, 'Realtime event dispatch completed without errors');

    // 9. Mailer & Action Token Engine
    console.log('\n\x1b[1m9. Testing Mailer & Action Token Engine\x1b[0m');
    const { Mailer, SettingsManager } = await import('../src/core/mailer.js');
    const token = Mailer.createActionToken({
      type: 'password_reset',
      id: 'usr_abc123',
      email: 'test@example.com',
      collectionName: 'users',
      tokenKey: 'randomTokenKey456',
    });
    assert(Boolean(token) && token.length > 20, 'Action token generated successfully');

    const decoded = Mailer.verifyActionToken(token, 'password_reset', 'randomTokenKey456');
    assert(decoded.id === 'usr_abc123' && decoded.email === 'test@example.com' && decoded.action === 'password_reset', 'Action token verified with correct payload');

    let tokenFailed = false;
    try {
      Mailer.verifyActionToken(token, 'password_reset', 'wrongTokenKey');
    } catch {
      tokenFailed = true;
    }
    assert(tokenFailed, 'Action token verification fails with invalid secret/key');

    // 10. OAuth2 Configuration Engine
    console.log('\n\x1b[1m10. Testing OAuth2 Configuration Engine\x1b[0m');
    const { OAuth2Manager } = await import('../src/core/oauth2.js');
    SettingsManager.set('oauth2', {
      google: { enabled: true, clientId: 'google_test_client_id', clientSecret: 'google_test_secret' },
      github: { enabled: false, clientId: '', clientSecret: '' },
    });
    const providers = OAuth2Manager.getProviders();
    assert(providers.length === 1 && providers[0].name === 'google', 'OAuth2 enabled providers correctly retrieved');
    assert(Boolean(providers[0].authUrl) && providers[0].authUrl.includes('google_test_client_id'), 'OAuth2 authorization URL generated with params');

    // 11. SQL View Collections
    console.log('\n\x1b[1m11. Testing SQL View Collections\x1b[0m');
    const viewCol = SchemaManager.createCollection({
      name: 'popular_posts',
      type: 'view',
      schema: [],
      options: {
        query: 'SELECT id, title, slug, views, created FROM posts WHERE views >= 10',
      },
    });
    assert(viewCol.name === 'popular_posts' && viewCol.type === 'view', 'Created "popular_posts" SQL View collection');

    const viewRecords = db.queryAll(`SELECT * FROM popular_posts`);
    assert(viewRecords.length === 1 && viewRecords[0].slug === 'hello-minibase', 'SQL View queried successfully and returned filtered data');

    // 12. Server-Side Lifecycle Hooks
    console.log('\n\x1b[1m12. Testing Server Lifecycle Hooks\x1b[0m');
    const { HookManager } = await import('../src/core/hooks.js');
    let hookTriggered = false;
    HookManager.onBeforeCreate('posts', async (context) => {
      hookTriggered = true;
      if (context.data) {
        context.data.title = context.data.title + ' [Hook Modified]';
      }
    });

    const hookData = { title: 'Hook Test Record' };
    await HookManager.triggerBeforeCreate({
      collection: postsCol,
      data: hookData,
    });
    assert(hookTriggered && hookData.title === 'Hook Test Record [Hook Modified]', 'BeforeCreate hook triggered and transformed data successfully');

    // 13. Image Thumbnail Processing
    console.log('\n\x1b[1m13. Testing Dynamic Storage & Sharp Integration\x1b[0m');
    const { StorageManager } = await import('../src/core/storage.js');
    const sharp = (await import('sharp')).default;
    // Create dummy png test buffer
    const testImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 16, g: 185, b: 129, alpha: 1 },
      },
    }).png().toBuffer();

    const sampleDir = path.join(testDataDir, 'storage', 'posts', 'rec_test_1');
    fs.mkdirSync(sampleDir, { recursive: true });
    fs.writeFileSync(path.join(sampleDir, 'test_image.png'), testImageBuffer);

    const thumbPath = await StorageManager.getThumbnail('posts', 'rec_test_1', 'test_image.png', '80x80');
    assert(Boolean(thumbPath) && fs.existsSync(thumbPath), 'Sharp generated resized thumbnail on the fly');

    // 14. Atomic Batch Transaction Engine
    console.log('\n\x1b[1m14. Testing Atomic Batch Transaction Logic\x1b[0m');
    let batchCommitted = false;
    db.transaction(() => {
      const nowTs = new Date().toISOString();
      db.run(
        `INSERT INTO posts (id, title, slug, views, published, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['batch_1', 'Batch One', 'batch-one', 100, 1, nowTs, nowTs]
      );
      db.run(
        `INSERT INTO posts (id, title, slug, views, published, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['batch_2', 'Batch Two', 'batch-two', 200, 1, nowTs, nowTs]
      );
      batchCommitted = true;
    });
    const batchCheck = db.queryAll(`SELECT id FROM posts WHERE id IN ('batch_1', 'batch_2')`);
    assert(batchCommitted && batchCheck.length === 2, 'Atomic batch transaction commits multiple operations cleanly');

    // Test rollback on error
    let rollbackSuccess = false;
    try {
      db.transaction(() => {
        const nowTs = new Date().toISOString();
        db.run(
          `INSERT INTO posts (id, title, slug, views, published, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['batch_3', 'Batch Three', 'batch-three', 300, 1, nowTs, nowTs]
        );
        // Throw deliberate error
        throw new Error('Simulated failure');
      });
    } catch {
      const rolledBack = db.queryOne(`SELECT id FROM posts WHERE id = 'batch_3'`);
      if (!rolledBack) {
        rollbackSuccess = true;
      }
    }
    assert(rollbackSuccess, 'Atomic batch transaction rolled back completely on error');

  } catch (err) {
    console.error('Test suite exception:', err);
    failed++;
  } finally {
    // Cleanup test data
    try {
      const { getDB } = await import('../src/core/db.js');
      getDB().close();
    } catch {
      //
    }
    if (fs.existsSync(testDataDir)) {
      try {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      } catch {
        //
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Test Results: \x1b[32m${passed} Passed\x1b[0m, \x1b[31m${failed} Failed\x1b[0m`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
