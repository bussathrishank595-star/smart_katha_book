# 📒 Katha Book – Digital Due Book Management System

A modern, full-stack web application for shopkeepers and wholesalers to digitally manage customer credit, billing, dues, penalties, and payments.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- npm

---

### 1️⃣ Backend Setup

```bash
cd backend
```

Edit `.env` and add your MongoDB Atlas connection string:
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/kathabook?retryWrites=true&w=majority
JWT_SECRET=katha_book_super_secret_jwt_key_2024
PORT=5000
```

Then install and start:
```bash
npm install
npm run dev     # Development (auto-reload)
# or
npm start       # Production
```

Backend runs on: **http://localhost:5000**

---

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## 🌐 Getting a MongoDB Atlas URI

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user (username + password)
4. Allow network access from `0.0.0.0/0` (or your IP)
5. Click "Connect" → "Connect your application" → Copy the URI
6. Replace `<username>`, `<password>`, `<cluster>` in `.env`

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based login/register |
| 📊 Dashboard | Stats, charts, payment alerts |
| 👥 Customers | CRUD with search |
| 📦 Products | Catalog management |
| 🧾 Billing | Multi-product bills with credit days |
| ⏰ Credit | Auto due date generation |
| ⚠️ Penalties | Auto-accruing overdue penalties |
| 💳 Payments | Partial payments, full history |
| 📄 Reports | Daily/weekly/monthly + PDF export |
| 📱 SMS | Native sms: URI (zero cost) |
| 🌙 Dark Mode | System-aware, persisted |

---

## 🏗️ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Recharts + jsPDF
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT

---

## 📁 Project Structure

```
smart Katha book/
├── backend/
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express API routes
│   ├── middleware/     # JWT auth
│   ├── .env            # ← Edit this!
│   └── server.js
└── frontend/
    ├── src/
    │   ├── pages/      # Route pages
    │   ├── components/ # Reusable UI
    │   ├── context/    # Auth + Theme
    │   ├── api/        # Axios client
    │   └── utils/      # Helpers
    └── .env
```
