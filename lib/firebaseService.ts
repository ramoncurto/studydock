// Firebase service functions for notes and tests
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';

// Types
export interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
}

export interface Question {
  question: string;
  options: string[];
  correct: string;
}

export interface Test {
  id: number;
  title: string;
  questions: Question[];
  date: string;
}

export interface NoteSession {
  noteTitle: string;
  startTime: string;
  duration: number; // in seconds
  date: string;
}

export interface TestAttempt {
  testTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  timestamp: number;
}

// Firestore document types (with Firestore metadata)
interface NoteDoc {
  title: string;
  content: string;
  createdAt: Timestamp;
}

interface TestDoc {
  title: string;
  questions: Question[];
  createdAt: Timestamp;
}

interface NoteSessionDoc {
  noteTitle: string;
  startTime: string;
  duration: number;
  createdAt: Timestamp;
}

interface TestAttemptDoc {
  testTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: Timestamp;
}

// ============ NOTES FUNCTIONS ============

/**
 * Get all notes for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of notes belonging to the user
 */
export async function getAllNotes(userId: string): Promise<Note[]> {
  try {
    const notesQuery = query(
      collection(db, `users/${userId}/notes`),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(notesQuery);

    const notes: Note[] = querySnapshot.docs.map((doc, index) => {
      const data = doc.data() as NoteDoc;
      return {
        id: Date.now() + index, // Generate unique ID
        title: data.title,
        content: data.content,
        date: data.createdAt?.toDate().toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES'),
      };
    });

    return notes;
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
}

/**
 * Add a new note for a specific user
 * @param userId - The authenticated user's ID
 * @param title - Note title
 * @param content - Note content
 */
export async function addNote(userId: string, title: string, content: string): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/notes`), {
      title,
      content,
      createdAt: Timestamp.now(),
    } as NoteDoc);
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
}

/**
 * Update a note for a specific user
 * @param userId - The authenticated user's ID
 * @param noteId - The note's local ID
 * @param allNotes - Array of all user's notes
 * @param newTitle - New title for the note
 */
export async function updateNote(userId: string, noteId: number, allNotes: Note[], newTitle: string): Promise<void> {
  try {
    // Find the note to get its current title
    const noteToUpdate = allNotes.find(n => n.id === noteId);
    if (!noteToUpdate) return;

    // Get all notes from Firestore
    const querySnapshot = await getDocs(collection(db, `users/${userId}/notes`));

    // Find the matching document by title
    const docToUpdate = querySnapshot.docs.find(doc => {
      const data = doc.data() as NoteDoc;
      return data.title === noteToUpdate.title;
    });

    if (docToUpdate) {
      await updateDoc(doc(db, `users/${userId}/notes`, docToUpdate.id), {
        title: newTitle,
      });
    }
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note for a specific user
 * @param userId - The authenticated user's ID
 * @param noteId - The note's local ID
 * @param allNotes - Array of all user's notes
 */
export async function deleteNote(userId: string, noteId: number, allNotes: Note[]): Promise<void> {
  try {
    // Find the note to get its title (we'll use title as identifier since Firestore uses different IDs)
    const noteToDelete = allNotes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    // Get all notes from Firestore
    const querySnapshot = await getDocs(collection(db, `users/${userId}/notes`));

    // Find the matching document by title and date
    const docToDelete = querySnapshot.docs.find(doc => {
      const data = doc.data() as NoteDoc;
      return data.title === noteToDelete.title;
    });

    if (docToDelete) {
      await deleteDoc(doc(db, `users/${userId}/notes`, docToDelete.id));
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

// ============ TESTS FUNCTIONS ============

/**
 * Get all tests for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of tests belonging to the user
 */
export async function getAllTests(userId: string): Promise<Test[]> {
  try {
    const testsQuery = query(
      collection(db, `users/${userId}/tests`),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(testsQuery);

    const tests: Test[] = querySnapshot.docs.map((doc, index) => {
      const data = doc.data() as TestDoc;
      return {
        id: Date.now() + index, // Generate unique ID
        title: data.title,
        questions: data.questions,
        date: data.createdAt?.toDate().toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES'),
      };
    });

    return tests;
  } catch (error) {
    console.error('Error getting tests:', error);
    return [];
  }
}

/**
 * Add a new test for a specific user
 * @param userId - The authenticated user's ID
 * @param title - Test title
 * @param questions - Array of test questions
 */
export async function addTest(userId: string, title: string, questions: Question[]): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/tests`), {
      title,
      questions,
      createdAt: Timestamp.now(),
    } as TestDoc);
  } catch (error) {
    console.error('Error adding test:', error);
    throw error;
  }
}

/**
 * Update a test for a specific user
 * @param userId - The authenticated user's ID
 * @param testId - The test's local ID
 * @param allTests - Array of all user's tests
 * @param newTitle - New title for the test
 */
