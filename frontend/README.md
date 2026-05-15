# IntWiz Frontend

React + TypeScript single-page application for the IntWiz interview 
preparation platform.

**🌐 Live application:** https://intwiz.vercel.app

For the full project overview, see the [root README](../README.md).

---

## Technology Stack

- **React 19** with **TypeScript**
- **Vite** build tooling and dev server
- **Tailwind CSS** with custom editorial design system
- **React Router DOM** for client-side navigation
- **Firebase JS SDK** for authentication and Firestore
- **axios** for backend HTTP communication
- **jsPDF** for portable-document report export

---

## Running Locally

### Prerequisites

- Node.js 18+ with npm
- The IntWiz backend running locally at `http://127.0.0.1:8000`, or a 
  deployed backend URL
- A Firebase project (the same one the backend uses)

### Setup

```bash
npm install
```

Create a `.env.local` file in this directory:

```
VITE_API_URL=http://127.0.0.1:8000

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Firebase configuration values are found at:
Firebase Console → Project Settings → Your apps → SDK setup and configuration.

### Run

```bash
npm run dev
```

The application runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

The production build is emitted to `dist/`.

---

## Project Structure

```
src/
├── App.tsx                # Top-level routing and providers
├── main.tsx               # Application entry point
├── index.css              # Tailwind base + global styles
├── pages/                 # 11 page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── DashboardPage.tsx
│   ├── SetupPage.tsx
│   ├── InterviewRoomPage.tsx
│   ├── ResultsPage.tsx
│   ├── ProfilePage.tsx
│   ├── SettingsPage.tsx
│   ├── HelpPage.tsx
│   └── MethodologyPage.tsx
├── components/            # Reusable UI
│   ├── TopNav.tsx         # Header navigation
│   ├── ProtectedRoute.tsx # Auth-gated route wrapper
│   └── MetricTooltip.tsx  # Inline metric explanations
├── contexts/
│   └── AuthContext.tsx    # Firebase auth provider
├── hooks/
│   ├── useAudioRecorder.ts # MediaRecorder lifecycle hook
│   └── useFocusTrap.ts     # Modal focus management
├── services/
│   ├── api.ts             # Backend API client (axios)
│   └── firebase.ts        # Firebase initialisation
├── types/
│   └── auth.ts            # Shared TypeScript interfaces
└── utils/
    └── generateReportPDF.ts # jsPDF report generator
```

---

## Routes

| Path | Component | Protected |
|---|---|---|
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/forgot-password` | ForgotPasswordPage | No |
| `/dashboard` | DashboardPage | Yes |
| `/interview/setup` | SetupPage | Yes |
| `/interview/active` | InterviewRoomPage | Yes |
| `/results/:reportId` | ResultsPage | Yes |
| `/profile` | ProfilePage | Yes |
| `/settings` | SettingsPage | Yes |
| `/help` | HelpPage | Yes |
| `/methodology` | MethodologyPage | Yes |

The root `/` and any unmatched path redirect to `/dashboard`.

---

## Deployment (Vercel)

The project is configured for Vercel's native Vite preset. Required 
deployment settings:

- **Root directory:** `frontend`
- **Framework preset:** Vite (auto-detected)
- **Build command:** `npm run build` (auto-detected)
- **Output directory:** `dist` (auto-detected)
- **Environment variables:** All 7 `VITE_*` variables listed above, with 
  `VITE_API_URL` set to the production backend URL