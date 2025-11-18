import React, { useEffect, useState, useRef } from "react";
import socket from "../src/socket";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";

function Chat({ isDark, onToggleTheme }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Prevent multiple socket event listeners
    if (socketInitialized.current) return;
    socketInitialized.current = true;

    // Join chat when component mounts
    const username = "User1"; // You can replace this with actual username later
    socket.emit("joinChat", username);

    // Listen for messages from other users
    const handleReceiveMessage = (data) => {
      setMessages((prev) => {
        // Add received message with a unique ID
        return [...prev, { ...data, id: `${Date.now()}-${Math.random()}`, isReceived: true }];
      });
      scrollToBottom();
    };

    // Listen for system messages
    const handleSystemMessage = (message) => {
      setMessages((prev) => {
        // Check if system message already exists
        const messageExists = prev.some(
          (msg) => msg.type === "system" && msg.text === message
        );
        if (messageExists) return prev;
        return [...prev, { text: message, type: "system" }];
      });
      scrollToBottom();
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userJoined", handleSystemMessage);
    socket.on("userLeft", handleSystemMessage);
    socket.on("showTyping", setTypingStatus);
    socket.on("hideTyping", () => setTypingStatus(""));

    // Cleanup when component unmounts
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userJoined", handleSystemMessage);
      socket.off("userLeft", handleSystemMessage);
      socket.off("showTyping", setTypingStatus);
      socket.off("hideTyping");
      socketInitialized.current = false;
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const timestamp = new Date().toISOString();
      const newMessage = {
        text: message.trim(),
        user: "User1",
        timestamp,
        id: `${Date.now()}-${Math.random()}`,
        isSent: true // Mark as sent immediately
      };
      
      // Add message to local state immediately
      setMessages(prev => [...prev, newMessage]);
      
      // Emit message to server
      socket.emit("sendMessage", newMessage);
      socket.emit("stopTyping"); // Clear typing indicator
      setMessage("");
      
      // Clear typing timeout if it exists
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      scrollToBottom();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#111b21]">
      {/* Left Sidebar */}
      <ChatSidebar
        onlineUsers={onlineUsers}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />
        
        {/* Search Bar */}
        <div className="p-2 bg-[#111b21]">
          <div className="bg-[#202c33] rounded-lg flex items-center px-4 py-1">
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none py-2"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {onlineUsers.map((user, index) => (
            <div key={index} className="flex items-center p-3 hover:bg-[#202c33] cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white mr-3">
                {user.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-white">{user}</h3>
                <p className="text-gray-400 text-sm">Click to start chat</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Chat List */}
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {[1, 2, 3].map((id) => (
            <div 
              key={id} 
              className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => setActiveChatId(id)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    👤
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">User {id}</h3>
                    <span className="text-xs text-gray-500">2m</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">Last message...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center flex-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                👤
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Room</h2>
              <p className="text-sm text-gray-500">Active now</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            msg.type === "system" ? (
              <div key={i} className="flex justify-center">
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm px-4 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            ) : (
              <div
                key={i}
                className={`flex items-end space-x-2 ${msg.user === "User1" ? "justify-end" : "justify-start"}`}
              >
                {msg.user !== "User1" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    👤
                  </div>
                )}
                <div className={`max-w-[60%] group`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.user === "User1"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${msg.user === "User1" ? "text-right" : "text-left"}`}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            )
          ))}
          {typingStatus && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                👤
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm px-4 py-2 rounded-full">
                {typingStatus}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              😊
            </button>
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              📎
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value) {
                  socket.emit("typing", "User1");
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit("stopTyping");
                  }, 1000);
                } else {
                  socket.emit("stopTyping");
                }
              }}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-primary dark:focus:border-primary bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={sendMessage}
              className="p-2 rounded-full bg-primary hover:bg-primary-dark text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
