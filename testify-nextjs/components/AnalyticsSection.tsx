import { SessionReportData } from '@/types';
import MetricCard from './MetricCard';

interface AnalyticsSectionProps {
  report: SessionReportData;
}

export default function AnalyticsSection({ report }: AnalyticsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="card text-center bg-gradient-to-br from-brand-navy to-brand-gold text-white">
        <h2 className="text-lg font-semibold mb-4 opacity-90">Overall Performance</h2>
        <div className="text-7xl font-bold mb-2">{report.overallScore}</div>
        <div className="text-xl opacity-90">out of 100</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Accuracy"
          score={report.metrics.accuracy}
          icon="🎯"
          description="Factual correctness and consistency"
        />
        <MetricCard
          title="Clarity"
          score={report.metrics.clarity}
          icon="💬"
          description="Clear and understandable communication"
        />
        <MetricCard
          title="Tone"
          score={report.metrics.tone}
          icon="🎭"
          description="Appropriate and professional tone"
        />
        <MetricCard
          title="Pace"
          score={report.metrics.pace}
          icon="⏱️"
          description="Speed and rhythm of responses"
        />
      </div>

      {/* Highlights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlights */}
        {report.highlights && report.highlights.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
              <span>⭐</span> Highlights
            </h3>
            <ul className="space-y-3">
              {report.highlights.map((highlight, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-green-600 font-bold flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <div className="card">
            <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
              <span>💡</span> Recommendations
            </h3>
            <ul className="space-y-3">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-brand-gold font-bold flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Flagged Segments */}
      {report.flaggedSegments && report.flaggedSegments.length > 0 && (
        <div className="card border-2 border-yellow-200">
          <h3 className="text-xl font-bold text-brand-navy mb-4 flex items-center gap-2">
            <span>🚩</span> Areas for Improvement
          </h3>
          <div className="space-y-4">
            {report.flaggedSegments.map((segment, index) => (
              <div
                key={index}
                className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 rounded-r-lg"
              >
                <div className="font-semibold text-yellow-800 mb-1">
                  {segment.reason}
                </div>
                <div className="text-gray-700 italic text-sm">
                  &ldquo;{segment.text}&rdquo;
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(segment.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

