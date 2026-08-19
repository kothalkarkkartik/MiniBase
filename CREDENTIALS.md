# 🦆 MiniBase — Admin Credentials

## Admin Studio Login

| Field    | Value                |
|----------|----------------------|
| URL      | http://localhost:8090/_/ |
| Email    | `admin@minibase.io`  |
| Password | `admin12345`         |

## API Endpoints

| Endpoint              | URL                                        |
|-----------------------|--------------------------------------------|
| Admin UI              | http://localhost:8090/_/                    |
| REST API              | http://localhost:8090/api/collections       |
| Auth (Login)          | `POST` http://localhost:8090/api/admins/auth-with-password |
| Realtime (SSE)        | http://localhost:8090/api/realtime          |

## Quick Login via API

```bash
curl -X POST http://localhost:8090/api/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@minibase.io", "password": "admin12345"}'
```

> ⚠️ **Production mein ye credentials change kar dena!**
