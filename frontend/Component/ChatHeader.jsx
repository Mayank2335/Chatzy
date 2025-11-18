import React from 'react';

function ChatHeader({ user, status }) {
  return (
    <div className="h-[59px] bg-[#202c33] flex items-center justify-between px-4 py-2 select-none">
      <div className="flex items-center">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
            {user?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          {status === 'online' && (
            <div className="absolute bottom-0 right-0 w-[8px] h-[8px] bg-green-500 rounded-full border-[2px] border-[#202c33]" />
          )}
        </div>
        <div className="ml-3">
          <h3 className="text-[16px] text-white font-medium leading-tight">
            {user || 'Chat Room'}
          </h3>
          <p className="text-[13px] text-[#8696a0] leading-tight">
            {status === 'online' ? 'online' : 'last seen recently'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 text-[#aebac1]">
        <button className="p-2 hover:bg-[#374045] rounded-full">
          <svg viewBox="0 0 24 24" width="24" height="24" className="">
            <path fill="currentColor" d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"></path>
          </svg>
        </button>
        <button className="p-2 hover:bg-[#374045] rounded-full">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;