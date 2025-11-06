# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StudyDock** is a Next.js study application for managing notes and tests for competitive exam preparation ("oposiciones"). The app features:
- Automatic text formatting for study notes uploaded as `.txt` files
- Interactive test-taking with multiple-choice questions
- Customizable test length (5, 10, 15, 25, 50 questions) with random selection
- Text-to-speech audiobook functionality for notes
- Audio URL linking for audiobooks (MP3, M4A, WAV, etc.) - works with Google Drive, Dropbox, OneDrive, etc.
- Dark/light theme support
- LocalStorage for theme persistence
- Firebase Firestore integration for data persistence

Built with Next.js 15 App Router, TypeScript, Tailwind CSS, and Firebase, deployed on Vercel.

## Architecture

### Next.js App Router Structure

The application uses Next.js App Router with the following structure:
- [app/layout.tsx](app/layout.tsx) - Root layout with metadata and HTML structure
- [app/page.tsx](app/page.tsx) - Main application component (client component with `'use client'`)
- [app/globals.css](app/globals.css) - Tailwind CSS imports
- [lib/firebase.ts](lib/firebase.ts) - Firebase configuration and initialization
- [lib/firebaseService.ts](lib/firebaseService.ts) - CRUD operations for Firestore

The main `StudyApp` component uses React hooks:
- `useState` for screen navigation, theme, notes, tests, and UI state
- `useEffect` for theme persistence with SSR-safe checks and Firebase data loading
- `useRef` for speech synthesis management

### Screen-Based Navigation

The app uses a simple screen-based navigation system controlled by the `screen` state variable:
- `home` - Main dashboard
- `notes` - List of uploaded notes
- `reading` - Note viewer with text-to-speech
- `tests` - List of uploaded tests
- `test-config` - Test configuration screen for selecting number of questions
- `taking-test` - Active test session
- `test-results` - Test score and review
- `audiobooks` - List of uploaded audio files
- `listening` - Audio player with playback controls

### Text Format Parser

The core feature is the automatic text formatting parser (`parseFormattedText` function in [app/page.tsx](app/page.tsx)) which converts plain text to structured content:

**Format Detection Rules:**
- ALL CAPS text → h1 (main titles)
- Lines starting with `#` or numbered patterns (`# 1.`, `1.`) → h2 (sections)
- Lines ending with `:` → h3 (subtitles)
- Lines starting with `-`, `*`, `•` → bullet lists
- Numbered lines (`1.`, `2.)`) → ordered lists
- Text wrapped in `**` or `__` → bold/strong emphasis

This parser is essential for the note display functionality and should be preserved when making changes.

### Data Structures

**Note Object:**
```javascript
{
  id: number,
  title: string,
  content: string,  // Raw text content
  date: string
}
```

**Test Object:**
```javascript
{
  id: number,
  title: string,
  questions: [
    {
      question: string,
      options: string[],
      correct: string
    }
  ],
  date: string
}
```

**AudioBook Object:**
```javascript
{
  id: number,
  title: string,
  url: string,              // Firebase Storage download URL
  storagePath: string,      // Path in Firebase Storage
  duration?: number,        // Duration in seconds (optional)
  relatedNoteTitle?: string, // Optional link to a specific note
  date: string
}
```

### Audio-Note Relationship

The app allows linking audiobooks to specific notes:
- When uploading an audio file, users can optionally link it to a note
- When viewing a note, if there's a linked audiobook, a "🎧 Escoltar Audiollibre" button appears
- Clicking this button plays the audio file instead of text-to-speech
- If no audiobook is linked, the button shows "🔊 Escoltar Text-to-Speech" for text-to-speech functionality
- In the audiobooks list, linked notes are displayed with a book icon

### Test File Format

Tests must be uploaded as `.txt` files with this specific format:
```
Q: ¿Question text?
- Option 1
- Option 2
- Option 3
A: Correct answer
```

The parser is in the `handleFileUpload` function in [app/page.tsx](app/page.tsx).

## Development Notes

### Theme System

