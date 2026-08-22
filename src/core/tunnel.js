import { bin } from 'cloudflared';
import { spawn } from 'node:child_process';
import localtunnel from 'localtunnel';

let childProc = null;
let ltInstance = null;
let publicUrl = null;

export const TunnelManager = {
  async start(port, options = {}) {
    if ((childProc || ltInstance) && publicUrl) return publicUrl;

    const targetPort = Number(port) || 8090;

    // 1. Custom Named Subdomain with localtunnel (e.g. minibase-kartik)
    if (options.subdomain) {
      try {
        ltInstance = await localtunnel({ port: targetPort, subdomain: options.subdomain });
        publicUrl = ltInstance.url;

        ltInstance.on('close', () => {
          ltInstance = null;
          publicUrl = null;
        });

        ltInstance.on('error', (err) => {
          console.error('[Tunnel Error]', err.message);
        });

        console.log(`[Tunnel] Custom subdomain LIVE: ${publicUrl}`);
        return publicUrl;
      } catch (err) {
        console.warn(`[Tunnel] Subdomain "${options.subdomain}" failed, falling back to Cloudflare:`, err.message);
      }
    }

    // 2. Cloudflare Named Tunnel with Token (e.g. minibase.yourdomain.com)
    if (options.token) {
      return new Promise((resolve, reject) => {
        childProc = spawn(bin, ['tunnel', 'run', '--token', options.token], {
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        childProc.on('error', reject);
        childProc.on('exit', () => {
          childProc = null;
          publicUrl = null;
        });

        publicUrl = options.domain ? `https://${options.domain}` : 'Custom Cloudflare Tunnel Active';
        resolve(publicUrl);
      });
    }

    // 3. Official Cloudflare Quick Tunnel (Zero-config)
    return new Promise((resolve, reject) => {
      let resolved = false;
      let tempUrl = null;

      // Spawn cloudflared tunnel
      childProc = spawn(bin, [
        'tunnel',
        '--url', `http://localhost:${targetPort}`,
        '--http-host-header', `localhost:${targetPort}`,
        '--no-autoupdate',
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const handleData = (chunk) => {
        const text = chunk.toString();

        const match = text.match(/https:\/\/(?!api\.)([a-zA-Z0-9-]+)\.trycloudflare\.com/i);
        if (match && match[1] !== 'api') {
          tempUrl = match[0];
          publicUrl = match[0];
        }

        if (tempUrl && !resolved) {
          resolved = true;
          setTimeout(() => {
            console.log(`[Tunnel] Cloudflare Edge LIVE: ${publicUrl}`);
            resolve(publicUrl);
          }, 1500);
        }
      };

      if (childProc.stdout) childProc.stdout.on('data', handleData);
      if (childProc.stderr) childProc.stderr.on('data', handleData);

      childProc.on('error', (err) => {
        console.error('[Tunnel Error]', err.message);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      childProc.on('exit', (code) => {
        childProc = null;
        publicUrl = null;
        if (!resolved) {
          resolved = true;
          reject(new Error(`cloudflared exited with code ${code}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!resolved) {
          if (tempUrl) {
            resolved = true;
            resolve(tempUrl);
          } else {
            resolved = true;
            reject(new Error('Cloudflare tunnel connection timeout'));
          }
        }
      }, 30000);
    });
  },

  async stop() {
    if (childProc) {
      try {
        childProc.kill('SIGTERM');
      } catch {}
      childProc = null;
    }
    if (ltInstance) {
      try {
        ltInstance.close();
      } catch {}
      ltInstance = null;
    }
    publicUrl = null;
  },

  getUrl() {
    return publicUrl;
  },

  isActive() {
    return Boolean(publicUrl && (childProc || ltInstance));
  },
};
