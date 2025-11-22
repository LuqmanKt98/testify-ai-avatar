interface ChatBubbleProps {
  speaker: 'user' | 'avatar';
  text: string;
  timestamp?: string;
  showTimestamp?: boolean;
}

export default function ChatBubble({
  speaker,
  text,
  timestamp,
  showTimestamp = true,
}: ChatBubbleProps) {
  const isUser = speaker === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-lg p-4 ${
          isUser
            ? 'bg-brand-navy text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : 'Interviewer'}
          </span>
          {showTimestamp && timestamp && (
            <span className="text-xs opacity-75">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </div>
    </div>
  );
}

