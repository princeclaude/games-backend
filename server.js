// import express from "express";
// import http from "http";
// import dotenv from "dotenv";
// import { Server } from "socket.io";
// import webpush from "web-push";
// import { startInvitationCleanupJob } from "./cron/cleanupInvitations.js";
// dotenv.config();

// const app = express();
// const server = http.createServer(app);

// webpush.setVapidDetails(
//   "mailto:your-email@example.com",
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// const io = new Server(server, {
//   cors: { origin: "*" }, // adjust this for production later
// });

// const onlineUsers = new Map();

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("register", (username) => {
//     onlineUsers.set(username, socket.id);
//     socket.join(username);
//     console.log(`${username} registered for real-time events`);
//   });

//   socket.on("disconnect", () => {
//     for (let [username, sockId] of onlineUsers) {
//       if (sockId === socket.id) {
//         onlineUsers.delete(username);
//       }
//     }
//     console.log("User disconnected:", socket.id);
//   });
// });

// // ✅ Pass io into cron job (if it needs to emit events)
// startInvitationCleanupJob(io);

// export { io, onlineUsers };
