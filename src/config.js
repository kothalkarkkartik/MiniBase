import path from 'node:path';
import fs from 'node:fs';

// Zero-Dependency Native .env Loader
function loadEnv() {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile();
      return;
    } catch {
      // .env file might not exist, proceed
    }
  }

  // Fallback simple .env parser
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

loadEnv();

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

const parsedArgs = parseArgs();

const dataDir = path.resolve(
  parsedArgs.dir || process.env.DATA_DIR || './minibase_data'
);

// Ensure directories exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const storageDir = path.join(dataDir, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export const config = {
  port: parseInt(parsedArgs.port || process.env.PORT || '8090', 10),
  host: parsedArgs.host || process.env.HOST || '0.0.0.0',
  dataDir,
  dbPath: path.join(dataDir, 'data.db'),
  storageDir,
  jwtSecret:
    parsedArgs['jwt-secret'] ||
    process.env.JWT_SECRET ||
    'minibase-default-secure-jwt-key-2026-minibase-secret',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  isDev: Boolean(parsedArgs.dev || process.env.NODE_ENV === 'development'),
  appName: process.env.APP_NAME || 'MiniBase',
  ssl: Boolean(parsedArgs.ssl || parsedArgs.https || process.env.SSL_ENABLED === 'true' || process.env.HTTPS === 'true'),
  sslCertPath: parsedArgs['ssl-cert'] || process.env.SSL_CERT || process.env.SSL_CERT_PATH,
  sslKeyPath: parsedArgs['ssl-key'] || process.env.SSL_KEY || process.env.SSL_KEY_PATH,
  httpsPort: parseInt(parsedArgs['https-port'] || process.env.HTTPS_PORT || '8443', 10),
};

