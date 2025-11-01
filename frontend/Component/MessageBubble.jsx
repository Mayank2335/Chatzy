import React from 'react';

function MessageBubble({ message, isOwn }) {
  // Format timestamp
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm mr-2">
          👤
        </div>
      )}
      <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-primary text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
          }`}
        >
          <p>{message.text}</p>
        </div>
        <div
          className={`text-xs text-gray-500 mt-1 ${
            isOwn ? 'text-right' : 'text-left'
          }`}
        >
          {formatTime(message.timestamp || new Date())}
          {isOwn && message.read && (
            <span className="ml-1 text-blue-500">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;