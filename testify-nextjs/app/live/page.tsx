'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { TranscriptEntry } from '@/types';
import { Room, RoomEvent, Track } from 'livekit-client';

function LiveSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { user, isAuthenticated, loading } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [heygenSessionId, setHeygenSessionId] = useState<string>('');
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [knowledgeBaseContent, setKnowledgeBaseContent] = useState<string>('');
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<string>('en-US');
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [showInterruptNotification, setShowInterruptNotification] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const heygenSessionIdRef = useRef<string>('');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('🔍 useEffect triggered:', { loading, isAuthenticated, sessionId, isInitializing: isInitializingRef.current });

    // Wait for auth to finish loading before doing anything
    if (loading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (!sessionId) {
      console.log('❌ No sessionId, redirecting to lobby');
      router.push('/lobby');
      return;
    }

    // Only initialize once - use a more robust check
    if (!isInitializingRef.current && !heygenSessionIdRef.current) {
      console.log('🚀 Starting initialization...');
      isInitializingRef.current = true;
      loadSession(); // Speech recognition will be initialized after session loads
      startTimer();
    } else {
      console.log('⏭️ Skipping initialization - already started');
    }

    // Cleanup function - only clean up timer and recognition
    // Room should stay connected until session ends
    return () => {
      console.log('🧹 Cleanup function called');
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      // DO NOT disconnect room here - it should stay connected
    };
  }, [loading, isAuthenticated, sessionId]);
  useEffect(() => {
    const audioEl = audioRef.current;

    if (!audioEl) {
      return;
    }

    audioEl.muted = isMuted;

    // Ensure volume is reset when unmuting
    if (!isMuted) {
      audioEl.volume = 1;
    }

    return () => {
      if (audioEl) {
        audioEl.muted = false;
      }
    };
  }, [isMuted]);

  // ---- Keyboard interrupt listener (ESC key) ----
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if ESC key is pressed (keyCode 27 or key 'Escape')
      if (event.key === 'Escape' || event.keyCode === 27) {
        console.log('🔑 [INTERRUPT] Escape key detected');

        // Don't interrupt if user is typing in a text input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          console.log('🔑 [INTERRUPT] User is typing in input, ignoring ESC key');
          return;
        }

        // Prevent default ESC behavior
        event.preventDefault();

        // Trigger interrupt
        handleInterrupt();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    console.log('🔑 [INTERRUPT] Keyboard listener attached');

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      console.log('🔑 [INTERRUPT] Keyboard listener removed');
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
  };

  const loadSession = async () => {
    try {
      console.log('📋 Loading session data for sessionId:', sessionId);

      // Try to get session from API first
      let sessionData = null;
      try {
        const response = await apiClient.get<any>(`/api/sessions/${sessionId}`);
        console.log('📊 Session API response:', response);

        if (response.success) {
          sessionData = response.session;
          console.log('✅ Session loaded from API:', sessionData);
        }
      } catch (apiError: any) {
        console.warn('⚠️ Failed to load from API, trying localStorage...', apiError.message);

        // Fallback to localStorage
        const storedSession = localStorage.getItem(`session_${sessionId}`);
        if (storedSession) {
          sessionData = JSON.parse(storedSession);
          console.log('✅ Session loaded from localStorage:', sessionData);
        } else {
          throw new Error('Session not found in API or localStorage');
        }
      }

      if (sessionData) {
        setSession(sessionData);

        // Set language from session
        const sessionLanguage = sessionData.language || 'en-US';
        setLanguage(sessionLanguage);
        console.log('🌍 Session language:', sessionLanguage);

        // Set knowledge base ID from session
        if (sessionData.knowledgeBaseId) {
          setKnowledgeBaseId(sessionData.knowledgeBaseId);
          console.log('📚 Knowledge Base ID set:', sessionData.knowledgeBaseId);
        }

        // Detect browser SpeechRecognition support
        const hasSpeechRecognition =
          typeof window !== 'undefined' &&
          (('webkitSpeechRecognition' in window) || 'SpeechRecognition' in window);

        setIsSpeechSupported(hasSpeechRecognition);

        if (hasSpeechRecognition) {
          // Initialize speech recognition with the correct language
          initializeSpeechRecognition(sessionLanguage);
        } else {
          console.warn(
            '⚠️ Browser does not support SpeechRecognition. Voice input will use Whisper transcription only.'
          );
        }

        // Proactively request microphone access so the user sees the permission prompt early
        await ensureMicrophoneAccess();

        // Initialize HeyGen session with knowledge base from session data
        await initializeHeyGenSession(
          sessionData.avatarId,
          sessionData.quality,
          sessionLanguage,
          sessionData.knowledgeBaseId
        );
      } else {
        throw new Error('Session data is null');
      }
    } catch (error: any) {
      console.error('❌ Failed to load session:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(`Failed to load session: ${error.message || 'Unknown error'}. Redirecting to lobby.`);
      isInitializingRef.current = false; // Reset on error so user can retry
      router.push('/lobby');
    }
  };

  const initializeHeyGenSession = async (avatarId: string, quality: string, language?: string, knowledgeId?: string) => {
    try {
      // Prevent duplicate session creation using ref (state is async)
      if (heygenSessionIdRef.current) {
        console.log('⚠️ HeyGen session already exists:', heygenSessionIdRef.current);
        return;
      }

      console.log('🎭 Initializing HeyGen session via backend...');
      if (language) {
        console.log('🌍 Using language:', language);
      }
      if (knowledgeId) {
        console.log('📚 Using Knowledge Base ID:', knowledgeId);
      }

      // Call the backend API to create a HeyGen session
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/heygen/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarId,
          quality,
          language,
          knowledgeId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Backend response:', data);

      if (data.success && data.data) {
        const { session_id, url, access_token } = data.data;

        // Set both state and ref immediately
        setHeygenSessionId(session_id);
        heygenSessionIdRef.current = session_id;

        console.log('✅ Session created:', session_id);
        console.log('📡 LiveKit URL:', url);

        // Connect to LiveKit
        await setupLiveKit(url, access_token, session_id, language, knowledgeId);
      } else {
        console.error('❌ Session creation failed:', data);
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (error: any) {
      console.error('Failed to initialize HeyGen session:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
      });
      // Show user-friendly error
      alert(`Failed to initialize avatar session: ${error.message}`);
    }
  };

  const setupLiveKit = async (url: string, accessToken: string, sessionId: string, sessionLanguage?: string, knowledgeId?: string) => {
    try {
      console.log('🎭 Setting up LiveKit connection...');
      console.log('📡 URL:', url);

      // Check if room already exists and is connected
      if (roomRef.current) {
        console.log('⚠️ Room already exists, disconnecting old room first...');
        await roomRef.current.disconnect();
        roomRef.current = null;
      }

      // Create LiveKit room
      const room = new Room();
      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('🎭 Track subscribed:', track.kind);

        if (track.kind === Track.Kind.Video && videoRef.current) {
          const element = track.attach();
          videoRef.current.srcObject = element.srcObject;
          setIsAvatarReady(true);
          console.log('✅ Video track attached to video element');
        }

        if (track.kind === Track.Kind.Audio && audioRef.current) {
          const element = track.attach();
          audioRef.current.srcObject = element.srcObject;
          audioRef.current.play().catch(e => console.error('Audio play error:', e));
          console.log('✅ Audio track attached to audio element');
        }
      });

      room.on(RoomEvent.Connected, () => {
        console.log('✅ LiveKit room connected');
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('❌ LiveKit room disconnected. Reason:', reason);
        console.log('❌ Disconnect reason details:', {
          reason,
          roomState: room.state,
          sessionId: heygenSessionId,
        });
        setIsAvatarReady(false);

        // Try to reconnect if not intentionally disconnected
        if (reason !== 0 && heygenSessionId) {
          console.log('🔄 Attempting to reconnect...');
          setTimeout(() => {
            if (roomRef.current && roomRef.current.state === 'disconnected') {
              console.log('🔄 Reconnecting to LiveKit room...');
              // Don't reconnect - this causes issues
              // Instead, just log the disconnect
            }
          }, 2000);
        }
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant connected:', participant.identity);
      });

      room.on(RoomEvent.Reconnecting, () => {
        console.log('🔄 LiveKit reconnecting...');
      });

      room.on(RoomEvent.Reconnected, () => {
        console.log('✅ LiveKit reconnected');
      });

      // Prepare connection (important: must be done before streaming.start)
      console.log('🔧 Preparing LiveKit connection...');
      await room.prepareConnection(url, accessToken);
      console.log('✅ LiveKit connection prepared');

      // Start HeyGen streaming
      console.log('🎬 Starting HeyGen streaming...');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const streamingResponse = await fetch(`${backendUrl}/api/heygen/session/${sessionId}/start-streaming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!streamingResponse.ok) {
        throw new Error(`Failed to start streaming: ${streamingResponse.status}`);
      }

      const streamingData = await streamingResponse.json();
      console.log('✅ Streaming started:', streamingData);

      // Connect to LiveKit room with proper options (like Flutter)
      console.log('🔌 Connecting to LiveKit room...');
      await room.connect(url, accessToken, {
        autoSubscribe: true,
      });
      console.log('✅ LiveKit room connected successfully');

      // Send initial greeting after connection (like Flutter does)
      console.log('👋 Sending initial greeting...');
      await sendInitialGreeting(sessionLanguage, sessionId, knowledgeId);

    } catch (error: any) {
      console.error('LiveKit setup error:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const sendInitialGreeting = async (greetingLanguage?: string, sessionId?: string, knowledgeId?: string) => {
    try {
      console.log('👋 Avatar starting with initial greeting...');
      console.log('🌍 Greeting language:', greetingLanguage || language);
      console.log('📚 Greeting Knowledge Base ID:', knowledgeId || knowledgeBaseId || '(none)');

      // Use the passed sessionId or fall back to state
      const activeSessionId = sessionId || heygenSessionId;
      if (!activeSessionId) {
        console.error('❌ No session ID available for greeting');
        return;
      }

      // Build conversation history (empty for first greeting)
      const conversationHistory = transcript.map((entry) => ({
        role: entry.speaker === 'user' ? 'user' : 'assistant',
        content: entry.text,
      }));

      // Generate initial greeting using LLM via backend (like Flutter does)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const llmResponse = await fetch(`${backendUrl}/api/llm/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello',
          conversationHistory,
          knowledgeBaseContent,
          knowledgeBaseId: knowledgeId || knowledgeBaseId, // Prefer explicit knowledgeId, fallback to state
          language: greetingLanguage || language, // Use parameter if provided, otherwise fall back to state
        }),
      });

      if (!llmResponse.ok) {
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();
      console.log('📊 LLM response:', llmData);

      if (llmData.success && llmData.response) {
        const greetingText = llmData.response;

        // Add greeting to transcript
        setTranscript((prev) => [
          ...prev,
          {
            id: `${Date.now()}_greeting`,
            timestamp: new Date().toISOString(),
            speaker: 'avatar',
            text: greetingText,
          },
        ]);

        // Make avatar speak the greeting
        console.log('🎤 Making avatar speak the greeting...');
        console.log('📋 Using session ID:', activeSessionId);
        const speakResponse = await fetch(`${backendUrl}/api/heygen/speak`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: activeSessionId,
            text: greetingText,
          }),
        });

        if (!speakResponse.ok) {
          const errorData = await speakResponse.json().catch(() => ({}));
          console.error('❌ Failed to make avatar speak greeting:', speakResponse.status);
          console.error('❌ Error details:', errorData);
        } else {
          console.log('✅ Avatar spoke greeting successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error sending initial greeting:', error);
    }
  };

  const initializeSpeechRecognition = (lang: string) => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang; // Use the language parameter
      console.log('🎤 Speech recognition initialized with language:', lang);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setCurrentMessage(transcript);

        if (event.results[event.results.length - 1].isFinal) {
          handleUserMessage(transcript);
          setCurrentMessage('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognition;
      console.log('✅ Speech recognition ready');
    } else {
      console.warn('⚠️ Speech recognition not supported in this browser');
    }
  };
  const ensureMicrophoneAccess = async (): Promise<MediaStream | null> => {
    if (mediaStreamRef.current) {
      return mediaStreamRef.current;
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia is not available in this environment');
      return null;
    }

    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Could not obtain microphone access:', error);
      alert(
        'Unable to access your microphone. Please allow microphone permissions in your browser settings and try again.'
      );
      return null;
    }
  };

  const startAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;

      const updateLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 100));

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      console.log('🎙️ Audio level monitoring started');
    } catch (error) {
      console.error('Error starting audio level monitoring:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    console.log('🎙️ Audio level monitoring stopped');
  };

  const transcribeRecordedAudio = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) {
      console.warn('No audio captured for transcription');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const formData = new FormData();
      // Backend Whisper route expects field name 'audio' (see backend/routes/whisper.js)
      formData.append('audio', audioBlob, 'speech.webm');

      console.log('Sending audio to Whisper for transcription...');
      const response = await fetch(`${backendUrl}/api/whisper/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Whisper API error response:', errorData);
        throw new Error(`Transcription failed with status ${response.status}: ${errorData.message || errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      const transcriptText: string = data?.data?.text || data?.transcript || '';

      if (!transcriptText.trim()) {
        console.warn('Whisper returned an empty transcript');
        return;
      }

      console.log('Whisper transcript:', transcriptText);
      await handleUserMessage(transcriptText);
    } catch (error) {
      console.error('Error during Whisper transcription:', error);
    }
  };



  const toggleRecording = async () => {
    console.log('🎛 toggleRecording called; isRecording:', isRecording);

    if (isRecording) {
      // Stop browser speech recognition (primary method)
      if (recognitionRef.current) {
        try {
          console.log('🛑 Stopping Web Speech API recognition...');
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }

      // Stop MediaRecorder if it is running (fallback)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('🛑 Stopping MediaRecorder fallback...');
        mediaRecorderRef.current.stop();
      }

      setIsRecording(false);
      return;
    }

    // PRIMARY METHOD: Use Web Speech API (browser native, no API key needed)
    if (recognitionRef.current) {
      try {
        console.log('🎤 Starting Web Speech API with language:', language);

        // Map language code to Web Speech API locale
        const localeMap: { [key: string]: string } = {
          'en': 'en-US',
          'en-US': 'en-US',
          'en-GB': 'en-GB',
          'id': 'id-ID',
          'hi': 'hi-IN',
          'es': 'es-ES',
          'fr': 'fr-FR',
          'de': 'de-DE',
          'pt': 'pt-BR',
          'zh': 'zh-CN',
          'ja': 'ja-JP',
          'ar': 'ar-SA',
        };

        const webSpeechLocale = localeMap[language] || language || 'en-US';
        recognitionRef.current.lang = webSpeechLocale;
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        let finalTranscript = '';

        recognitionRef.current.onstart = () => {
          console.log('✅ Web Speech API started listening');
          setInterimTranscript('');

          // Start audio level monitoring
          if (mediaStreamRef.current) {
            startAudioLevelMonitoring(mediaStreamRef.current);
          }
        };

        recognitionRef.current.onresult = (event: any) => {
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              console.log('✅ Final result:', transcript);
            } else {
              interim += transcript;
            }
          }

          // Update interim transcript display
          setInterimTranscript(interim);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('❌ Web Speech API error:', event.error);
          setInterimTranscript('');
        };

        recognitionRef.current.onend = () => {
          console.log('🛑 Web Speech API stopped');
          setInterimTranscript('');
          stopAudioLevelMonitoring();

          if (finalTranscript.trim()) {
            console.log('📤 Sending final transcript:', finalTranscript);
            handleUserMessage(finalTranscript.trim());
          }
        };

        recognitionRef.current.start();
        setIsRecording(true);
        console.log('✅ Web Speech API recording started');
        return;
      } catch (error) {
        console.error('❌ Error starting Web Speech API:', error);
      }
    }

    // FALLBACK METHOD: Use MediaRecorder + Whisper (if Web Speech API not available)
    console.log('⚠️ Web Speech API not available, falling back to MediaRecorder + Whisper');

    const stream = await ensureMicrophoneAccess();

    if (!stream) {
      console.warn('⚠️ No microphone stream available; cannot start recording');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      console.warn('MediaRecorder is not supported in this browser');
      alert('Your browser does not support audio recording. Try using a recent version of Chrome or Edge.');
      return;
    }

    try {
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped, sending audio to Whisper');
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await transcribeRecordedAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      console.log('🎙 MediaRecorder started (fallback)');
    } catch (error) {
      console.error('Failed to start MediaRecorder:', error);
      alert('Failed to start audio recording. Please check your browser microphone settings.');
      return;
    }

    setIsRecording(true);
  };

  const handleUserMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message to transcript
    const userEntry: TranscriptEntry = {
      id: `${Date.now()}_user`,
      timestamp: new Date().toISOString(),
      speaker: 'user',
      text: message,
    };
    setTranscript((prev) => [...prev, userEntry]);

    // Update conversation history
    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
    ];
    setConversationHistory(newHistory);

    try {
      // Get LLM response via backend (like Flutter does)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const llmResponse = await fetch(`${backendUrl}/api/llm/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: newHistory,
          knowledgeBaseContent,
          knowledgeBaseId, // Pass the HeyGen knowledge base ID to the LLM
          language, // Pass the language to LLM
        }),
      });

      if (!llmResponse.ok) {
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();

      if (llmData.success && llmData.response) {
        // Add AI response to transcript
        const aiEntry: TranscriptEntry = {
          id: `${Date.now()}_ai`,
          timestamp: new Date().toISOString(),
          speaker: 'avatar',
          text: llmData.response,
        };
        setTranscript((prev) => [...prev, aiEntry]);

        // Update conversation history
        setConversationHistory([
          ...newHistory,
          { role: 'assistant', content: llmData.response },
        ]);

        // Make avatar speak via backend
        if (heygenSessionId) {
          console.log('🎤 Making avatar speak with session:', heygenSessionId);
          const speakResponse = await fetch(`${backendUrl}/api/heygen/speak`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: heygenSessionId,
              text: llmData.response,
            }),
          });

          if (!speakResponse.ok) {
            console.error('❌ Failed to make avatar speak:', speakResponse.status);
          } else {
            console.log('✅ Avatar speak request sent successfully');
          }
        }
      }
    } catch (error) {
      console.error('Failed to process message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      handleUserMessage(currentMessage);
      setCurrentMessage('');
    }
  };

  // ---- Interrupt avatar on Escape key ----
  const handleInterrupt = async () => {
    console.log('⏹️ [INTERRUPT] Interrupt triggered via Escape key');
    console.log('⏹️ [INTERRUPT] Calling backend interrupt endpoint...');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/heygen/interrupt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('⏹️ [INTERRUPT] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('⏹️ [INTERRUPT] Backend response:', data);
        if (data.success) {
          console.log('✅ [INTERRUPT] Avatar interrupted successfully');
          // Show brief notification
          setShowInterruptNotification(true);
          setTimeout(() => setShowInterruptNotification(false), 500);
        } else {
          console.warn('⚠️ [INTERRUPT] Avatar interrupt returned false');
        }
      } else {
        console.error('❌ [INTERRUPT] Failed to interrupt avatar:', response.status);
      }
    } catch (error) {
      console.error('❌ [INTERRUPT] Error interrupting avatar:', error);
    }
  };

  const handleEndSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition on session end:', error);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        console.log('Stopping MediaRecorder on session end...');
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder on session end:', error);
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      // Disconnect LiveKit room
      if (roomRef.current) {
        roomRef.current.disconnect();
        console.log('🔌 LiveKit room disconnected');
      }

      // End HeyGen session via backend
      if (heygenSessionId) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        await fetch(`${backendUrl}/api/heygen/session/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Update session with transcript
      await apiClient.put(`/api/sessions/${sessionId}`, {
        transcript,
        endTime: new Date().toISOString(),
        duration: sessionTime,
      });

      // Analyze session
      const analysisResponse = await apiClient.post<any>('/api/analysis/session', {
        transcript,
        durationSeconds: sessionTime,
      });

      if (analysisResponse.success) {
        // Update session with report
        await apiClient.put(`/api/sessions/${sessionId}`, {
          report: analysisResponse.report,
        });
      }

      // Navigate to report
      router.push(`/report?sessionId=${sessionId}`);
    } catch (error) {
      console.error('Failed to end session:', error);
      router.push('/lobby');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-navy-900 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium text-brand-navy-900">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-brand-navy-900">{session.name}</h1>
              <p className="text-sm text-gray-600">Live Interview Session</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold text-brand-navy-900">
                {formatTime(sessionTime)}
              </div>
              <button
                onClick={handleEndSession}
                className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interrupt Notification */}
      {showInterruptNotification && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg animate-pulse z-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏹️</span>
            <span className="font-semibold">Avatar interrupted</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Avatar Video */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex items-center justify-center bg-black relative overflow-hidden">
            {!isAvatarReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                  <p className="font-medium">Initializing avatar...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            {/* Hidden audio element for avatar voice */}
            <audio
              ref={audioRef}
              autoPlay
              playsInline
              className="hidden"
            />
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col gap-4">
            {/* Recording Button with Visual Feedback */}
            <div className="flex gap-4 justify-center items-center">
              <button
                onClick={toggleRecording}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                    : 'bg-brand-navy-900 text-white hover:bg-brand-gold-500'
                }`}
              >
                {isRecording && (
                  <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse"></span>
                )}
                {isRecording ? '🎤 Recording...' : '🎤 Start Speaking'}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="px-8 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200"
              >
                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
            </div>

            {/* Audio Level Visualization */}
            {isRecording && (
              <div className="flex items-center gap-3 justify-center px-4 py-3 bg-red-50 rounded-xl border border-red-200">
                <span className="text-sm font-medium text-red-700">Audio Level:</span>
                <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden max-w-xs">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-red-700 w-8 text-right">
                  {Math.round(audioLevel)}%
                </span>
              </div>
            )}

            {/* Interim Transcription Display */}
            {isRecording && interimTranscript && (
              <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-xs font-medium text-blue-700 mb-1">🎤 Listening...</div>
                <div className="text-sm text-blue-900 italic">
                  {interimTranscript}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript Panel */}
        <div className="w-96 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-brand-navy-900 mb-4">💬 Transcript</h3>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    entry.speaker === 'user'
                      ? 'bg-brand-navy-900 text-white ml-4 shadow-md'
                      : 'bg-gray-100 text-gray-800 mr-4'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1 font-medium">
                    {entry.speaker === 'user' ? '👤 You' : '🤖 Interviewer'} •{' '}
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-sm leading-relaxed">{entry.text}</div>
                </div>
              ))}
              {isProcessing && (
                <div className="bg-gray-100 text-gray-800 mr-4 p-3 rounded-xl">
                  <div className="text-xs opacity-75 mb-1 font-medium">🤖 Interviewer</div>
                  <div className="text-sm">Thinking...</div>
                </div>
              )}
            </div>

            {/* Manual Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendMessage}
                disabled={isProcessing || !currentMessage.trim()}
                className="px-4 py-2 bg-brand-navy-900 text-white rounded-xl hover:bg-brand-gold-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LiveSessionContent />
    </Suspense>
  );
}

