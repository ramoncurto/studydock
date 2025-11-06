# Sharing Feature Implementation Plan

## Overview
This document outlines the implementation plan for adding content sharing functionality to StudyDock. Users will be able to share their notes, tests, and audiobooks with others through invitation codes. Invited users will have read-only access.

## Architecture

### Database Structure

#### Firestore Collections

**1. `/invitations/{code}` (Root-level collection)**
```typescript
{
  code: string;              // 8-character alphanumeric code
  ownerId: string;           // User ID of content owner
  ownerEmail: string;        // Email of content owner
  createdAt: Timestamp;      // Creation date
  expiresAt: Timestamp;      // Expiration date (default: 30 days)
  usedBy: string[];          // Array of user IDs who accepted
  maxUses: number;           // Maximum uses (default: 999)
}
```

**2. `/users/{userId}/accessTo/{ownerId}` (Guest's access list)**
```typescript
{
  ownerId: string;           // User ID they have access to
  ownerEmail: string;        // Email of owner
  grantedAt: Timestamp;      // When access was granted
}
```

**3. `/users/{userId}/sharedWith/{guestId}` (Owner's guests list)**
```typescript
{
  guestId: string;           // User ID of guest
  guestEmail: string;        // Email of guest
  grantedAt: Timestamp;      // When access was granted
}
```

### Permission Model

**Owner Permissions:**
- ✅ Read all own content
- ✅ Create notes, tests, audiobooks
- ✅ Edit/delete own content
- ✅ Generate invitation codes
- ✅ Revoke guest access

**Guest Permissions (Read-Only):**
- ✅ Read notes from owners they have access to
- ✅ Take tests from owners they have access to
- ✅ Listen to audiobooks from owners they have access to
- ❌ Upload/create new content
- ❌ Edit/delete any content
- ❌ Generate invitations for content that isn't theirs

## Implementation Steps

### ✅ Phase 1: Backend Services (COMPLETED)

All sharing-related functions have been added to `lib/firebaseService.ts`:
- `createInvitation()` - Generate invitation codes
- `getInvitation()` - Retrieve invitation details
- `acceptInvitation()` - Accept an invitation and grant access
- `getUserInvitations()` - Get user's created invitations
- `getSharedAccess()` - Get accounts user has access to
- `revokeAccess()` - Remove guest access
- `deleteInvitation()` - Delete an invitation

### 🔄 Phase 2: State Management (IN PROGRESS)

Add to `app/page.tsx`:

```typescript
// New state variables needed:
const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([]);
const [userInvitations, setUserInvitations] = useState<Invitation[]>([]);
const [viewingOwnerId, setViewingOwnerId] = useState<string | null>(null);
const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
const [invitationCode, setInvitationCode] = useState('');

// Screen additions:
// 'sharing' - Manage invitations and view shared accounts
// 'accept-invitation' - Accept invitation screen
// 'shared-content' - View shared owner's content
```

### 📋 Phase 3: UI Screens

#### 3.1 Home Screen Updates
Add buttons to:
- "Compartir els meus materials" (Share my materials)
- "Veure materials compartits" (View shared materials)

#### 3.2 Sharing Management Screen (`screen === 'sharing'`)

**Owner Section:**
- Button: "Generar Nova Invitació"
- Display list of active invitations with:
  - Invitation code
  - Created date
  - Expires date
  - Usage count
  - Copy button for invitation link
  - Delete button
- Display list of users with access:
  - Guest email
  - Access granted date
  - Revoke access button

**Guest Section:**
- "Utilitzar Codi d'Invitació" form
- List of accounts user has access to:
  - Owner email
  - Access granted date
  - "View Content" button

#### 3.3 Shared Content Viewer Screen (`screen === 'shared-content'`)

Similar to main app but:
- Display owner's email at top
- Show "Read-Only" badge
- Disable all upload buttons
- Disable all edit/delete buttons
- Allow viewing notes, taking tests, listening to audiobooks
- All stats saved to guest's account (not owner's)

#### 3.4 Invitation Acceptance Flow

URL format: `https://yourdomain.com?invite=ABCD1234`

- Check URL parameters on app load
- If `invite` parameter exists:
  - Show invitation details
  - "Accept" button
  - On accept, call `acceptInvitation()`
  - Redirect to shared content

### 🔒 Phase 4: Firestore Security Rules

Update security rules to allow:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User's own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Shared access: Guest can read owner's content
    match /users/{ownerId}/notes/{noteId} {
      allow read: if request.auth != null && (
        request.auth.uid == ownerId ||
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(ownerId))
      );
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }

    match /users/{ownerId}/tests/{testId} {
      allow read: if request.auth != null && (
        request.auth.uid == ownerId ||
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(ownerId))
      );
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }

    match /users/{ownerId}/audiobooks/{audioId} {
      allow read: if request.auth != null && (
        request.auth.uid == ownerId ||
        exists(/databases/$(database)/documents/users/$(request.auth.uid)/accessTo/$(ownerId))
      );
      allow write: if request.auth != null && request.auth.uid == ownerId;
    }

    // Invitations: Anyone authenticated can read, only owner can write
    match /invitations/{code} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

