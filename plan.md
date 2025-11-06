# Multi-User Implementation Plan

**Overall Progress:** `70%`

---

## Phase 1: Firebase Authentication Setup

- [x] ✅ **Step 1.1: Add Firebase Auth to project**
  - [x] ✅ Export `auth` from [lib/firebase.ts](lib/firebase.ts)
  - [x] ✅ Import `getAuth` and `Auth` from `firebase/auth`

- [x] ✅ **Step 1.2: Create authentication context**
  - [x] ✅ Add auth state management to [app/page.tsx](app/page.tsx)
  - [x] ✅ Add `onAuthStateChanged` listener in `useEffect`
  - [x] ✅ Add `user` state (`User | null`) and `authLoading` state

- [x] ✅ **Step 1.3: Build login screen**
  - [x] ✅ Create login UI component (email/password form)
  - [x] ✅ Implement `signInWithEmailAndPassword` function
  - [x] ✅ Add error handling and display

- [x] ✅ **Step 1.4: Build signup screen**
  - [x] ✅ Create signup UI component (email/password form)
  - [x] ✅ Implement `createUserWithEmailAndPassword` function
  - [x] ✅ Add error handling and display

- [x] ✅ **Step 1.5: Add logout functionality**
  - [x] ✅ Add logout button in header/profile menu
  - [x] ✅ Implement `signOut` function
  - [x] ✅ Clear local state on logout

---

## Phase 2: Firestore Data Model Update (Subcollection Architecture)

- [x] ✅ **Step 2.1: Update Notes functions in [lib/firebaseService.ts](lib/firebaseService.ts)**
  - [x] ✅ Add `userId` parameter to `getAllNotes(userId: string)`
  - [x] ✅ Change collection path to `users/{userId}/notes`
  - [x] ✅ Add `userId` parameter to `addNote(userId, title, content)`
  - [x] ✅ Add `userId` parameter to `updateNote(userId, noteId, ...)`
  - [x] ✅ Add `userId` parameter to `deleteNote(userId, noteId)`

- [x] ✅ **Step 2.2: Update Tests functions**
  - [x] ✅ Add `userId` parameter to `getAllTests(userId: string)`
  - [x] ✅ Change collection path to `users/{userId}/tests`
  - [x] ✅ Add `userId` parameter to `addTest(userId, title, questions)`
  - [x] ✅ Add `userId` parameter to `updateTest(userId, testId, ...)`
  - [x] ✅ Add `userId` parameter to `deleteTest(userId, testId)`

- [x] ✅ **Step 2.3: Update AudioBooks functions**
  - [x] ✅ Add `userId` parameter to `getAllAudioBooks(userId: string)`
  - [x] ✅ Change collection path to `users/{userId}/audiobooks`
  - [x] ✅ Add `userId` parameter to `addAudioBook(userId, title, url, ...)`
  - [x] ✅ Add `userId` parameter to `updateAudioBook(userId, audioId, ...)`
  - [x] ✅ Add `userId` parameter to `deleteAudioBook(userId, audioId)`

- [x] ✅ **Step 2.4: Update Stats functions**
  - [x] ✅ Add `userId` parameter to `addNoteSession(userId, noteTitle, ...)`
  - [x] ✅ Change collection path to `users/{userId}/noteSessions`
  - [x] ✅ Add `userId` parameter to `getAllNoteSessions(userId: string)`
  - [x] ✅ Add `userId` parameter to `addTestAttempt(userId, testTitle, ...)`
  - [x] ✅ Change collection path to `users/{userId}/testAttempts`
  - [x] ✅ Add `userId` parameter to `getAllTestAttempts(userId: string)`

---

## Phase 3: Update UI to Use Authentication

- [x] ✅ **Step 3.1: Update data loading in [app/page.tsx](app/page.tsx)**
  - [x] ✅ Pass `user.uid` to all `getAll*()` functions
  - [x] ✅ Pass `user.uid` to all `add*()` functions
  - [x] ✅ Pass `user.uid` to all `update*()` functions
  - [x] ✅ Pass `user.uid` to all `delete*()` functions
  - [x] ✅ Only load data when `user` is authenticated

- [x] ✅ **Step 3.2: Add authentication gates**
  - [x] ✅ Show loading screen while `authLoading` is true
  - [x] ✅ Show login/signup screen when `user` is null
  - [x] ✅ Show main app when `user` exists

- [x] ✅ **Step 3.3: Add user profile UI**
  - [x] ✅ Add user email display in header
  - [x] ✅ Add logout button
  - [x] ✅ Style user menu with theme colors

---

## Phase 4: Deploy Security Rules ⚠️ MANUAL STEPS REQUIRED

