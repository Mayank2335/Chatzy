import React from 'react';
import { useState } from 'react';

function Sidebar({ activeChat, onSelectChat, onlineUsers }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dummy data for demonstration - replace with real data later
  const conversations = [
    { id: 1, username: 'john_doe', avatar: '👤', lastMessage: 'Hey there!', timestamp: '2m', unread: 2 },
    { id: 2, username: 'jane_smith', avatar: '👤', lastMessage: 'How are you?', timestamp: '1h' },
    { id: 3, username: 'mike_jones', avatar: '👤', lastMessage: 'See you later!', timestamp: '2h' },
  ];

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Messages</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search messages"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectChat(conv.id)}
            className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
              activeChat === conv.id ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl">
                {conv.avatar}
              </div>
              {onlineUsers?.includes(conv.username) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              )}
            </div>

            {/* Chat Info */}
            <div className="ml-4 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">{conv.username}</span>
                <span className="text-xs text-gray-500">{conv.timestamp}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                {conv.unread && (
                  <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;