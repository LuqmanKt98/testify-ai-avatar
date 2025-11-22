'use client';

import { useState, useEffect } from 'react';

interface KnowledgeBase {
  id: string;
  name: string;
  opening?: string;
  prompt?: string;
  created_at?: string;
  updated_at?: string;
}

interface KnowledgeBaseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (knowledgeBase: KnowledgeBase) => void;
  selectedId?: string;
}

export function KnowledgeBaseSelector({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: KnowledgeBaseSelectorProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchKnowledgeBases();
    }
  }, [isOpen]);

  const fetchKnowledgeBases = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/heygen/knowledge-base/list`);

      if (!response.ok) {
        throw new Error(`Failed to fetch knowledge bases: ${response.status}`);
      }

      const data = await response.json();
      console.log('📚 Knowledge Bases fetched:', data);

      if (data.success && data.data) {
        setKnowledgeBases(data.data);
      } else {
        setError('No knowledge bases found');
      }
    } catch (err) {
      console.error('❌ Error fetching knowledge bases:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-navy-900">📚 Select Knowledge Base</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-navy-900 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading knowledge bases...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              ❌ {error}
            </div>
          )}

          {!loading && !error && knowledgeBases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No knowledge bases found
            </div>
          )}

          {!loading && knowledgeBases.length > 0 && (
            <div className="space-y-3">
              {knowledgeBases.map((kb) => (
                <button
                  key={kb.id}
                  onClick={() => {
                    onSelect(kb);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedId === kb.id
                      ? 'border-brand-navy-900 bg-blue-50'
                      : 'border-gray-200 hover:border-brand-navy-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{kb.name}</div>
                  {kb.opening && (
                    <div className="text-sm text-gray-600 mt-1">Opening: {kb.opening.substring(0, 100)}...</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">ID: {kb.id}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Close
          </button>
          <button
            onClick={fetchKnowledgeBases}
            disabled={loading}
            className="px-4 py-2 bg-brand-navy-900 text-white rounded-lg hover:bg-brand-navy-800 transition-all disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

