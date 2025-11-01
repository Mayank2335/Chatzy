import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import './index.css';

const socket = io("http://localhost:5000");

export default function App() {
  const [username, setUsername] = useState("");
  const [tempName, setTempName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("userJoined", (msg) => setMessages((prev) => [...prev, { system: true, text: msg }]));
    socket.on("userLeft", (msg) => setMessages((prev) => [...prev, { system: true, text: msg }]));
    socket.on("showTyping", (msg) => setTyping(msg));
    socket.on("hideTyping", () => setTyping(""));

    return () => {
      socket.off("receiveMessage");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("showTyping");
      socket.off("hideTyping");
    };
  }, []);

  const handleSend = () => {
    if (message.trim()) {
      const msg = { user: username, text: message };
      socket.emit("sendMessage", msg);
      setMessages((prev) => [...prev, msg]);
      setMessage("");
      socket.emit("stopTyping");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing");
    setTimeout(() => socket.emit("stopTyping"), 1000);
  };

  const joinChat = () => {
    if (tempName.trim()) {
      setUsername(tempName);
      socket.emit("joinChat", tempName);
    }
  };

  // Theme toggling is now handled by the ThemeContext

  // ------------------- UI -------------------
  if (!username)
    return (
      <div className="flex items-center justify-center h-screen transition-all duration-500 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
        <div className="p-8 rounded-2xl shadow-2xl bg-white dark:bg-gray-800 text-center w-96">
          <h1 className="text-3xl font-bold mb-6">💬 Chill Chat</h1>
          <input
            type="text"
            placeholder="Enter your name..."
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full text-center mb-4 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={joinChat}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mb-3"
          >
            Join Chat
          </button>
          <button
            onClick={toggleTheme}
            className="text-sm text-blue-400 hover:underline"
          >
            {isDark ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"}
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-screen transition-all duration-500 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-blue-500 text-white shadow-lg">
        <h1 className="text-xl font-bold">💬 Chill Chat</h1>
        <button
          onClick={toggleTheme}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-all"
        >
          {isDark ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) =>
          msg.system ? (
            <p key={i} className="text-center text-gray-500 italic">
              {msg.text}
            </p>
          ) : (
            <div
              key={i}
              className={`flex ${
                msg.user === username ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs p-3 rounded-2xl ${
                  msg.user === username
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-bl-none"
                }`}
              >
                <p className="text-sm font-semibold">{msg.user}</p>
                <p>{msg.text}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Typing Indicator */}
      {typing && (
        <p className="text-sm text-gray-500 italic text-center mb-2">
          {typing}
        </p>
      )}

      {/* Input */}
      <div className="flex items-center p-4 bg-gray-200 dark:bg-gray-800">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 p-2 rounded-lg border dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={handleSend}
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
