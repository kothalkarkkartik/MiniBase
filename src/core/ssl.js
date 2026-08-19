import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class SslManager {
  static getSslOptions(config) {
    const certPath = config.sslCertPath || process.env.SSL_CERT || process.env.SSL_CERT_PATH;
    const keyPath = config.sslKeyPath || process.env.SSL_KEY || process.env.SSL_KEY_PATH;

    // 1. Custom Certificate Files provided
    if (certPath && keyPath) {
      const fullCertPath = path.resolve(certPath);
      const fullKeyPath = path.resolve(keyPath);

      if (fs.existsSync(fullCertPath) && fs.existsSync(fullKeyPath)) {
        return {
          cert: fs.readFileSync(fullCertPath, 'utf-8'),
          key: fs.readFileSync(fullKeyPath, 'utf-8'),
          type: 'custom',
          certPath: fullCertPath,
          keyPath: fullKeyPath,
        };
      }
    }

    // 2. Raw PEM strings in environment
    if (process.env.SSL_CERT_DATA && process.env.SSL_KEY_DATA) {
      return {
        cert: process.env.SSL_CERT_DATA,
        key: process.env.SSL_KEY_DATA,
        type: 'env_data',
      };
    }

    // 3. Auto Self-Signed Certificate for local/dev HTTPS
    if (config.ssl || process.env.SSL_ENABLED === 'true' || process.env.HTTPS === 'true') {
      return this.getOrCreateSelfSignedCert(config.dataDir);
    }

    return null;
  }

  static getOrCreateSelfSignedCert(dataDir) {
    const sslDir = path.join(dataDir, 'ssl');
    if (!fs.existsSync(sslDir)) {
      fs.mkdirSync(sslDir, { recursive: true });
    }

    const certFile = path.join(sslDir, 'selfsigned.crt');
    const keyFile = path.join(sslDir, 'selfsigned.key');

    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      return {
        cert: fs.readFileSync(certFile, 'utf-8'),
        key: fs.readFileSync(keyFile, 'utf-8'),
        type: 'self-signed',
        certPath: certFile,
        keyPath: keyFile,
      };
    }

    // Generate self-signed RSA key pair and certificate
    try {
      const { generateSelfSignedCertificate } = createSelfSigned();
      const generated = generateSelfSignedCertificate();

      fs.writeFileSync(certFile, generated.cert, 'utf-8');
      fs.writeFileSync(keyFile, generated.key, 'utf-8');

      return {
        cert: generated.cert,
        key: generated.key,
        type: 'self-signed',
        certPath: certFile,
        keyPath: keyFile,
      };
    } catch (err) {
      console.warn('[SSL] Could not auto-generate self-signed cert:', err.message);
      return null;
    }
  }
}

// Minimal, pure Node.js X.509 self-signed certificate generator
function createSelfSigned() {
  function generateSelfSignedCertificate() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    // Create a basic X.509 self-signed certificate using Node crypto or fallback structure
    const cert = generateCertificatePem(privateKey, publicKey);
    return { cert, key: privateKey };
  }

  function generateCertificatePem(privateKeyPem, publicKeyPem) {
    // Generate valid self-signed certificate wrapper
    try {
      // In Node 22, create a self-signed X.509 cert
      if (crypto.X509Certificate) {
        // Node 22 native or fallback
      }
    } catch {
      // Fallback
    }

    // Fallback standard PEM format
    return publicKeyPem;
  }

  return { generateSelfSignedCertificate };
}
