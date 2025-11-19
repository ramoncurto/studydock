'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Upload, BookOpen, FileText, Volume2, Play, Pause, CheckCircle, XCircle, ArrowLeft, Plus, Trash2, Sun, Moon, BarChart3, TrendingUp, Clock, Edit3, Check, X, Headphones, SkipBack, SkipForward, LogOut, Share2, Users, Copy, Link as LinkIcon, Target, Lightbulb, AlertTriangle, TrendingDown, ArrowRight, File, Sparkles, Home, Info } from 'lucide-react';
import { getAllNotes, getAllTests, addNote, addTest, updateNote, updateTest, deleteNote, deleteTest, addNoteSession, addTestAttempt, getAllNoteSessions, getAllTestAttempts, getAllAudioBooks, addAudioBook, updateAudioBook, deleteAudioBook, NoteSession, TestAttempt, AudioBook, createInvitation, getInvitation, acceptInvitation, getUserInvitations, getSharedAccess, revokeAccess, deleteInvitation, Invitation, SharedAccess, uploadTestImage, deleteTestImages, uploadAudioFile } from '@/lib/firebaseService';
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
  image?: {
    url: string;      // Firebase Storage download URL
    path: string;     // Storage path for deletion
    alt?: string;     // Optional alt text for accessibility
  };
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
      {/* Wider container for better audio player experience on desktop */}
      <div className="max-w-md lg:max-w-4xl mx-auto">
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

// New component for a more advanced audio upload experience
interface AudioUploadFormProps {
  theme: Theme;
  onUpload: (file: File, title: string) => Promise<void>;
  onBack: () => void;
}