### 🎨 Phase 5: Visual Indicators

**Read-Only Mode Indicators:**
- Orange/amber badge at top: "Mode Només Lectura - Materials de {ownerEmail}"
- Hide all upload buttons (Upload icon in HomeScreen)
- Hide all edit/delete buttons (Edit3, Trash2 icons)
- Show info icon tooltip: "No pots modificar materials compartits"

**Owner View Indicators:**
- Green badge when viewing own content: "Els Teus Materials"
- Show sharing button (Share icon)

### 📱 Phase 6: User Experience Flow

#### Owner Workflow:
1. Click "Compartir els meus materials"
2. Click "Generar Nova Invitació"
3. Copy invitation link
4. Share link via email/WhatsApp/etc
5. See when guests accept
6. Revoke access if needed

#### Guest Workflow:
1. Receive invitation link
2. Click link (or enter code manually)
3. Sign in/sign up to StudyDock
4. Accept invitation
5. View owner's materials in read-only mode
6. Take tests and view notes
7. Stats are saved to own account

## Testing Checklist

### Owner Tests:
- [ ] Create invitation successfully
- [ ] Copy invitation link works
- [ ] View list of invitations
- [ ] Delete invitation
- [ ] View list of guests with access
- [ ] Revoke guest access
- [ ] Expired invitations don't work
- [ ] Max uses limit respected

### Guest Tests:
- [ ] Accept invitation via link
- [ ] Accept invitation via code input
- [ ] View owner's notes (read-only)
- [ ] Take owner's tests
- [ ] Listen to owner's audiobooks
- [ ] Cannot upload content to owner's account
- [ ] Cannot edit owner's content
- [ ] Cannot delete owner's content
- [ ] Test stats saved to own account
- [ ] Can access multiple owners' content

### Security Tests:
- [ ] Guest cannot access owner's content without invitation
- [ ] Revoked access prevents viewing
- [ ] Expired invitations rejected
- [ ] Guest cannot modify owner's data via API

## Benefits

✨ **For Students:**
- Study groups can share materials easily
- Access to peer's organized notes
- Practice with shared test banks
- No duplicate manual work

✨ **For Teachers/Tutors:**
- Share materials with students
- Track who has access
- Revoke access when needed
- Students can't modify original content

✨ **For the App:**
- Increases user engagement
- Network effects (more users invite more users)
- Premium feature potential (limit number of shares on free tier)

## Future Enhancements

🚀 Potential future features:
- Email invitations directly from app
- Invitation expiration notifications
- Usage analytics (which materials are most viewed)
- Comments on shared materials
- Public sharing links (no signup required, view-only)
- Sharing permissions levels (read-only, take tests, etc)
- Shared folders/collections
- Collaborative editing (future)

---

**Implementation Priority:** High
**Estimated Complexity:** Medium-High
**User Value:** Very High
