# Firestore Security Rules for StudyDock Sharing Feature

This document contains the Firestore security rules required for the sharing feature to work properly. These rules enforce read-only access for shared content while maintaining full control for content owners.

## How to Apply These Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy and paste the rules below
5. Click **Publish**

⚠️ **Important**: These rules replace your existing rules. Make sure to backup your current rules before applying these.

## Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // USER DATA - FULL ACCESS FOR OWNER
    // ============================================

    // User's own notes - Full access for owner
    match /users/{userId}/notes/{noteId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Shared access: Guest can only read
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(userId));
    }

    // User's own tests - Full access for owner
    match /users/{userId}/tests/{testId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Shared access: Guest can only read
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(userId));
    }

    // User's own audiobooks - Full access for owner
    match /users/{userId}/audiobooks/{audioId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Shared access: Guest can only read
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(userId));
    }

    // User's note sessions (study stats) - Owner only
    match /users/{userId}/noteSessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User's test attempts (test stats) - Owner only
    match /users/{userId}/testAttempts/{attemptId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ============================================
    // SHARING SYSTEM
    // ============================================

    // Access list: Which owners the guest has access to
    match /users/{userId}/accessTo/{ownerId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;

      // Owner can see who has access to their content
      allow read: if request.auth != null && request.auth.uid == ownerId;
      allow delete: if request.auth != null && request.auth.uid == ownerId;
    }

    // Shared with list: Which guests have access to owner's content
    match /users/{ownerId}/sharedWith/{guestId} {
      allow read: if request.auth != null && request.auth.uid == ownerId;
      allow write: if request.auth != null && (
        request.auth.uid == ownerId ||
        request.auth.uid == guestId
      );
    }

    // ============================================
    // INVITATIONS
    // ============================================

    // Invitations - Anyone authenticated can read to accept them
    match /invitations/{code} {
      // Anyone can read invitations to accept them
      allow read: if request.auth != null;

      // Only authenticated users can create invitations
      allow create: if request.auth != null;

      // Only the invitation owner can update or delete
      allow update, delete: if request.auth != null &&
        request.auth.uid == resource.data.ownerId;
    }
  }
}
```

## Rule Explanations

### Notes, Tests, and Audiobooks

```javascript
match /users/{userId}/notes/{noteId} {
  // Owner has full access
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // Guests can only read if they have accessTo document
  allow read: if request.auth != null &&
    exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(userId));
}
```

**How it works:**
- Owners can do anything with their own content
- Guests can only read if they have an `accessTo/{ownerId}` document
- Guests cannot write, edit, or delete owner's content

### Sharing Lists

```javascript
match /users/{userId}/accessTo/{ownerId} {
  // Users can manage their own access list
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // Owners can see who has access to their content
  allow read: if request.auth != null && request.auth.uid == ownerId;
  allow delete: if request.auth != null && request.auth.uid == ownerId;
}
```

**How it works:**
- Users can see and manage which accounts they have access to
- Content owners can see who has access to their content
- Content owners can revoke access by deleting the accessTo document

### Invitations

```javascript
match /invitations/{code} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null &&
    request.auth.uid == resource.data.ownerId;
}
```

**How it works:**
- Any authenticated user can read invitations (needed to accept them)
- Any authenticated user can create invitations
- Only the invitation creator can modify or delete their invitations

## Testing the Rules

### Test 1: Owner Access
✅ Owner can read their own notes
✅ Owner can create new notes
✅ Owner can update their notes
✅ Owner can delete their notes

### Test 2: Guest Access (with invitation accepted)
✅ Guest can read owner's notes
❌ Guest cannot create notes in owner's account
❌ Guest cannot update owner's notes
❌ Guest cannot delete owner's notes

### Test 3: Guest Access (without invitation)
❌ Guest cannot read owner's notes
❌ Guest cannot access any of owner's content

### Test 4: Invitations
✅ Anyone authenticated can read invitation details
✅ Anyone authenticated can create invitations
✅ Only invitation owner can delete invitations

### Test 5: Stats (Always Private)
✅ Users can read/write their own stats
❌ Others cannot read user's stats (even with shared access)

## Common Issues and Solutions

### Issue: "Missing or insufficient permissions"

**Cause**: The security rules are not applied or are incorrect.

**Solution**:
1. Make sure you published the rules in Firebase Console
2. Wait 1-2 minutes for rules to propagate
3. Check that the user is authenticated (`request.auth != null`)
4. Verify the invitation was accepted correctly

### Issue: Guest can see content but it says "Missing or insufficient permissions"

**Cause**: The `accessTo` document doesn't exist for that guest-owner pair.

**Solution**:
1. Check if invitation was accepted properly
2. Verify the `users/{guestId}/accessTo/{ownerId}` document exists
3. Verify the `users/{ownerId}/sharedWith/{guestId}` document exists

### Issue: Error when accepting invitation

**Cause**: Firestore rules might be blocking the write operation.

**Solution**:
1. Make sure the invitation exists and is not expired
2. Check that both `accessTo` and `sharedWith` rules allow creation
3. Verify the user is authenticated

## Production vs Development Rules

### Development (Testing)
For testing purposes only, you can temporarily use more permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: Never use these rules in production! They allow any authenticated user to access and modify any data.

### Production (Secure)
Always use the complete rules provided at the top of this document for production deployments.

## Monitoring Access

You can monitor access attempts in Firebase Console:

1. Go to **Firestore Database** → **Rules** tab
2. Click on **Rules Playground** to test specific scenarios
3. Check **Usage** tab to see denied requests

## Rule Updates

If you need to modify the rules:

1. Always test changes in the Rules Playground first
2. Consider the impact on existing users
3. Update this documentation
4. Test with real accounts before wide deployment

---

**Last Updated**: December 2024
**Version**: 1.0
**Sharing Feature**: Enabled