Dynamic theme object is defined in [app/page.tsx](app/page.tsx) using Tailwind CSS classes. Theme preference persists to localStorage with SSR-safe checks. When modifying UI, always use the `theme` object properties instead of hardcoded colors.

### Text-to-Speech

Uses Web Speech API (`window.speechSynthesis`) configured for Catalan (`ca-ES`) in [app/page.tsx](app/page.tsx). The utterance reference is stored in `utteranceRef` to manage playback state. Includes SSR-safe checks with `typeof window !== 'undefined'`.

### TypeScript

The application uses TypeScript with strict type checking. Key interfaces:
- `Note` - Structure for study notes
- `Question` - Individual test question structure
- `Test` - Complete test with multiple questions
- `TestProgress` - Test session state
- `FormattedContent` - Parsed text content with type information

### Data Flow and State Management

The application manages data through a combination of React state and Firebase Firestore:

1. **Initial Load**: On component mount, `useEffect` fetches all notes and tests from Firestore
2. **Loading State**: `isLoading` state shows a loading screen while data is being fetched
3. **Local State**: Fetched data is stored in React state (`notes`, `tests`)
4. **User Actions**:
   - **Upload**: File content is parsed → sent to Firestore → state is refreshed from Firestore
   - **Delete**: Item is removed from Firestore → state is refreshed from Firestore
   - **Read/Test**: Uses local state (no Firestore calls during reading/testing)

### Firebase Integration

The application uses Firebase Firestore for data persistence:
- **Collections**: `notes` and `tests` collections store user data
- **Configuration**: Firebase config in [lib/firebase.ts](lib/firebase.ts) uses environment variables
- **Services**: CRUD operations in [lib/firebaseService.ts](lib/firebaseService.ts):
  - `getAllNotes()` / `getAllTests()` - Fetch all documents ordered by creation date
  - `addNote()` / `addTest()` - Add new documents to Firestore
  - `deleteNote()` / `deleteTest()` - Remove documents from Firestore
- **Data Loading**: Application loads data from Firebase on mount with a loading state
- **ID Management**: Firestore auto-generates document IDs; app generates client-side IDs for React keys
- **Environment Variables**: Required environment variables in `.env.local`:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### SSR Considerations

Since Next.js pre-renders pages, the app includes checks for browser-only APIs:
- `localStorage` access wrapped in `typeof window !== 'undefined'`
- Speech synthesis checks before accessing `window.speechSynthesis`
- Main component marked with `'use client'` directive for client-side rendering

## Setup and Development

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Follow instructions in [FIREBASE-SETUP.md](FIREBASE-SETUP.md)
   - Create `.env.local` with your Firebase credentials
   - Enable Firestore Database in Firebase Console
   - Configure Firestore security rules

3. **Run development server:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

### Commands

