import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer/simplepeer.min.js";
import EmojiPicker from "emoji-picker-react";
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let socket = null;

function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  // Chat states
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState({}); // { [username]: messages[] }
  const [systemMessages, setSystemMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  // Emoji & attachment states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  // Video call states
  const [callState, setCallState] = useState('idle'); // idle | calling | incoming | in-call
  const [incomingCall, setIncomingCall] = useState(null); // { from, signal }
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const myStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSocket = (userData) => {
    if (socket) return;
    
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.emit("joinChat", userData.username);

    socket.on("receiveMessage", (msg) => {
      const fromUser = msg.user;
      setConversations(prev => ({
        ...prev,
        [fromUser]: [...(prev[fromUser] || []), msg]
      }));
    });
    socket.on("userJoined", (msg) => setSystemMessages(prev => [...prev, { system: true, text: msg }]));
    socket.on("userLeft", (msg) => setSystemMessages(prev => [...prev, { system: true, text: msg }]));
    socket.on("showTyping", (msg) => setTyping(msg));
    socket.on("hideTyping", () => setTyping(""));
    socket.on("onlineUsers", (users) => setOnlineUsers(users));

    // Video call signaling listeners
    socket.on("incomingCall", ({ signal, from }) => {
      setIncomingCall({ signal, from });
      setCallState('incoming');
    });

    socket.on("callAccepted", ({ signal }) => {
      peerRef.current?.signal(signal);
      // 'in-call' state is set by the peer 'stream' event, not here
    });

    socket.on("iceCandidate", ({ candidate }) => {
      peerRef.current?.signal(candidate);
    });

    socket.on("callEnded", () => {
      endCall(false);
    });
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
    setConversations({});
    setSystemMessages([]);
    setSelectedUser(null);
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
    if (message.trim() && socket && user && selectedUser) {
      const msg = { user: user.username, text: message, to: selectedUser };
      socket.emit("sendMessage", msg);
      setConversations(prev => ({
        ...prev,
        [selectedUser]: [...(prev[selectedUser] || []), msg]
      }));
      setMessage("");
      socket.emit("stopTyping", { to: selectedUser });
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socket && user && selectedUser) {
      socket.emit("typing", { username: user.username, to: selectedUser });
      setTimeout(() => socket.emit("stopTyping", { to: selectedUser }), 1000);
    }
  };

  // ── Emoji ─────────────────────────────────────────────────────────────────
  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // ── File Attachment ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const msg = {
        user: user.username,
        to: selectedUser,
        text: '',
        file: { name: file.name, type: file.type, data: reader.result }
      };
      socket.emit("sendMessage", msg);
      setConversations(prev => ({
        ...prev,
        [selectedUser]: [...(prev[selectedUser] || []), msg]
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Video Call ─────────────────────────────────────────────────────────────
  const endCall = (notify = true) => {
    if (notify && socket && selectedUser) {
      socket.emit("callEnded", { to: selectedUser });
    }
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach(t => t.stop());
      myStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    remoteStreamRef.current = null;
    setCallState('idle');
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  const startCall = async () => {
    if (!selectedUser || !socket) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      alert('Camera/microphone permission denied. Please allow access in your browser and try again.');
      return;
    }
    try {
      myStreamRef.current = stream;
      setCallState('calling');

      const peer = new SimplePeer({ initiator: true, trickle: false, stream, config: ICE_SERVERS });
      peerRef.current = peer;

      peer.on('signal', signal => {
        socket.emit("callUser", { to: selectedUser, signal, from: user.username });
      });

      peer.on('stream', remoteStream => {
        remoteStreamRef.current = remoteStream;
        setCallState('in-call'); // triggers useEffect to set srcObjects after render
      });

      peer.on('error', (err) => { console.error('Peer error:', err); endCall(true); });
      peer.on('close', () => endCall(false));
    } catch (err) {
      console.error('WebRTC setup error:', err);
      stream.getTracks().forEach(t => t.stop());
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      alert('Camera/microphone permission denied. Please allow access in your browser and try again.');
      endCall(false);
      return;
    }
    try {
      myStreamRef.current = stream;

      const peer = new SimplePeer({ initiator: false, trickle: false, stream, config: ICE_SERVERS });
      peerRef.current = peer;

      peer.on('signal', signal => {
        socket.emit("callAccepted", { to: incomingCall.from, signal });
      });

      peer.on('stream', remoteStream => {
        remoteStreamRef.current = remoteStream;
        setCallState('in-call'); // triggers useEffect to set srcObjects after render
      });

      peer.on('error', (err) => { console.error('Peer error:', err); endCall(true); });
      peer.on('close', () => endCall(false));

      peer.signal(incomingCall.signal);
      setSelectedUser(incomingCall.from);
    } catch (err) {
      console.error('WebRTC setup error:', err);
      stream.getTracks().forEach(t => t.stop());
      endCall(false);
    }
  };

  const toggleMute = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  };

  const toggleCamera = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOff(prev => !prev);
    }
  };

  const playRingTone = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const beep = () => {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 520;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(() => ctx.close(), 800);
      } catch {}
    };
    beep();
    ringIntervalRef.current = setInterval(beep, 1500);
  };

  const stopRingTone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  };

  // Play/stop ringtone based on call state
  useEffect(() => {
    if (callState === 'incoming') {
      playRingTone();
    } else {
      stopRingTone();
    }
    return () => stopRingTone();
  }, [callState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set video srcObjects after the video elements are rendered
  useEffect(() => {
    if (callState === 'in-call') {
      if (myVideoRef.current && myStreamRef.current) {
        myVideoRef.current.srcObject = myStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [callState]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedUser]);

  const handleGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      setAuthError('Google OAuth is not configured');
      return;
    }
    
    const redirectURL = `${window.location.origin}/auth/callback`;
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_URL=${redirectURL}&response_type=code&scope=email profile`;
    window.location.href = googleAuthURL;
  };

  // Handle Google OAuth callback
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code && window.location.pathname === '/auth/callback') {
        try {
          const res = await fetch(`${API_URL}/auth/google/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            window.history.replaceState({}, '', '/');
          } else {
            setAuthError(data.message || 'Google login failed');
            window.history.replaceState({}, '', '/');
          }
        } catch {
          setAuthError('Failed to authenticate with Google');
          window.history.replaceState({}, '', '/');
        }
      }
    };
    
    handleGoogleCallback();
  }, []);

  const renderAuthForm = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-95">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chatzy
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
            </p>
          </div>

          {/* Google Sign In Button */}
          {GOOGLE_CLIENT_ID && (
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all mb-6 shadow-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {/* Divider */}
          {GOOGLE_CLIENT_ID && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">Or continue with email</span>
              </div>
            </div>
          )}
          
          {/* Email/Password Form */}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="johndoe"
                    required
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength="6"
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {authError && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700 dark:text-red-300 text-sm">{authError}</p>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
          
          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError("");
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <div className="text-center mt-4">
          <button
            onClick={toggleTheme}
            className="text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-2 rounded-full transition-all inline-flex items-center gap-2"
          >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderChatRoom = () => (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">

      {/* ── Incoming Call Modal ───────────────────────────────────────────── */}
      {callState === 'incoming' && incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl text-center w-80">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 animate-pulse">
              {incomingCall.from?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-1">{incomingCall.from}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Incoming video call...</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => endCall(false)}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
              <button onClick={acceptCall}
                className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.866V15.134a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Outgoing Call Modal ───────────────────────────────────────────── */}
      {callState === 'calling' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl text-center w-80">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 animate-pulse">
              {selectedUser?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-1">{selectedUser}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Calling...</p>
            <button onClick={() => endCall(true)}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Active Video Call Screen ──────────────────────────────────────── */}
      {callState === 'in-call' && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          {/* Videos */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-900">
            {/* Remote video (full screen) */}
            <video ref={remoteVideoRef} autoPlay playsInline
              className="w-full h-full object-cover" />
            {/* My video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-2xl bg-gray-800">
              <video ref={myVideoRef} autoPlay playsInline muted
                className="w-full h-full object-cover" />
            </div>
            {/* Name badge */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedUser}
            </div>
          </div>
          {/* Controls */}
          <div className="bg-gray-900/95 p-6 flex items-center justify-center gap-6">
            <button onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
              {isMuted ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <button onClick={() => endCall(true)}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
            <button onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
              {isCameraOff ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.866V15.134a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold dark:text-white">{user?.username}</h3>
                <p className="text-xs"><span className="text-green-500">●</span> <span className="text-green-600 dark:text-green-400 font-medium">Online</span></p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>

        {/* Online Users */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
            Users ({onlineUsers.filter(u => u !== user?.username).length})
          </h4>
          <div className="space-y-2">
            {onlineUsers.filter(u => u !== user?.username).map((username, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedUser(username)}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                  selectedUser === username
                    ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-white">{username}</p>
                  <p className="text-xs"><span className="text-green-500">●</span> <span className="text-green-600 dark:text-green-400">Online</span></p>
                </div>
              </div>
            ))}
            {onlineUsers.filter(u => u !== user?.username).length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No other users online</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold dark:text-white">
                  {selectedUser ? selectedUser : 'Direct Messages'}
                </h2>
                <p className="text-sm">
                  {selectedUser
                    ? <><span className="text-green-500">●</span> <span className="text-green-600 dark:text-green-400 font-medium">Online</span></>
                    : <span className="text-gray-500 dark:text-gray-400">{`${onlineUsers.filter(u => u !== user?.username).length} users online`}</span>
                  }
                </p>
              </div>
            </div>
            {/* Video Call Button */}
            {selectedUser && callState === 'idle' && (
              <button onClick={startCall}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.866V15.134a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Video Call
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-500">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">Select a user to start chatting</p>
              <p className="text-sm opacity-70">Messages are private — only you and the recipient can see them</p>
              {systemMessages.map((msg, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-sm">
                  {msg.text}
                </div>
              ))}
            </div>
          ) : (
            <>
              {(conversations[selectedUser] || []).map((msg, index) => {
                const isOwn = msg.user === user?.username;
                return (
                  <div key={index} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}>
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {msg.user?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isOwn
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none"
                          : "bg-white dark:bg-gray-800 dark:text-white rounded-bl-none"
                      }`}>
                        {msg.file ? (
                          msg.file.type.startsWith('image/') ? (
                            <img src={msg.file.data} alt={msg.file.name} className="max-w-xs rounded-lg" />
                          ) : (
                            <a href={msg.file.data} download={msg.file.name}
                              className="flex items-center gap-2 underline text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {msg.file.name}
                            </a>
                          )
                        ) : (
                          <p className="break-words">{msg.text}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-2">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {isOwn && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
              {typing && (
                <div className="flex items-center gap-2 px-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{typing}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 relative">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 z-30">
              <EmojiPicker onEmojiClick={onEmojiClick} theme={isDark ? 'dark' : 'light'} height={380} />
            </div>
          )}
          {/* Hidden file input */}
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx,.txt" />
          <div className="flex items-center gap-3">
            {/* Attachment */}
            <button onClick={() => fileInputRef.current?.click()} disabled={!selectedUser}
              title="Attach file"
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={selectedUser ? `Message ${selectedUser}...` : "Select a user to start chatting"}
              disabled={!selectedUser}
              className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {/* Emoji */}
            <button onClick={() => setShowEmojiPicker(prev => !prev)} disabled={!selectedUser}
              title="Emoji"
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || !selectedUser}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Send
            </button>
          </div>
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
