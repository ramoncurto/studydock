# Deployment Guide - Multi-User StudyDock

This guide walks you through deploying the newly implemented multi-user authentication system.

---

## Prerequisites

- ✅ Code implementation is complete
- ⚠️ Firebase Console access required
- ⚠️ Vercel account (for deployment) or local server for testing

---

## Step-by-Step Deployment

### Phase 1: Firebase Console Configuration (CRITICAL)

#### 1.1 Enable Firebase Authentication

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **nuria_opos** (or your project name)
3. Click **Authentication** in the left sidebar
4. Click **Get Started** (if not already enabled)
5. Go to the **Sign-in method** tab
6. Click on **Email/Password**
7. Enable the **Email/Password** toggle
8. Click **Save**

**✅ Verification:** You should see "Email/Password" listed as "Enabled" in the Sign-in providers list.

#### 1.2 Deploy Firestore Security Rules

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. Click the **Rules** tab at the top
3. Replace ALL existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - subcollection architecture
    // Each user can only read/write their own data under users/{userId}/
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access by default
    // This prevents access to root-level collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**
5. Wait for confirmation message: "Security rules successfully updated"

**✅ Verification:**
- The rules should show as "Published" with a timestamp
- Test in the "Rules Playground" if available

**⚠️ IMPORTANT:** Without these rules, users will get "Permission Denied" errors!

#### 1.3 (Optional) Configure Storage Rules

**Only if you plan to use Firebase Storage for audio files** (currently the app uses URL linking):

1. Click **Storage** in the left sidebar
2. Click the **Rules** tab
3. Replace existing rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User-specific audiobook storage
    match /users/{userId}/audiobooks/{filename} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**

---

### Phase 2: Local Testing

Before deploying to production, test locally:

#### 2.1 Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

#### 2.2 Test Authentication Flow

**Test Signup:**
1. Click the "Registrar-se" tab
2. Enter email: `test@example.com`
3. Enter password: `password123` (minimum 6 characters)
4. Click "Crear Compte"
5. ✅ You should be automatically logged in and see the home screen

**Test Logout:**
1. Click the logout button (icon in top-right)
2. ✅ You should return to the login screen

**Test Login:**
1. Enter the same credentials: `test@example.com` / `password123`
2. Click "Iniciar Sessió"
3. ✅ You should see the home screen

**Test Error Handling:**
1. Try logging in with wrong password
2. ✅ Should show error message in Catalan
3. Try signing up with existing email
4. ✅ Should show "email already exists" error

#### 2.3 Test Data Isolation

**Create data as User A:**
1. Login as `test@example.com`
2. Upload a note (use any .txt file)
3. Upload a test (use example test format)
4. Note the note/test titles
5. Logout

