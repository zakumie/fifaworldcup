# World Cup 2026 — Match Prediction Mini Game

## Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server
- Redis

### Run Backend
```
cd API
dotnet run --project src/WorldCup2026.WebAPI
```
API runs at: https://localhost:5000

### Run Frontend
```
cd WEB
npm install
npm run dev
```
App runs at: http://localhost:4000

---

## Sample Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@worldcup2026.com | Admin@123 |
| Manager | manager@worldcup2026.com | Manager@123 |
| Normal User | user@worldcup2026.com | User@123 |

---

## Google Login
Requires Google OAuth Client ID configured in:
- Backend: `appsettings.json` > `Google:ClientId`
- Frontend: `WEB/.env` > `VITE_GOOGLE_CLIENT_ID`