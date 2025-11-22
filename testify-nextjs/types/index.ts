// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  lawFirm: string;
  uniqueCode: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  uniqueCode: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  name: string;
  avatarId: string;
  quality: 'low' | 'medium' | 'high';
  language?: string; // Language code for STT and TTS (e.g., 'en-US', 'hi-IN')
  knowledgeBaseId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  transcript: TranscriptEntry[];
  report?: SessionReportData;
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: 'user' | 'avatar';
  text: string;
  duration?: number;
}

// Session Report Types
export interface SessionReportData {
  overallScore: number; // 0-100
  metrics: {
    accuracy: number; // 0-100
    clarity: number; // 0-100
    tone: number; // 0-100 (Consistency/Composure)
    pace: number; // 0-100 (Completeness)
  };
  highlights: string[];
  recommendations: string[];
  durationSeconds?: number;
  summary?: string;
  flaggedSegments?: FlaggedSegment[];
}

export interface FlaggedSegment {
  time?: string;
  title?: string;
  snippet?: string;
  reason: string;
  text: string;
  timestamp: string;
}

// Knowledge Base Types
export interface KnowledgeBase {
  id: string;
  name: string;
  content: string;
  fileType: 'txt' | 'pdf' | 'docx';
  uploadedAt: string;
  characterCount: number;
}

// HeyGen Types
export interface HeyGenSession {
  sessionId: string;
  avatarId: string;
  quality: string;
  status: 'idle' | 'starting' | 'streaming' | 'ended';
  sdp?: string;
  iceServers?: RTCIceServer[];
}

export interface HeyGenAvatar {
  id: string;
  name: string;
}

// LLM Types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  message: string;
  conversationHistory?: LLMMessage[];
  knowledgeBaseContent?: string;
  knowledgeBaseId?: string;
  language?: string;
}

export interface LLMResponse {
  success: boolean;
  response?: string;
  error?: string;
  provider?: 'ytl-ilmu' | 'openai' | 'backend';
  timestamp?: string;
}

// Analysis Types
export interface AnalysisRequest {
  transcript: TranscriptEntry[];
  durationSeconds?: number;
}

export interface AnalysisResponse {
  success: boolean;
  report?: SessionReportData;
  error?: string;
}

// Whisper Types
export interface WhisperTranscription {
  text: string;
  segments?: WhisperSegment[];
  duration?: number;
  wordCount?: number;
  wordsPerMinute?: number;
}

export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Available Avatars
export const AVAILABLE_AVATARS: HeyGenAvatar[] = [
  { id: 'Dexter_Lawyer_Sitting_public', name: 'Dexter' },
  { id: 'Wayne_20240711', name: 'Wayne' },
  { id: 'Judy_Lawyer_Sitting2_public', name: 'Judy (Lawyer)' },
  { id: 'Judy_Teacher_Sitting_public', name: 'Judy (Teacher)' },
  { id: 'June_HR_public', name: 'June' },
  { id: 'Rika_Chair_Sitting_public', name: 'Rika' },
  { id: 'Marianne_Chair_Sitting_public', name: 'Marianne' },
];

