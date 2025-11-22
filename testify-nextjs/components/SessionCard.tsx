import { Session } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface SessionCardProps {
  session: Session;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SessionCard({
  session,
  onView,
  onEdit,
  onDelete,
}: SessionCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = () => {
    if (session.endTime) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          ✓ Completed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
        ⏳ In Progress
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h3 className="text-xl font-bold text-brand-navy-900 group-hover:text-brand-gold-500 transition-colors truncate">
              {session.name}
            </h3>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
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
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-semibold text-gray-700">Messages:</span>{' '}
              <span className="text-brand-navy-700">{session.transcript.length}</span>
            </div>
          )}

          {session.report && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-semibold text-gray-700">
                Overall Score:
              </span>
              <span
                className={`text-3xl font-bold ${
                  session.report.overallScore >= 80
                    ? 'text-green-600'
                    : session.report.overallScore >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {session.report.overallScore}
              </span>
              <span className="text-sm text-gray-500">/ 100</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {session.endTime && session.report && onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="px-4 py-2 bg-brand-navy-900 text-white rounded-xl hover:bg-brand-gold-500 transition-all duration-200 text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow-md"
            >
              📊 View Report
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium whitespace-nowrap"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 text-sm font-medium whitespace-nowrap"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

