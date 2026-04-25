# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `polihack19` (or your choice)
4. Follow the setup wizard and create the project

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web** icon (</> symbol)
2. Register your app with name `polihack19-web`
3. Firebase will generate your configuration - **COPY THIS**

Your config will look like:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "polihack19-xxxxx.firebaseapp.com",
  projectId: "polihack19-xxxxx",
  storageBucket: "polihack19-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
}
```

## Step 3: Set Up Environment Variables

1. Open `/home/razvan/Projects/Polihack19/polihack19web/`
2. Create or edit the file `.env.local` (if it doesn't exist):

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

Replace each value with the corresponding value from your Firebase config.

**Example:**
```bash
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=polihack19-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=polihack19-demo
VITE_FIREBASE_STORAGE_BUCKET=polihack19-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 4: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Email/Password** and enable it
3. Save changes

## Step 5: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your region and create

### Add Security Rules (For Production):

In the Rules tab, use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // API Keys can only be read/written by owner
    match /api_keys/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Step 6: Verify Setup in Code

The Firebase configuration is automatically loaded from environment variables in:
**`src/services/firebaseConfig.ts`**

This file loads:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo_domain',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo_project',
  // ... other fields
};
```

## Step 7: Test Authentication

1. Start the dev server:
```bash
cd /home/razvan/Projects/Polihack19/polihack19web
npm run dev
```

2. Go to `http://localhost:5175/auth`
3. Click "Sign up" and create an account
4. You should be able to sign up and login!

## Troubleshooting

### "PERMISSION_DENIED" errors when saving to Firestore?
- Check your Firestore security rules
- Make sure you're in **test mode** for development or rules allow your writes

### Auth not working?
- Verify `.env.local` has correct values
- Check Firebase project ID matches
- Restart the dev server after changing `.env.local`

### Cannot find module error?
- Run `npm install` again
- Clear `node_modules` and reinstall if needed: `rm -rf node_modules && npm install`

## Emulator Setup (Optional - For Local Development)

To use Firebase emulators locally without needing the internet:

1. Install Firebase Tools:
```bash
npm install -g firebase-tools
```

2. Create `firebase.json` in project root:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    }
  }
}
```

3. Start emulator:
```bash
firebase emulators:start
```

4. In `src/services/firebaseConfig.ts`, uncomment emulator connection code:
```typescript
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## File Locations Reference

- **Firebase Config**: `src/services/firebaseConfig.ts`
- **Auth Service**: `src/services/authService.ts`
- **API Keys Service**: `src/services/apiKeysService.ts`
- **Environment Variables**: `.env.local` (in project root)
- **Main Router**: `src/AppRouter.tsx`
