interface MetricCardProps {
  title: string;
  score: number;
  icon: string;
  description?: string;
}

export default function MetricCard({ title, score, icon, description }: MetricCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700 text-base">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>

      <div className={`text-5xl font-bold mb-3 ${getScoreColor(score)}`}>
        {score}
      </div>

      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${getScoreBadgeColor(score)}`}>
        {getScoreLabel(score)}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${getScoreBgColor(score)} transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {description && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

