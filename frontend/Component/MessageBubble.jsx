import React from 'react';

function MessageBubble({ message, isOwn }) {
  // Format timestamp
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`relative max-w-[65%] group`}>
        <div
          className={`relative px-2 py-[6px] rounded-md ${
            isOwn
              ? 'bg-[#005c4b] text-white rounded-tr-none'
              : 'bg-[#202c33] text-white rounded-tl-none'
          }`}
        >
          {/* Message content */}
          <p className="text-[14.2px] break-words min-w-[58px] whitespace-pre-wrap">{message.text}</p>
          
          {/* Time and status */}
          <div className="inline-flex items-end justify-end float-right -mt-[3px] ml-2 mb-[4px]">
            <span className="text-[11px] text-[#ffffff99] leading-none ml-1">
              {formatTime(message.timestamp || new Date())}
            </span>
            {isOwn && (
              <span className="text-[11px] text-[#ffffff99] ml-1">
                {message.status === 'sent' && (
                  <svg viewBox="0 0 12 11" width="12" height="11" className="inline align-middle">
                    <path fill="currentColor" d="M11.1 0.900098L3.6 8.40005L0.899902 5.70005L0 6.60005L3.6 10.2L12 1.80005L11.1 0.900098Z"/>
                  </svg>
                )}
                {message.status === 'delivered' && (
                  <svg viewBox="0 0 16 11" width="16" height="11" className="inline align-middle">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                )}
                {message.status === 'read' && (
                  <svg viewBox="0 0 16 11" width="16" height="11" className="inline align-middle text-[#53bdeb]">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                )}
              </span>
            )}
          </div>

          {/* Message tail */}
          <div
            className={`absolute top-0 w-[8px] h-[13px] ${
              isOwn ? '-right-2' : '-left-2'
            }`}
            style={{
              background: isOwn ? '#005c4b' : '#202c33',
              clipPath: isOwn 
                ? 'polygon(0 0, 0% 100%, 100% 0)' 
                : 'polygon(0 0, 100% 0, 100% 100%)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;