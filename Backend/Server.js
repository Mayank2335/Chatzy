import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Message from './models/Message.js';
import authRoutes from './Routes/authRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat-app";
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = FRONTEND_URL.split(',');
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard domains like *.netlify.app
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production, you can change this
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Chatzy Backend Server is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// ✅ Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ Route to get all previous messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ Track connected users: socketId -> username
const onlineUsersMap = new Map(); // socketId -> username
const userSocketMap = new Map();  // username -> socketId

function broadcastOnlineUsers() {
  const users = Array.from(onlineUsersMap.values());
  io.emit("onlineUsers", users);
}

// ✅ Socket.io logic
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // ✅ User joins the chat
  socket.on("joinChat", (username) => {
    socket.username = username;
    onlineUsersMap.set(socket.id, username);
    userSocketMap.set(username, socket.id);
    io.emit("userJoined", `${username} joined the chat`);
    broadcastOnlineUsers();
  });

  // ✅ Typing indicator — sent privately to the recipient
  socket.on("typing", (data) => {
    const name = typeof data === 'string' ? data : (data?.username || socket.username);
    const to = typeof data === 'object' ? data?.to : null;
    if (to) {
      const targetSocketId = userSocketMap.get(to);
      if (targetSocketId) io.to(targetSocketId).emit("showTyping", `${name} is typing...`);
    } else {
      socket.broadcast.emit("showTyping", `${name} is typing...`);
    }
  });

  socket.on("stopTyping", (data) => {
    const to = typeof data === 'object' ? data?.to : null;
    if (to) {
      const targetSocketId = userSocketMap.get(to);
      if (targetSocketId) io.to(targetSocketId).emit("hideTyping");
    } else {
      socket.broadcast.emit("hideTyping");
    }
  });

  // ✅ Sending messages — delivered only to the intended recipient
  socket.on("sendMessage", async (msg) => {
    if (!msg.user) msg.user = socket.username;

    const messageWithStatus = {
      ...msg,
      status: 'delivered',
      deliveredAt: new Date().toISOString()
    };

    if (msg.to) {
      // Private message: deliver only to the target user
      const targetSocketId = userSocketMap.get(msg.to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("receiveMessage", messageWithStatus);
      }
    } else {
      // Fallback: broadcast (no recipient specified)
      socket.broadcast.emit("receiveMessage", messageWithStatus);
    }

    socket.emit("messageStatus", {
      messageId: msg.id,
      status: 'delivered',
      deliveredAt: messageWithStatus.deliveredAt
    });
  });

  // ✅ WebRTC Signaling — relay only, server never sees media
  socket.on("callUser", ({ to, signal, from }) => {
    const targetSocketId = userSocketMap.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incomingCall", { signal, from });
    }
  });

  socket.on("callAccepted", ({ to, signal }) => {
    const targetSocketId = userSocketMap.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callAccepted", { signal });
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("iceCandidate", { candidate });
    }
  });

  socket.on("callEnded", ({ to }) => {
    const targetSocketId = userSocketMap.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callEnded");
    }
  });

  // ✅ Disconnect event
  socket.on("disconnect", () => {
    if (socket.username) {
      console.log(`👋 ${socket.username} left the chat`);
      onlineUsersMap.delete(socket.id);
      userSocketMap.delete(socket.username);
      io.emit("userLeft", `${socket.username} left the chat`);
      broadcastOnlineUsers();
    }
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