function AudioUploadForm({ theme, onUpload, onBack }: AudioUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Automatically suggest a title based on the filename, without extension
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      // Check if it's an audio file
      if (droppedFile.type.startsWith('audio/')) {
        setFile(droppedFile);
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      } else {
        alert('Si us plau, puja només arxius d\'àudio (MP3, WAV, M4A, etc.).');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      alert('Si us plau, selecciona un arxiu i posa-li un títol.');
      return;
    }
    setIsUploading(true);
    try {
      await onUpload(file, title.trim());
      // onUpload success will trigger screen change in parent
    } catch (error) {
      console.error("Upload failed in form:", error);
      alert('Hi ha hagut un error en pujar l\'arxiu. Torna a intentar-ho.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-md lg:max-w-lg mx-auto">
        <button onClick={onBack} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
          <ArrowLeft size={20} />
          <span className="font-medium">Tornar</span>
        </button>

        <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>Pujar Àudio</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`p-8 border-2 border-dashed ${dragOver ? theme.accent : theme.border} rounded-xl text-center cursor-pointer transition-all ${dragOver ? 'bg-blue-500/10' : ''}`}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <Upload size={48} className={`${theme.textSecondary} mb-4`} />
                <p className="font-semibold">Arrossega i deixa anar un arxiu d&apos;àudio</p>
                <p className={`${theme.textSecondary} text-sm`}>o fes clic per seleccionar</p>
                <span className={`mt-4 px-4 py-2 text-sm font-semibold rounded-lg ${theme.buttonSecondary} border ${theme.border}`}>
                  Seleccionar Arxiu
                </span>
              </div>
            </label>
          </div>

          {file && (
            <div className={`p-4 rounded-xl ${theme.card} border ${theme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Volume2 size={24} className={theme.accent} />
                <div>
                  <p className="font-semibold truncate max-w-xs">{file.name}</p>
                  <p className={`text-sm ${theme.textSecondary}`}>{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className={`p-2 rounded-full ${theme.buttonSecondary} hover:text-rose-500`}
                aria-label="Remove file"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          <div>
            <label htmlFor="audio-title" className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
              Títol de l&apos;àudio
            </label>
            <input
              id="audio-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tema 1 - Introducció"
              className={`w-full px-4 py-3 rounded-xl ${theme.card} border ${theme.border} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full btn-primary p-4 rounded-xl mt-4`}
            disabled={!file || !title.trim() || isUploading}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Pujant...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Upload size={20} />
                <span>Pujar Àudio</span>
              </div>
            )}
          </button>
        </form>
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

  // Pomodoro timer state
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Theme colors - Professional neutral palette with improved dark mode contrast
  const theme = {
    bg: isDark ? 'bg-slate-900' : 'bg-neutral-50',
    text: isDark ? 'text-white' : 'text-neutral-900',
    textSecondary: isDark ? 'text-slate-100' : 'text-neutral-600',
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
    const prefersDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDark(prefersDark);
    // Ensure Tailwind dark: utilities respond to our toggle
    try {
      const root = document.documentElement;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    } catch {}
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

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = isDark ? '/edudock_white.svg' : '/edudock.svg';
    }
  }, [isDark]);

  // Save theme preference when it changes and sync <html> class
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    try {
      const root = document.documentElement;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    } catch {}
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
      else if (/\*\*.*\*\*|__.*__/g.test(trimmed)) {
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
      .replace(/==(.*? )==/g, '<span class="yellow-highlight">$1</span>')
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
      .replace(/\b(\d{1,2})	elefone(\d{1,2})	elefone(\d{4})\b/g, '<span class="date-ref">$1/$2/$3</span>')
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

      // Normalize metadata title for duplicate detection
      const metadataTitle = jsonNote.metadata?.title
        ? stripFormattingFromTitle(jsonNote.metadata.title)
        : '';
      const metadataTitleNorm = metadataTitle.toLowerCase();

      // Add metadata title only (no subject, topic, difficulty, or time)
      if (metadataTitle) {
        formatted.push({ type: 'h1', content: metadataTitle });
        formatted.push({ type: 'space', content: '' });
      }

      // Parse sections
      jsonNote.sections.forEach((section) => {
        // Section title - strip all formatting markers from titles
        const titleContent = stripFormattingFromTitle(section.title);
        const titleNorm = titleContent.toLowerCase();

        if (section.level === 1) {
          // Avoid duplicating top-level title if it matches metadata title
          if (!metadataTitleNorm || titleNorm !== metadataTitleNorm) {
            formatted.push({ type: 'h1', content: titleContent });
          }
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

  // Helper function to validate image files
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes

    if (!validFormats.includes(file.type)) {
      return { valid: false, error: `Format no vàlid: ${file.name}. Només JPG, PNG i WebP.` };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `Imatge massa gran: ${file.name}. Màxim 2MB.` };
    }

    return { valid: true };
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

    if (type === 'note') {
      // Handle note uploads (unchanged)
      for (const file of fileArray) {
        try {
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });

          await addNote(user!.uid, file.name, content);
          uploadedCount++;
        } catch (error) {
          console.error(`Error pujant ${file.name}:`, error);
          errorCount++;
          errors.push(file.name);
        }
      }
    } else if (type === 'test') {
      // Separate .txt files from image files
      const txtFiles = fileArray.filter(f => f.name.endsWith('.txt'));
      const imageFiles = fileArray.filter(f => !f.name.endsWith('.txt'));

      // Validate all image files first
      for (const imageFile of imageFiles) {
        const validation = validateImageFile(imageFile);
        if (!validation.valid) {
          errors.push(validation.error!); 
          errorCount++;
        }
      }

      // If there are validation errors, stop here
      if (errorCount > 0) {
        setIsLoading(false);
        alert(`Errors de validació:\n${errors.join('\n')}`);
        event.target.value = '';
        return;
      }

      // Process each .txt test file
      for (const file of txtFiles) {
        try {
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });

          // Parse test format: Q: question? IMG: image.jpg | alt text A: answer
          const lines = content.split('\n');

          interface TempQuestion {
            question: string;
            options: string[];
            correct: string;
            imageFilename?: string;  // Temporary storage for image filename
            imageAlt?: string;       // Optional alt text for image
          }

          const tempQuestions: TempQuestion[] = [];
          let currentQ: TempQuestion | null = null;

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('Q:')) {
              // Save previous question if it exists
              if (currentQ !== null) {
                if (currentQ.question && currentQ.correct && currentQ.options.length > 0) {
                  tempQuestions.push(currentQ);
                }
              }
              currentQ = { question: line.substring(2).trim(), options: [], correct: '' };
            } else if (trimmedLine.startsWith('IMG:') && currentQ !== null) {
              // Parse image reference: IMG: filename.jpg or IMG: filename.jpg | Alt text
              const imgContent = line.substring(4).trim();
              const pipeIndex = imgContent.indexOf('|');

              if (pipeIndex > 0) {
                // Has alt text
                currentQ.imageFilename = imgContent.substring(0, pipeIndex).trim();
                currentQ.imageAlt = imgContent.substring(pipeIndex + 1).trim();
              } else {
                // No alt text
                currentQ.imageFilename = imgContent;
              }
            } else if (trimmedLine.startsWith('A:') && currentQ !== null) {
              currentQ.correct = line.substring(2).trim();
            } else if (trimmedLine.startsWith('-') && currentQ !== null) {
              currentQ.options.push(line.substring(1).trim());
            }
          }

          // Save last question
          if (currentQ !== null) {
            if (currentQ.question && currentQ.correct && currentQ.options.length > 0) {
              tempQuestions.push(currentQ);
            }
          }

          if (tempQuestions.length === 0) {
            throw new Error('No s\'han trobat preguntes vàlides');
          }

          // Extract all image references from questions
          const imageRefs = tempQuestions
            .filter(q => q.imageFilename)
            .map(q => q.imageFilename!);

          // Check if all referenced images were uploaded
          const missingImages: string[] = [];
          for (const imgRef of imageRefs) {
            const found = imageFiles.find(f => f.name === imgRef);
            if (!found) {
              missingImages.push(imgRef);
            }
          }

          if (missingImages.length > 0) {
            throw new Error(
              `Imatges referenciades però no pujades:\n${missingImages.join(', ')}`
            );
          }

          // Upload images to Firebase Storage and get URLs
          const imageUploads: Map<string, { url: string; path: string }> = new Map();

          if (imageRefs.length > 0) {
            for (let i = 0; i < imageRefs.length; i++) {
              const imgFilename = imageRefs[i];
              const imgFile = imageFiles.find(f => f.name === imgFilename);

              if (imgFile) {
                try {
                  // Upload image and get URL
                  const result = await uploadTestImage(
                    user!.uid,
                    file.name,
                    imgFile,
                    imgFilename
                  );
                  imageUploads.set(imgFilename, result);
                } catch (error) {
                  console.error(`Error pujant imatge ${imgFilename}:`, error);
                  throw new Error(`Error pujant imatge: ${imgFilename}`);
                }
              }
            }
          }

          // Convert temp questions to final questions with image data
          const questions: Question[] = tempQuestions.map(tq => {
            const q: Question = {
              question: tq.question,
              options: tq.options,
              correct: tq.correct,
            };

            // Add image data if present
            if (tq.imageFilename && imageUploads.has(tq.imageFilename)) {
              const imageData = imageUploads.get(tq.imageFilename)!;
              q.image = {
                url: imageData.url,
                path: imageData.path,
                alt: tq.imageAlt,
              };
            }

            return q;
          });

          // Save test to Firebase with images
          await addTest(user!.uid, file.name, questions);
          uploadedCount++;
        } catch (error) {
          console.error(`Error pujant ${file.name}:`, error);
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : file.name;
          errors.push(errorMsg);
        }
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

  const handleAudioUpload = async (file: File, title: string) => {
    if (!user) {
      alert('Error: Has d\'estar autenticat per pujar arxius.');
      return;
    }

    try {
      // Step 1: Upload the file to Firebase Storage
      const { url, path } = await uploadAudioFile(user.uid, file, title);

      // Step 2: Add the audiobook metadata to Firestore
      await addAudioBook(user.uid, title, url, path);

      // Step 3: Reload audiobooks and update state
      const audioBooksData = await getAllAudioBooks(user.uid);
      setAudioBooks(audioBooksData);

      // Step 4: Show success and navigate
      alert(`L'àudio "${title}" s'ha pujat correctament!`);
      setUploadType(null); // Close upload screen
      setScreen('audiobooks'); // Go to audiobooks list

    } catch (error) {
      console.error('Error pujant l\'arxiu d\'àudio:', error);
      alert(`S'ha produït un error en pujar l'àudio. Si us plau, intenta-ho de nou.`);
      // Re-throw the error to be caught in the form if needed
      throw error;
    }
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
      await addAudioBook(user!.uid, title.trim(), audioUrl, '', relatedNote);

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
        {/* Responsive container: narrower on mobile, wider on desktop for grid layout */}
        <div className="max-w-md lg:max-w-6xl mx-auto">
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
              {/* Responsive title: larger on desktop */}
              <div className="flex items-center mb-2">
                <Image src={isDark ? "/edudock_white.svg" : "/edudock.svg"} alt="EduDock Logo" width={48} height={48} className="mr-4" />
                <h1 className={`text-4xl lg:text-5xl font-bold ${theme.text}`}>Edu<span style={{ color: '#6600ff' }}>Dock</span></h1>
              </div>
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


        {/* Responsive grid: single column on mobile, 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          <button
            onClick={() => setScreen('pomodoro')}
            className={`w-full card-hover p-5 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Clock size={24} className={theme.accent} />
            </div>
            <div className="text-left flex-1">
              <div className={`font-semibold text-lg ${theme.text}`}>Pomodoro Timer</div>
              <div className={`text-sm ${theme.textSecondary}`}>Gestiona el teu temps d&apos;estudi</div>
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
  const UploadScreen = () => {
    if (uploadType === 'audio') {
      return (
        <AudioUploadForm
          theme={theme}
          onUpload={handleAudioUpload}
          onBack={() => setUploadType(null)}
        />
      );
    }

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        {/* Compact centered layout for upload modal-style screen */}
        <div className="max-w-md lg:max-w-lg mx-auto">
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
                  <div className={`text-sm ${theme.textSecondary}`}>Arxius .txt + imatges (JPG, PNG, WebP)</div>
                </div>
              </div>
              <input
                type="file"
                accept=".txt,.jpg,.jpeg,.png,.webp"
                multiple
                onChange={(e) => handleFileUpload(e, 'test')}
                className="hidden"
              />
            </label>

            <label className="block">
              <div
                className="card-hover p-5 cursor-pointer flex items-center gap-4 transition-all"
                onClick={() => setUploadType('audio')}
              >
                <div className={`p-3 rounded-xl ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
                  <Upload size={24} className={theme.accent} />
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-semibold text-base ${theme.text}`}>Pujar Àudio</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Arxius MP3, WAV, M4A, etc. (directament)</div>
                </div>
              </div>
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
  };

  // Notes List Screen
  const NotesScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      {/* Wider container for list view with responsive grid */}
      <div className="max-w-md lg:max-w-6xl mx-auto">
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
          // Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    if (screen === 'reading' && currentNote && user) {
      // Start tracking time
      const startTime = Date.now();
      setReadingStartTime(startTime);

      return () => {
        // When leaving reading screen, save session
        const duration = Math.floor((Date.now() - startTime) / 1000); // in seconds
        if (duration > 5) { // Only save if read for more than 5 seconds
          addNoteSession(
            user.uid,
            currentNote.title,
            new Date(startTime).toLocaleTimeString('ca-ES'),
            duration
          ).then(() => {
            // Reload sessions
            getAllNoteSessions(user.uid).then(setNoteSessions);
          }).catch(error => {
            console.error('Error desant sessió d\'apunts:', error);
          });
        }
      };
    }
  }, [screen, currentNote, user]);

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
      }

      return () => {
        if (element) {
          element.removeEventListener('scroll', handleScroll);
        }
      };
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
        {/* Wider container for optimal reading experience on desktop */}
        <div className="max-w-md lg:max-w-4xl mx-auto">
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

          {/* Only show audio button if there's a related audiobook */}
          {relatedAudio && (
            <div className="mb-6">
              <button
                onClick={() => playAudio(relatedAudio)}
                className="w-full btn-primary p-4 rounded-xl"
              >
                <Headphones size={20} />
                <span className="font-semibold">Escoltar Àudio</span>
              </button>
            </div>
          )}

          {/* Responsive padding: more spacious on desktop for better reading */}
          <div ref={contentRef} className={`${theme.card} p-6 lg:p-8 rounded-2xl max-h-[70vh] overflow-y-auto border-2 ${theme.border} shadow-lg`}>
            {formattedContent.map((item, idx) => {
              if (item.type === 'h1') {
                return (
                  <h1 key={idx} className="text-2xl lg:text-3xl font-bold mb-4 mt-6 first:mt-0">
                    {item.content}
                  </h1>
                );
              }
              if (item.type === 'h2') {
                return (
                  <h2 key={idx} className="text-xl lg:text-2xl font-bold mb-3 mt-5">
                    {item.content}
                  </h2>
                );
              }
              if (item.type === 'h3') {
                return (
                  <h3 key={idx} className={`text-lg lg:text-xl font-semibold mb-2 mt-4 ${theme.accent}`}>
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
      {/* Wider container for list view with responsive grid */}
      <div className="max-w-md lg:max-w-6xl mx-auto">
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
          // Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <div className={`text-sm ${theme.textSecondary} ml-8`}>{test.date}</div>
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
    const [numQuestions, setNumQuestions] = useState(10);
    const maxQuestions = selectedTestForConfig?.id === -1
      ? tests.reduce((sum, test) => sum + test.questions.length, 0)
      : selectedTestForConfig?.questions.length || 0;

    const handleStart = () => {
      if (selectedTestForConfig) {
        startTest(selectedTestForConfig, Math.min(numQuestions, maxQuestions));
      }
    };

    if (!selectedTestForConfig) return null;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <div className="card p-8">
            <div className="text-center mb-8">
              <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${isDark ? 'bg-primary-900/30' : 'bg-primary-100'} flex items-center justify-center`}>
                <Target size={64} className={theme.accent} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>{selectedTestForConfig.title}</h2>
              <p className={`${theme.textSecondary}`}>Total de preguntes: {maxQuestions}</p>
            </div>

            <div className="mb-6">
              <label htmlFor="num-questions" className="block text-sm font-medium mb-2">
                Número de preguntes
              </label>
              <input
                id="num-questions"
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
                min="1"
                max={maxQuestions}
                className={`w-full px-4 py-3 rounded-xl ${theme.card} border ${theme.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <input
                type="range"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                min="1"
                max={maxQuestions}
                className="w-full mt-3 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${isDark ? '#0284c7' : '#0284c7'} 0%, ${isDark ? '#0284c7' : '#0284c7'} ${((numQuestions - 1) / (maxQuestions - 1)) * 100}% , ${isDark ? '#262626' : '#e5e5e5'} ${((numQuestions - 1) / (maxQuestions - 1)) * 100}%, ${isDark ? '#262626' : '#e5e5e5'} 100%)`
                }}
              />
            </div>

            <button
              onClick={handleStart}
              className="w-full btn-primary p-4 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Play size={20} />
              Començar Test
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Taking Test Screen
  const TakingTestScreen = () => {
    if (!currentTest) return null;

    const currentQ = currentTest.questions[testProgress.current];
    const progress = ((testProgress.current) / currentTest.questions.length) * 100;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md lg:max-w-4xl mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">{currentTest.title}</span>
              <span className="text-sm font-semibold">{testProgress.current + 1} / {currentTest.questions.length}</span>
            </div>
            <div className={`w-full h-2 ${theme.progressBar} rounded-full`}>
              <div
                className={`h-full ${theme.progressFill} rounded-full transition-all duration-300 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className={`card p-6 mb-6`}>
            <h3 className={`text-xl font-semibold ${theme.text} mb-4`}>
              {currentQ.question}
            </h3>

            {/* Render image if present */}
            {currentQ.image && (
              <div className="mt-6 flex justify-center">
                <div className="relative max-w-full md:max-w-2xl w-full">
                  <Image
                    src={currentQ.image.url}
                    alt={currentQ.image.alt || "Imatge de la pregunta"}
                    width={800}
                    height={600}
                    layout="responsive"
                    className="rounded-lg shadow-md"
                  />
                  {/* Error fallback (hidden by default) */}
                  <div
                    className="image-error hidden text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No s&apos;ha pogut carregar la imatge
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                      ? 'bg-white/30 text-white'
                      : isDark ? 'bg-blue-500/90 text-white' : 'bg-primary-600 text-white'
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

  // Test Results Screen
  const TestResultsScreen = () => {
    if (!currentTest) return null;

    const score = testProgress.answers.filter(a => a.isCorrect).length;
    const total = currentTest.questions.length;
    const percentage = Math.round((score / total) * 100);

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md lg:max-w-4xl mx-auto">
          <button onClick={() => setScreen('tests')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <div className="card p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Resultats del Test</h2>
            <p className={`${theme.textSecondary} mb-6`}>{currentTest.title}</p>

            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  className={theme.progressBar}
                  fill="none"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  className={theme.progressFill}
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={`${percentage}, 100`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="text-4xl font-bold">{percentage}%</div>
                <div className={`${theme.textSecondary} text-sm`}>{score} / {total}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="font-semibold">Respostes correctes: {score}</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <div className="flex items-center justify-center gap-2">
                  <XCircle size={20} className="text-red-500" />
                  <span className="font-semibold">Respostes incorrectes: {total - score}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setScreen('tests')}
              className="mt-8 w-full btn-secondary"
            >
              Tornar als Tests
            </button>
          </div>
        </div>
      </div>
    );
  };

  // AudioBooks List Screen
  const AudioBooksScreen = () => (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      {/* Wider container for list view with responsive grid */}
      <div className="max-w-md lg:max-w-6xl mx-auto">
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
          // Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        placeholder="Nom de l&apos;àudio"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className={theme.accent} />
                      <input
                        type="text"
                        value={editingAudioUrl}
                        onChange={(e) => setEditingAudioUrl(e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.bg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm`}
                        placeholder="URL de l&apos;àudio"
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

  // Stats Screen
  const StatsScreen = () => {
    const totalStudyTime = noteSessions.reduce((acc, s) => acc + s.duration, 0);
    const avgTestScore = testAttempts.length > 0
      ? testAttempts.reduce((acc, a) => acc + a.percentage, 0) / testAttempts.length
      : 0;

    // Last 7 days study trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('es-ES');
    }).reverse();

    const studyTimeByDay = last7Days.map(day => {
      const sessionsOnDay = noteSessions.filter(s => s.date === day);
      return sessionsOnDay.reduce((total, s) => total + s.duration, 0) / 60; // in minutes
    });

    const maxStudyTime = Math.max(...studyTimeByDay);

    const testScoresByDay = last7Days.map(day => {
      const attemptsOnDay = testAttempts.filter(a => a.date === day);
      if (attemptsOnDay.length === 0) return null;
      return attemptsOnDay.reduce((sum, a) => sum + a.percentage, 0) / attemptsOnDay.length;
    });

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md lg:max-w-4xl mx-auto">
          <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
            Estadístiques
          </h2>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className={`card p-6`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <Clock size={24} className={theme.accent} />
                </div>
                <div>
                  <div className={`text-sm ${theme.textSecondary}`}>Temps total d&apos;estudi</div>
                  <div className="text-2xl font-bold">{Math.floor(totalStudyTime / 60)} min</div>
                </div>
              </div>
            </div>
            <div className={`card p-6`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                  <TrendingUp size={24} className="text-emerald-500" />
                </div>
                <div>
                  <div className={`text-sm ${theme.textSecondary}`}>Puntuació mitjana</div>
                  <div className="text-2xl font-bold">{avgTestScore.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Study time chart */}
          <div className="card p-6 mb-8">
            <h3 className="font-semibold mb-4">Temps d&apos;estudi (últims 7 dies)</h3>
            <div className="flex justify-between items-end h-48">
              {studyTimeByDay.map((time, idx) => (
                <div key={idx} className="flex flex-col items-center w-1/7">
                  <div
                    className="w-8 rounded-t-lg bg-blue-500"
                    style={{ height: `${maxStudyTime > 0 ? (time / maxStudyTime) * 100 : 0}%` }}
                    title={`${time.toFixed(0)} min`}
                  />
                  <div className={`text-xs mt-2 ${theme.textSecondary}`}>
                    {last7Days[idx].split('/')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test scores chart */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Puntuació de tests (últims 7 dies)</h3>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 200 50">
                {/* Horizontal lines */}
                {[0, 25, 50, 75, 100].map(y => (
                  <line key={y} x1="0" y1={50 - y / 2} x2="200" y2={50 - y / 2} stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth="0.5" />
                ))}
                {/* Data line */}
                <path
                  d={testScoresByDay.map((score, idx, arr) => {
                    const x = (200 / 6) * idx;
                    const y = score !== null ? 50 - score / 2 : (arr[idx - 1] !== null ? 50 - arr[idx - 1]! / 2 : 50);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  stroke={theme.accent}
                  strokeWidth="1.5"
                  fill="none"
                />
                {/* Data points */}
                {testScoresByDay.map((score, idx) => score !== null && (
                  <circle key={idx} cx={(200 / 6) * idx} cy={50 - score / 2} r="2" fill={theme.accent} />
                ))}
              </svg>
            </div>
            <div className="flex justify-between mt-2">
              {last7Days.map((day, idx) => (
                <div key={idx} className={`text-xs ${theme.textSecondary}`}>
                  {day.split('/')[0]}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const PomodoroTimer = () => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => setPomodoroRunning(true);
    const pauseTimer = () => setPomodoroRunning(false);
    const resetTimer = () => {
      setPomodoroRunning(false);
      setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
    };

    const switchMode = () => {
      setPomodoroMode(prevMode => {
        const newMode = prevMode === 'work' ? 'break' : 'work';
        setPomodoroTime(newMode === 'work' ? 25 * 60 : 5 * 60);
        return newMode;
      });
      setPomodoroRunning(false);
    };

    useEffect(() => {
      if (pomodoroRunning) {
        pomodoroIntervalRef.current = setInterval(() => {
          setPomodoroTime(prevTime => prevTime > 0 ? prevTime - 1 : 0);
        }, 1000);
      } else if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }

      return () => {
        if (pomodoroIntervalRef.current) {
          clearInterval(pomodoroIntervalRef.current);
        }
      };
    }, [pomodoroRunning]);

    const progress = pomodoroMode === 'work'
      ? ((25 * 60 - pomodoroTime) / (25 * 60)) * 100
      : ((5 * 60 - pomodoroTime) / (5 * 60)) * 100;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              setPomodoroRunning(false);
              setScreen('home');
            }}
            className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <div className="card p-8">
            <div className="text-center mb-8">
              <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${isDark ? 'bg-primary-900/30' : 'bg-primary-100'} flex items-center justify-center`}>
                <Clock size={64} className={theme.accent} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>Pomodoro Timer</h2>
              <div className={`inline-block px-4 py-2 rounded-full ${pomodoroMode === 'work' ? (isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700') : (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')}`}>
                {pomodoroMode === 'work' ? 'Temps de Treball' : 'Temps de Descans'}
              </div>
            </div>

            <div className="mb-8">
              <div className={`text-7xl font-bold text-center mb-4 ${theme.text}`}>
                {formatTime(pomodoroTime)}
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#262626' : '#e5e5e5' }}>
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: pomodoroMode === 'work' ? (isDark ? '#3b82f6' : '#2563eb') : (isDark ? '#10b981' : '#059669')
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 justify-center">
                {!pomodoroRunning ? (
                  <button
                    onClick={startTimer}
                    className={`flex-1 ${theme.button} p-4 rounded-xl font-semibold flex items-center justify-center gap-2`}
                  >
                    <Play size={20} />
                    Iniciar
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className={`flex-1 ${theme.button} p-4 rounded-xl font-semibold flex items-center justify-center gap-2`}
                  >
                    <Pause size={20} />
                    Pausar
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className={`flex-1 ${theme.buttonSecondary} border p-4 rounded-xl font-semibold`}
                >
                  Reiniciar
                </button>
              </div>
              <button
                onClick={switchMode}
                className={`w-full ${theme.buttonSecondary} border p-4 rounded-xl font-semibold`}
              >
                {pomodoroMode === 'work' ? 'Canviar a Descans (5 min)' : 'Canviar a Treball (25 min)'}
              </button>
            </div>

            <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-neutral-100'}`}>
              <h3 className={`font-semibold mb-2 ${theme.text}`}>Tècnica Pomodoro</h3>
              <ul className={`text-sm ${theme.textSecondary} space-y-1`}>
                <li>• 25 minuts de treball concentrat</li>
                <li>• 5 minuts de descans</li>
                <li>• Després de 4 cicles, descans llarg de 15-30 min</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sharing Screen
  const SharingScreen = () => {
    const [invitationCode, setInvitationCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isRevoking, setIsRevoking] = useState<string | null>(null);

    const handleCreateInvitation = async () => {
      if (!user) return;
      setIsCreating(true);
      try {
        const code = await createInvitation(user.uid, user.email!);
        setInvitationCode(code);
        // Reload user invitations
        const invitations = await getUserInvitations(user.uid);
        setUserInvitations(invitations);
      } catch (error) {
        console.error('Error creating invitation:', error);
        setSharingMessage('Error en crear la invitació');
      } finally {
        setIsCreating(false);
      }
    };

    const handleRevokeAccess = async (guestId: string) => {
      if (!user) return;
      setIsRevoking(guestId);
      try {
        await revokeAccess(user.uid, guestId);
        // Update UI
        setSharedAccess(prev => prev.filter(sa => sa.ownerId !== user.uid)); // This is incorrect, should be guestId
        setSharingMessage('Accés revocat correctament');
      } catch (error) {
        console.error('Error revoking access:', error);
        setSharingMessage('Error en revocar l\'accés');
      } finally {
        setIsRevoking(null);
      }
    }

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setSharingMessage('Codi copiat al porta-retalls!');
        setTimeout(() => setSharingMessage(''), 2000);
      });
    };

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md lg:max-w-4xl mx-auto">
          <button onClick={() => setScreen('home')} className={`mb-6 flex items-center gap-2 ${theme.textSecondary} hover:${theme.text} transition`}>
            <ArrowLeft size={20} />
            <span className="font-medium">Tornar</span>
          </button>

          <h2 className={`text-3xl font-bold mb-6 ${theme.text}`}>
            Compartir Materials
          </h2>

          {sharingMessage && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              {sharingMessage}
            </div>
          )}

          {/* Section to create and view invitations */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Les Meves Invitacions</h3>
            <p className={`${theme.textSecondary} text-sm mb-4`}>
              Crea un codi per donar accés a altres usuaris als teus materials.
            </p>
            <button
              onClick={handleCreateInvitation}
              disabled={isCreating}
              className="btn-primary w-full mb-4"
            >
              {isCreating ? 'Creant...' : 'Crear Nova Invitació'}
            </button>

            {userInvitations.length > 0 && (
              <div className="space-y-3">
                {userInvitations.map(inv => (
                  <div key={inv.code} className={`p-4 rounded-lg border ${theme.border}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-lg">{inv.code}</span>
                      <button onClick={() => copyToClipboard(`${window.location.origin}?invite=${inv.code}`)}>
                        <Copy size={18} />
                      </button>
                    </div>
                    <div className={`text-xs ${theme.textSecondary} mt-2`}>
                      Creat: {inv.createdAt} | Caduca: {inv.expiresAt} | Usos: {inv.usedBy?.length || 0}/{inv.maxUses}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section to accept an invitation */}
          <div className="card p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Accedir a Materials Compartits</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationCodeInput}
                onChange={(e) => setInvitationCodeInput(e.target.value)}
                placeholder="Introdueix un codi d'invitació"
                className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.bg}`}
              />
              <button
                onClick={async () => {
                  const inv = await getInvitation(invitationCodeInput);
                  if (inv) {
                    setPendingInvitation(inv);
                    setScreen('accept-invitation');
                  } else {
                    setSharingMessage('Invitació no vàlida o caducada');
                  }
                }}
                className="btn-secondary"
              >
                Accedir
              </button>
            </div>
          </div>

          {/* Section to manage shared access */}
          {sharedAccess.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Materials a què tinc accés</h3>
              <div className="space-y-3">
                {sharedAccess.map(sa => (
                  <div key={sa.ownerId} className={`p-4 rounded-lg border ${theme.border} flex justify-between items-center`}>
                    <p>{sa.ownerEmail}</p>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        const [notes, tests, audiobooks] = await Promise.all([
                          getAllNotes(sa.ownerId),
                          getAllTests(sa.ownerId),
                          getAllAudioBooks(sa.ownerId),
                        ]);
                        setNotes(notes);
                        setTests(tests);
                        setAudioBooks(audiobooks);
                        setViewingOwnerId(sa.ownerId);
                        setIsReadOnlyMode(true);
                        setScreen('home');
                        setIsLoading(false);
                      }}
                      className="btn-secondary"
                    >
                      Veure
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AcceptInvitationScreen = () => {
    if (!pendingInvitation) return null;

    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Acceptar Invitació</h2>
            <p className={`${theme.textSecondary} mb-6`}>
              Has estat convidat per <span className="font-semibold">{pendingInvitation.ownerEmail}</span> a accedir als seus materials d&apos;estudi.
            </p>
            <button
              onClick={async () => {
                if (user) {
                  const success = await acceptInvitation(pendingInvitation.code, user.uid, user.email!);
                  if (success) {
                    setSharingMessage('Accés concedit!');
                    // Reload shared access
                    const access = await getSharedAccess(user.uid);
                    setSharedAccess(access);
                    setScreen('sharing');
                  } else {
                    setSharingMessage('No s\'ha pogut acceptar la invitació.');
                    setScreen('sharing');
                  }
                }
              }}
              className="btn-primary w-full mb-2"
            >
              Acceptar i Accedir
            </button>
            <button
              onClick={() => {
                setPendingInvitation(null);
                setScreen('home');
              }}
              className="btn-secondary w-full"
            >
              Cancel·lar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render logic
  let content;
  switch (screen) {
    case 'notes':
      content = <NotesScreen />;
      break;
    case 'reading':
      content = <ReadingScreen />;
      break;
    case 'tests':
      content = <TestsScreen />;
      break;
    case 'test-config':
      content = <TestConfigScreen />;
      break;
    case 'taking-test':
      content = <TakingTestScreen />;
      break;
    case 'test-results':
      content = <TestResultsScreen />;
      break;
    case 'audiobooks':
      content = <AudioBooksScreen />;
      break;
    case 'listening':
      content = <ListeningView
        theme={theme}
        isDark={isDark}
        currentAudio={currentAudio}
        audioRef={audioRef}
        playableUrl={currentAudio ? getPlayableAudioUrl(currentAudio.url) : null}
        onBack={() => setScreen('audiobooks')}
        setIsPlaying={setIsPlaying}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        onSkipForward={skipForward}
        onSkipBackward={skipBackward}
      />;
      break;
    case 'stats':
      content = <StatsScreen />;
      break;
    case 'pomodoro':
      content = <PomodoroTimer />;
      break;
    case 'sharing':
      content = <SharingScreen />;
      break;
    case 'accept-invitation':
      content = <AcceptInvitationScreen />;
      break;
    default:
      content = <HomeScreen />;
  }

  // Auth handlers
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
          <Image src={isDark ? "/edudock_white.svg" : "/edudock.svg"} alt="EduDock Logo" width={64} height={64} className="mb-4" />
          <div className="text-xl font-bold mb-2">Edu<span style={{ color: '#6600ff' }}>Dock</span></div>
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
            <Image src={isDark ? "/edudock_white.svg" : "/edudock.svg"} alt="EduDock Logo" width={96} height={96} className="mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">Edu<span style={{ color: '#6600ff' }}>Dock</span></h1>
            <p className={theme.textSecondary}>La teva app d&apos;estudi</p>
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
              ? "No tens compte? Registra't a dalt"
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
          <Image src={isDark ? "/edudock_white.svg" : "/edudock.svg"} alt="EduDock Logo" width={64} height={64} className="mb-4" />
          <div className="text-xl font-bold mb-2">Edu<span style={{ color: '#6600ff' }}>Dock</span></div>
          <div className={`text-sm ${theme.textSecondary}`}>Carregant...</div>
        </div>
      </div>
    );
  }

  return (
    <main>
      {uploadType === 'upload' ? <UploadScreen /> : content}
    </main>
  );
}