**Create User B and verify isolation:**
1. Signup as `test2@example.com` / `password123`
2. ✅ Dashboard should be empty (no User A's data)
3. Upload a different note
4. Logout

**Verify User A data persistence:**
1. Login as `test@example.com`
2. ✅ Should see only User A's original notes/tests
3. ✅ Should NOT see User B's note

**🎉 If all checks pass, authentication is working correctly!**

---

### Phase 3: Production Deployment (Vercel)

#### 3.1 Commit Changes

```bash
git add .
git commit -m "feat: implement Firebase Authentication for multi-user support"
git push origin main
```

#### 3.2 Deploy to Vercel

**Option A: Automatic Deployment**
- Vercel automatically detects the push
- Build starts automatically
- Wait for deployment to complete

**Option B: Manual Deployment**
```bash
vercel --prod
```

#### 3.3 Verify Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **super-nuria** (or your project name)
3. Go to **Settings** → **Environment Variables**
4. Verify these variables exist:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

**If missing:** Add them from your `.env.local` file

5. Redeploy if you added any variables

---

### Phase 4: Production Testing

#### 4.1 Open Production URL

Your app URL: `https://your-app-name.vercel.app`

#### 4.2 Repeat Authentication Tests

Run the same tests as in Phase 2.2 and 2.3, but on the production URL.

#### 4.3 Check Firebase Console

1. Open Firebase Console → **Authentication**
2. Go to **Users** tab
3. ✅ You should see the test accounts listed

1. Open Firebase Console → **Firestore Database**
2. Navigate to: `users` → `{userId}` → `notes`
3. ✅ You should see the uploaded notes

---

## Common Issues & Solutions

### Issue 1: "Permission Denied" Error

**Symptom:** Error in browser console when trying to load notes/tests

**Causes:**
- Firestore security rules not deployed
- Rules deployed incorrectly

**Solution:**
1. Go to Firebase Console → Firestore Database → Rules
2. Verify the rules exactly match the template in Step 1.2
3. Ensure "Published" status
4. Wait 1-2 minutes for rules to propagate
5. Refresh the app

### Issue 2: "Auth Domain Not Whitelisted"

**Symptom:** Authentication fails with domain error

**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Click "Authorized domains"
3. Add your production domain: `your-app-name.vercel.app`
4. Save and try again

### Issue 3: Empty Dashboard After Login

**Symptom:** User logs in but sees no data

**Possible causes:**
- User account is new (expected behavior)
- Security rules blocking access
- Wrong user logged in

**Solution:**
1. Verify you're logged in as the correct user (check email in header)
2. Upload some test data
3. Check Firestore Console to verify data was saved
4. Check browser console for errors

### Issue 4: Cannot Create Account

**Symptom:** "Error de registre" message when signing up

**Possible causes:**
- Email already in use
- Password too short (< 6 characters)
- Authentication not enabled

**Solution:**
1. Try a different email address
2. Ensure password is at least 6 characters
3. Verify Authentication is enabled in Firebase Console

---

## Security Checklist

Before going live with real users:

- [ ] ✅ Email/Password authentication is enabled in Firebase Console
- [ ] ✅ Firestore security rules are deployed and published
- [ ] ✅ All environment variables are set in Vercel
- [ ] ✅ Tested signup flow on production
- [ ] ✅ Tested login flow on production
- [ ] ✅ Tested logout flow on production
- [ ] ✅ Verified data isolation (User A cannot see User B's data)
- [ ] ✅ Checked browser console for errors (should be none)
- [ ] ✅ Tested on mobile device (responsive design)
- [ ] ⚠️ (Optional) Set up password reset functionality
- [ ] ⚠️ (Optional) Enable email verification

---

## Monitoring & Maintenance

### Firebase Console Monitoring

**Authentication Usage:**
- Firebase Console → Authentication → Users
- Track number of users
- Monitor sign-in methods

**Firestore Usage:**
- Firebase Console → Firestore Database → Usage
- Track document reads/writes
- Monitor storage usage

**Free Tier Limits:**
- Authentication: Unlimited users
- Firestore: 50,000 reads/day, 20,000 writes/day
- Storage: 1 GB free

### Vercel Monitoring

- Vercel Dashboard → Your Project → Analytics
- Monitor page views
- Check build status
- Review deployment logs

---

## Rollback Plan

If you need to rollback to single-user mode:

**⚠️ WARNING: This will break multi-user functionality**

1. Revert commits:
```bash
git revert HEAD~1
git push origin main
```

2. Restore old Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Open access (DEV ONLY)
    }
  }
}
```

3. Redeploy on Vercel

**Better approach:** Fix the issue instead of rolling back!

---

## Next Steps After Deployment

### 1. User Onboarding
- Create a welcome message or tutorial
- Add help/FAQ section
- Document the upload format for notes and tests

### 2. Feature Enhancements
- Implement password reset
- Add email verification
- Enable Google Sign-In
- Add user profile customization

### 3. Performance Optimization
- Enable Firestore offline persistence
- Implement pagination for large collections
- Add caching for frequently accessed data

### 4. Analytics
- Set up Google Analytics
- Track user engagement
- Monitor feature usage

---

## Support & Resources

**Firebase Documentation:**
- [Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

**Vercel Documentation:**
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Environment Variables](https://vercel.com/docs/environment-variables)

**Project Documentation:**
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `plan.md` - Original implementation plan
- `README.md` - Project overview
- `CLAUDE.md` - Development guidelines

---

**Last Updated:** November 1, 2025
**Status:** Ready for deployment
**Deployment Time Estimate:** 30-45 minutes (including testing)
