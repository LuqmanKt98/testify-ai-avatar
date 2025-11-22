'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Session } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function SessionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadSessions();
  }, [isAuthenticated, router]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/api/sessions', {
        headers: {
          'x-user-id': user?.id,
        },
      });

      if (response.success) {
        // Sort by start time (newest first)
        const sortedSessions = response.sessions.sort(
          (a: Session, b: Session) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/sessions/${sessionId}`);
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session');
    }
  };

  const handleStartEdit = (session: Session) => {
    setEditingId(session.id);
    setEditName(session.name);
  };

  const handleSaveEdit = async (sessionId: string) => {
    try {
      await apiClient.put(`/api/sessions/${sessionId}`, {
        name: editName,
      });

      setSessions(
        sessions.map((s) =>
          s.id === sessionId ? { ...s, name: editName } : s
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('Failed to update session name');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (session: Session) => {
    if (session.endTime) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          Completed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
        In Progress
      </span>
    );
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand-navy-900 tracking-tight">My Sessions</h1>
          <button
            onClick={() => router.push('/lobby')}
            className="px-4 py-2 text-sm font-semibold text-brand-navy-900 hover:text-brand-gold-500 transition-colors rounded-xl hover:bg-gray-100"
          >
            ← Back to Lobby
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-navy-900 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 animate-slide-up">
            <div className="inline-block p-6 bg-gray-100 rounded-3xl mb-6">
              <div className="text-7xl">📝</div>
            </div>
            <h2 className="text-3xl font-bold text-brand-navy-900 mb-3">
              No Sessions Yet
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Start your first interview training session
            </p>
            <button
              onClick={() => router.push('/session-config')}
              className="px-8 py-4 bg-brand-navy-900 text-white rounded-xl font-semibold hover:bg-brand-navy-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create New Session
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy-900 focus:border-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(session.id)}
                          className="px-5 py-2 bg-brand-navy-900 text-white rounded-xl hover:bg-brand-gold-500 transition-all duration-200 text-sm font-semibold shadow-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <h3 className="text-xl font-bold text-brand-navy-900 truncate">
                          {session.name}
                        </h3>
                        {getStatusBadge(session)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 mb-1">Started</span>
                        <span className="text-gray-600">
                          {formatDistanceToNow(new Date(session.startTime), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 mb-1">Duration</span>
                        <span className="text-gray-600">{formatDuration(session.duration)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 mb-1">Avatar</span>
                        <span className="text-gray-600">{session.avatarId.split('_')[0]}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 mb-1">Quality</span>
                        <span className="text-gray-600 capitalize">{session.quality}</span>
                      </div>
                    </div>

                    {session.transcript && session.transcript.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Messages:</span>{' '}
                        <span className="text-brand-navy-700">{session.transcript.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {session.endTime && session.report && (
                      <button
                        onClick={() => router.push(`/report?sessionId=${session.id}`)}
                        className="px-5 py-2 bg-brand-navy-900 text-white rounded-xl hover:bg-brand-gold-500 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md whitespace-nowrap"
                      >
                        📊 View Report
                      </button>
                    )}
                    {editingId !== session.id && (
                      <>
                        <button
                          onClick={() => handleStartEdit(session)}
                          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium whitespace-nowrap"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="px-5 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 text-sm font-medium whitespace-nowrap"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

