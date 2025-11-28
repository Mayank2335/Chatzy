import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  // Chat states
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data._id) {
          setUser(data);
          initializeSocket(data);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const initializeSocket = (userData) => {
    if (socket) return;
    
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.emit("joinChat", userData.username);

    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("userJoined", (msg) => setMessages((prev) => [...prev, { system: true, text: msg }]));
    socket.on("userLeft", (msg) => setMessages((prev) => [...prev, { system: true, text: msg }]));
    socket.on("showTyping", (msg) => setTyping(msg));
    socket.on("hideTyping", () => setTyping(""));
  };

  const handleAuth = async (formData) => {
    setAuthError("");
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        initializeSocket(data.user);
      } else {
        setAuthError(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('Failed to connect to server. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    setMessages([]);
  };

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
    return () => {
      if (socket) {
        socket.off("receiveMessage");
        socket.off("userJoined");
        socket.off("userLeft");
        socket.off("showTyping");
        socket.off("hideTyping");
      }
    };
  }, []);

  const handleSend = () => {
    if (message.trim() && socket && user) {
      const msg = { user: user.username, text: message };
      socket.emit("sendMessage", msg);
      setMessages((prev) => [...prev, msg]);
      setMessage("");
      socket.emit("stopTyping");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socket && user) {
      socket.emit("typing", user.username);
      setTimeout(() => socket.emit("stopTyping"), 1000);
    }
  };

  const renderAuthForm = () => (
    <div className="flex items-center justify-center min-h-screen transition-all duration-500 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="p-8 rounded-2xl shadow-2xl bg-white dark:bg-gray-800 text-center w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">💬 Chatzy {isLogin ? 'Login' : 'Signup'}</h1>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = {
            email: e.target.email.value,
            password: e.target.password.value,
            username: !isLogin ? e.target.username.value : undefined
          };
          handleAuth(formData);
        }}>
          <div className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full border rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {!isLogin && (
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full border rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              minLength="6"
              className="w-full border rounded-lg px-4 py-3 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {authError && (
              <div className="text-red-500 text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setAuthError("");
            }}
            className="text-sm text-blue-500 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
        
        <button
          onClick={toggleTheme}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </div>
  );

  const renderChatRoom = () => (
    <div className="flex flex-col h-screen transition-all duration-500 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">💬 Chatzy</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, <strong>{user?.username}</strong>!</span>
            <button
              onClick={toggleTheme}
              className="text-xl hover:opacity-70 transition-opacity"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.user === user?.username ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-lg p-3 rounded-lg ${
                msg.user === user?.username
                  ? "bg-blue-500 text-white"
                  : msg.system
                  ? "bg-gray-300 dark:bg-gray-700 text-center w-full"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              {!msg.system && <div className="font-bold">{msg.user}</div>}
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {typing}
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return user ? renderChatRoom() : renderAuthForm();
}

export default App;
