import { TranscriptEntry } from '@/types';

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  maxHeight?: string;
  showTimestamps?: boolean;
}

export default function TranscriptDisplay({
  transcript,
  maxHeight = '500px',
  showTimestamps = true,
}: TranscriptDisplayProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-3">💬</div>
        <p>No transcript available</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 overflow-y-auto pr-2"
      style={{ maxHeight }}
    >
      {transcript.map((entry) => (
        <div
          key={entry.id}
          className={`p-4 rounded-lg transition-all ${
            entry.speaker === 'user'
              ? 'bg-brand-navy text-white ml-8'
              : 'bg-gray-100 text-gray-800 mr-8'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm">
              {entry.speaker === 'user' ? 'You' : 'Interviewer'}
            </span>
            {showTimestamps && (
              <span className="text-xs opacity-75">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {entry.text}
          </div>
        </div>
      ))}
    </div>
  );
}

