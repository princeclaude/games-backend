// index.js
import express from "express";
import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import webpush from "web-push";

import authRoute from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import gameRoutes from "./routes/game.js";
import inviteRoutes from "./routes/invite.js";
import { startInvitationCleanupJob } from "./cron/cleanupInvitations.js";

dotenv.config();

const app = express();
const server = http.createServer(app); // Attach express app to HTTP server


const corsOptions = {
  origin: ["http://localhost:5173", "https://games-five-gold.vercel.app/"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// --- ROUTES ---
app.use("/api/auth", authRoute);
app.use("/api/user", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/invite", inviteRoutes);

// --- MONGODB CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error(" MongoDB Error:", err));

// --- SIMPLE TEST ROUTE ---
app.get("/", (req, res) => {
  res.json({ message: "Backend is running " });
});

// --- SOCKET.IO SETUP ---
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket.IO client connected:", socket.id);

  // ✅ Register user for direct events
  socket.on("register", (username) => {
    onlineUsers.set(username, socket.id);
    socket.join(username);
    console.log(`${username} registered for real-time events`);
  });

  // ✅ Join a room for 1v1 or group session
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    io.to(roomId).emit("user-joined", { socketId: socket.id });
  });

  // ✅ Leave a room
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
    io.to(roomId).emit("user-left", { socketId: socket.id });
  });

  // ✅ Sync music toggle
  socket.on("music-toggle", ({ isPlaying, roomId }) => {
    console.log(`Music state changed in ${roomId}: ${isPlaying}`);
    socket.to(roomId).emit("music-toggle", { isPlaying });
  });

  // ✅ Sync game selection
  socket.on("game-selected", ({ game, roomId }) => {
    console.log(`Game selected in ${roomId}: ${game}`);
    socket.to(roomId).emit("game-selected", { game });
  });

  // ✅ Voice chat events
  socket.on("voice-offer", (offer) => {
    socket.broadcast.emit("voice-offer", offer);
  });

  socket.on("voice-answer", (answer) => {
    socket.broadcast.emit("voice-answer", answer);
  });

  socket.on("voice-ice-candidate", (candidate) => {
    socket.broadcast.emit("voice-ice-candidate", candidate);
  });

  // ✅ Handle disconnects
  socket.on("disconnect", () => {
    for (let [username, sockId] of onlineUsers) {
      if (sockId === socket.id) {
        onlineUsers.delete(username);
        console.log(`${username} disconnected`);
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

// --- CRON JOB ---
startInvitationCleanupJob(io);

// --- EXPORTS (for other files like invite.js to use IO) ---
export { io, onlineUsers };

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server + Socket.IO running on http://localhost:${PORT}`)
);