export async function updateTest(userId: string, testId: number, allTests: Test[], newTitle: string): Promise<void> {
  try {
    // Find the test to get its current title
    const testToUpdate = allTests.find(t => t.id === testId);
    if (!testToUpdate) return;

    // Get all tests from Firestore
    const querySnapshot = await getDocs(collection(db, `users/${userId}/tests`));

    // Find the matching document by title
    const docToUpdate = querySnapshot.docs.find(doc => {
      const data = doc.data() as TestDoc;
      return data.title === testToUpdate.title;
    });

    if (docToUpdate) {
      await updateDoc(doc(db, `users/${userId}/tests`, docToUpdate.id), {
        title: newTitle,
      });
    }
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
}

/**
 * Delete a test for a specific user
 * @param userId - The authenticated user's ID
 * @param testId - The test's local ID
 * @param allTests - Array of all user's tests
 */
export async function deleteTest(userId: string, testId: number, allTests: Test[]): Promise<void> {
  try {
    // Find the test to get its title
    const testToDelete = allTests.find(t => t.id === testId);
    if (!testToDelete) return;

    // Get all tests from Firestore
    const querySnapshot = await getDocs(collection(db, `users/${userId}/tests`));

    // Find the matching document by title
    const docToDelete = querySnapshot.docs.find(doc => {
      const data = doc.data() as TestDoc;
      return data.title === testToDelete.title;
    });

    if (docToDelete) {
      await deleteDoc(doc(db, `users/${userId}/tests`, docToDelete.id));
    }
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
}

// ============ STATS FUNCTIONS ============

/**
 * Add a note reading session for a specific user
 * @param userId - The authenticated user's ID
 * @param noteTitle - Title of the note read
 * @param startTime - Start time of the session
 * @param duration - Duration in seconds
 */
export async function addNoteSession(userId: string, noteTitle: string, startTime: string, duration: number): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/noteSessions`), {
      noteTitle,
      startTime,
      duration,
      createdAt: Timestamp.now(),
    } as NoteSessionDoc);
  } catch (error) {
    console.error('Error adding note session:', error);
    throw error;
  }
}

/**
 * Get all note reading sessions for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of note sessions
 */
export async function getAllNoteSessions(userId: string): Promise<NoteSession[]> {
  try {
    const sessionsQuery = query(
      collection(db, `users/${userId}/noteSessions`),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(sessionsQuery);

    const sessions: NoteSession[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as NoteSessionDoc;
      return {
        noteTitle: data.noteTitle,
        startTime: data.startTime,
        duration: data.duration,
        date: data.createdAt?.toDate().toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES'),
      };
    });

    return sessions;
  } catch (error) {
    console.error('Error getting note sessions:', error);
    return [];
  }
}

/**
 * Add a test attempt for a specific user
 * @param userId - The authenticated user's ID
 * @param testTitle - Title of the test taken
 * @param score - Number of correct answers
 * @param totalQuestions - Total number of questions
 * @param percentage - Score percentage
 */
export async function addTestAttempt(
  userId: string,
  testTitle: string,
  score: number,
  totalQuestions: number,
  percentage: number
): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/testAttempts`), {
      testTitle,
      score,
      totalQuestions,
      percentage,
      createdAt: Timestamp.now(),
    } as TestAttemptDoc);
  } catch (error) {
    console.error('Error adding test attempt:', error);
    throw error;
  }
}

/**
 * Get all test attempts for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of test attempts
 */
export async function getAllTestAttempts(userId: string): Promise<TestAttempt[]> {
  try {
    const attemptsQuery = query(
      collection(db, `users/${userId}/testAttempts`),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(attemptsQuery);

    const attempts: TestAttempt[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as TestAttemptDoc;
      return {
        testTitle: data.testTitle,
        score: data.score,
        totalQuestions: data.totalQuestions,
        percentage: data.percentage,
        date: data.createdAt?.toDate().toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES'),
        timestamp: data.createdAt?.toMillis() || Date.now(),
      };
    });

    return attempts;
  } catch (error) {
    console.error('Error getting test attempts:', error);
    return [];
  }
}

// ============ AUDIO FUNCTIONS ============

export interface AudioBook {
  id: number;
  title: string;
  url: string;
  storagePath: string;
  duration?: number;
  date: string;
  relatedNoteTitle?: string; // Link to a specific note
}

interface AudioBookDoc {
  title: string;
  url: string;
  storagePath: string;
  duration?: number;
  relatedNoteTitle?: string;
  createdAt: Timestamp;
}

/**
 * Get all audiobooks for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of audiobooks belonging to the user
 */
