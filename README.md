# 🚀 DevPulse – Tech Issue & Feature Tracker

Collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

**vercel Live URL:** https://assignment-2-umber-zeta.vercel.app/

---

## ✨ Key Features

- JWT authentication with role-based access (contributor / maintainer)
- Create, view, update, delete issues (role-dependent)
- Filter & sort issues (`sort`, `type`, `status`)
- Maintainer-only: system metrics, status updates, delete any issue
- No SQL JOINs – reporter data fetched via separate queries

## 🛠️ Tech Stack

Node.js (LTS), TypeScript, Express, PostgreSQL (native `pg`), Raw SQL, bcrypt, jsonwebtoken

## 🔧 Setup

```bash
git clone <repo>
npm install
# Create .env with DB credentials & JWT_SECRET
npm run dev