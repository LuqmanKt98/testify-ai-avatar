'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { AVAILABLE_AVATARS } from '@/types';

const LANGUAGES = [
  { name: 'Bulgarian', code: 'bg-BG' },
  { name: 'Chinese', code: 'zh-CN' },
  { name: 'Czech', code: 'cs-CZ' },
  { name: 'Danish', code: 'da-DK' },
  { name: 'Dutch', code: 'nl-NL' },
  { name: 'English', code: 'en-US' },
  { name: 'Finnish', code: 'fi-FI' },
  { name: 'French', code: 'fr-FR' },
  { name: 'German', code: 'de-DE' },
  { name: 'Greek', code: 'el-GR' },
  { name: 'Hindi', code: 'hi-IN' },
  { name: 'Hungarian', code: 'hu-HU' },
  { name: 'Indonesian', code: 'id-ID' },
  { name: 'Italian', code: 'it-IT' },
  { name: 'Japanese', code: 'ja-JP' },
  { name: 'Korean', code: 'ko-KR' },
  { name: 'Malay', code: 'ms-MY' },
  { name: 'Norwegian', code: 'no-NO' },
  { name: 'Polish', code: 'pl-PL' },
  { name: 'Portuguese', code: 'pt-PT' },
  { name: 'Romanian', code: 'ro-RO' },
  { name: 'Russian', code: 'ru-RU' },
  { name: 'Slovak', code: 'sk-SK' },
  { name: 'Spanish', code: 'es-ES' },
  { name: 'Swedish', code: 'sv-SE' },
  { name: 'Turkish', code: 'tr-TR' },
  { name: 'Ukrainian', code: 'uk-UA' },
  { name: 'Vietnamese', code: 'vi-VN' },
];

export default function SessionConfigPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [sessionName, setSessionName] = useState('');
  const [avatarId, setAvatarId] = useState(AVAILABLE_AVATARS[0].id);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [language, setLanguage] = useState('en-US');
  const [file, setFile] = useState<File | null>(null);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false);
  const [knowledgeBasesError, setKnowledgeBasesError] = useState<string>('');

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch knowledge bases on component mount
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        setLoadingKnowledgeBases(true);
        setKnowledgeBasesError('');

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/heygen/knowledge-base/list`);

        if (!response.ok) {
          throw new Error(`Failed to fetch knowledge bases: ${response.status}`);
        }

        const data = await response.json();
        console.log('📚 Knowledge bases fetched:', data);

        if (data.success && Array.isArray(data.data)) {
          setKnowledgeBases(data.data);
          console.log(`✅ Loaded ${data.data.length} knowledge bases`);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        console.error('❌ Error fetching knowledge bases:', error);
        setKnowledgeBasesError(error.message || 'Failed to load knowledge bases');
      } finally {
        setLoadingKnowledgeBases(false);
      }
    };

    fetchKnowledgeBases();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['txt', 'pdf', 'docx'].includes(fileType || '')) {
        setError('Only TXT, PDF, and DOCX files are supported');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let kbId = knowledgeBaseId;

      // Upload knowledge base if file is selected
      if (file) {
        setUploadProgress('Uploading knowledge base...');
        const uploadResult = await apiClient.uploadFile<any>(
          '/api/knowledge-base/upload',
          file
        );

        if (uploadResult.success) {
          kbId = uploadResult.knowledgeBase.id;
        } else {
          throw new Error('Failed to upload knowledge base');
        }
      }

      // Create session
      setUploadProgress('Creating session...');
      console.log('📝 Creating session with data:', {
        userId: user?.id,
        name: sessionName || `Session ${new Date().toLocaleDateString()}`,
        avatarId,
        quality,
        language,
        knowledgeBaseId: kbId,
      });

      const sessionResult = await apiClient.post<any>('/api/sessions', {
        userId: user?.id,
        name: sessionName || `Session ${new Date().toLocaleDateString()}`,
        avatarId,
        quality,
        language,
        knowledgeBaseId: kbId,
      });

      console.log('✅ Session created:', sessionResult);

      if (sessionResult.success) {
        // Store session in localStorage as backup
        localStorage.setItem(`session_${sessionResult.session.id}`, JSON.stringify(sessionResult.session));
        console.log('💾 Session stored in localStorage');

        // Navigate to live session
        router.push(`/live?sessionId=${sessionResult.session.id}`);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand-navy-900 tracking-tight">Configure Session</h1>
          <button
            onClick={() => router.push('/lobby')}
            className="px-4 py-2 text-sm font-semibold text-brand-navy-900 hover:text-brand-gold-500 transition-colors rounded-xl hover:bg-gray-100"
          >
            ← Back to Lobby
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleStartSession} className="space-y-6">
          {/* Session Name */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label htmlFor="sessionName" className="block text-sm font-semibold text-gray-700 mb-3">
              Session Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id="sessionName"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Case #123 Practice"
            />
          </div>

          {/* Avatar Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label htmlFor="avatar" className="block text-sm font-semibold text-gray-700 mb-3">
              Select Avatar
            </label>
            <select
              id="avatar"
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
            >
              {AVAILABLE_AVATARS.map((avatar) => (
                <option key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quality Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Stream Quality
            </label>
            <div className="flex gap-4">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <label key={q} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="quality"
                    value={q}
                    checked={quality === q}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="w-4 h-4 text-brand-navy-900 border-gray-300 focus:ring-brand-navy-900 focus:ring-2"
                  />
                  <span className="ml-2 capitalize text-gray-700 group-hover:text-brand-navy-900 transition-colors font-medium">
                    {q}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label htmlFor="language" className="block text-sm font-semibold text-gray-700 mb-3">
              Select Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Avatar will speak and understand in the selected language
            </p>
          </div>

          {/* Knowledge Base Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label htmlFor="knowledgeBase" className="block text-sm font-semibold text-gray-700 mb-3">
              📚 Select Knowledge Base <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            {loadingKnowledgeBases ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-navy-900 border-t-transparent"></div>
                <span className="text-sm">Loading knowledge bases...</span>
              </div>
            ) : knowledgeBasesError ? (
              <div className="px-4 py-3 bg-red-50 rounded-xl text-red-600 text-sm border border-red-200">
                ⚠️ {knowledgeBasesError}
              </div>
            ) : (
              <>
                <select
                  id="knowledgeBase"
                  value={knowledgeBaseId}
                  onChange={(e) => setKnowledgeBaseId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Knowledge Base...</option>
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={kb.id}>
                      {kb.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-2">
                  Choose a pre-built knowledge base to guide the avatar's responses
                </p>
              </>
            )}
          </div>

          {/* Knowledge Base Upload */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label htmlFor="file" className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Case Materials <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Upload TXT, PDF, or DOCX files (max 50,000 characters)
            </p>
            <input
              id="file"
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-navy-900 file:text-white hover:file:bg-brand-gold-500 file:transition-all file:duration-200 file:shadow-sm hover:file:shadow-md cursor-pointer"
            />
            {file && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-700 font-medium">
                  ✓ Selected: {file.name}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium animate-slide-down">
              {error}
            </div>
          )}

          {uploadProgress && (
            <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-5 py-4 rounded-xl text-sm font-medium animate-slide-down">
              {uploadProgress}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-brand-navy-900 text-white rounded-xl font-semibold hover:bg-brand-navy-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
          >
            {loading ? 'Starting Session...' : 'Start Interview Session'}
          </button>
        </form>
      </main>
    </div>
  );
}

