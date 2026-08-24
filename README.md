# Academic Manager — Frontend

React frontend for **Academic Manager**, an internship/apprenticeship management platform for a school: students, teachers, and administrators track internships and companies, while company contacts (guests) manage their own company profile. Built as a group project at ESEO — this repo covers the **frontend** only; the [REST API](https://github.com/Synergy-XVortex/Projet_API_Rest) is a separate repository built by a teammate.

## My role

I was responsible for the **frontend**: the React application, routing and role-based access control, UI/UX, and integration with the backend API. A teammate built the Spring Boot REST API, and a third teammate handled testing.

## Features

- **Authentication** — Login and registration screens, with JWT-based session handling.
- **Role-based access control** — Four roles (`ADMINISTRATOR`, `TEACHER`, `STUDENT`, `GUEST`) each see a tailored navigation and route set; protected routes redirect unauthenticated or unauthorized users automatically.
- **Dashboard** — Landing page after login, common to all authenticated roles.
- **Internship tracking** — Dedicated page to view and manage internships.
- **Company directory** — Shared company directory for students, teachers, and admins; company contacts (`GUEST` role) instead see and manage only their own company profile.
- **User management** — Admin-only page to manage platform users.
- **Notifications** — In-app notifications with a dropdown panel in the navbar.
- **Light/dark theme** — Toggle in the navbar, persisted in local storage, with an `Alt + T` keyboard shortcut.
- **PDF export** — PDF generation support via `jsPDF` (e.g. for exporting internship/company data).

## Tech stack

- React 19 + Vite
- React Router
- Axios (API calls)
- jwt-decode (reading role/claims from the JWT issued by the backend)
- jsPDF (PDF export)
- ESLint

## Project structure

```
src/
  pages/          # Login, Register, Dashboard, Internships, Companies, Notifications, UserManagement
  components/      # Navbar, ProtectedRoute, and other shared UI components
  services/        # API clients (auth, notifications, etc.)
  styles/          # CSS
  App.jsx          # Routes and role-based access control
```

## Getting started

### Requirements
- Node.js and npm
- The [backend API](https://github.com/Synergy-XVortex/Projet_API_Rest) running (see that repo for setup)

### Install and run
```bash
cd frontend
npm install
npm run dev
```

The app runs on Vite's default dev server (`http://localhost:5173` by default) and expects the backend API to be reachable — check `src/services/` for the configured API base URL.

### Build
```bash
npm run build
```

## Author

Frontend developed by [Clément Vongsanga](https://github.com/Synergy-XVortex) as part of a 3-person team project (backend, frontend, testing) at ESEO.
