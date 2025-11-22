'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import TestifyTopbar from '@/components/TestifyTopbar';

export default function LobbyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-navy-900/5 rounded-full blur-3xl"></div>
      </div>

      <TestifyTopbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-brand-navy-900/10 to-brand-gold-500/10 rounded-full border border-brand-gold-500/20">
              <span className="text-2xl">👋</span>
              <span className="text-sm font-semibold text-brand-navy-900">Welcome back!</span>
            </div>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-brand-navy-900 mb-4 tracking-tight">
            Hello, <span className="bg-gradient-to-r from-brand-navy-900 to-brand-gold-500 bg-clip-text text-transparent">{user.name}</span>
          </h2>
          <p className="text-xl text-gray-600 font-medium">
            Practice witness interviews with AI-powered avatars
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <Link href="/session-config">
            <div className="relative bg-white rounded-3xl border-2 border-gray-200 p-10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer group overflow-hidden">
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900/5 to-brand-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 rounded-3xl mb-6 group-hover:from-brand-gold-500 group-hover:to-brand-gold-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-brand-navy-900 mb-4 group-hover:text-brand-gold-500 transition-colors">
                  New Session
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Start a new interview training session with an AI avatar
                </p>

                {/* Arrow indicator */}
                <div className="mt-6 flex items-center gap-2 text-brand-navy-900 group-hover:text-brand-gold-500 transition-colors font-semibold">
                  <span>Get Started</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/sessions">
            <div className="relative bg-white rounded-3xl border-2 border-gray-200 p-10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer group overflow-hidden">
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900/5 to-brand-gold-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 rounded-3xl mb-6 group-hover:from-brand-gold-500 group-hover:to-brand-gold-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-brand-navy-900 mb-4 group-hover:text-brand-gold-500 transition-colors">
                  View Sessions
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Review past sessions and performance reports
              </p>

                {/* Arrow indicator */}
                <div className="mt-6 flex items-center gap-2 text-brand-navy-900 group-hover:text-brand-gold-500 transition-colors font-semibold">
                  <span>View All</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-white via-brand-ivory/30 to-white rounded-3xl p-10 border-2 border-gray-200 shadow-xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-navy-900/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-gold-500 to-brand-gold-400 rounded-2xl shadow-lg">
                  <span className="text-4xl">💡</span>
                </div>
                <h3 className="text-3xl font-bold text-brand-navy-900">
                  How It Works
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-brand-gold-500 to-brand-gold-400 text-white font-bold rounded-xl text-lg shadow-md group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy-900 mb-2 text-lg">Configure Session</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Select an avatar and upload case materials
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-brand-gold-500 to-brand-gold-400 text-white font-bold rounded-xl text-lg shadow-md group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy-900 mb-2 text-lg">Practice Live</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Practice your testimony with the AI interviewer in real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-brand-gold-500 to-brand-gold-400 text-white font-bold rounded-xl text-lg shadow-md group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy-900 mb-2 text-lg">Get Analytics</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Receive detailed performance analysis and recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-brand-gold-500 to-brand-gold-400 text-white font-bold rounded-xl text-lg shadow-md group-hover:scale-110 transition-transform">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy-900 mb-2 text-lg">Review & Improve</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Review transcripts and improve your interview skills
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

