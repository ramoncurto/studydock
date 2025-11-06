# Quick Start Guide - Final Steps

Your Firebase credentials are already configured in `.env.local`! Follow these last steps to complete the setup:

## Step 1: Enable Firestore Database

1. Go to: https://console.firebase.google.com/project/nuriaopos-2ac5a/firestore
2. Click **"Create database"** button
3. Select **"Start in production mode"**
4. Choose location: **europe-west3** (or closest to Spain)
5. Click **"Enable"**

## Step 2: Set Up Security Rules

After Firestore is enabled:

1. Click on the **"Rules"** tab
2. Replace the default rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{document=**} {
      allow read, write: if true;
    }
    match /tests/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

⚠️ **Note**: These rules allow public access for development. For production, implement authentication (see [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for details).

## Step 3: Start Your App

```bash
npm run dev
```

Open http://localhost:3000

## Step 4: Test It!

1. Upload a note or test file
2. Check Firebase Console → Firestore Database
3. You should see your data in the `notes` or `tests` collection!
4. Refresh the page - your data persists!

## ✅ You're Done!

Your StudyDock app is now connected to Firebase and all data will be saved to the cloud.

---

### Need Help?

- **Detailed Setup**: See [FIREBASE-SETUP.md](FIREBASE-SETUP.md)
- **What Changed**: See [FIREBASE-INTEGRATION-SUMMARY.md](FIREBASE-INTEGRATION-SUMMARY.md)
- **Firebase Console**: https://console.firebase.google.com/project/nuriaopos-2ac5a

### Deploy to Vercel

When ready to deploy, add these environment variables in Vercel settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAaeRi2Da1T3L4Zb3Qn6Rto9cUmD1Fyxtg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nuriaopos-2ac5a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nuriaopos-2ac5a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nuriaopos-2ac5a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=113133894339
NEXT_PUBLIC_FIREBASE_APP_ID=1:113133894339:web:059bc098a5daa70a4cc076
```