export async function getAllAudioBooks(userId: string): Promise<AudioBook[]> {
  try {
    const audioBooksQuery = query(
      collection(db, `users/${userId}/audiobooks`),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(audioBooksQuery);

    const audioBooks: AudioBook[] = querySnapshot.docs.map((doc, index) => {
      const data = doc.data() as AudioBookDoc;
      return {
        id: Date.now() + index,
        title: data.title,
        url: data.url,
        storagePath: data.storagePath,
        duration: data.duration,
        relatedNoteTitle: data.relatedNoteTitle,
        date: data.createdAt?.toDate().toLocaleDateString('es-ES') || new Date().toLocaleDateString('es-ES'),
      };
    });

    return audioBooks;
  } catch (error) {
    console.error('Error getting audiobooks:', error);
    return [];
  }
}

/**
 * Add a new audiobook for a specific user
 * @param userId - The authenticated user's ID
 * @param title - Audiobook title
 * @param url - URL to the audio file
 * @param relatedNoteTitle - Optional title of related note
 */
export async function addAudioBook(userId: string, title: string, url: string, relatedNoteTitle?: string): Promise<void> {
  try {
    // Add metadata to Firestore (URL-based, no file upload)
    await addDoc(collection(db, `users/${userId}/audiobooks`), {
      title,
      url,
      storagePath: '', // Empty since we're not using Storage
      relatedNoteTitle,
      createdAt: Timestamp.now(),
    } as AudioBookDoc);
  } catch (error) {
    console.error('Error adding audiobook:', error);
    throw error;
  }
}

/**
 * Update an audiobook for a specific user
 * @param userId - The authenticated user's ID
 * @param audioId - The audiobook's local ID
 * @param allAudioBooks - Array of all user's audiobooks
 * @param newTitle - New title for the audiobook
 * @param newUrl - New URL for the audiobook
 */
export async function updateAudioBook(userId: string, audioId: number, allAudioBooks: AudioBook[], newTitle: string, newUrl: string): Promise<void> {
  try {
    const audioToUpdate = allAudioBooks.find(a => a.id === audioId);
    if (!audioToUpdate) return;

    // Get all audiobooks from Firestore
    const querySnapshot = await getDocs(collection(db, `users/${userId}/audiobooks`));

    // Find the matching document by URL
    const docToUpdate = querySnapshot.docs.find(doc => {
      const data = doc.data() as AudioBookDoc;
      return data.url === audioToUpdate.url;
    });

    if (docToUpdate) {
      await updateDoc(doc(db, `users/${userId}/audiobooks`, docToUpdate.id), {
        title: newTitle,
        url: newUrl,
      });
    }
  } catch (error) {
    console.error('Error updating audiobook:', error);
    throw error;
  }
}

/**
 * Delete an audiobook for a specific user
 * @param userId - The authenticated user's ID
 * @param audioId - The audiobook's local ID
 * @param allAudioBooks - Array of all user's audiobooks
 */
export async function deleteAudioBook(userId: string, audioId: number, allAudioBooks: AudioBook[]): Promise<void> {
  try {
    const audioToDelete = allAudioBooks.find(a => a.id === audioId);
    if (!audioToDelete) return;

    // Get all audiobooks from Firestore
    const querySnapshot = await getDocs(collection(db, `users/${userId}/audiobooks`));

    // Find the matching document by URL (since we're not using storage)
    const docToDelete = querySnapshot.docs.find(doc => {
      const data = doc.data() as AudioBookDoc;
      return data.url === audioToDelete.url;
    });

    if (docToDelete) {
      // Only delete document from Firestore (no storage file to delete)
      await deleteDoc(doc(db, `users/${userId}/audiobooks`, docToDelete.id));
    }
  } catch (error) {
    console.error('Error deleting audiobook:', error);
    throw error;
  }
}

// ============ SHARING FUNCTIONS ============

export interface Invitation {
  code: string;
  ownerId: string;
  ownerEmail: string;
  createdAt: string;
  expiresAt: string;
  usedBy?: string[];
  maxUses?: number;
}

export interface SharedAccess {
  ownerId: string;
  ownerEmail: string;
  grantedAt: string;
}

interface InvitationDoc {
  code: string;
  ownerId: string;
  ownerEmail: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedBy: string[];
  maxUses: number;
}

interface SharedAccessDoc {
  ownerId: string;
  ownerEmail: string;
  grantedAt: Timestamp;
}

/**
 * Generate a unique invitation code
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new invitation for sharing content
 * @param userId - The owner's user ID
 * @param userEmail - The owner's email
 * @param expirationDays - Days until invitation expires (default: 30)
 * @param maxUses - Maximum number of times invitation can be used (default: unlimited)
 * @returns The generated invitation code
 */
export async function createInvitation(
  userId: string,
  userEmail: string,
  expirationDays: number = 30,
  maxUses: number = 999
): Promise<string> {
  try {
    const code = generateInvitationCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

    await setDoc(doc(db, `invitations/${code}`), {
      code,
      ownerId: userId,
      ownerEmail: userEmail,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      usedBy: [],
      maxUses,
    } as InvitationDoc);

    return code;
  } catch (error) {
    console.error('Error creating invitation:', error);
    throw error;
  }
}

/**
 * Get an invitation by code
 * @param code - The invitation code
 * @returns The invitation data or null if not found/expired
 */
export async function getInvitation(code: string): Promise<Invitation | null> {
  try {
    const invitationDoc = await getDoc(doc(db, `invitations/${code}`));

    if (!invitationDoc.exists()) {
      return null;
    }

    const data = invitationDoc.data() as InvitationDoc;

    // Check if expired
    if (data.expiresAt.toDate() < new Date()) {
      return null;
    }

    // Check if max uses reached
    if (data.usedBy.length >= data.maxUses) {
      return null;
    }

    return {
      code: data.code,
      ownerId: data.ownerId,
      ownerEmail: data.ownerEmail,
      createdAt: data.createdAt.toDate().toLocaleDateString('es-ES'),
      expiresAt: data.expiresAt.toDate().toLocaleDateString('es-ES'),
      usedBy: data.usedBy,
      maxUses: data.maxUses,
    };
  } catch (error) {
    console.error('Error getting invitation:', error);
    return null;
  }
}

/**
 * Accept an invitation and grant access to guest user
 * @param code - The invitation code
 * @param guestId - The guest user's ID
 * @param guestEmail - The guest user's email
 * @returns True if successful, false otherwise
 */
export async function acceptInvitation(
  code: string,
  guestId: string,
  guestEmail: string
): Promise<boolean> {
  try {
    const invitation = await getInvitation(code);

    if (!invitation) {
      return false;
    }

    // Check if user already has access
    if (invitation.usedBy?.includes(guestId)) {
      return true; // Already has access
    }

    // Grant access to guest
    await setDoc(doc(db, `users/${guestId}/accessTo/${invitation.ownerId}`), {
      ownerId: invitation.ownerId,
      ownerEmail: invitation.ownerEmail,
      grantedAt: Timestamp.now(),
    } as SharedAccessDoc);

    // Grant access from owner's perspective
    await setDoc(doc(db, `users/${invitation.ownerId}/sharedWith/${guestId}`), {
      guestId: guestId,
      guestEmail: guestEmail,
      grantedAt: Timestamp.now(),
    });

    // Update invitation usage
    await updateDoc(doc(db, `invitations/${code}`), {
      usedBy: arrayUnion(guestId),
    });

    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return false;
  }
}

/**
 * Get all invitations created by a user
 * @param userId - The owner's user ID
 * @returns Array of invitations
 */
export async function getUserInvitations(userId: string): Promise<Invitation[]> {
  try {
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(invitationsQuery);

    const invitations: Invitation[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as InvitationDoc;
      return {
        code: data.code,
        ownerId: data.ownerId,
        ownerEmail: data.ownerEmail,
        createdAt: data.createdAt.toDate().toLocaleDateString('es-ES'),
        expiresAt: data.expiresAt.toDate().toLocaleDateString('es-ES'),
        usedBy: data.usedBy,
        maxUses: data.maxUses,
      };
    });

    return invitations;
  } catch (error) {
    console.error('Error getting user invitations:', error);
    return [];
  }
}

