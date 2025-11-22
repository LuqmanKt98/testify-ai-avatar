'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { Session, SessionReportData } from '@/types';

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [report, setReport] = useState<SessionReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'analysis'>('overview');

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login...');
      router.push('/login');
      return;
    }

    if (!sessionId) {
      console.log('❌ No session ID, redirecting to sessions...');
      router.push('/sessions');
      return;
    }

    console.log('✅ Auth loaded and authenticated, loading session report...');
    loadSessionReport();
  }, [authLoading, isAuthenticated, sessionId, router]);

  const loadSessionReport = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading session report for:', sessionId);

      const response = await apiClient.get<any>(`/api/sessions/${sessionId}`);

      if (response.success) {
        setSession(response.session);

        // Check if report exists
        if (response.session.report) {
          console.log('✅ Using existing report from session');
          setReport(response.session.report);
        } else {
          // No report exists - generate one from transcript
          console.log('⚠️ No report found, generating analysis...');
          await generateAnalysis(response.session);
        }
      }
    } catch (error) {
      console.error('Failed to load session report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async (sessionData: Session) => {
    try {
      console.log('🔍 Generating analysis for session...');
      console.log('   Transcript entries:', sessionData.transcript?.length || 0);

      if (!sessionData.transcript || sessionData.transcript.length === 0) {
        console.warn('⚠️ No transcript available, using mock data');
        // Use mock data if no transcript
        const mockReport: SessionReportData = {
          overallScore: 75,
          metrics: {
            accuracy: 75,
            clarity: 75,
            tone: 75,
            pace: 75,
          },
          highlights: ['Session completed'],
          recommendations: ['Continue practicing'],
          durationSeconds: sessionData.duration || 0,
          summary: 'No transcript available for analysis',
          flaggedSegments: [],
        };
        setReport(mockReport);
        return;
      }

      // Call analysis API
      const analysisResponse = await apiClient.post<any>('/api/analysis/session', {
        transcript: sessionData.transcript,
        durationSeconds: sessionData.duration,
      });

      if (analysisResponse.success && analysisResponse.report) {
        console.log('✅ Analysis generated successfully');
        setReport(analysisResponse.report);

        // Save the report back to the session
        await apiClient.put(`/api/sessions/${sessionId}`, {
          report: analysisResponse.report,
        });
        console.log('💾 Report saved to session');
      } else {
        console.error('❌ Analysis failed:', analysisResponse.error);
        throw new Error(analysisResponse.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      // Use fallback mock data
      const fallbackReport: SessionReportData = {
        overallScore: 70,
        metrics: {
          accuracy: 70,
          clarity: 70,
          tone: 70,
          pace: 70,
        },
        highlights: ['Analysis unavailable'],
        recommendations: ['Please try again later'],
        durationSeconds: sessionData.duration || 0,
        summary: 'Analysis service temporarily unavailable',
        flaggedSegments: [],
      };
      setReport(fallbackReport);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const exportToPDF = () => {
    if (!session || !report) return;

    try {
      console.log('📄 Opening print dialog for PDF export...');

      // Use browser's native print functionality which supports all Unicode characters
      window.print();

    } catch (error) {
      console.error('❌ Error opening print dialog:', error);
      alert(`Failed to open print dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-navy-900 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-navy-900 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!session || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-slide-up">
          <div className="inline-block p-6 bg-gray-100 rounded-3xl mb-6">
            <span className="text-7xl">📊</span>
          </div>
          <h2 className="text-3xl font-bold text-brand-navy-900 mb-6">Report Not Found</h2>
          <button
            onClick={() => router.push('/sessions')}
            className="px-8 py-4 bg-brand-navy-900 text-white rounded-xl font-semibold hover:bg-brand-navy-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy-900 tracking-tight">{session.name}</h1>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                {new Date(session.startTime).toLocaleString()} • {formatDuration(session.duration)}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exportToPDF}
                className="px-6 py-3 bg-brand-gold-500 text-white rounded-xl font-semibold hover:bg-brand-gold-600 transition-all duration-200 shadow-md hover:shadow-lg"
                title="Print or save as PDF"
              >
                🖨️ Print / Export PDF
              </button>
              <button
                onClick={() => router.push('/sessions')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-3 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-brand-navy-900 text-brand-navy-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-2 border-b-3 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'analysis'
                  ? 'border-brand-navy-900 text-brand-navy-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 Detailed Analysis
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-4 px-2 border-b-3 font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'transcript'
                  ? 'border-brand-navy-900 text-brand-navy-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💬 Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block bg-white border-b-4 border-brand-navy-900 p-8 mb-8">
        <h1 className="text-4xl font-bold text-brand-navy-900 mb-4">Testify - Session Report</h1>
        <div className="grid grid-cols-2 gap-4 text-lg">
          <div><strong>Session:</strong> {session.name}</div>
          <div><strong>Date:</strong> {new Date(session.startTime).toLocaleString()}</div>
          <div><strong>Duration:</strong> {formatDuration(session.duration)}</div>
          <div><strong>Overall Score:</strong> {report.overallScore}/100</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Tab */}
        <div className={`space-y-8 ${activeTab === 'overview' ? 'block' : 'hidden print:block'}`}>
            {/* Overall Score */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-brand text-center">
              <h2 className="text-lg font-semibold text-gray-600 mb-6">Overall Performance</h2>
              <div className={`text-7xl font-bold mb-3 ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}
              </div>
              <div className="text-gray-600 text-lg">out of 100</div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-brand transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-lg">Accuracy</h3>
                  <span className="text-3xl">🎯</span>
                </div>
                <div className={`text-5xl font-bold mb-4 ${getScoreColor(report.metrics.accuracy)}`}>
                  {report.metrics.accuracy}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.accuracy)}`}
                    style={{ width: `${report.metrics.accuracy}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-brand transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-lg">Clarity</h3>
                  <span className="text-3xl">💬</span>
                </div>
                <div className={`text-5xl font-bold mb-4 ${getScoreColor(report.metrics.clarity)}`}>
                  {report.metrics.clarity}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.clarity)}`}
                    style={{ width: `${report.metrics.clarity}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-brand transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-lg">Tone</h3>
                  <span className="text-3xl">🎭</span>
                </div>
                <div className={`text-5xl font-bold mb-4 ${getScoreColor(report.metrics.tone)}`}>
                  {report.metrics.tone}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.tone)}`}
                    style={{ width: `${report.metrics.tone}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-brand transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 text-lg">Pace</h3>
                  <span className="text-3xl">⏱️</span>
                </div>
                <div className={`text-5xl font-bold mb-4 ${getScoreColor(report.metrics.pace)}`}>
                  {report.metrics.pace}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.pace)}`}
                    style={{ width: `${report.metrics.pace}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {report.highlights && report.highlights.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-2xl font-bold text-brand-navy-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">⭐</span> Highlights
                </h3>
                <ul className="space-y-4">
                  {report.highlights.map((highlight, index) => (
                    <li key={index} className="flex gap-4 p-3 bg-green-50 rounded-xl border border-green-200">
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-green-600 text-white font-bold rounded-full text-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed pt-0.5">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-2xl font-bold text-brand-navy-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">💡</span> Recommendations
                </h3>
                <ul className="space-y-4">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-brand-gold-500 text-white font-bold rounded-full text-sm">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed pt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        {/* Analysis Tab */}
        <div className={`space-y-8 ${activeTab === 'analysis' ? 'block' : 'hidden print:block'}`}>
            {/* Flagged Segments */}
            {report.flaggedSegments && report.flaggedSegments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-2xl font-bold text-brand-navy-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">🚩</span> Flagged Segments
                </h3>
                <div className="space-y-4">
                  {report.flaggedSegments.map((segment, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-5 py-3 bg-red-50 rounded-r-xl">
                      <div className="font-semibold text-red-700 mb-2 text-lg">{segment.reason}</div>
                      <div className="text-gray-700 italic leading-relaxed">&ldquo;{segment.text}&rdquo;</div>
                      <div className="text-sm text-gray-500 mt-2 font-medium">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Metrics Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-brand-navy-900 mb-8">Performance Breakdown</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-700 text-lg">Accuracy</span>
                    <span className={`font-bold text-2xl ${getScoreColor(report.metrics.accuracy)}`}>
                      {report.metrics.accuracy}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.accuracy)}`}
                      style={{ width: `${report.metrics.accuracy}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    Measures how factually correct and consistent your responses were.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-700 text-lg">Clarity</span>
                    <span className={`font-bold text-2xl ${getScoreColor(report.metrics.clarity)}`}>
                      {report.metrics.clarity}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.clarity)}`}
                      style={{ width: `${report.metrics.clarity}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    Evaluates how clear and understandable your communication was.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-700 text-lg">Tone</span>
                    <span className={`font-bold text-2xl ${getScoreColor(report.metrics.tone)}`}>
                      {report.metrics.tone}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.tone)}`}
                      style={{ width: `${report.metrics.tone}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    Assesses the appropriateness and professionalism of your tone.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-700 text-lg">Pace</span>
                    <span className={`font-bold text-2xl ${getScoreColor(report.metrics.pace)}`}>
                      {report.metrics.pace}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-700 ${getScoreBgColor(report.metrics.pace)}`}
                      style={{ width: `${report.metrics.pace}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    Measures the speed and rhythm of your responses.
                  </p>
                </div>
              </div>
            </div>
        </div>

        {/* Transcript Tab */}
        <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm ${activeTab === 'transcript' ? 'block' : 'hidden print:block'}`}>
            <h3 className="text-2xl font-bold text-brand-navy-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">💬</span> Full Transcript
            </h3>
            {session.transcript && session.transcript.length > 0 ? (
              <div className="space-y-4">
                {session.transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-5 rounded-2xl transition-all duration-200 ${
                      entry.speaker === 'user'
                        ? 'bg-brand-navy-900 text-white ml-12 shadow-md'
                        : 'bg-gray-100 text-gray-800 mr-12'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-lg">
                        {entry.speaker === 'user' ? '👤 You' : '🤖 Interviewer'}
                      </span>
                      <span className={`text-sm font-medium ${entry.speaker === 'user' ? 'opacity-75' : 'text-gray-500'}`}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed">{entry.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-6 bg-gray-100 rounded-3xl mb-4">
                  <span className="text-6xl">📝</span>
                </div>
                <p className="text-gray-600 text-lg">No transcript available</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}