**IMPORTANT: These steps must be completed manually in the Firebase Console**

- [ ] ⚠️ **Step 4.1: Enable Firebase Authentication**
  - [ ] ⚠️ Open Firebase Console → Authentication → Get Started
  - [ ] ⚠️ Enable Email/Password sign-in method
  - [ ] ⚠️ Save changes

- [ ] ⚠️ **Step 4.2: Configure Firestore security rules**
  - [ ] ⚠️ Open Firebase Console → Firestore Database → Rules
  - [ ] ⚠️ Replace rules with the following:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // User data - subcollection architecture
        match /users/{userId}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        // Deny all other access
        match /{document=**} {
          allow read, write: if false;
        }
      }
    }
    ```
  - [ ] ⚠️ Publish rules

- [ ] ⚠️ **Step 4.3: Configure Storage security rules (if using Firebase Storage)**
  - [ ] ⚠️ Open Firebase Console → Storage → Rules
  - [ ] ⚠️ Replace rules with:
    ```javascript
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /users/{userId}/audiobooks/{filename} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
  - [ ] ⚠️ Publish rules

- [ ] ⚠️ **Step 4.4: Test security**
  - [ ] ⚠️ Create a test user account
  - [ ] ⚠️ Verify user can create notes/tests/audiobooks
  - [ ] ⚠️ Create a second test user
  - [ ] ⚠️ Verify User B cannot see User A's data
  - [ ] ⚠️ Test that unauthenticated access is blocked

---

## Phase 5: Testing & Polish ⚠️ USER TESTING REQUIRED

**These steps should be performed after deploying to production or test environment**

- [ ] ⚠️ **Step 5.1: Test authentication flow**
  - [ ] ⚠️ Test signup with new user
  - [ ] ⚠️ Test login with existing user
  - [ ] ⚠️ Test logout
  - [ ] ⚠️ Test invalid credentials error handling
  - [ ] ⚠️ Test email already exists error

- [ ] ⚠️ **Step 5.2: Test data isolation**
  - [ ] ⚠️ Create notes/tests/audiobooks as User A
  - [ ] ⚠️ Login as User B
  - [ ] ⚠️ Verify User B doesn't see User A's content
  - [ ] ⚠️ Create content as User B
  - [ ] ⚠️ Login back as User A and verify separation

- [ ] ⚠️ **Step 5.3: Update documentation**
  - [ ] ⚠️ Update [README.md](README.md) with authentication setup instructions
  - [ ] ⚠️ Update [CLAUDE.md](CLAUDE.md) with multi-user architecture details
  - [ ] ⚠️ Add authentication screenshots to docs (optional)

---

## Optional Enhancements (Post-MVP)

- [ ] 🟥 **Email verification on signup**
- [ ] 🟥 **Password reset functionality**
- [ ] 🟥 **Google Sign-In integration**
- [ ] 🟥 **User profile settings (display name, avatar)**
- [ ] 🟥 **Remember me / persistent login**

---

## Implementation Summary

✅ **Code Implementation Complete (70% of total plan)**

All code changes have been successfully implemented:
- ✅ Firebase Authentication initialized in [lib/firebase.ts](lib/firebase.ts)
- ✅ All Firestore functions updated with userId parameters in [lib/firebaseService.ts](lib/firebaseService.ts)
- ✅ Complete authentication UI (login/signup/logout) added to [app/page.tsx](app/page.tsx)
- ✅ All data operations now scoped to authenticated users
- ✅ Loading states and error handling implemented
- ✅ User profile display and logout functionality added

⚠️ **Manual Steps Remaining (30% of total plan)**

To complete the implementation, you must:
1. **Enable Email/Password authentication** in Firebase Console
2. **Deploy Firestore security rules** to enforce user data isolation
3. **Test the authentication flow** with real users
4. **Update documentation** with new authentication requirements

---

## Technical Notes

- **Architecture Choice:** Subcollection structure (`users/{userId}/notes`, `users/{userId}/tests`, etc.)
- **Auth Method:** Email/Password (Firebase Authentication)
- **Language:** All UI text in Catalan
- **Theme:** Maintains existing "girly pastel" theme system
- **Data Migration:** Not needed - project is in development phase
- **Firestore Free Tier:** Sufficient for initial rollout (~1000-5000 users)

---

## Files Modified

1. **[lib/firebase.ts](lib/firebase.ts)** - Added Firebase Auth initialization
2. **[lib/firebaseService.ts](lib/firebaseService.ts)** - Updated all functions to accept `userId` parameter
3. **[app/page.tsx](app/page.tsx)** - Added complete authentication system with UI
