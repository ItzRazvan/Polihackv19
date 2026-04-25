# Polihack19 Web App

Modern B2B SaaS website for selling API access. Built with React, TypeScript, Firebase, and React Router.

## 🚀 Quick Start

### 1. Setup Firebase Credentials

```bash
# Copy the template file
cp .env.example .env.local

# Edit .env.local and add your Firebase credentials
# See FIREBASE_QUICK_START.md for detailed instructions
```

### 2. Install & Run

```bash
cd /home/razvan/Projects/Polihack19/polihack19web
npm install
npm run dev
```

Visit: http://localhost:5175

## 📚 Documentation

- **🔥 New to this project?** → Read `README_FIRST.md`
- **Firebase setup (5 min)** → `FIREBASE_QUICK_START.md`
- **`.env.local` setup** → `ENV_SETUP.md`
- **Project overview** → `SETUP_SUMMARY.md`
- **Changes made** → `CHANGES_COMPLETED.md`

## ✨ Features

- ✅ Multi-page SaaS website with React Router v6
- ✅ Firebase Authentication (Email/Password)
- ✅ Firestore Database integration
- ✅ User Dashboard with API key management
- ✅ Subscription/Pricing system (demo mode)
- ✅ Interactive weather map with heatmap
- ✅ Dark theme with glassmorphism design
- ✅ TypeScript for type safety

## 📁 Project Structure

```
src/
├── AppRouter.tsx          # Main routing
├── pages/                 # Page components
│   ├── HomePage.tsx       # Landing page
│   ├── PricingPage.tsx    # Pricing plans
│   ├── MapPage.tsx        # Demo map
│   ├── Dashboard.tsx      # User dashboard (protected)
│   └── DocsPage.tsx       # Documentation
├── services/              # Backend services
│   ├── firebaseConfig.ts  # Firebase setup
│   ├── authService.ts     # Authentication
│   └── apiKeysService.ts  # API key management
├── components/            # Reusable components
│   └── AuthForm.tsx       # Login/Signup
└── map/                   # Map components
```

## 🔧 Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## 🔐 Environment Variables

Create `.env.local` in the project root with:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

⚠️ **Important**: `.env.local` is in `.gitignore` - never commit it!

## 📖 Available Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Home/Landing | No |
| `/pricing` | Pricing Plans | No |
| `/map` | Demo Map | No |
| `/docs` | Documentation | No |
| `/auth` | Login/Signup | No |
| `/dashboard` | User Dashboard | **Yes** |

## 🧪 Testing

Sign up at `/auth` with:
- Email: `test@example.com`
- Password: `Test123!`
- Name: `Test User`

Check Firebase Console → Authentication to verify user was created.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Maps**: MapLibre GL, react-map-gl
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Routing**: React Router v6
- **Build**: Vite
- **Styling**: Inline styles with CSS utilities

## 📝 Notes

- Dark theme with blue accents
- Responsive design (desktop first)
- Demo mode: purchasing automatically subscribes user
- Firestore security rules recommended for production

## 🔗 Links

- [Firebase Console](https://console.firebase.google.com)
- [MapLibre GL](https://maplibre.org/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
