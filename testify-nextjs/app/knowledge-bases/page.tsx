'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface KnowledgeBase {
  id: string;
  name: string;
  opening?: string;
  prompt?: string;
  created_at?: string;
  updated_at?: string;
}

export default function KnowledgeBasesPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      console.log('🔄 Fetching from:', `${backendUrl}/api/heygen/knowledge-base/list`);

      const response = await fetch(`${backendUrl}/api/heygen/knowledge-base/list`);

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(
          `Failed to fetch knowledge bases: ${response.status} - ${errorData.error || 'Unknown error'}`
        );
      }

      const data = await response.json();
      console.log('📚 Knowledge Bases response:', data);

      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Found', data.data.length, 'knowledge bases');
        setKnowledgeBases(data.data);
      } else if (data.success && data.data) {
        console.log('✅ Found knowledge bases:', data.data);
        setKnowledgeBases(Array.isArray(data.data) ? data.data : []);
      } else {
        console.warn('⚠️ No knowledge bases in response:', data);
        setError(data.error || 'No knowledge bases found');
      }
    } catch (err) {
      console.error('❌ Error fetching knowledge bases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy-900">📚 Knowledge Bases</h1>
              <p className="text-gray-600 mt-1">All available HeyGen knowledge bases</p>
            </div>
            <Link
              href="/"
              className="bg-brand-navy-900 text-white px-6 py-2 rounded-lg hover:bg-brand-navy-800 transition-all"
            >
              ← Back Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Refresh Button */}
        <button
          onClick={fetchKnowledgeBases}
          disabled={loading}
          className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          🔄 Refresh Knowledge Bases
        </button>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-navy-900 border-t-transparent"></div>
            <span className="ml-4 text-lg text-gray-600">Loading knowledge bases...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            <h3 className="font-semibold mb-2">❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && knowledgeBases.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-700">
            <h3 className="font-semibold mb-2">⚠️ No Knowledge Bases</h3>
            <p>No knowledge bases found in your HeyGen account.</p>
          </div>
        )}

        {/* Knowledge Bases Grid */}
        {!loading && knowledgeBases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                onClick={() => setSelectedKB(selectedKB?.id === kb.id ? null : kb)}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{kb.name}</h3>
                
                {kb.opening && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-600">Opening:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{kb.opening}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded p-3 mt-4">
                  <p className="text-xs font-mono text-gray-600 break-all">ID: {kb.id}</p>
                </div>

                {kb.created_at && (
                  <p className="text-xs text-gray-500 mt-3">Created: {new Date(kb.created_at).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Selected KB Details */}
        {selectedKB && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 {selectedKB.name} Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base ID</label>
                <div className="bg-gray-50 p-3 rounded font-mono text-sm text-gray-700 break-all">
                  {selectedKB.id}
                </div>
              </div>

              {selectedKB.opening && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Message</label>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    {selectedKB.opening}
                  </div>
                </div>
              )}

              {selectedKB.prompt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt/Instructions</label>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-48 overflow-y-auto">
                    {selectedKB.prompt}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedKB(null)}
              className="mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
            >
              Close Details
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

