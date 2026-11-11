<div align="center">

<img src="minibase-logo.png" alt="MiniBase Logo" width="120" height="120" style="border-radius:24px; margin-bottom:12px;" />

# ⚡ MiniBase
### Ultra-Lightweight, Zero-Config Backend-as-a-Service (BaaS) with Embedded SQLite

[![Node.js](https://img.shields.io/badge/Node.js-22+-68a063?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows_|_Linux_|_macOS_|_Docker-8A2BE2?style=for-the-badge)](https://github.com/kothalkarkkartik/MiniBase)
[![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

An open-source, ultra-fast **Firebase & PocketBase alternative** built natively with Node.js & SQLite (WAL Mode). Zero external database servers required. Memory footprint: **~35MB RAM**.

[🚀 Quick Start](#-quick-start-options) • [⚖️ MiniBase vs Firebase](#-minibase-vs-firebase-when-to-use-which) • [🖼️ Demo App](#️-included-client-demo-app-wallvibe-4k) • [📖 Complete Guide](#-how-to-use-minibase-complete-guide) • [💻 CLI Suite](#-universal-terminal-cli-suite-minibase) • [🌐 REST API](#-rest-api-cheatsheet)

---

### 📸 Visual Showcase

| 🖼️ Live 4K Client Demo (`/demo`) | 💻 Sleek Dark Admin Studio (`/_/`) |
|:---:|:---:|
| <img src="screenshots/08_wallpaper_app_client.png" width="480" alt="Wallpaper Demo App" /> | <img src="screenshots/02_admin_studio_dashboard.png" width="480" alt="Admin Studio Dashboard" /> |

| ⚡ Terminal CLI Suite | 📖 Interactive API Docs (`/docs`) |
|:---:|:---:|
| <img src="screenshots/07_terminal_cli_suite.png" width="480" alt="MiniBase CLI Suite" /> | <img src="screenshots/05_interactive_api_docs.png" width="480" alt="Interactive OpenAPI Docs" /> |

</div>

---

## ⚖️ MiniBase vs Firebase (When to Use Which?)

Firebase is an exceptional cloud platform for massive, multi-region distributed enterprise applications. But for MVPs, indie projects, internal tools, and developers who prioritize complete data ownership and local-first simplicity, **MiniBase** provides an ultra-fast, zero-config, self-hosted alternative.

| Feature | 🔥 Firebase | ⚡ MiniBase |
|---|---|---|
| **Primary Architecture** | Managed Google Cloud Platform (Multi-tenant) | **Single-binary, 100% Self-Hosted (Node.js + SQLite)** |
| **Data Ownership** | Stored in Google Cloud | **100% Yours in a single portable file (`data.db`)** |
| **Database Engine** | Proprietary Firestore / Realtime DB (NoSQL) | **Native SQLite WAL (ACID compliant, microsecond latency)** |
| **Cost & Billing** | Pay per document read/write/bandwidth | **$0 / Run anywhere on a $5 VPS, Docker, or Raspberry Pi** |
| **Setup & Local Dev** | Emulators, service account keys, cloud configs | **1 Command (`minibase serve`) with zero config** |
| **Realtime Updates** | Proprietary WebSockets & Client SDKs | **Standard Server-Sent Events (SSE) with standard HTTP** |
| **Admin Interface** | Google Cloud Console | **Built-in Dark Glassmorphic Admin Studio** |
| **CLI & Raw SQL** | Limited CLI query tools | **Built-in `minibase sql` raw query runner & backup suite** |
| **Data Portability** | Complex cloud export workflows | **1-Click RFC 4180 CSV / JSON bulk import & export** |
| **API Documentation** | Manual docs or Google documentation | **Instant interactive OpenAPI 3.0 documentation (`/docs`)** |

### 🎯 When should you choose Firebase?
- You are building an enterprise app requiring multi-region data replication across continents.
- You rely heavily on deep Google Cloud ecosystem integrations (BigQuery, Cloud Functions, Google Analytics).
- You need managed phone number authentication or push notification services (FCM) out of the box.

### 🎯 When should you choose MiniBase?
- You want **100% data ownership** without vendor lock-in or surprise monthly usage bills.
- You love the speed and simplicity of **SQLite WAL** (microsecond queries, single-file backup).
- You want an **instant backend** for your Flutter, React, Vue, Svelte, or Python project in under 10 seconds.
- You want a lightweight solution that runs effortlessly on local machines, private servers, Docker, or edge hardware with a ~35MB RAM footprint.

---

## 🖼️ Included Client Demo App: WallVibe 4K

MiniBase ships with a full demo client application in [`examples/wallpaper-app`](examples/wallpaper-app) to showcase end-to-end integration:

- **Live URL**: `http://localhost:8090/demo` (or `/app` / `/wallpapers`)
- **Key Capabilities Demonstrated**:
  - **Native File Streaming**: Streams high-definition 4K images directly from MiniBase file storage (`/api/files/wallpapers/:id/:file`).
  - **Live Server-Sent Events (SSE)**: Download counters and record updates sync across all connected clients in real-time.
  - **Dynamic Filtering & Search**: Instant category-based queries (`Nature`, `Abstract`, `Architecture`) and debounced search.
  - **Engine Telemetry**: Visual glass bar showing real-time SQLite WAL status, active collection counts, and endpoint mappings.

---

## ✨ Key Highlights

- 🚀 **Zero-Config Embedded SQLite**: Instant startup with WAL mode (`journal_mode=WAL`) for high concurrency and supersonic performance.
- 🎨 **PocketBase-Inspired Dark Studio**: Ultra-sleek, responsive DevTools dark dashboard with schema builder, records grid, live filters, and system logs.
- ✏️ **Inline Cell Editing (Excel/Notion Style)**: Double-click any table cell to edit numbers, text, or booleans inline with instant database autosave.
- 📥 **1-Click CSV / JSON Bulk Importer**: Drag-and-drop any `.csv` or `.json` file to auto-detect columns and bulk-insert thousands of rows in milliseconds.
- 🔍 **Visual Filter Builder**: Build complex query filters visually (`[ Category ] [ is equal to ] [ Nature ]`) without syntax confusion.
- 📱 **Instant "Connect App" Code Generator**: Copy-paste live code snippets for **Flutter (Dart)**, **React / Next.js (JS)**, **Python**, and **cURL**.
- ⚡ **Realtime Subscriptions**: Built-in Server-Sent Events (SSE) live stream for instant push updates to mobile and web apps.
- 📖 **Interactive OpenAPI Documentation**: Built-in Scalar interactive API explorer mounted at `/docs`.
- 🔒 **User Authentication & Granular API Rules**: Password hashing with Scrypt, JWT auth, and customizable access rules per collection.
- 🌐 **Built-in Cloudflare Live Tunnel**: 1-click free public HTTPS URL (`--tunnel`) to test mobile and web apps worldwide with zero router/DNS config.
- 💾 **1-Click Database Disaster Recovery**: Full database export archive and instant drag-and-drop restore.

---

## 🚀 Quick Start Options

### Option 1: Linux / VPS 1-Command Auto Setup (Recommended for Servers) 🔥
Paste this single command into your Linux / VPS terminal:
```bash
curl -fsSL https://raw.githubusercontent.com/kothalkarkkartik/MiniBase/main/scripts/install.sh | bash
```
> **What this does automatically:**
> - Detects OS & installs Node.js 22 LTS if missing.
> - Clones MiniBase & installs production dependencies.
> - Creates a **24/7 background system service (`systemd`)** with auto-restart on reboot.
> - Configures the universal global **`minibase`** CLI command.
> - Displays your Admin Studio URL and credentials.

---

### Option 2: Windows Native Desktop App 💻
Simply double-click:
```
MiniBase-Studio.exe
```
> Launches a dedicated, standalone **Native Desktop Software Window** with custom icon, zero black console flickers, and automatic background server management!

---

### Option 3: Manual Git / Local Setup
```bash
# 1. Clone repository
git clone https://github.com/kothalkarkkartik/MiniBase.git
cd MiniBase

# 2. Install dependencies
npm install

# 3. Start MiniBase Studio
node bin/minibase.js serve --open
```

---

### Option 4: Docker & Docker Compose 🐳
```bash
docker compose up -d
```
Access Admin Studio at `http://localhost:8090/_/` (data persists in `./minibase_data`).

---

## 💻 Universal Terminal CLI Suite (`minibase`)

MiniBase includes a complete command-line toolkit for server administrators and power users:

```bash
# Start server with auto-browser launch
minibase serve --open

# Start with free Cloudflare public HTTPS tunnel
minibase serve --tunnel

# Check service status, live URL, collection count, and process PID
minibase status

# Execute raw SQL queries directly against SQLite WAL
minibase sql "SELECT id, title, category, downloads FROM wallpapers LIMIT 5;"

# Manage Super-Admin accounts
minibase admin list
minibase admin create admin@company.com mypassword123
minibase admin passwd admin@company.com newpassword123
minibase admin delete admin@company.com

# Inspect and manage collections
minibase collections list
minibase collections delete old_temp_data

# Bulk import & export data via CLI
minibase export wallpapers ./wallpapers_backup.csv
minibase import wallpapers ./new_data.csv

# Create an instant SQLite hot backup
minibase backup ./backups/hot_backup.db
```

---

## 📖 How to Use MiniBase (Complete Guide)

### 1. Initial Admin Login
Open your browser and navigate to:
```
http://localhost:8090/_/
```
*(On a VPS, replace `localhost` with your VPS IP, e.g. `http://192.168.1.100:8090/_/`)*

- **Default Email**: `admin@minibase.io`
- **Default Password**: `admin12345`
*(You can change your password anytime in Settings)*

---

### 2. Creating Collections & Custom Schema
1. Click **`+ New Collection`** in the left sidebar.
2. Enter collection name (e.g. `products`, `wallpapers`, `posts`).
3. Choose Collection Type:
   - **Base Collection**: Standard data table.
   - **Auth Collection**: User accounts table with authentication, email, and password hashing.
4. Add Fields with custom types:
   - `text`, `number`, `bool`, `email`, `url`, `json`, `file`, `relation`, `select`.
5. Set API Access Rules (e.g. Leave blank for Public, or `@request.auth.id != ""` for Authenticated Users).
6. Click **Create Collection** — your SQLite table is created instantly!

---

### 3. Inline Cell Editing (Excel / Notion Style)
- Double-click any text or number cell in the table to edit inline.
- Toggle booleans directly with a single click.
- Press **Enter** to save, or **Escape** to cancel.

---

### 4. Bulk CSV / JSON Import & Export
1. In any collection view, click the **`Import CSV / JSON`** button in the top toolbar.
2. Drag and drop your `.csv` or `.json` file.
3. MiniBase will display a 5-row live preview and detect column types.
4. Click **Import Records** — all rows are batch-inserted inside an atomic SQLite transaction in milliseconds!
5. To export, click **`Export ▾`** and choose **Export as CSV** or **Export as JSON**.

---

### 5. Interactive API Documentation (`/docs`)
Navigate to:
```
http://localhost:8090/docs
```
MiniBase dynamically generates OpenAPI 3.0 specifications for all collections and serves them using **Scalar** — test endpoints, review request bodies, and copy curl commands with live interactive exploration.

---

### 6. Visual Filter Builder
1. Click the **`Filter Builder`** icon next to the search bar.
2. Add condition chips: `[ Field ] [ Operator (=, !=, >, <, contains) ] [ Value ]`.
3. Combine rules with `AND` / `OR` logic.
4. The table filters immediately without having to write raw SQL.

---

### 7. 1-Click "Connect App" Code Generator
1. Click the green **`Connect App`** button in the topbar or table header.
2. Select your platform:
   - 📱 **Flutter / Dart**
   - ⚛️ **JavaScript / React / Next.js**
   - 🐍 **Python**
   - 🌐 **cURL / Postman**
3. Copy-paste the ready-to-run snippet directly into your frontend project!

---

### 8. Worldwide Public Live Tunnel
Want to test your mobile app or webhook without configuring router port-forwarding or SSL?
```bash
node bin/minibase.js serve --tunnel
```
MiniBase will instantly spin up a **Cloudflare Edge SSL Tunnel** with a worldwide HTTPS URL:
```
🌍 MiniBase is LIVE Worldwide:
➜ Mobile / Flutter API: https://random-name.trycloudflare.com
➜ Admin Studio:        https://random-name.trycloudflare.com/_/
```

---

### 9. Database Backup & Disaster Recovery
- **Download Hot Backup**: Navigate to **Settings** ➜ Click **Download DB Backup** (or `GET /api/admins/backup/export`).
- **Restore Backup**: Drag and drop any `.json` or `.db` backup file to restore all collections and rows instantly.

---

## 📱 Connect App & Client SDKs

### 1. Flutter (Dart SDK)
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class MiniBaseService {
  static const String baseUrl = 'http://localhost:8090'; // or your Cloudflare Tunnel URL

  // Fetch records
  static Future<List<dynamic>> getRecords(String collection) async {
    final res = await http.get(Uri.parse('$baseUrl/api/collections/$collection/records?sort=-created'));
    if (res.statusCode == 200) {
      return jsonDecode(res.body)['items'];
    }
    throw Exception('Failed to load records');
  }

  // Insert record
  static Future<Map<String, dynamic>> createRecord(String collection, Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/collections/$collection/records'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return jsonDecode(res.body);
  }
}
```

---

### 2. JavaScript / React / Next.js
```javascript
const BASE_URL = 'http://localhost:8090';

// 1. Fetch Records
async function getWallpapers() {
  const res = await fetch(`${BASE_URL}/api/collections/wallpapers/records?sort=-created`);
  const data = await res.json();
  return data.items;
}

// 2. Create Record
async function createWallpaper(payload) {
  const res = await fetch(`${BASE_URL}/api/collections/wallpapers/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// 3. Live Realtime Push Updates via SSE
const sse = new EventSource(`${BASE_URL}/api/realtime`);
sse.addEventListener('create', (event) => {
  const { collection, record } = JSON.parse(event.data);
  console.log(`[Realtime Created in ${collection}]:`, record);
});
```

---

### 3. Python Client
```python
import requests

BASE_URL = "http://localhost:8090"

# Fetch records
res = requests.get(f"{BASE_URL}/api/collections/wallpapers/records?sort=-created")
data = res.json()
print("Records:", data.get("items", []))

# Insert record
payload = {
    "title": "Neon Sunset",
    "category": "nature",
    "downloads": 120,
}
post_res = requests.post(f"{BASE_URL}/api/collections/wallpapers/records", json=payload)
print("Created Record:", post_res.json())
```

---

### 4. cURL
```bash
# 1. Fetch records
curl -X GET "http://localhost:8090/api/collections/wallpapers/records?page=1&perPage=20"

# 2. Insert record
curl -X POST "http://localhost:8090/api/collections/wallpapers/records" \
     -H "Content-Type: application/json" \
     -d '{"title":"Cyberpunk City","category":"urban"}'
```

---

## 🌐 REST API Cheatsheet

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/collections` | `GET` | List all collections |
| `/api/collections` | `POST` | Create a new collection schema |
| `/api/collections/:col/records` | `GET` | List paginated records (`?page=1&perPage=30&sort=-created&filter=...`) |
| `/api/collections/:col/records/:id` | `GET` | Get single record by ID |
| `/api/collections/:col/records` | `POST` | Create a new record |
| `/api/collections/:col/records/:id` | `PATCH` | Update a record |
| `/api/collections/:col/records/:id` | `DELETE` | Delete a record |
| `/api/collections/:col/export` | `GET` | Export collection records as CSV or JSON |
| `/api/collections/:col/import` | `POST` | Bulk import records with atomic SQLite transactions |
| `/api/batch` | `POST` | Execute atomic batch operations (inserts, updates, deletes) |
| `/api/admins/auth-with-password` | `POST` | Admin authentication & JWT token generation |
| `/api/collections/:authCol/auth-with-password` | `POST` | User login authentication |
| `/api/files/:col/:id/:filename` | `GET` | Serve stored files & auto-generated thumbnails |
| `/api/realtime` | `GET` | Server-Sent Events (SSE) live activity stream |
| `/docs` | `GET` | Interactive OpenAPI 3.0 documentation powered by Scalar |
| `/api/admins/backup/export` | `GET` | Download full database JSON archive |
| `/api/admins/backup/restore` | `POST` | Restore database archive |

---

## ⚙️ Environment Configuration

| Variable | Default | Description |
| :--- | :---: | :--- |
| `PORT` | `8090` | HTTP Server port |
| `HOST` | `0.0.0.0` | Bind host address |
| `DATA_DIR` | `./minibase_data` | Directory for SQLite DB and uploaded media files |
| `JWT_SECRET` | auto-generated | Secret key for signing tokens |
| `NODE_ENV` | `production` | Environment mode (`development` / `production`) |
| `MINIBASE_TUNNEL` | `false` | Enable automatic Cloudflare Live Tunnel on startup |

---

## 📄 License

MiniBase is open-source software licensed under the [MIT License](LICENSE).
Built with ❤️ for developers who love speed, simplicity, and zero configuration.
