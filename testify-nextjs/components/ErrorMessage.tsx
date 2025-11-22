interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
}: ErrorMessageProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-lg animate-slide-down">
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">⚠️</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-red-800 mb-2">{title}</h3>
          <p className="text-red-700 mb-4 leading-relaxed">{message}</p>
          <div className="flex gap-3 flex-wrap">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 text-sm font-medium"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

