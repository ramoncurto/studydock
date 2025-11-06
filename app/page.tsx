'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, BookOpen, FileText, Volume2, Play, Pause, CheckCircle, XCircle, ArrowLeft, Plus, Trash2, Sun, Moon, BarChart3, TrendingUp, Clock, Edit3, Check, X, Headphones, SkipBack, SkipForward, LogOut, Share2, Users, Copy, Link as LinkIcon, Target, Lightbulb, AlertTriangle, TrendingDown, ArrowRight, File, Sparkles, Home, Info } from 'lucide-react';
import { getAllNotes, getAllTests, addNote, addTest, updateNote, updateTest, deleteNote, deleteTest, addNoteSession, addTestAttempt, getAllNoteSessions, getAllTestAttempts, getAllAudioBooks, addAudioBook, updateAudioBook, deleteAudioBook, NoteSession, TestAttempt, AudioBook, createInvitation, getInvitation, acceptInvitation, getUserInvitations, getSharedAccess, revokeAccess, deleteInvitation, Invitation, SharedAccess } from '@/lib/firebaseService';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
}

interface Question {
  question: string;
  options: string[];
  correct: string;
}

interface Test {
  id: number;
  title: string;
  questions: Question[];
  date: string;
}

interface TestProgress {
  current: number;
  answers: {
    question: string;
    answer: string;
    correct: string;
    isCorrect: boolean;
  }[];
}

interface FormattedContent {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'space' | 'formula' | 'highlight' | 'definition' | 'example' | 'table';
  content: string;
  label?: string;
  term?: string;
  details?: string[];
  importance?: 'high' | 'medium' | 'low';
  headers?: string[];
  rows?: string[][];
}

// JSON Note Structure
interface JsonNoteMetadata {
  title: string;
  subject?: string;
  topic?: string;
  keywords?: string[];
  difficulty?: 'bàsic' | 'mitjà' | 'avançat';
  estimatedTime?: string;
}

interface JsonNoteContent {
  type: 'paragraph' | 'formula' | 'list' | 'definition' | 'highlight' | 'subsection' | 'example' | 'table';
  text?: string;
  label?: string;
  title?: string;
  items?: string[] | JsonDefinitionItem[];
  importance?: 'high' | 'medium' | 'low';
  headers?: string[];
  rows?: string[][];
}

interface JsonDefinitionItem {
  type: 'definition';
  term: string;
  details: string[];
}

interface JsonNoteSection {
  id: string;
  title: string;
  level: number;
  content: JsonNoteContent[];
}

interface JsonNote {
  metadata: JsonNoteMetadata;
  sections: JsonNoteSection[];
}

// Move ListeningScreen to top-level to avoid remounts on parent re-render
type Theme = {
  bg: string;
  text: string;
  textSecondary: string;
  card: string;
  cardHover: string;
  button: string;
  buttonSecondary: string;
  border: string;
  success: string;
  error: string;
  progressBar: string;
  progressFill: string;
  accent: string;
};

// Helpers for Google Drive embed
function parseDriveFileId(src: string): string | null {
  try {
    const url = new URL(src);
    if (url.hostname.includes('drive.google.com') || url.hostname.includes('docs.google.com')) {
      const m1 = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m1 && m1[1]) return m1[1];
      const idParam = url.searchParams.get('id');
      if (idParam) return idParam;
    }
  } catch {}
  return null;
}

