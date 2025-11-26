import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Message from './models/Message.js';

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

// ✅ Socket.io logic
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // ✅ User joins the chat
  socket.on("joinChat", (username) => {
    socket.username = username;
    io.emit("userJoined", `${username} joined the chat`);
  });

  // ✅ Typing indicator logic
  socket.on("typing", (username) => {
    // accept username from client for reliability
    const name = username || socket.username;
    if (name) {
      socket.broadcast.emit("showTyping", `${name} is typing...`);
    }
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("hideTyping");
  });

  // ✅ Sending messages
  socket.on("sendMessage", async (msg) => {
    if (!msg.user) msg.user = socket.username;
    console.log(`📩 ${msg.user}: ${msg.text}`);

    // Add message status
    const messageWithStatus = {
      ...msg,
      status: 'delivered',
      deliveredAt: new Date().toISOString()
    };

    // Send to other clients
    socket.broadcast.emit("receiveMessage", messageWithStatus);
    
    // Send delivery confirmation to sender
    socket.emit("messageStatus", {
      messageId: msg.id,
      status: 'delivered',
      deliveredAt: messageWithStatus.deliveredAt
    });
  });

  // ✅ Disconnect event
  socket.on("disconnect", () => {
    if (socket.username) {
      console.log(`👋 ${socket.username} left the chat`);
      io.emit("userLeft", `${socket.username} left the chat`);
    }
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
