# 🏫 SRVMS Portal (SRV School Portal)

A comprehensive, full-stack school management system designed to streamline academic administration, automate media management, and provide role-based portals for students, parents, faculty, and administrative staff.

## 🚀 Key Features

*   **Modern & Responsive UI**: Built with React, Vite, and Tailwind CSS, featuring modern web design practices, intuitive layouts, and fluid dynamic animations via Framer Motion.
*   **Role-Based Access Control**:
    *   **Frontend/Student Portal**: A dedicated workspace for parents/students to track academic progress and explore school services.
    *   **Admin Panel**: Granular role-based portals (Admin, HOD, Faculty) tailored for robust school management. 
*   **Dynamic Media System**: Automated, folder-based image management serving optimized `.webp` images to ensure snappy load times and seamless content updates.
*   **Robust Backend System**: A secure Node.js & Express REST API interacting with MongoDB. Engineered with JWT authentication, password hashing, and vital security middlewares including Helmet, CORS, and Rate Limiting.

## 📂 Project Structure

This project is structured as a monorepo containing three core applications:

*   [`/frontend`](./frontend/): The user-facing client React application.
*   [`/admin`](./admin/): The administrative dashboard React application.
*   [`/server`](./server/): The Node.js Express backend API that powers both portals.

## 💻 Tech Stack

### Frontend & Admin Dashboard
*   **Core**: React 19, React Router DOM 7, Vite 6
*   **Styling**: Tailwind CSS 4
*   **UI Components & Animations**: Framer Motion, Lucide React, Recharts
*   **Utilities**: Axios, SweetAlert2, Lenis (smooth scrolling), html2canvas/jspdf

### Backend Server
*   **Core**: Node.js, Express 5
*   **Database**: MongoDB & Mongoose
*   **Authentication**: JSON Web Tokens (JWT), bcryptjs
*   **Security Tools**: Helmet, Express-Rate-Limit, Express-Mongo-Sanitize, HPP, CORS

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Locally installed or an accessible MongoDB Atlas URI)

## ⚙️ Getting Started & Installation

You need to run the `server`, `admin`, and `frontend` applications concurrently.

### 1. Backend API (`/server`)

```bash
cd server
npm install
```

**Environment Variables**: Create a `.env` file in the `/server` folder and configure variables such as:
```env
PORT=5000
MONGODB_URI=your_mongo_database_uri
JWT_SECRET=your_jwt_secret_key
```

**Start the API**:
```bash
npm run dev
```

### 2. Administrator Panel (`/admin`)

Open a new terminal session:

```bash
cd admin
npm install
```

**Configuration**: Set your backend API base URL in the frontend environment configurations if required (e.g. `VITE_API_BASE_URL`).

**Start the Admin App**:
```bash
npm run dev
```
*(The admin portal runs on `http://localhost:3001` or your configured host)*

### 3. User Portal (`/frontend`)

Open a new terminal session:

```bash
cd frontend
npm install
npm run dev
```
*(The frontend runs on `http://localhost:3000` or your configured host)*

## 🔧 Scripts & Maintenance

Several utility scripts are located in the project's root folder to help facilitate UI/UX changes and testing:
*   `buildPngFavicon.js` / `buildSvgFavicon.js` — Useful for automated icon generation processes.
*   `roundFavicon.js` — Facilitates generating perfectly-rounded assets for Android/PWA production builds.
*   `replaceAlerts.js` — Script to sweep and format structural alerts.

---

**Note**: This repository contains production-ready APK configurations generated via wrappers. To compile Android applications natively, refer to your mobile wrapper configuration logs.
