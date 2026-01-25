// Maps userId => Set of socketIds
const connectedUsers = new Map();

// Maps `${senderId}-${receiverId}` => true (typing status)
const typingUsers = new Map();

import Message from "./models/Message.js";

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("user_login", (userId) => {
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
      }
      connectedUsers.get(userId).add(socket.id);

      console.log(`User ${userId} connected on socket ${socket.id}`);

      // Broadcast online status
      io.emit("user_status", { userId, status: "online" });

      // Send online users list to this socket
      socket.emit("online_users", [...connectedUsers.keys()]);
    });

    socket.on("private_message", (data) => {
      const { receiverId, message, senderId, timestamp } = data;
      const receiverSockets = connectedUsers.get(receiverId);

      // Clear typing indicator on message send
      const typingKey = `${senderId}-${receiverId}`;
      if (typingUsers.has(typingKey)) {
        typingUsers.delete(typingKey);
        if (receiverSockets) {
          receiverSockets.forEach((sockId) =>
            io
              .to(sockId)
              .emit("typing_status", { userId: senderId, isTyping: false }),
          );
        }
      }

      // Send message to receiver if online
      if (receiverSockets) {
        receiverSockets.forEach((sockId) =>
          io.to(sockId).emit("private_message", {
            senderId,
            message,
            timestamp,
            senderProfile: data.senderProfile,
          }),
        );
      }

      // Confirm delivery to sender
      socket.emit("message_delivered", {
        messageId: data.messageId,
        receiverId,
        delivered: !!receiverSockets,
      });
    });

    socket.on("typing", (data) => {
      const { senderId, receiverId, isTyping } = data;
      const typingKey = `${senderId}-${receiverId}`;

      if (isTyping) {
        typingUsers.set(typingKey, true);
      } else {
        typingUsers.delete(typingKey);
      }

      const receiverSockets = connectedUsers.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach((sockId) =>
          io.to(sockId).emit("typing_status", { userId: senderId, isTyping }),
        );
      }
    });

    socket.on("mark_read", (data) => {
      const { senderId, receiverId } = data;
      // senderId is the person who SENT the messages (User B)
      // receiverId is the person READING them (User A, current socket)

      const senderSockets = connectedUsers.get(senderId);
      if (senderSockets) {
        senderSockets.forEach((sockId) =>
          io.to(sockId).emit("messages_read_update", {
            by: receiverId,
            readAt: new Date().toISOString(),
          }),
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);

      for (const [userId, sockets] of connectedUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedUsers.delete(userId);
            console.log(`User ${userId} went offline`);
            io.emit("user_status", { userId, status: "offline" });

            // Clear typing indicators for this user
            for (const key of typingUsers.keys()) {
              if (key.startsWith(`${userId}-`)) {
                const receiverId = key.split("-")[1];
                const receiverSockets = connectedUsers.get(receiverId);
                if (receiverSockets) {
                  receiverSockets.forEach((sockId) =>
                    io
                      .to(sockId)
                      .emit("typing_status", { userId, isTyping: false }),
                  );
                }
                typingUsers.delete(key);
              }
            }
          }
          break;
        }
      }
    });
  });
};