function buildDrivePreviewUrl(src: string): string | null {
  const id = parseDriveFileId(src);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

interface ListeningViewProps {
  theme: Theme;
  isDark: boolean;
  currentAudio: AudioBook | null;
  audioRef: React.RefObject<HTMLAudioElement>;
  playableUrl: string | null;
  onBack: () => void;
  setIsPlaying: (v: boolean) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
}

function ListeningView({
  theme,
  isDark,
  currentAudio,
  audioRef,
  playableUrl,
  onBack,
  setIsPlaying,
  isPlaying,
  onTogglePlayPause,
  onSkipForward,
  onSkipBackward,
}: ListeningViewProps): JSX.Element | null {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [useEmbed, setUseEmbed] = useState(false);
  const previewUrl = currentAudio ? buildDrivePreviewUrl(currentAudio.url) : null;

  useEffect(() => {
    if (!useEmbed && currentAudio && audioRef.current && playableUrl) {
      const audio = audioRef.current;
      audio.src = playableUrl;
      audio.preload = 'auto';
      audio.load();

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => setIsPlaying(false);
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleWaiting = () => console.debug('Audio waiting...');
      const handleStalled = () => console.debug('Audio stalled');
      const handleCanPlay = () => console.debug('Audio canplay');
      const handleCanPlayThrough = () => console.debug('Audio canplaythrough');

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('stalled', handleStalled);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('canplaythrough', handleCanPlayThrough);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('stalled', handleStalled);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      };
    }
  }, [useEmbed, currentAudio, playableUrl, audioRef, setIsPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  if (!currentAudio) return null;

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Tornar</span>
        </button>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${isDark ? 'bg-primary-900/30' : 'bg-primary-100'} flex items-center justify-center`}>
              <Headphones size={64} className={theme.accent} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>{currentAudio.title}</h2>
            <p className={`${theme.textSecondary}`}>Audiollibre</p>
          </div>

          <div className="mb-6">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${isDark ? '#0284c7' : '#0284c7'} 0%, ${isDark ? '#0284c7' : '#0284c7'} ${(currentTime / (duration || 1)) * 100}%, ${isDark ? '#262626' : '#e5e5e5'} ${(currentTime / (duration || 1)) * 100}%, ${isDark ? '#262626' : '#e5e5e5'} 100%)`
              }}
            />
            <div className={`flex justify-between text-sm mt-2 ${theme.textSecondary}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {!useEmbed && (
          <div className="flex items-center justify-center gap-6">
            <button onClick={onSkipBackward} className={`p-4 rounded-full ${theme.buttonSecondary} ${theme.text} transition transform hover:scale-110 shadow-md`}>
              <SkipBack size={24} />
            </button>
            <button onClick={onTogglePlayPause} className={`p-6 rounded-full ${theme.button} transition transform hover:scale-110 shadow-lg`}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button onClick={onSkipForward} className={`p-4 rounded-full ${theme.buttonSecondary} ${theme.text} transition transform hover:scale-110 shadow-md`}>
              <SkipForward size={24} />
            </button>
          </div>
          )}

          {useEmbed && previewUrl && (
            <div className="mt-4">
              <iframe
                src={previewUrl}
                width="100%"
                height="120"
                allow="autoplay"
                frameBorder={0}
              />
              <div className={`text-xs mt-2 ${theme.textSecondary}`}>
                Reproduint amb el reproductor de Google Drive. <a href={previewUrl} target="_blank" rel="noreferrer" className="underline">Obrir en una pestanya nova</a>.
              </div>
            </div>
          )}

          {/* Help box and toggle removed per request */}
        </div>

        {/* Keep audio element mounted even when using embed to avoid AbortError */}
        <audio
          ref={audioRef}
          onError={(e) => {
            console.error('Audio error:', e);
            const isGoogleDrive = currentAudio?.url.includes('drive.google.com');
            if (isGoogleDrive && previewUrl) {
              // Fall back to Drive embed automatically
              if (audioRef.current) {
                try { audioRef.current.pause(); } catch {}
              }
              setUseEmbed(true);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function StudyApp() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');

  const [screen, setScreen] = useState('home');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [testProgress, setTestProgress] = useState<TestProgress>({ current: 0, answers: [] });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [uploadType, setUploadType] = useState<string | null>(null);
  const [noteSessions, setNoteSessions] = useState<NoteSession[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteName, setEditingNoteName] = useState<string>('');
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [editingTestName, setEditingTestName] = useState<string>('');
  const [selectedTestForConfig, setSelectedTestForConfig] = useState<Test | null>(null);
  const [audioBooks, setAudioBooks] = useState<AudioBook[]>([]);
  const [currentAudio, setCurrentAudio] = useState<AudioBook | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingAudioId, setEditingAudioId] = useState<number | null>(null);
  const [editingAudioName, setEditingAudioName] = useState<string>('');
  const [editingAudioUrl, setEditingAudioUrl] = useState<string>('');

  // Sharing state
  const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([]);
  const [userInvitations, setUserInvitations] = useState<Invitation[]>([]);
  const [viewingOwnerId, setViewingOwnerId] = useState<string | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [invitationCodeInput, setInvitationCodeInput] = useState('');
  const [pendingInvitation, setPendingInvitation] = useState<Invitation | null>(null);
  const [sharingMessage, setSharingMessage] = useState('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Theme colors - Professional neutral palette with improved dark mode contrast
  const theme = {
    bg: isDark ? 'bg-slate-900' : 'bg-neutral-50',
    text: isDark ? 'text-slate-100' : 'text-neutral-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-neutral-600',
    card: isDark ? 'bg-slate-800' : 'bg-white',
    cardHover: isDark ? 'hover:bg-slate-700' : 'hover:bg-neutral-100',
    button: isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-primary-600 text-white hover:bg-primary-700',
    buttonSecondary: isDark ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' : 'bg-white hover:bg-neutral-50 border-neutral-300',
    border: isDark ? 'border-slate-700' : 'border-neutral-200',
    success: isDark ? 'bg-emerald-900/70 border-emerald-700' : 'bg-emerald-50 border-emerald-200',
    error: isDark ? 'bg-rose-900/70 border-rose-700' : 'bg-rose-50 border-rose-200',
    progressBar: isDark ? 'bg-slate-700' : 'bg-neutral-200',
    progressFill: isDark ? 'bg-blue-500' : 'bg-primary-600',
    accent: isDark ? 'text-blue-400' : 'text-primary-600'
  };

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check for invitation code in URL on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');

    if (inviteCode) {
      // Load invitation details
      const loadInvitation = async () => {
        const invitation = await getInvitation(inviteCode);
        if (invitation) {
          setPendingInvitation(invitation);
          setScreen('accept-invitation');
        } else {
          setSharingMessage('Invitació no vàlida o caducada');
        }
      };
      loadInvitation();
    }
  }, [user]);

  // Initialize theme and load data on mount
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme ? savedTheme === 'dark' : true);
    setMounted(true);

    // Only load data if user is authenticated
    if (!user) return;

    // Load data from Firebase
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [notesData, testsData, sessionsData, attemptsData, audioBooksData, sharedAccessData, invitationsData] = await Promise.all([
          getAllNotes(user.uid),
          getAllTests(user.uid),
          getAllNoteSessions(user.uid),
          getAllTestAttempts(user.uid),
          getAllAudioBooks(user.uid),
          getSharedAccess(user.uid),
          getUserInvitations(user.uid)
        ]);

        // Filter out any notes with empty or invalid content
        const validNotes = notesData.filter(note => {
          if (!note.content || note.content.trim() === '') {
            console.warn(`Skipping note "${note.title}" with empty content`);
            return false;
          }
          return true;
        });

        setNotes(validNotes);
        setTests(testsData || []);
        setNoteSessions(sessionsData || []);
        setTestAttempts(attemptsData || []);
        setAudioBooks(audioBooksData);
        setSharedAccess(sharedAccessData || []);
        setUserInvitations(invitationsData || []);
      } catch (error) {
        console.error('Error carregant dades de Firebase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Save theme preference when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }, [isDark, mounted]);

  const toggleTheme = () => setIsDark(!isDark);

  // Text formatting parser
  const parseFormattedText = (text: string): FormattedContent[] => {
    const lines = text.split('\n');
    const formatted: FormattedContent[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        formatted.push({ type: 'space', content: '' });
        return;
      }

      // Main title (ALL CAPS or starts with #)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /^[A-ZÁÉÍÓÚÑ\s:]+$/.test(trimmed)) {
        formatted.push({ type: 'h1', content: trimmed });
      }
      // Subtitle with # or numbered sections
      else if (trimmed.startsWith('#') || /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmed)) {
        const cleanedText = trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '');
        formatted.push({ type: 'h2', content: stripFormattingFromTitle(cleanedText) });
      }
      // Section marker (ends with :) - check this BEFORE checking for bold text
      else if (trimmed.endsWith(':')) {
        formatted.push({ type: 'h3', content: stripFormattingFromTitle(trimmed) });
      }
      // Bullet list (starts with -, *, or •)
      else if (/^[-*•]\s+/.test(trimmed)) {
        formatted.push({ type: 'li', content: trimmed.replace(/^[-*•]\s+/, '') });
      }
      // Numbered list
      else if (/^\d+[\.)]\s+/.test(trimmed)) {
        formatted.push({ type: 'li', content: trimmed.replace(/^\d+[\.)]\s+/, '') });
      }
      // Important text (between ** or __)
      else if (/\*\*.*\*\*|__.*__/.test(trimmed)) {
        formatted.push({
          type: 'p',
          content: trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
        });
      }
      // Regular paragraph
      else {
        formatted.push({ type: 'p', content: trimmed });
      }
    });

    return formatted;
  };

  // Process inline formatting in text (bold, italic, legal refs, etc.)
  const processInlineFormatting = (text: string): string => {
    // First, clean up malformed markers (e.g., **text**** becomes **text**)
    let cleaned = text
      .replace(/\*{3,}/g, '**')  // Replace 3+ asterisks with 2
      .replace(/_{3,}/g, '__')   // Replace 3+ underscores with 2
      .replace(/={3,}/g, '==');  // Replace 3+ equals with 2

    return cleaned
      // Yellow highlight: ==text==
      .replace(/==(.*?)==/g, '<span class="yellow-highlight">$1</span>')
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Legal references: Art. X, art. X.Y
      .replace(/\b(art\.|Art\.|article|Article)\s+(\d+(?:\.\d+)?(?:\s+[A-Z]{2,})?)/gi, '<span class="legal-ref">$1 $2</span>')
      // Dates: DD de month de YYYY, DD/MM/YYYY
      .replace(/\b(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\b/g, '<span class="date-ref">$1 de $2 de $3</span>')
      .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, '<span class="date-ref">$1/$2/$3</span>')
      // Numbers and percentages
      .replace(/\b(\d+(?:\.\d+)?)\s*%/g, '<span class="number-ref">$1%</span>');
  };

  // Helper function to strip ALL formatting markers from titles
  const stripFormattingFromTitle = (text: string): string => {
    return text
      .replace(/\*\*/g, '')  // Remove bold markers
      .replace(/__/g, '')    // Remove alternative bold markers
      .replace(/==/g, '')    // Remove highlight markers
      .replace(/\*/g, '')    // Remove any remaining single asterisks
      .replace(/_/g, '')     // Remove any remaining underscores
      .trim();
  };

  // JSON parser for structured notes
  const parseJsonNote = (jsonText: string): FormattedContent[] => {
    try {
      if (!jsonText || jsonText.trim() === '') {
        console.error('Empty JSON content provided');
        return [{ type: 'p', content: 'Error: contingut buit' }];
      }
      const jsonNote: JsonNote = JSON.parse(jsonText);
      const formatted: FormattedContent[] = [];

      // Add metadata title only (no subject, topic, difficulty, or time)
      if (jsonNote.metadata) {
        formatted.push({ type: 'h1', content: stripFormattingFromTitle(jsonNote.metadata.title) });
        formatted.push({ type: 'space', content: '' });
      }

      // Parse sections
      jsonNote.sections.forEach((section) => {
        // Section title - strip all formatting markers from titles
        const titleContent = stripFormattingFromTitle(section.title);
        if (section.level === 1) {
          formatted.push({ type: 'h1', content: titleContent });
        } else if (section.level === 2) {
          formatted.push({ type: 'h2', content: titleContent });
        } else {
          formatted.push({ type: 'h3', content: titleContent });
        }

        // Section content
        section.content.forEach((item) => {
          switch (item.type) {
            case 'paragraph':
              if (item.text) {
                formatted.push({ type: 'p', content: processInlineFormatting(item.text) });
              }
              break;

            case 'formula':
              formatted.push({
                type: 'formula',
                content: processInlineFormatting(item.text || ''),
                label: item.label
              });
              break;

            case 'list':
              if (item.items && Array.isArray(item.items)) {
                item.items.forEach((listItem) => {
                  if (typeof listItem === 'string') {
                    formatted.push({ type: 'li', content: processInlineFormatting(listItem) });
                  }
                });
              }
              break;

            case 'table':
              if (item.headers && item.rows) {
                formatted.push({
                  type: 'table',
                  content: '',
                  headers: item.headers,
                  rows: item.rows
                });
              }
              break;

            case 'definition':
              if (item.items && Array.isArray(item.items)) {
                item.items.forEach((def) => {
                  if (typeof def === 'object' && 'term' in def) {
                    formatted.push({
                      type: 'definition',
                      term: processInlineFormatting(def.term),
                      details: def.details.map(d => processInlineFormatting(d)),
                      content: ''
                    });
                  }
                });
              }
              break;

            case 'highlight':
              formatted.push({
                type: 'highlight',
                content: (item.items || []).map(i => typeof i === 'string' ? processInlineFormatting(i) : i).join('\n'),
                importance: item.importance || 'high'
              });
              break;

            case 'subsection':
              if (item.title) {
                // Strip all formatting markers from subsection titles
                formatted.push({ type: 'h3', content: stripFormattingFromTitle(item.title) });
              }
              if (item.items && Array.isArray(item.items)) {
                item.items.forEach((subItem) => {
                  if (typeof subItem === 'object' && 'term' in subItem) {
                    formatted.push({
                      type: 'definition',
                      term: processInlineFormatting(subItem.term),
                      details: subItem.details.map(d => processInlineFormatting(d)),
                      content: ''
                    });
                  } else if (typeof subItem === 'string') {
                    formatted.push({ type: 'li', content: processInlineFormatting(subItem) });
                  }
                });
              }
              break;

            case 'example':
              formatted.push({
                type: 'example',
                content: processInlineFormatting(item.text || ''),
                label: item.label ? processInlineFormatting(item.label) : undefined
              });
              break;
          }
        });

        formatted.push({ type: 'space', content: '' });
      });

      return formatted;
    } catch (error) {
      console.error('Error parsing JSON note:', error);
      console.error('JSON text preview:', jsonText?.substring(0, 100));
      // Fallback to text parser
      return parseFormattedText(jsonText);
    }
  };

  // Auto-detect format and parse accordingly
  const parseNoteContent = (content: string): FormattedContent[] => {
    if (!content) {
      console.error('parseNoteContent: empty content provided');
      return [{ type: 'p', content: 'Error: No hi ha contingut' }];
    }

    const trimmed = content.trim();
    // Check if content is JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        JSON.parse(trimmed);
        return parseJsonNote(trimmed);
      } catch (error) {
        console.error('JSON parse failed in auto-detect, falling back to text parser:', error);
        console.error('Content preview:', trimmed.substring(0, 100));
        // Not valid JSON, fallback to text parser
        return parseFormattedText(content);
      }
    }
    // Default to text parser
    return parseFormattedText(content);
  };

  // Text-to-speech functions
  const startReading = (text: string) => {
    if (typeof window === 'undefined') return;

    const speechSynthesis = window.speechSynthesis;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ca-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => setIsReading(false);

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const stopReading = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setIsReading(false);
  };

  const toggleReading = () => {
    if (isReading) {
      stopReading();
    } else if (currentNote) {
      startReading(currentNote.content);
    }
  };

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    let uploadedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    setIsLoading(true);

    for (const file of fileArray) {
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        if (type === 'note') {
          // Save to Firebase
          await addNote(user!.uid, file.name, content);
          uploadedCount++;
        } else if (type === 'test') {
          // Parse test format: Q: question? A: answer
          const lines = content.split('\n');
          const questions: Question[] = [];

          interface TempQuestion {
            question: string;
            options: string[];
            correct: string;
          }

          let currentQ: TempQuestion | null = null;

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('Q:')) {
              if (currentQ !== null) {
                const q: TempQuestion = currentQ;
                if (q.question && q.correct && q.options.length > 0) {
                  questions.push(q);
                }
              }
              currentQ = { question: line.substring(2).trim(), options: [], correct: '' };
            } else if (trimmedLine.startsWith('A:') && currentQ !== null) {
              currentQ.correct = line.substring(2).trim();
            } else if (trimmedLine.startsWith('-') && currentQ !== null) {
              currentQ.options.push(line.substring(1).trim());
            }
          }

          if (currentQ !== null) {
            const q: TempQuestion = currentQ;
            if (q.question && q.correct && q.options.length > 0) {
              questions.push(q);
            }
          }

          if (questions.length === 0) {
            throw new Error('No s\'han trobat preguntes vàlides');
          }

          // Save to Firebase
          await addTest(user!.uid, file.name, questions);
          uploadedCount++;
        }
      } catch (error) {
        console.error(`Error pujant ${file.name}:`, error);
        errorCount++;
        errors.push(file.name);
      }
    }

    // Reload data from Firebase
    try {
      if (type === 'note') {
        const notesData = await getAllNotes(user!.uid);
        setNotes(notesData);
      } else if (type === 'test') {
        const testsData = await getAllTests(user!.uid);
        setTests(testsData);
      }
    } catch (error) {
      console.error('Error recarregant dades:', error);
    }

    setIsLoading(false);
    setUploadType(null);
    setScreen('home');

    // Show summary message
    if (errorCount === 0) {
      alert(`S'han pujat ${uploadedCount} ${type === 'note' ? 'apunts' : 'tests'} correctament!`);
    } else if (uploadedCount === 0) {
      alert(`Error en pujar els arxius:\n${errors.join('\n')}`);
    } else {
      alert(`Pujats ${uploadedCount} arxius correctament.\nErrors en ${errorCount} arxius:\n${errors.join('\n')}`);
    }

    // Reset file input
    event.target.value = '';
  };

  // Convert Google Drive URL to direct streaming URL
  const convertGoogleDriveUrl = (url: string): string => {
    // Check if it's a Google Drive URL
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      // Use the direct streaming URL format
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  const handleAddAudioLink = async () => {
    // Ask for audio URL
    let audioUrl = prompt('Enganxa l\'URL de l\'arxiu d\'àudio (MP3, M4A, etc.):\n\nExemple Google Drive:\nhttps://drive.google.com/file/d/...\n\nExemple Dropbox:\nhttps://www.dropbox.com/s/...?dl=1');
    if (!audioUrl || !audioUrl.trim()) return;

    // Auto-convert Google Drive URLs
    audioUrl = convertGoogleDriveUrl(audioUrl.trim());

    // Ask for title
    const title = prompt('Quin nom vols donar a aquest àudio?');
    if (!title || !title.trim()) return;

    // Ask user if they want to link this audio to a note
    let relatedNote: string | undefined = undefined;
    if (notes.length > 0) {
      const linkToNote = confirm('Vols vincular aquest àudio a un apunt específic?');
      if (linkToNote) {
        // Show list of notes to choose from
        const notesList = notes.map((note, index) => `${index + 1}. ${note.title}`).join('\n');
        const choice = prompt(`Selecciona el número de l'apunt:\n\n${notesList}`);
        if (choice) {
          const index = parseInt(choice) - 1;
          if (index >= 0 && index < notes.length) {
            relatedNote = notes[index].title;
          }
        }
      }
    }

    try {
      // Save to Firebase
      await addAudioBook(user!.uid, title.trim(), audioUrl, relatedNote);

      // Reload audiobooks from Firebase
      const audioBooksData = await getAllAudioBooks(user!.uid);
      setAudioBooks(audioBooksData);

      // Show success message with the URL that will be used
      if (audioUrl.includes('drive.google.com/uc')) {
        alert(`Àudio afegit correctament!\n\nNota: Estem usant Google Drive. Si l'àudio no es reprodueix, és degut a les limitacions de CORS de Google Drive.\n\nURL convertida:\n${audioUrl}\n\nRecomanem usar Dropbox per a millor compatibilitat.`);
      }

      setUploadType(null);
      setScreen('home');
    } catch (error) {
      console.error('Error afegint àudio:', error);
      alert('Error en afegir l\'àudio. Si us plau, torna-ho a intentar.');
    }
  };

  // Audio functions
  const getPlayableAudioUrl = (url: string): string => {
    // Ensure Google Drive links are normalized then proxied through our server to avoid CORS
    const normalized = convertGoogleDriveUrl(url);
    return `/api/audio-proxy?src=${encodeURIComponent(normalized)}`;
  };
  const playAudio = (audio: AudioBook) => {
    setCurrentAudio(audio);
    setScreen('listening');
  };

  const togglePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        alert('Error reproduint l\'àudio. Assegura\'t que l\'URL és un enllaç directe de descàrrega.\n\nConsulta GUIA-AUDIO-LINKS.md per més informació.');
        setIsPlaying(false);
      }
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };

  // Test functions
  const showTestConfig = (test: Test) => {
    setSelectedTestForConfig(test);
    setScreen('test-config');
  };

  const startTest = (test: Test, questionCount: number) => {
    let questionsToUse: Question[];

    // Check if this is a mixed test (Test General)
    if (test.id === -1) {
      // Combine all questions from all tests
      const allQuestions = tests.flatMap(t => t.questions);
      // Shuffle all questions
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      // Select the requested number of questions
      questionsToUse = shuffled.slice(0, questionCount);
    } else {
      // Single test: shuffle and select questions
      const shuffled = [...test.questions].sort(() => Math.random() - 0.5);
      questionsToUse = shuffled.slice(0, questionCount);
    }

    // Shuffle options for each question
    const questionsWithShuffledOptions = questionsToUse.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));

    const configuredTest = {
      ...test,
      questions: questionsWithShuffledOptions
    };

    setCurrentTest(configuredTest);
    setTestProgress({ current: 0, answers: [] });
    setScreen('taking-test');
  };

  const answerQuestion = async (answer: string) => {
    if (!currentTest || showFeedback) return; // Prevent multiple clicks during feedback

    const currentQ = currentTest.questions[testProgress.current];
    const isCorrect = answer === currentQ.correct;

    // Show immediate feedback
    setSelectedAnswer(answer);
    setAnswerIsCorrect(isCorrect);
    setShowFeedback(true);

    // Wait 1.5 seconds to show feedback before continuing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Reset feedback state
    setShowFeedback(false);
    setSelectedAnswer(null);

    const newAnswers = [...testProgress.answers, { question: currentQ.question, answer, correct: currentQ.correct, isCorrect }];

    if (testProgress.current < currentTest.questions.length - 1) {
      setTestProgress({ current: testProgress.current + 1, answers: newAnswers });
    } else {
      setTestProgress({ current: testProgress.current, answers: newAnswers });

      // Save test attempt to Firebase
      const score = newAnswers.filter(a => a.isCorrect).length;
      const total = newAnswers.length;
      const percentage = Math.round((score / total) * 100);

      try {
        await addTestAttempt(user!.uid, currentTest.title, score, total, percentage);
        // Reload test attempts
        const attemptsData = await getAllTestAttempts(user!.uid);
        setTestAttempts(attemptsData);
      } catch (error) {
        console.error('Error desant intent del test:', error);
      }

      setScreen('test-results');
    }
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteName(note.title);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteName('');
  };

  const saveNoteRename = async (noteId: number) => {
    if (!editingNoteName.trim()) {
      alert('El nom de l\'apunt no pot estar buit');
      return;
    }

    try {
      await updateNote(user!.uid, noteId, notes, editingNoteName.trim());
      // Reload notes from Firebase
      const notesData = await getAllNotes(user!.uid);
      setNotes(notesData);
      setEditingNoteId(null);
      setEditingNoteName('');
    } catch (error) {
      console.error('Error reanomenant apunt:', error);
      alert('Error en reanomenar l\'apunt. Si us plau, torna-ho a intentar.');
    }
  };

  const startEditingTest = (test: Test) => {
    setEditingTestId(test.id);
    setEditingTestName(test.title);
  };

  const cancelEditingTest = () => {
    setEditingTestId(null);
    setEditingTestName('');
  };

  const saveTestRename = async (testId: number) => {
    if (!editingTestName.trim()) {
      alert('El nom del test no pot estar buit');
      return;
    }

    try {
      await updateTest(user!.uid, testId, tests, editingTestName.trim());
      // Reload tests from Firebase
      const testsData = await getAllTests(user!.uid);
      setTests(testsData);
      setEditingTestId(null);
      setEditingTestName('');
    } catch (error) {
      console.error('Error reanomenant test:', error);
      alert('Error en reanomenar el test. Si us plau, torna-ho a intentar.');
    }
  };

  const startEditingAudio = (audio: AudioBook) => {
    setEditingAudioId(audio.id);
    setEditingAudioName(audio.title);
    setEditingAudioUrl(audio.url);
  };

  const cancelEditingAudio = () => {
    setEditingAudioId(null);
    setEditingAudioName('');
    setEditingAudioUrl('');
  };

  const saveAudioEdit = async (audioId: number) => {
    if (!editingAudioName.trim() || !editingAudioUrl.trim()) {
      alert('El nom i l\'URL de l\'àudio no poden estar buits');
      return;
    }

    try {
      await updateAudioBook(user!.uid, audioId, audioBooks, editingAudioName.trim(), editingAudioUrl.trim());
      // Reload audiobooks from Firebase
      const audioBooksData = await getAllAudioBooks(user!.uid);
      setAudioBooks(audioBooksData);
      setEditingAudioId(null);
      setEditingAudioName('');
      setEditingAudioUrl('');
    } catch (error) {
      console.error('Error actualitzant àudio:', error);
      alert('Error en actualitzar l\'àudio. Si us plau, torna-ho a intentar.');
    }
  };

  const deleteItem = async (id: number, type: 'note' | 'test' | 'audio') => {
    try {
      if (type === 'note') {
        await deleteNote(user!.uid, id, notes);
        // Reload notes from Firebase
        const notesData = await getAllNotes(user!.uid);
        setNotes(notesData);
      } else if (type === 'test') {
        await deleteTest(user!.uid, id, tests);
        // Reload tests from Firebase
        const testsData = await getAllTests(user!.uid);
        setTests(testsData);
      } else if (type === 'audio') {
        await deleteAudioBook(user!.uid, id, audioBooks);
        // Reload audiobooks from Firebase
        const audioBooksData = await getAllAudioBooks(user!.uid);
        setAudioBooks(audioBooksData);
      }
    } catch (error) {
      console.error('Error eliminant element:', error);
      alert('Error en eliminar l\'element. Si us plau, torna-ho a intentar.');
    }
  };

  // Home Screen
  const HomeScreen = () => {
    const handleBackToMyContent = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setViewingOwnerId(null);
        setIsReadOnlyMode(false);

        const [myNotes, myTests, myAudioBooks] = await Promise.all([
          getAllNotes(user.uid),
          getAllTests(user.uid),
          getAllAudioBooks(user.uid)
        ]);

        setNotes(myNotes);
        setTests(myTests);
        setAudioBooks(myAudioBooks);
      } catch (error) {
        console.error('Error loading my content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          {/* Read-Only Mode Banner */}
          {isReadOnlyMode && viewingOwnerId && (
            <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-amber-900/50 border-amber-700' : 'bg-amber-100 border-amber-300'} border-2 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Users size={20} className={isDark ? 'text-amber-300' : 'text-amber-700'} />
                <div>
                  <div className="font-semibold text-sm">Mode Només Lectura</div>
                  <div className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    Materials de {sharedAccess.find(a => a.ownerId === viewingOwnerId)?.ownerEmail}
                  </div>
                </div>
              </div>
              <button
                onClick={handleBackToMyContent}
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${theme.button}`}
              >
                Els Meus Materials
              </button>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className={`text-4xl font-bold ${theme.text}`}>StudyDock</h1>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-xl ${theme.card} border ${theme.border} hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-soft hover:shadow-medium`}
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun size={20} className={theme.accent} /> : <Moon size={20} className={theme.accent} />}
                </button>
                <button
                  onClick={handleLogout}
                  className={`p-3 rounded-xl ${theme.card} border ${theme.border} hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-soft hover:shadow-medium`}
                  aria-label="Tancar sessió"
                  title="Tancar sessió"
                >
                  <LogOut size={20} className={theme.accent} />
                </button>
              </div>
            </div>
            {user?.email && (
              <div className={`text-sm ${theme.textSecondary} text-right`}>
                {user.email}
              </div>
            )}
          </div>

        <div className="space-y-3">
          <button
            onClick={() => setScreen('notes')}
            className={`w-full card-hover p-5 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <BookOpen size={24} className={theme.accent} />
            </div>
            <div className="text-left flex-1">
              <div className={`font-semibold text-lg ${theme.text}`}>Els Meus Apunts</div>
              <div className={`text-sm ${theme.textSecondary}`}>{notes.length} documents</div>
            </div>
            <ArrowRight size={20} className={theme.textSecondary} />
          </button>

          <button
            onClick={() => setScreen('tests')}
            className={`w-full card-hover p-5 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Edit3 size={24} className={theme.accent} />
            </div>
            <div className="text-left flex-1">
              <div className={`font-semibold text-lg ${theme.text}`}>Els Meus Tests</div>
              <div className={`text-sm ${theme.textSecondary}`}>{tests.length} tests</div>
            </div>
            <ArrowRight size={20} className={theme.textSecondary} />
          </button>

          <button
            onClick={() => setScreen('audiobooks')}
            className={`w-full card-hover p-5 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Headphones size={24} className={theme.accent} />
            </div>
            <div className="text-left flex-1">
              <div className={`font-semibold text-lg ${theme.text}`}>Àudios</div>
              <div className={`text-sm ${theme.textSecondary}`}>{audioBooks.length} àudios</div>
            </div>
            <ArrowRight size={20} className={theme.textSecondary} />
          </button>

          <button
            onClick={() => setScreen('stats')}
            className={`w-full card-hover p-5 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <BarChart3 size={24} className={theme.accent} />
            </div>
            <div className="text-left flex-1">
              <div className={`font-semibold text-lg ${theme.text}`}>Estadístiques</div>
              <div className={`text-sm ${theme.textSecondary}`}>Progrés i rendiment</div>
            </div>
            <ArrowRight size={20} className={theme.textSecondary} />
          </button>

          <button
            onClick={() => setScreen('sharing')}
            className={`w-full card-hover p-5 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Share2 size={24} className={theme.accent} />
            </div>
            <div className="text-left flex-1">
              <div className={`font-semibold text-lg ${theme.text}`}>Compartir Materials</div>
              <div className={`text-sm ${theme.textSecondary}`}>
                {sharedAccess.length > 0 ? `Accés a ${sharedAccess.length} compte${sharedAccess.length > 1 ? 's' : ''}` : 'Gestionar invitacions'}
              </div>
            </div>
            <ArrowRight size={20} className={theme.textSecondary} />
          </button>

          {/* Only show upload button if not in read-only mode */}
          {!isReadOnlyMode && (
            <button
              onClick={() => setUploadType('upload')}
              className={`w-full btn-primary p-5 mt-4 rounded-xl`}
            >
              <Plus size={20} />
              <span className="font-semibold">Pujar Contingut</span>
            </button>
          )}

          {/* Show info message when in read-only mode */}
          {isReadOnlyMode && (
            <div className={`w-full p-6 rounded-2xl border-2 border-dashed ${theme.border} ${theme.textSecondary} text-center`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={24} />
                <span className="font-semibold">Mode Només Lectura</span>
              </div>
              <p className="text-sm">No pots pujar contingut als materials compartits</p>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  // Upload Screen
  const UploadScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setUploadType(null)} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
          <ArrowLeft size={20} />
          <span className="font-medium">Tornar</span>
        </button>

        <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
          Pujar Contingut
        </h2>

        <div className="space-y-3">
          <label className="block">
            <div className="card-hover p-5 cursor-pointer flex items-center gap-4 transition-all">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
                <BookOpen size={24} className={theme.accent} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-semibold text-base ${theme.text}`}>Pujar Apunts</div>
                <div className={`text-sm ${theme.textSecondary}`}>Arxius .txt o .json (múltiples)</div>
              </div>
            </div>
            <input
              type="file"
              accept=".txt,.json"
              multiple
              onChange={(e) => handleFileUpload(e, 'note')}
              className="hidden"
            />
          </label>

          <label className="block">
            <div className="card-hover p-5 cursor-pointer flex items-center gap-4 transition-all">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
                <Edit3 size={24} className={theme.accent} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-semibold text-base ${theme.text}`}>Pujar Test</div>
                <div className={`text-sm ${theme.textSecondary}`}>Arxius .txt (múltiples)</div>
              </div>
            </div>
            <input
              type="file"
              accept=".txt"
              multiple
              onChange={(e) => handleFileUpload(e, 'test')}
              className="hidden"
            />
          </label>

          <button onClick={handleAddAudioLink} className="block w-full">
            <div className="card-hover p-5 cursor-pointer flex items-center gap-4 transition-all">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
                <Headphones size={24} className={theme.accent} />
              </div>
              <div className="flex-1 text-left">
                <div className={`font-semibold text-base ${theme.text}`}>Afegir Enllaç d&apos;Àudio</div>
                <div className={`text-sm ${theme.textSecondary}`}>URL d&apos;arxiu M4A, MP3, etc.</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // Notes List Screen
  const NotesScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
          <ArrowLeft size={20} />
          <span className="font-medium">Tornar</span>
        </button>

        <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
          Els Meus Apunts
        </h2>

        {notes.length === 0 ? (
          <div className={`text-center ${theme.textSecondary} mt-12 p-8`}>
            <BookOpen size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No hi ha apunts encara</p>
            <p className="text-sm mt-2">Puja el teu primer document</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="card-hover p-4">
                {editingNoteId === note.id ? (
                  // Editing mode
                  <div className="flex items-center gap-2">
                    <FileText size={20} className={theme.accent} />
                    <input
                      type="text"
                      value={editingNoteName}
                      onChange={(e) => setEditingNoteName(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNoteRename(note.id);
                        if (e.key === 'Escape') cancelEditingNote();
                      }}
                    />
                    <button
                      onClick={() => saveNoteRename(note.id)}
                      className={`p-2 rounded-lg ${isDark ? 'text-emerald-400 hover:bg-emerald-900/50' : 'text-emerald-600 hover:bg-emerald-50'} transition`}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={cancelEditingNote}
                      className={`p-2 rounded-lg ${theme.textSecondary} ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'} transition`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  // Normal mode
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCurrentNote(note);
                        setScreen('reading');
                      }}
                      className="flex-1 text-left"
                    >
                      <div className={`font-semibold flex items-center gap-3 ${theme.text}`}>
                        <FileText size={20} className={theme.accent} />
                        {note.title}
                      </div>
                      <div className={`text-sm ${theme.textSecondary} ml-8`}>{note.date}</div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingNote(note)}
                        className={`p-2 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-500/20' : 'text-primary-600 hover:bg-blue-50'} transition`}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem(note.id, 'note')}
                        className={`p-2 rounded-lg ${isDark ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-500 hover:bg-rose-50'} transition`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Track note reading session
  useEffect(() => {
    if (screen === 'reading' && currentNote) {
      // Start tracking time
      const startTime = Date.now();
      setReadingStartTime(startTime);

      return () => {
        // When leaving reading screen, save session
        const duration = Math.floor((Date.now() - startTime) / 1000); // in seconds
        if (duration > 5) { // Only save if read for more than 5 seconds
          addNoteSession(
            user!.uid,
            currentNote.title,
            new Date(startTime).toLocaleTimeString('ca-ES'),
            duration
          ).then(() => {
            // Reload sessions
            getAllNoteSessions(user!.uid).then(setNoteSessions);
          }).catch(error => {
            console.error('Error desant sessió d\'apunts:', error);
          });
        }
      };
    }
  }, [screen, currentNote]);

  // Reading Screen
  const ReadingScreen = () => {
    const [readingProgress, setReadingProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    const formattedContent = currentNote && currentNote.content
      ? parseNoteContent(currentNote.content)
      : [{ type: 'p' as const, content: 'Error: No hi ha contingut per mostrar' }];

    // Check if there's a related audiobook for this note
    const relatedAudio = currentNote ? audioBooks.find(audio => audio.relatedNoteTitle === currentNote.title) : null;

    // Track reading progress based on scroll position
    useEffect(() => {
      const handleScroll = () => {
        if (contentRef.current) {
          const element = contentRef.current;
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight - element.clientHeight;
          const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
          setReadingProgress(Math.min(Math.round(progress), 100));
        }
      };

      const element = contentRef.current;
      if (element) {
        element.addEventListener('scroll', handleScroll);
        return () => element.removeEventListener('scroll', handleScroll);
      }
    }, []);

    const handleBackToNotes = async () => {
      stopReading();

      // Save session before leaving
      if (readingStartTime && currentNote) {
        const duration = Math.floor((Date.now() - readingStartTime) / 1000);
        if (duration > 5) {
          try {
            await addNoteSession(
              user!.uid,
              currentNote.title,
              new Date(readingStartTime).toLocaleTimeString('ca-ES'),
              duration
            );
            const sessionsData = await getAllNoteSessions(user!.uid);
            setNoteSessions(sessionsData);
          } catch (error) {
            console.error('Error desant sessió d\'apunts:', error);
          }
        }
      }

      setReadingStartTime(null);
      setScreen('notes');
    };

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={handleBackToNotes} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${theme.text}`}>
            <BookOpen size={24} className={theme.accent} />
            {currentNote?.title}
          </h2>

          {/* Reading Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={theme.textSecondary}>Progrés de lectura</span>
              <span className={`font-semibold ${theme.accent}`}>{readingProgress}%</span>
            </div>
            <div className={`w-full h-2 ${theme.progressBar} rounded-full overflow-hidden`}>
              <div
                className={`h-full ${theme.progressFill} transition-all duration-300 ease-out`}
                style={{ width: `${readingProgress}%` }}
              />
            </div>
          </div>

          <div className="mb-6 space-y-3">
            {relatedAudio ? (
              <button
                onClick={() => playAudio(relatedAudio)}
                className="w-full btn-primary p-4 rounded-xl"
              >
                <Headphones size={20} />
                <span className="font-semibold">Escoltar Audiollibre</span>
              </button>
            ) : (
              <button
                onClick={toggleReading}
                className="w-full btn-primary p-4 rounded-xl"
              >
                {isReading ? (
                  <>
                    <Pause size={20} />
                    <span className="font-semibold">Pausar Lectura</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    <span className="font-semibold">Escoltar Text-to-Speech</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div ref={contentRef} className={`${theme.card} p-6 rounded-2xl max-h-[70vh] overflow-y-auto border-2 ${theme.border} shadow-lg`}>
            {formattedContent.map((item, idx) => {
              if (item.type === 'h1') {
                return (
                  <h1 key={idx} className="text-2xl font-bold mb-4 mt-6 first:mt-0">
                    {item.content}
                  </h1>
                );
              }
              if (item.type === 'h2') {
                return (
                  <h2 key={idx} className="text-xl font-bold mb-3 mt-5">
                    {item.content}
                  </h2>
                );
              }
              if (item.type === 'h3') {
                return (
                  <h3 key={idx} className={`text-lg font-semibold mb-2 mt-4 ${theme.accent}`}>
                    {item.content}
                  </h3>
                );
              }
              if (item.type === 'li') {
                return (
                  <div key={idx} className="flex gap-2 mb-2 ml-4">
                    <span className={theme.accent}>•</span>
                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                );
              }
              if (item.type === 'space') {
                return <div key={idx} className="h-2" />;
              }
              if (item.type === 'formula') {
                return (
                  <div key={idx} className={`my-4 p-4 rounded-xl ${isDark ? 'bg-blue-500/10 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                    {item.label && (
                      <div className={`text-sm font-semibold mb-2 ${theme.accent}`}>
                        <span dangerouslySetInnerHTML={{ __html: item.label || '' }} />:
                      </div>
                    )}
                    <code className="text-base font-mono block text-center" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                );
              }
              if (item.type === 'definition') {
                return (
                  <div key={idx} className={`my-3 p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} border-l-4 ${isDark ? 'border-blue-400' : 'border-primary-600'}`}>
                    <div className={`font-bold mb-2 flex items-center gap-2 ${theme.text}`}>
                      <BookOpen size={18} className={theme.accent} />
                      <span dangerouslySetInnerHTML={{ __html: item.term || '' }} />
                    </div>
                    {item.details && item.details.length > 0 && (
                      <div className="space-y-1 ml-3">
                        {item.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex gap-2">
                            <ArrowRight size={16} className={theme.accent} />
                            <span className="flex-1 text-sm" dangerouslySetInnerHTML={{ __html: detail }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (item.type === 'highlight') {
                const bgColor = item.importance === 'high'
                  ? (isDark ? 'bg-yellow-900/30 border-yellow-600' : 'bg-yellow-100 border-yellow-400')
                  : item.importance === 'medium'
                  ? (isDark ? 'bg-blue-900/30 border-blue-600' : 'bg-blue-100 border-blue-400')
                  : (isDark ? 'bg-cyan-900/30 border-cyan-600' : 'bg-cyan-50 border-cyan-400');
                const IconComponent = item.importance === 'high' ? Sparkles : item.importance === 'medium' ? Lightbulb : Info;
                return (
                  <div key={idx} className={`my-4 p-4 rounded-xl ${bgColor} border`}>
                    <div className="flex items-start gap-3">
                      <IconComponent size={20} className={item.importance === 'high' ? 'text-yellow-600 dark:text-yellow-400' : item.importance === 'medium' ? 'text-blue-600 dark:text-blue-400' : 'text-cyan-600 dark:text-cyan-400'} />
                      <div className="flex-1">
                        {item.content.split('\n').map((line, lIdx) => (
                          <div key={lIdx} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: line }} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              if (item.type === 'example') {
                return (
                  <div key={idx} className={`my-4 p-4 rounded-xl ${isDark ? 'bg-emerald-950/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border`}>
                    {item.label && (
                      <div className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        <FileText size={16} />
                        <span dangerouslySetInnerHTML={{ __html: item.label || '' }} />
                      </div>
                    )}
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                );
              }
              if (item.type === 'table') {
                return (
                  <div key={idx} className={`my-4 overflow-x-auto rounded-xl ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'} border ${theme.border}`}>
                    <table className="w-full text-sm">
                      <thead className={isDark ? 'bg-neutral-850' : 'bg-neutral-100'}>
                        <tr>
                          {item.headers?.map((header, hIdx) => (
                            <th key={hIdx} className={`px-4 py-3 text-left font-semibold ${theme.text}`}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {item.rows?.map((row, rIdx) => (
                          <tr key={rIdx} className={`border-t ${theme.border} ${rIdx % 2 === 0 ? (isDark ? 'bg-neutral-900/30' : 'bg-white') : ''}`}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-4 py-3" dangerouslySetInnerHTML={{ __html: cell }} />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <p
                  key={idx}
                  className="mb-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Tests List Screen
  const TestsScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
          <ArrowLeft size={20} />
          <span className="font-medium">Tornar</span>
        </button>

        <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
          Els Meus Tests
        </h2>

        {tests.length >= 2 && (
          <button
            onClick={() => showTestConfig({ id: -1, title: 'Test General (Tots els Tests)', questions: [], date: '' } as Test)}
            className={`w-full mb-4 card-hover p-5 ${isDark ? 'border-amber-600/50 bg-amber-950/20' : 'border-amber-300 bg-amber-50'} border-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                  <Target size={24} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                </div>
                <div className="text-left">
                  <div className={`font-semibold text-lg ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    Test General
                  </div>
                  <div className={`text-sm ${isDark ? 'text-amber-400/70' : 'text-amber-700/70'}`}>
                    Combina preguntes de tots els tests
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-200 text-amber-900'} font-semibold`}>
                {tests.reduce((sum, test) => sum + test.questions.length, 0)} preguntes
              </div>
            </div>
          </button>
        )}

        {tests.length === 0 ? (
          <div className={`text-center ${theme.textSecondary} mt-12 p-8`}>
            <FileText size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">No hi ha tests encara</p>
            <p className="text-sm mt-2">Puja el teu primer test</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="card-hover p-4">
                {editingTestId === test.id ? (
                  // Editing mode
                  <div className="flex items-center gap-2">
                    <FileText size={20} className={theme.accent} />
                    <input
                      type="text"
                      value={editingTestName}
                      onChange={(e) => setEditingTestName(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTestRename(test.id);
                        if (e.key === 'Escape') cancelEditingTest();
                      }}
                    />
                    <button
                      onClick={() => saveTestRename(test.id)}
                      className={`p-2 rounded-lg ${isDark ? 'text-emerald-400 hover:bg-emerald-900/50' : 'text-emerald-600 hover:bg-emerald-50'} transition`}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={cancelEditingTest}
                      className={`p-2 rounded-lg ${theme.textSecondary} ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'} transition`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  // Normal mode
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => showTestConfig(test)}
                      className="flex-1 text-left"
                    >
                      <div className={`font-semibold flex items-center gap-3 ${theme.text}`}>
                        <FileText size={20} className={theme.accent} />
                        {test.title}
                      </div>
                      <div className={`text-sm ${theme.textSecondary} ml-8`}>
                        {test.questions.length} preguntes • {test.date}
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingTest(test)}
                        className={`p-2 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-500/20' : 'text-primary-600 hover:bg-blue-50'} transition`}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem(test.id, 'test')}
                        className={`p-2 rounded-lg ${isDark ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-500 hover:bg-rose-50'} transition`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Test Configuration Screen
  const TestConfigScreen = () => {
    if (!selectedTestForConfig) return null;

    const isMixedTest = selectedTestForConfig.id === -1;
    const totalQuestions = isMixedTest
      ? tests.reduce((sum, test) => sum + test.questions.length, 0)
      : selectedTestForConfig.questions.length;
    const questionOptions = [5, 10, 15, 25, 50].filter(n => n <= totalQuestions);

    // Add "All" option
    if (!questionOptions.includes(totalQuestions)) {
      questionOptions.push(totalQuestions);
    }

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              setSelectedTestForConfig(null);
              setScreen('tests');
            }}
            className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <div className={`card p-6 mb-6 ${isMixedTest ? (isDark ? 'border-amber-600/50 bg-amber-950/20' : 'border-amber-300 bg-amber-50') : ''} ${isMixedTest ? 'border-2' : ''}`}>
            <h2 className={`text-2xl font-bold mb-2 flex items-center gap-3 ${theme.text}`}>
              {isMixedTest ? <Target size={28} className={isDark ? 'text-amber-400' : 'text-amber-600'} /> : <FileText size={28} className={theme.accent} />}
              {selectedTestForConfig.title}
            </h2>
            <p className={`${theme.textSecondary} text-sm`}>
              {totalQuestions} preguntes disponibles{isMixedTest ? ` (de ${tests.length} tests)` : ''}
            </p>
          </div>

          <div className="card p-6">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme.text}`}>
              <Target size={20} className={theme.accent} />
              Quantes preguntes vols fer?
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {questionOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => startTest(selectedTestForConfig, count)}
                  className="btn-primary p-4 rounded-xl font-semibold text-lg"
                >
                  {count === totalQuestions ? `Totes (${count})` : count}
                </button>
              ))}
            </div>

            <div className={`mt-4 p-3 ${isDark ? 'bg-blue-500/10 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg`}>
              <p className={`text-sm flex items-start gap-2 ${theme.text}`}>
                <Info size={16} className={theme.accent} />
                <span>Les preguntes s&apos;escolliran aleatòriament del conjunt total</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Taking Test Screen
  const TakingTestScreen = () => {
    const currentQ = currentTest?.questions[testProgress.current];
    if (!currentQ) return null;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Sortir</span>
          </button>

          <div className="mb-6">
            <div className={`text-sm ${theme.textSecondary} mb-3 font-medium flex items-center gap-2`}>
              <FileText size={16} />
              Pregunta {testProgress.current + 1} de {currentTest!.questions.length}
            </div>
            <div className={`${theme.progressBar} h-2 rounded-full overflow-hidden`}>
              <div
                className={`${theme.progressFill} h-full transition-all duration-500`}
                style={{ width: `${((testProgress.current + 1) / currentTest!.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className={`card p-6 mb-6`}>
            <h3 className={`text-xl font-semibold ${theme.text}`}>
              {currentQ.question}
            </h3>
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = showFeedback && selectedAnswer === option;
              const isCorrectAnswer = option === currentQ.correct;
              const shouldShowCorrect = showFeedback && !answerIsCorrect && isCorrectAnswer;

              let buttonClasses = `w-full p-4 rounded-2xl text-left font-medium shadow-md flex items-center gap-3 transition-all duration-300`;

              if (showFeedback) {
                // Disable hover and scale effects during feedback
                buttonClasses += ' cursor-default';

                if (isSelected && answerIsCorrect) {
                  // Selected and correct - green
                  buttonClasses += ` ${isDark ? 'bg-green-600 hover:bg-green-600' : 'bg-green-500 hover:bg-green-500'} text-white border-2 border-green-400 scale-105`;
                } else if (isSelected && !answerIsCorrect) {
                  // Selected and incorrect - red
                  buttonClasses += ` ${isDark ? 'bg-red-600 hover:bg-red-600' : 'bg-red-500 hover:bg-red-500'} text-white border-2 border-red-400 scale-105`;
                } else if (shouldShowCorrect) {
                  // Show correct answer in green when user was wrong
                  buttonClasses += ` ${isDark ? 'bg-green-600 hover:bg-green-600' : 'bg-green-500 hover:bg-green-500'} text-white border-2 border-green-400`;
                } else {
                  // Other options - dimmed
                  buttonClasses += ` ${theme.button} opacity-40`;
                }
              } else {
                // Normal state - interactive
                buttonClasses += ` ${theme.button} transform hover:scale-105`;
              }

              return (
                <button
                  key={idx}
                  onClick={() => answerQuestion(option)}
                  disabled={showFeedback}
                  className={buttonClasses}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    showFeedback && (isSelected || shouldShowCorrect)
                      ? 'bg-white/30'
                      : isDark ? 'bg-primary-900/30' : 'bg-neutral-100'
                  }`}>
                    {showFeedback && isSelected && answerIsCorrect && <Check size={18} />}
                    {showFeedback && isSelected && !answerIsCorrect && <X size={18} />}
                    {showFeedback && shouldShowCorrect && <Check size={18} />}
                    {(!showFeedback || (!isSelected && !shouldShowCorrect)) && String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {showFeedback && !answerIsCorrect && (
            <div className={`mt-4 p-4 ${isDark ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border rounded-xl`}>
              <p className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                <Check size={16} />
                <span><span className="font-bold">Resposta correcta:</span> {currentQ.correct}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // AudioBooks List Screen
  const AudioBooksScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
          <ArrowLeft size={20} />
          <span className="font-medium">Inici</span>
        </button>

        <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
          Els Meus Àudios
        </h2>

        {audioBooks.length === 0 ? (
          <div className={`card p-8 text-center ${theme.textSecondary} border-2 border-dashed`}>
            <Headphones size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tens cap àudio encara.</p>
            <p className="mt-2">Puja àudios des del menú principal!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audioBooks.map((audio) => (
              <div key={audio.id} className="card-hover p-4">
                {editingAudioId === audio.id ? (
                  // Editing mode
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Headphones size={20} className={theme.accent} />
                      <input
                        type="text"
                        value={editingAudioName}
                        onChange={(e) => setEditingAudioName(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        placeholder="Nom de l'àudio"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className={theme.accent} />
                      <input
                        type="text"
                        value={editingAudioUrl}
                        onChange={(e) => setEditingAudioUrl(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm`}
                        placeholder="URL de l'àudio"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => saveAudioEdit(audio.id)}
                        className={`px-4 py-2 rounded-lg ${isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white transition flex items-center gap-2`}
                      >
                        <Check size={16} />
                        Desar
                      </button>
                      <button
                        onClick={cancelEditingAudio}
                        className="btn-secondary px-4 py-2 flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel·lar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal display mode
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => playAudio(audio)}
                      className="flex-1 text-left"
                    >
                      <div className={`font-semibold flex items-center gap-3 ${theme.text}`}>
                        <Headphones size={20} className={theme.accent} />
                        {audio.title}
                      </div>
                      <div className={`text-sm ${theme.textSecondary} ml-8`}>
                        {audio.relatedNoteTitle && (
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen size={14} />
                            <span className="italic">{audio.relatedNoteTitle}</span>
                          </div>
                        )}
                        {audio.date}
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditingAudio(audio)}
                        className={`p-2 rounded-lg ${isDark ? 'text-blue-400 hover:bg-blue-500/20' : 'text-primary-600 hover:bg-blue-50'} transition`}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem(audio.id, 'audio')}
                        className={`p-2 rounded-lg ${isDark ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-500 hover:bg-rose-50'} transition`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Listening Screen (Audio Player)
  const ListeningScreen = () => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      if (currentAudio && audioRef.current) {
        const audio = audioRef.current;
        audio.src = getPlayableAudioUrl(currentAudio.url);
        audio.preload = 'auto';
        audio.load();

        const handleLoadedMetadata = () => {
          setDuration(audio.duration);
          // Try to resume if user had already tapped play
          if (!audio.paused && audio.currentTime === 0) {
            audio.play().catch(() => {});
          }
        };

        const handleTimeUpdate = () => {
          setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
          setIsPlaying(false);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => console.debug('Audio waiting...');
        const handleStalled = () => console.debug('Audio stalled');
        const handleCanPlay = () => console.debug('Audio canplay');
        const handleCanPlayThrough = () => console.debug('Audio canplaythrough');

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('stalled', handleStalled);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('canplaythrough', handleCanPlayThrough);

        return () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('play', handlePlay);
          audio.removeEventListener('pause', handlePause);
          audio.removeEventListener('waiting', handleWaiting);
          audio.removeEventListener('stalled', handleStalled);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        };
      }
    }, [currentAudio]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    if (!currentAudio) return null;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            setIsPlaying(false);
            setScreen('audiobooks');
          }} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <div className="card p-8">
            <div className="text-center mb-8">
              <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${isDark ? 'bg-primary-900/30' : 'bg-primary-100'} flex items-center justify-center`}>
                <Headphones size={64} className={theme.accent} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>{currentAudio.title}</h2>
              <p className={`${theme.textSecondary}`}>Audiollibre</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${isDark ? '#0284c7' : '#0284c7'} 0%, ${isDark ? '#0284c7' : '#0284c7'} ${(currentTime / duration) * 100}%, ${isDark ? '#262626' : '#e5e5e5'} ${(currentTime / duration) * 100}%, ${isDark ? '#262626' : '#e5e5e5'} 100%)`
                }}
              />
              <div className={`flex justify-between text-sm mt-2 ${theme.textSecondary}`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={skipBackward}
                className="btn-secondary p-4 rounded-full"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlayPause}
                className="btn-primary p-6 rounded-full"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>

              <button
                onClick={skipForward}
                className="btn-secondary p-4 rounded-full"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Help text */}
            <div className={`mt-4 p-3 ${isDark ? 'bg-primary-950/30 border-primary-800' : 'bg-primary-50 border-primary-200'} border rounded-lg text-xs`}>
              <p className={`flex items-start gap-2 ${theme.text}`}>
                <Info size={14} className={`flex-shrink-0 mt-0.5 ${theme.accent}`} />
                <span>Si l&apos;àudio no es reprodueix, assegura&apos;t que l&apos;URL és un enllaç directe de descàrrega. Consulta <strong>GUIA-AUDIO-LINKS.md</strong></span>
              </p>
            </div>
          </div>

          <audio
            ref={audioRef}
            onError={(e) => {
              console.error('Audio error:', e);
              const isGoogleDrive = currentAudio?.url.includes('drive.google.com');
              if (isGoogleDrive) {
                alert('Error: Google Drive té limitacions de CORS que impedeixen la reproducció directa d\'àudio.\n\nSolucions:\n1. Usa Dropbox (més recomanat)\n2. Puja l\'arxiu a OneDrive\n3. Comparteix l\'arxiu des d\'un altre servei\n\nConsulta la guia GUIA-AUDIO-LINKS.md per més detalls.');
              } else {
                alert('Error carregant l\'àudio.\n\nVerifica que:\n- L\'URL és correcta\n- És un enllaç directe de descàrrega\n- L\'arxiu és accessible públicament');
              }
            }}
          />
        </div>
      </div>
    );
  };

  // Stats Screen
  const StatsScreen = () => {
    // Calculate study statistics
    const totalStudyTime = noteSessions.reduce((acc, session) => acc + session.duration, 0);
    const totalStudyMinutes = Math.floor(totalStudyTime / 60);
    const totalStudyHours = Math.floor(totalStudyMinutes / 60);
    const remainingMinutes = totalStudyMinutes % 60;

    // Notes studied frequency
    const noteFrequency: { [key: string]: number } = {};
    noteSessions.forEach(session => {
      noteFrequency[session.noteTitle] = (noteFrequency[session.noteTitle] || 0) + 1;
    });
    const topStudiedNotes = Object.entries(noteFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Test performance stats
    const testPerformance: { [key: string]: TestAttempt[] } = {};
    testAttempts.forEach(attempt => {
      if (!testPerformance[attempt.testTitle]) {
        testPerformance[attempt.testTitle] = [];
      }
      testPerformance[attempt.testTitle].push(attempt);
    });

    // Calculate average score and improvement
    const totalTestAttempts = testAttempts.length;
    const averageScore = totalTestAttempts > 0
      ? Math.round(testAttempts.reduce((acc, att) => acc + att.percentage, 0) / totalTestAttempts)
      : 0;

    // Recent performance (last 5 attempts)
    const recentAttempts = [...testAttempts].slice(0, 5);

    // Calculate improvement trend
    const getImprovementTrend = (testTitle: string) => {
      const attempts = testPerformance[testTitle];
      if (!attempts || attempts.length < 2) return null;

      const sortedAttempts = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
      const firstScore = sortedAttempts[0].percentage;
      const lastScore = sortedAttempts[sortedAttempts.length - 1].percentage;
      const improvement = lastScore - firstScore;

      return {
        attempts: sortedAttempts.length,
        firstScore,
        lastScore,
        improvement,
        isImproving: improvement > 0
      };
    };

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
            Les Meves Estadístiques
          </h2>

          {/* Total Study Time Card */}
          <div className="card p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock size={24} className={theme.accent} />
              <h3 className={`text-xl font-semibold ${theme.text}`}>Temps Total d&apos;Estudi</h3>
            </div>
            <div className={`text-4xl font-bold mt-4 ${theme.text}`}>
              {totalStudyHours > 0 && <span>{totalStudyHours}h </span>}
              <span>{remainingMinutes}min</span>
            </div>
            <p className={`text-sm mt-2 ${theme.textSecondary}`}>
              {noteSessions.length} sessions de lectura
            </p>
          </div>

          {/* Test Performance Summary */}
          <div className="card p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={24} className={theme.accent} />
              <h3 className={`text-xl font-semibold ${theme.text}`}>Rendiment en Tests</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className={`text-3xl font-bold ${theme.text}`}>{totalTestAttempts}</div>
                <p className={`text-sm ${theme.textSecondary}`}>Tests realitzats</p>
              </div>
              <div>
                <div className={`text-3xl font-bold ${theme.text}`}>{averageScore}%</div>
                <p className={`text-sm ${theme.textSecondary}`}>Puntuació mitjana</p>
              </div>
            </div>
          </div>

          {/* Most Studied Notes */}
          {topStudiedNotes.length > 0 && (
            <div className="card p-6 mb-4">
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme.text}`}>
                <BookOpen size={20} className={theme.accent} />
                Apunts Més Estudiats
              </h3>
              <div className="space-y-3">
                {topStudiedNotes.map(([title, count]) => (
                  <div key={title} className={`p-3 rounded-xl ${isDark ? 'bg-primary-950/30' : 'bg-primary-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${theme.text}`}>{title}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isDark ? 'bg-primary-900/50 text-primary-300' : 'bg-primary-100 text-primary-700'}`}>
                        {count} {count === 1 ? 'vegada' : 'vegades'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Improvement Tracking */}
          {Object.keys(testPerformance).length > 0 && (
            <div className="card p-6 mb-4">
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme.text}`}>
                <TrendingUp size={20} className={theme.accent} />
                Progrés per Test
              </h3>
              <div className="space-y-4">
                {Object.entries(testPerformance).map(([testTitle, attempts]) => {
                  const trend = getImprovementTrend(testTitle);
                  if (!trend) return null;

                  return (
                    <div key={testTitle} className={`p-4 rounded-xl ${isDark ? 'bg-primary-950/30' : 'bg-primary-50'}`}>
                      <div className={`font-semibold mb-2 ${theme.text}`}>{testTitle}</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className={theme.textSecondary}>Intents:</span>
                          <span className={`font-semibold ${theme.text}`}>{trend.attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={theme.textSecondary}>Primer intent:</span>
                          <span className={`font-semibold ${theme.text}`}>{trend.firstScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={theme.textSecondary}>Últim intent:</span>
                          <span className={`font-semibold ${theme.text}`}>{trend.lastScore}%</span>
                        </div>
                        <div className={`flex justify-between items-center mt-2 pt-2 border-t ${theme.border}`}>
                          <span className={theme.textSecondary}>Progrés:</span>
                          <span className={`font-bold flex items-center gap-1 ${trend.isImproving ? 'text-emerald-500' : trend.improvement === 0 ? 'text-amber-500' : 'text-orange-500'}`}>
                            {trend.improvement > 0 ? '+' : ''}{trend.improvement}%
                            {trend.isImproving ? <TrendingUp size={16} /> : trend.improvement === 0 ? <ArrowRight size={16} /> : <TrendingDown size={16} />}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Test Attempts */}
          {recentAttempts.length > 0 && (
            <div className="card p-6 mb-4">
              <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme.text}`}>
                <FileText size={20} className={theme.accent} />
                Últims Tests
              </h3>
              <div className="space-y-3">
                {recentAttempts.map((attempt, idx) => (
                  <div key={idx} className={`p-3 rounded-xl ${isDark ? 'bg-primary-950/30' : 'bg-primary-50'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-medium ${theme.text}`}>{attempt.testTitle}</span>
                      <span className={`text-xl font-bold ${attempt.percentage >= 70 ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {attempt.percentage}%
                      </span>
                    </div>
                    <div className={`text-xs ${theme.textSecondary}`}>
                      {attempt.score}/{attempt.totalQuestions} correctes • {attempt.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {noteSessions.length === 0 && testAttempts.length === 0 && (
            <div className={`text-center ${theme.textSecondary} mt-12 p-8`}>
              <BarChart3 size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">No hi ha estadístiques encara</p>
              <p className="text-sm mt-2">Comença a estudiar per veure el teu progrés</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Test Results Screen
  const TestResultsScreen = () => {
    const correct = testProgress.answers.filter(a => a.isCorrect).length;
    const total = testProgress.answers.length;
    const percentage = Math.round((correct / total) * 100);

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar a Tests</span>
          </button>

          <div className="text-center mb-8">
            <h2 className={`text-4xl font-bold mb-4 ${theme.text}`}>
              Test Completat!
            </h2>
            <div className={`text-7xl font-bold my-6 ${theme.text}`}>
              {percentage}%
            </div>
            <div className={`text-xl ${theme.textSecondary} font-medium`}>
              {correct} de {total} correctes
            </div>
          </div>

          <div className="space-y-3">
            {testProgress.answers.map((answer, idx) => (
              <div key={idx} className={`card p-5 ${answer.isCorrect ?
                (isDark ? 'border-emerald-700/50 bg-emerald-950/20' : 'border-emerald-300 bg-emerald-50') :
                (isDark ? 'border-rose-700/50 bg-rose-950/20' : 'border-rose-300 bg-rose-50')
              } border-2`}>
                <div className="flex items-start gap-3 mb-2">
                  {answer.isCorrect ? (
                    <div className="flex-shrink-0">
                      <CheckCircle size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">
                      <XCircle size={24} className={isDark ? 'text-rose-400' : 'text-rose-600'} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold mb-3 text-base ${theme.text}`}>{answer.question}</div>
                    <div className="text-sm space-y-1">
                      <div className={`p-2 rounded-lg ${answer.isCorrect ? (isDark ? 'bg-emerald-900/30' : 'bg-emerald-100/50') : (isDark ? 'bg-rose-900/30' : 'bg-rose-100/50')}`}>
                        <span className="font-semibold">La teva resposta:</span> {answer.answer}
                      </div>
                      {!answer.isCorrect && (
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100/50'}`}>
                          <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Correcta:</span>
                          <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}> {answer.correct}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => showTestConfig(currentTest!)}
            className="w-full mt-6 btn-primary p-4 rounded-xl"
          >
            <ArrowRight size={20} />
            <span className="font-semibold">Repetir Test</span>
          </button>
        </div>
      </div>
    );
  };

  // Sharing Management Screen
  const SharingScreen = () => {
    const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCreateInvitation = async () => {
      if (!user) return;

      setIsCreatingInvitation(true);
      try {
        const code = await createInvitation(user.uid, user.email || 'unknown');
        const updated = await getUserInvitations(user.uid);
        setUserInvitations(updated);
        setSharingMessage(`Invitació creada: ${code}`);
        setTimeout(() => setSharingMessage(''), 3000);
      } catch (error) {
        console.error('Error creating invitation:', error);
        setSharingMessage('Error al crear la invitació');
      } finally {
        setIsCreatingInvitation(false);
      }
    };

    const handleDeleteInvitation = async (code: string) => {
      if (!user) return;

      try {
        await deleteInvitation(code);
        const updated = await getUserInvitations(user.uid);
        setUserInvitations(updated);
        setSharingMessage('Invitació eliminada');
        setTimeout(() => setSharingMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting invitation:', error);
        setSharingMessage('Error al eliminar la invitació');
      }
    };

    const copyInvitationLink = (code: string) => {
      const link = `${window.location.origin}${window.location.pathname}?invite=${code}`;
      navigator.clipboard.writeText(link);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleAcceptCode = async () => {
      if (!user || !invitationCodeInput.trim()) return;

      try {
        const success = await acceptInvitation(invitationCodeInput.trim().toUpperCase(), user.uid, user.email || 'unknown');
        if (success) {
          const updated = await getSharedAccess(user.uid);
          setSharedAccess(updated);
          setSharingMessage('Invitació acceptada amb èxit!');
          setInvitationCodeInput('');
          setTimeout(() => setSharingMessage(''), 3000);
        } else {
          setSharingMessage('Codi d\'invitació no vàlid o caducat');
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setSharingMessage('Error al acceptar la invitació');
      }
    };

    const viewSharedContent = async (ownerId: string) => {
      if (!user) return;

      try {
        setIsLoading(true);
        setViewingOwnerId(ownerId);
        setIsReadOnlyMode(true);

        const [sharedNotes, sharedTests, sharedAudioBooks] = await Promise.all([
          getAllNotes(ownerId),
          getAllTests(ownerId),
          getAllAudioBooks(ownerId)
        ]);

        setNotes(sharedNotes);
        setTests(sharedTests);
        setAudioBooks(sharedAudioBooks);
        setScreen('home');
      } catch (error) {
        console.error('Error loading shared content:', error);
        setSharingMessage('Error al carregar el contingut compartit');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setScreen('home')}
            className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <h1 className="text-3xl font-bold mb-6">🤝 Compartir Materials</h1>

          {sharingMessage && (
            <div className={`mb-4 p-4 rounded-lg ${theme.card} border-2 ${theme.border}`}>
              {sharingMessage}
            </div>
          )}

          {/* My Invitations Section */}
          <div className={`${theme.card} p-6 rounded-2xl border-2 ${theme.border} shadow-lg mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LinkIcon size={24} />
                Les Meves Invitacions
              </h2>
              <button
                onClick={handleCreateInvitation}
                disabled={isCreatingInvitation}
                className={`${theme.button} px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50`}
              >
                <Plus size={20} />
                Nova Invitació
              </button>
            </div>

            {userInvitations.length === 0 ? (
              <p className={theme.textSecondary}>No tens invitacions actives</p>
            ) : (
              <div className="space-y-3">
                {userInvitations.map((invitation) => (
                  <div key={invitation.code} className={`p-4 rounded-lg ${isDark ? 'bg-purple-800/50' : 'bg-pink-100'} border ${theme.border}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-2xl font-bold mb-2">{invitation.code}</div>
                        <div className={`text-sm ${theme.textSecondary} space-y-1`}>
                          <div>Creat: {invitation.createdAt}</div>
                          <div>Caduca: {invitation.expiresAt}</div>
                          <div>Usos: {invitation.usedBy?.length || 0} / {invitation.maxUses}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyInvitationLink(invitation.code)}
                          className={`p-2 rounded-lg ${theme.buttonSecondary} transition`}
                          title="Copiar enllaç"
                        >
                          {copiedCode === invitation.code ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                        <button
                          onClick={() => handleDeleteInvitation(invitation.code)}
                          className={`p-2 rounded-lg ${isDark ? 'bg-rose-900 hover:bg-rose-800' : 'bg-rose-200 hover:bg-rose-300'} transition`}
                          title="Eliminar"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accept Invitation Section */}
          <div className={`${theme.card} p-6 rounded-2xl border-2 ${theme.border} shadow-lg mb-6`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users size={24} />
              Acceptar Invitació
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationCodeInput}
                onChange={(e) => setInvitationCodeInput(e.target.value.toUpperCase())}
                placeholder="Introdueix el codi (ex: ABCD1234)"
                maxLength={8}
                className={`flex-1 px-4 py-3 rounded-lg ${theme.card} border-2 ${theme.border} ${theme.text} font-mono text-lg uppercase`}
              />
              <button
                onClick={handleAcceptCode}
                disabled={invitationCodeInput.length !== 8}
                className={`${theme.button} px-6 py-3 rounded-lg font-semibold disabled:opacity-50`}
              >
                Acceptar
              </button>
            </div>
          </div>

          {/* Shared Access Section */}
          <div className={`${theme.card} p-6 rounded-2xl border-2 ${theme.border} shadow-lg`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen size={24} />
              Materials Compartits Amb Mi
            </h2>

            {sharedAccess.length === 0 ? (
              <p className={theme.textSecondary}>No tens accés a materials compartits</p>
            ) : (
              <div className="space-y-3">
                {sharedAccess.map((access) => (
                  <div key={access.ownerId} className={`p-4 rounded-lg ${isDark ? 'bg-purple-800/50' : 'bg-pink-100'} border ${theme.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{access.ownerEmail}</div>
                        <div className={`text-sm ${theme.textSecondary}`}>
                          Accés concedit: {access.grantedAt}
                        </div>
                      </div>
                      <button
                        onClick={() => viewSharedContent(access.ownerId)}
                        className={`${theme.button} px-4 py-2 rounded-lg font-semibold flex items-center gap-2`}
                      >
                        <BookOpen size={18} />
                        Veure Materials
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Invitation Acceptance Screen
  const AcceptInvitationScreen = () => {
    if (!pendingInvitation || !user) return null;

    const handleAccept = async () => {
      try {
        const success = await acceptInvitation(pendingInvitation.code, user.uid, user.email || 'unknown');
        if (success) {
          const updated = await getSharedAccess(user.uid);
          setSharedAccess(updated);
          setSharingMessage('Invitació acceptada amb èxit!');
          setPendingInvitation(null);

          // Clear URL parameter
          window.history.replaceState({}, '', window.location.pathname);

          setScreen('sharing');
        } else {
          setSharingMessage('Error al acceptar la invitació');
          setScreen('home');
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setSharingMessage('Error al acceptar la invitació');
        setScreen('home');
      }
    };

    const handleDecline = () => {
      setPendingInvitation(null);
      window.history.replaceState({}, '', window.location.pathname);
      setScreen('home');
    };

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6 flex items-center justify-center`}>
        <div className={`max-w-md w-full card p-8`}>
          <div className="text-center mb-6">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? 'bg-primary-900/30' : 'bg-primary-100'} flex items-center justify-center`}>
              <Share2 size={40} className={theme.accent} />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${theme.text}`}>Invitació Rebuda</h1>
            <p className={theme.textSecondary}>T&apos;han convidat a accedir a materials d&apos;estudi</p>
          </div>

          <div className={`p-4 rounded-lg ${isDark ? 'bg-primary-950/30 border-primary-800' : 'bg-primary-50 border-primary-200'} border mb-6`}>
            <div className="text-sm space-y-2">
              <div><span className="font-semibold">De:</span> {pendingInvitation.ownerEmail}</div>
              <div><span className="font-semibold">Codi:</span> <span className="font-mono">{pendingInvitation.code}</span></div>
              <div><span className="font-semibold">Caduca:</span> {pendingInvitation.expiresAt}</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full btn-primary p-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Check size={20} />
              <span className="font-semibold">Acceptar Invitació</span>
            </button>
            <button
              onClick={handleDecline}
              className={`w-full ${theme.buttonSecondary} p-4 rounded-xl font-semibold transition`}
            >
              Declinar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Authentication handlers
  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(error.message || 'Error d\'inici de sessió');
    }
  };

  const handleSignup = async (email: string, password: string) => {
    try {
      setAuthError('');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(error.message || 'Error de registre');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setNotes([]);
      setTests([]);
      setAudioBooks([]);
      setScreen('home');
    } catch (error: any) {
      console.error('Error logging out:', error);
    }
  };

  // Loading screen while checking authentication
  if (authLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-xl font-bold mb-2">StudyDock</div>
          <div className={`text-sm ${theme.textSecondary}`}>Carregant...</div>
        </div>
      </div>
    );
  }

  // Authentication screens when user is not logged in
  if (!user) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
        <div className="max-w-md mx-auto pt-20 px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">StudyDock</h1>
            <p className={theme.textSecondary}>La teva app d&apos;estudi personal</p>
          </div>

          <div className={`${theme.card} rounded-lg p-6 mb-4`}>
            {/* Tab switcher */}
            <div className="flex mb-6">
              <button
                onClick={() => { setAuthScreen('login'); setAuthError(''); }}
                className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                  authScreen === 'login'
                    ? `${theme.button} text-white rounded-l-lg`
                    : `${theme.buttonSecondary} rounded-l-lg`
                }`}
              >
                Iniciar Sessió
              </button>
              <button
                onClick={() => { setAuthScreen('signup'); setAuthError(''); }}
                className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                  authScreen === 'signup'
                    ? `${theme.button} text-white rounded-r-lg`
                    : `${theme.buttonSecondary} rounded-r-lg`
                }`}
              >
                Registrar-se
              </button>
            </div>

            {/* Login/Signup Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              if (authScreen === 'login') {
                handleLogin(email, password);
              } else {
                handleSignup(email, password);
              }
            }}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Correu electrònic</label>
                <input
                  type="email"
                  name="email"
                  required
                  className={`w-full px-4 py-2 rounded-lg ${theme.bg} ${theme.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="nom@exemple.com"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium">Contrasenya</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className={`w-full px-4 py-2 rounded-lg ${theme.bg} ${theme.border} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Mínim 6 caràcters"
                />
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className={`w-full ${theme.button} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity`}
              >
                {authScreen === 'login' ? 'Iniciar Sessió' : 'Crear Compte'}
              </button>
            </form>
          </div>

          <p className={`text-center text-sm ${theme.textSecondary}`}>
            {authScreen === 'login'
              ? "No tens compte? Registra&apos;t a dalt"
              : "Ja tens compte? Inicia sessió a dalt"}
          </p>
        </div>
      </div>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
        <div className="text-center">
          <BookOpen size={64} className={`mx-auto mb-4 ${theme.accent} animate-pulse`} />
          <p className="text-xl">Carregant dades...</p>
        </div>
      </div>
    );
  }

  // Compute playable URL for current audio
  const playableUrl = currentAudio ? getPlayableAudioUrl(currentAudio.url) : null;

  // Render current screen
  return (
    <div className="font-sans">
      {screen === 'home' && <HomeScreen />}
      {uploadType && <UploadScreen />}
      {screen === 'notes' && <NotesScreen />}
      {screen === 'reading' && <ReadingScreen />}
      {screen === 'tests' && <TestsScreen />}
      {screen === 'test-config' && <TestConfigScreen />}
      {screen === 'taking-test' && <TakingTestScreen />}
      {screen === 'test-results' && <TestResultsScreen />}
      {screen === 'audiobooks' && <AudioBooksScreen />}
      {screen === 'listening' && (
        <ListeningView
          theme={theme}
          isDark={isDark}
          currentAudio={currentAudio}
          audioRef={audioRef}
          playableUrl={playableUrl}
          onBack={() => {
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            setScreen('audiobooks');
          }}
          setIsPlaying={setIsPlaying}
          isPlaying={isPlaying}
          onTogglePlayPause={togglePlayPause}
          onSkipForward={skipForward}
          onSkipBackward={skipBackward}
        />
      )}
      {screen === 'stats' && <StatsScreen />}
      {screen === 'sharing' && <SharingScreen />}
      {screen === 'accept-invitation' && <AcceptInvitationScreen />}
    </div>
  );
}