/**
 * Get all accounts the user has access to (as a guest)
 * @param userId - The guest user's ID
 * @returns Array of shared access records
 */
export async function getSharedAccess(userId: string): Promise<SharedAccess[]> {
  try {
    const accessQuery = query(collection(db, `users/${userId}/accessTo`));
    const querySnapshot = await getDocs(accessQuery);

    const accessList: SharedAccess[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as SharedAccessDoc;
      return {
        ownerId: data.ownerId,
        ownerEmail: data.ownerEmail,
        grantedAt: data.grantedAt.toDate().toLocaleDateString('es-ES'),
      };
    });

    return accessList;
  } catch (error) {
    console.error('Error getting shared access:', error);
    return [];
  }
}

/**
 * Revoke access for a specific guest user
 * @param ownerId - The owner's user ID
 * @param guestId - The guest user's ID to revoke
 */
export async function revokeAccess(ownerId: string, guestId: string): Promise<void> {
  try {
    // Remove from owner's sharedWith list
    await deleteDoc(doc(db, `users/${ownerId}/sharedWith/${guestId}`));

    // Remove from guest's accessTo list
    await deleteDoc(doc(db, `users/${guestId}/accessTo/${ownerId}`));
  } catch (error) {
    console.error('Error revoking access:', error);
    throw error;
  }
}

/**
 * Delete an invitation
 * @param code - The invitation code to delete
 */
export async function deleteInvitation(code: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `invitations/${code}`));
  } catch (error) {
    console.error('Error deleting invitation:', error);
    throw error;
  }
}
