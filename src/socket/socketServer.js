import { Server } from "socket.io";
import logger from "../utils/logger.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: "https://real-time-chat-web-app-backend.onrender.com",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info("Connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("user connected");
    });

    socket.on("join chat", (room) => {
      socket.join(room);
      logger.info("User joined chatroom: " + room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing..."));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageReceived) => {
      let chat = newMessageReceived.chat;

      if (!chat.users) return logger.info("chat.users not defined");

      chat.users.forEach((user) => {
        if (user._id == newMessageReceived.sender._id) return;

        socket.in(user._id).emit("message received", newMessageReceived);
      });
    });

    socket.off("setup", () => {
      logger.info("USER DISCONNECTED");
      socket.leave(userData._id);
    });
  });

  return io;
};
