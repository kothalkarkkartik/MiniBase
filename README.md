<div align="center">

# ⚡ MiniBase
### Ultra-Lightweight, Zero-Config Backend-as-a-Service (BaaS) with Embedded SQLite

[![Node.js](https://img.shields.io/badge/Node.js-22+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

An open-source, embedded PocketBase alternative built natively with Node.js & SQLite (WAL Mode). Zero external database servers required.

[Features](#-features) • [Quick Start](#-quick-start) • [Client SDK](#-client-sdk) • [Docker Deployment](#-docker-deployment) • [API Documentation](#-api-documentation)

---

</div>

## ✨ Features

- 🚀 **Zero-Config Embedded SQLite**: Instant startup with WAL mode (`journal_mode=WAL`) for high concurrency and ultra-fast performance.
- 🎨 **PocketBase-Inspired Admin Studio**: Clean, responsive dark-mode dashboard with column schema designer, records grid, live filters, and activity logs.
- ⚡ **Realtime Subscriptions**: Built-in Server-Sent Events (SSE) live updates for instant push notifications to frontends.
- 🔒 **Authentication & Granular API Rules**: Scrypt password hashing, JWT auth, and customizable access rules per collection.
- 📁 **File & Media Storage**: Automatic file management, thumbnail generation (`sharp`), and secure URL token delivery.
- ✉️ **Real SMTP Email Engine**: Production email delivery for password resets and verification with 1-click provider presets (Gmail, Resend, SendGrid, etc.).
- 🌐 **Multi-Language Client SDK**: Ready-to-use SDKs and snippets for Vanilla JS, React / Next.js, Flutter / Dart, fetch(), and cURL.
- 📥 **1-Click Web App Downloader**: Non-technical friendly single-click export to download a live HTML/Tailwind app connected to your database.
- 🐳 **Production Ready**: Optimized multi-stage Dockerfile and docker-compose volume mounts.

---

## 🚀 Quick Start

### 1. Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/kothalkarkkartik/MiniBase.git
cd MiniBase

# Install dependencies
npm install

# Start the MiniBase server
node bin/minibase.js serve
```

### 2. Access Admin Dashboard

Open your browser and navigate to:
```
http://localhost:8090/_/
```
Create your initial Super Admin account to access the dashboard.

---

## 📦 Client SDK Usage

Add the lightweight SDK to your HTML or frontend:

```html
<script src="http://localhost:8090/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('http://localhost:8090');

  async function main() {
    // 1. Fetch records
    const records = await mb.collection('posts').getList(1, 20, {
      sort: '-created'
    });
    console.log(records.items);

    // 2. Create a new record
    const newPost = await mb.collection('posts').create({
      title: 'Hello from MiniBase!',
      content: 'Building apps at lightning speed.'
    });

    // 3. Subscribe to Realtime live updates
    mb.realtime.subscribe('posts', (action, data) => {
      console.log('Realtime event:', action, data);
    });
  }

  main();
</script>
```

---

## 🐳 Docker Deployment

Deploy MiniBase with persistent storage in one command:

```bash
docker compose up -d
```

### `docker-compose.yml`:
```yaml
version: '3.8'

services:
  minibase:
    build: .
    container_name: minibase
    restart: unless-stopped
    ports:
      - "8090:8090"
    environment:
      - NODE_ENV=production
      - PORT=8090
      - JWT_SECRET=your-custom-production-secret-key
    volumes:
      - ./minibase_data:/app/minibase_data
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :---: | :--- |
| `PORT` | `8090` | HTTP Server port |
| `HOST` | `0.0.0.0` | Bind host address |
| `DATA_DIR` | `./minibase_data` | Root directory for SQLite DB and file storage |
| `JWT_SECRET` | auto-generated | Secret key for signing authentication tokens |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `SSL_CERT_PATH` | - | Optional path to SSL certificate for HTTPS |
| `SSL_KEY_PATH` | - | Optional path to SSL private key |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