**Development:**
```bash
npm run dev        # Start development server at localhost:3000
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## Key Files

### Application Code
- [app/page.tsx](app/page.tsx) - Main application component with all logic
- [app/layout.tsx](app/layout.tsx) - Root layout with metadata
- [app/globals.css](app/globals.css) - Tailwind CSS configuration
- [lib/firebase.ts](lib/firebase.ts) - Firebase initialization
- [lib/firebaseService.ts](lib/firebaseService.ts) - Firestore CRUD operations

### Configuration
- [package.json](package.json) - Dependencies and scripts
- [next.config.js](next.config.js) - Next.js configuration
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [tailwind.config.ts](tailwind.config.ts) - Tailwind CSS configuration
- [vercel.json](vercel.json) - Vercel deployment settings
- [.env.local](.env.local) - Environment variables (not in git, must be created)

### Documentation & Examples
- [README.md](README.md) - Project documentation
- [FIREBASE-SETUP.md](FIREBASE-SETUP.md) - Firebase configuration guide
- [GUIA-FORMATO.md](GUIA-FORMATO.md) - User documentation for text formatting (Catalan)
- [GUIA-FORMAT-JSON.md](GUIA-FORMAT-JSON.md) - JSON format guide with LLM prompts
- [exemple-format-apunts.txt](exemple-format-apunts.txt) - Example formatted notes template
- [exemple-equacions-formatat.txt](exemple-equacions-formatat.txt) - Real-world example with math content
- [exemple-json-apunts.json](exemple-json-apunts.json) - Example JSON formatted notes with rich content types

## Important Constraints

1. **Format Parser is Critical**: The parsers (`parseFormattedText` and `parseJsonNote`) must maintain backward compatibility with existing note files
2. **Dual Format Support**: Application supports both plain text and JSON formats; auto-detection in `parseNoteContent`
3. **Catalan Language**: UI and content are in Catalan; maintain this convention
4. **Accessibility**: Text-to-speech is a core feature for accessibility
5. **Firebase Integration**: Data persists in Firestore; ensure proper error handling for network issues
6. **File-based Input**: All content comes from `.txt` or `.json` file uploads
7. **Environment Variables**: Firebase credentials must be configured in `.env.local` for local development and in Vercel for production

## JSON Note Format

The application now supports rich JSON-formatted notes with a specific structure. **IMPORTANT**: When converting notes to JSON format, always follow this exact structure.

### Root Structure

All JSON notes must have this root structure:

```json
{
  "metadata": {
    "title": "Note title",
    "subject": "Subject name",
    "topic": "Specific topic",
    "keywords": ["keyword1", "keyword2"],
    "difficulty": "bàsic|mitjà|avançat",
    "estimatedTime": "XX min"
  },
  "sections": [
    {
      "id": "unique-id",
      "title": "Section title",
      "level": 1,
      "content": [
        /* Content elements here */
      ]
    }
  ]
}
```

### Content Types Available

Each section's `content` array can contain these types:

#### 1. **paragraph** - Regular text content
```json
{
  "type": "paragraph",
  "text": "Text content here"
}
```

#### 2. **formula** - Mathematical/chemical equations with labels
```json
{
  "type": "formula",
  "label": "Equation description",
  "text": "The actual formula"
}
```

#### 3. **list** - Bulleted lists
```json
{
  "type": "list",
  "title": "Optional list title",
  "items": [
    "Item 1",
    "Item 2",
    "Item 3"
  ]
}
```

#### 4. **definition** - Terms with detailed explanations
**CRITICAL**: Definitions must ALWAYS be inside a `subsection` wrapper:

```json
{
  "type": "subsection",
  "title": "Subsection title",
  "items": [
    {
      "type": "definition",
      "term": "Term name",
      "details": [
        "Detail point 1",
        "Detail point 2",
        "Detail point 3"
      ]
    }
  ]
}
```

#### 5. **highlight** - Important concepts with importance levels
```json
{
  "type": "highlight",
  "importance": "high|medium|low",
  "items": [
    "Important point 1",
    "Important point 2"
  ]
}
```

Colors by importance:
- `high` - Yellow background (critical information)
- `medium` - Blue background (important)
- `low` - Light blue background (noteworthy)

#### 6. **subsection** - Grouped content under subtitles
```json
{
  "type": "subsection",
  "title": "Subsection title",
  "items": [
    "Can contain strings",
    {
      "type": "definition",
      "term": "Or definition objects",
      "details": ["Detail 1", "Detail 2"]
    }
  ]
}
```

#### 7. **example** - Practical examples with special rendering
```json
{
  "type": "example",
  "label": "Example label/title",
  "text": "Example content with detailed explanation"
}
```

### Critical Conversion Rules

When converting existing notes (like tema2.json) to this format:

1. **Always include metadata** - All fields are important for organization
2. **Wrap definitions in subsections** - Never have definitions directly in content array
3. **Use proper field names**:
   - For examples: use `"label"` not `"title"`
   - For lists: use `"items"` for the array
   - For definitions: use `"term"` and `"details"`
4. **Split long texts** - Break long paragraphs into multiple items for better readability
5. **Convert inline formatting**:
   - Text with `**bold**` markers → Keep as is in text
   - Headers with `**Title:**` → Convert to subsection titles
6. **Nested structure**:
   - Section → contains content array
   - Content can have subsections → subsections contain items
   - Items can be strings or definition objects
7. **Importance levels** - Use appropriately:
   - `high` for critical concepts, tables, must-know information
   - `medium` for mnemonics, tips, common mistakes
   - `low` for supplementary information

### Example Reference

See [exemple-json-apunts.json](exemple-json-apunts.json) for a complete, correctly formatted example and [docs/tema2.json](docs/tema2.json) for a real-world legal studies note.

### Common Mistakes to Avoid

❌ **WRONG** - Definition directly in content:
```json
{
  "content": [
    {
      "type": "definition",
      "term": "Term",
      "definition": "Text"  // Wrong: should be "details" array
    }
  ]
}
```

✅ **CORRECT** - Definition wrapped in subsection:
```json
{
  "content": [
    {
      "type": "subsection",
      "title": "Definitions",
      "items": [
        {
          "type": "definition",
          "term": "Term",
          "details": [
            "Detail 1",
            "Detail 2"
          ]
        }
      ]
    }
  ]
}
```

❌ **WRONG** - Using "title" for examples:
```json
{
  "type": "example",
  "title": "Example 1"  // Wrong field name
}
```

✅ **CORRECT** - Using "label" for examples:
```json
{
  "type": "example",
  "label": "Example 1",
  "text": "Content here"
}
```

See [GUIA-FORMAT-JSON.md](GUIA-FORMAT-JSON.md) for complete documentation and LLM prompts for generating JSON notes.

## Deployment

The application is configured for Vercel deployment:

1. **Push to GitHub** - Commit and push your code
2. **Connect to Vercel** - Import the repository at vercel.com
3. **Configure Environment Variables** - Add all `NEXT_PUBLIC_FIREBASE_*` variables in Vercel Project Settings
4. **Auto-deploy** - Vercel detects Next.js automatically
5. **Custom domain** - Optional: configure in Vercel dashboard

The [vercel.json](vercel.json) file includes build and output configuration. See [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for detailed Firebase configuration steps.

## Dependencies

**Core Framework:**
- `next` (^15.0.3) - Next.js framework
- `react` (^18.3.1) - React library
- `react-dom` (^18.3.1) - React DOM

**Backend/Database:**
- `firebase` (^12.5.0) - Firebase SDK for Firestore

**UI/Icons:**
- `lucide-react` (^0.460.0) - Icon library
- `tailwindcss` (^3.4.15) - CSS framework

**Development:**
- `typescript` (^5) - TypeScript for type safety
- `eslint` (^8) - Code linting
- `@types/node`, `@types/react`, `@types/react-dom` - TypeScript definitions

## Troubleshooting

### Firebase Issues

**Problem: "Firebase: No Firebase App '[DEFAULT]' has been created"**
- Solution: Ensure `.env.local` exists with all required Firebase variables
- Check that environment variables start with `NEXT_PUBLIC_`

**Problem: "Missing or insufficient permissions"**
- Solution: Update Firestore security rules to allow read/write operations
- For development, you can use test mode rules (see FIREBASE-SETUP.md)

**Problem: Data not loading**
- Solution: Check browser console for errors
- Verify Firestore Database is enabled in Firebase Console
- Ensure network connectivity to Firebase

### Development Issues

**Problem: Build fails with TypeScript errors**
- Solution: Run `npm run lint` to identify issues
- Check that all interfaces match the actual data structures

**Problem: Text-to-speech not working**
- Solution: Only works in browsers that support Web Speech API
- Chrome and Edge have best support; Firefox has limited support

## Potential Improvements

If asked to enhance the application, consider:
- ~~Adding localStorage persistence for notes and tests~~ ✅ Implemented with Firebase Firestore
- Creating an export functionality for notes/tests (download as PDF or .txt)
- Adding markdown editor for creating notes in-app
- Implementing progressive web app (PWA) capabilities
- User authentication and multi-user support (Firebase Auth)
- Spaced repetition algorithm for tests
- Note search and filtering functionality
- Offline support with Firebase offline persistence
- Note categories/tags for better organization
- Study statistics and progress tracking
