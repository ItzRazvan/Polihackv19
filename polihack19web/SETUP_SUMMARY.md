# Polihack19 Website - Quick Setup Guide

## ✅ What's Been Completed

### Layout Fixes
- ✅ **Warning Banner**: Moved to bottom-right corner, smaller size, darker red color, closeable with × button
- ✅ **Z-Index Fixed**: Search bar, Legend, and zoom controls now properly layered above warning
- ✅ **Map Layout**: Map is full-screen and scrollable; other pages have normal scroll
- ✅ **No Full-Page Scroll**: Only the map page is fullscreen; pricing, home, dashboard scroll normally

### Website Structure
- ✅ **Multi-page routing** with React Router v6
- ✅ **Firebase Authentication** integration (email/password)
- ✅ **Firestore Database** setup ready
- ✅ **5 Main Pages**: Home, Pricing, Map, Dashboard, Docs
- ✅ **Protected Routes**: Dashboard only accessible after login
- ✅ **Dark Theme**: Professional glassmorphism design throughout

## 🔐 Firebase Setup (REQUIRED for production)

### Quick Steps:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project named `polihack19`
   - Create a Web app

2. **Create `.env.local` file** in `/home/razvan/Projects/Polihack19/polihack19web/`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Enable Authentication**:
   - Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password"

4. **Create Firestore Database**:
   - Firebase Console → Firestore Database
   - Create database in test mode

**📖 Full guide available in**: `FIREBASE_SETUP.md`

## 🚀 Running the App

```bash
# Install dependencies (if not done)
cd /home/razvan/Projects/Polihack19/polihack19web
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

App runs on: `http://localhost:5175` (or next available port)

## 📁 File Structure

```
src/
├── AppRouter.tsx           # Main routing setup
├── pages/                  # All page components
│   ├── HomePage.tsx        # Landing page
│   ├── PricingPage.tsx     # 4 subscription plans
│   ├── MapPage.tsx         # Demo map with warning
│   ├── Dashboard.tsx       # User dashboard (protected)
│   └── DocsPage.tsx        # Documentation page
├── services/               # Backend services
│   ├── firebaseConfig.ts   # Firebase initialization
│   ├── authService.ts      # Auth functions
│   └── apiKeysService.ts   # API key management
├── components/
│   └── AuthForm.tsx        # Login/Signup form
└── map/                    # Map-related components
    ├── MapPage.tsx
    ├── LocationSearch.tsx
    ├── Legend.tsx
    └── HeatmapLayer.tsx
```

## 🔑 API Keys Feature

**Users who purchase a subscription can:**
1. Login to dashboard
2. Go to "API Keys" tab
3. Create new keys (with description and device name)
4. View all keys with creation date
5. Delete keys they no longer need

**Keys are stored in Firestore** with:
- `key`: Generated API key (e.g., `pk_live_abc123...`)
- `userId`: Owner's Firebase UID
- `description`: User-defined purpose
- `deviceName`: Device/server name
- `isActive`: Active status
- `createdAt`: Timestamp

## 🎨 Design Notes

- **Color Scheme**: Dark blue (`#0f172a`, `#1e293b`) with blue accents (`#3b82f6`)
- **Styling**: Inline styles for consistency (no CSS framework)
- **Components**: Glassmorphism effect with backdrop blur
- **Responsive**: Works on desktop; mobile optimization can be added

## 🛠️ Troubleshooting

### Port Already in Use
Dev server auto-uses next available port (5173, 5174, 5175, etc.)

### Environment Variables Not Loading
- Restart dev server after creating `.env.local`
- Check file is in project root, not subdirectory
- Variables must start with `VITE_` prefix

### Firebase Auth Not Working
- Verify `.env.local` has correct Firebase config
- Ensure "Email/Password" is enabled in Firebase Console
- Check Firestore test mode or security rules allow writes

### Firestore Permission Denied
- For development: Use **test mode** or add this rule:
  ```javascript
  match /{document=**} {
    allow read, write: if request.time < timestamp.date(2026, 12, 31);
  }
  ```

## 📚 Available Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Home/Landing | No |
| `/pricing` | Pricing Plans | No |
| `/map` | Demo Map | No |
| `/docs` | Documentation | No |
| `/auth` | Login/Signup | No (redirects if logged in) |
| `/dashboard` | User Dashboard | **Yes** |

## 🔄 Demo Features

- **Auto-Purchase**: Clicking "Buy" on pricing automatically subscribes user (demo mode)
- **API Key Generation**: Keys are randomly generated with `pk_live_` prefix
- **Warning Banner**: Bottom-right corner, can be closed, data disclaimer

## ✨ Next Steps

1. Configure Firebase credentials in `.env.local`
2. Test authentication flow (signup → dashboard)
3. Test API key creation/deletion
4. Add real payment processing (Stripe/PayPal)
5. Fill in documentation page content
6. Deploy to production (Firebase Hosting, Vercel, Netlify)

## 📞 Support

For questions about setup, refer to:
- `FIREBASE_SETUP.md` - Detailed Firebase configuration
- `src/services/firebaseConfig.ts` - Firebase initialization code
- `src/services/authService.ts` - Authentication methods
- `src/services/apiKeysService.ts` - API key methods
