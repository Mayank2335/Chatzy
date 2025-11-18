import React from 'react';
import DarkModeToggle from './DarkModeToggle';

function ChatSidebar({ onlineUsers, selectedChat, onSelectChat, isDark, onToggleTheme }) {
  return (
    <div className="w-[400px] h-full flex flex-col bg-[#111b21] border-r border-[#313d45]">
      {/* Sidebar Header */}
      <div className="h-[59px] bg-[#202c33] flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white">
            👤
          </div>
        </div>
        <div className="flex items-center space-x-3 text-[#aebac1]">
          <button className="p-2 hover:bg-[#374045] rounded-full">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-.944-1.229 7.26 7.26 0 0 0-4.8-8.804.977.977 0 0 1 .594-1.86 9.212 9.212 0 0 1 6.092 11.169.976.976 0 0 1-.942.724zm-16.025-.39a.977.977 0 0 1-.953-.769 9.21 9.21 0 0 1 6.626-10.86.975.975 0 1 1 .52 1.882l-.015.004a7.259 7.259 0 0 0-5.223 8.558.978.978 0 0 1-.955 1.185z"></path>
            </svg>
          </button>
          <DarkModeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button className="p-2 hover:bg-[#374045] rounded-full">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-[10px] py-[6px]">
        <div className="bg-[#202c33] rounded-lg flex items-center">
          <div className="pl-3 pr-2">
            <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#aebac1]">
              <path fill="currentColor" d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="flex-1 bg-transparent text-white placeholder-[#8696a0] text-[14px] py-[8px] px-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {onlineUsers.map((user, index) => (
          <div
            key={index}
            onClick={() => onSelectChat(user)}
            className={`flex items-center px-3 py-[10px] cursor-pointer hover:bg-[#202c33] ${
              selectedChat === user ? 'bg-[#2a3942]' : ''
            }`}
          >
            <div className="relative">
              <div className="w-[49px] h-[49px] rounded-full bg-[#6a7175] flex items-center justify-center text-white">
                {user.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-[2px] right-[2px] w-[11px] h-[11px] bg-[#00a884] rounded-full border-[2px] border-[#111b21]" />
            </div>
            <div className="ml-3 flex-1 min-w-0 border-t border-[#313d45] py-[13px]">
              <div className="flex justify-between">
                <h3 className="text-white text-[17px] font-normal">{user}</h3>
                <span className="text-[12px] text-[#8696a0]">12:00</span>
              </div>
              <p className="text-[#8696a0] text-[14px] truncate">Click to start chat</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;