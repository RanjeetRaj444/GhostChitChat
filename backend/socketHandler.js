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

      // Store userId on socket for later use
      socket.userId = userId;

      console.log(`User ${userId} connected on socket ${socket.id}`);

      // Broadcast online status
      io.emit("user_status", { userId, status: "online" });

      // Send online users list to this socket
      socket.emit("online_users", [...connectedUsers.keys()]);
    });

    socket.on("private_message", (data) => {
      const {
        receiverId,
        message,
        senderId,
        timestamp,
        messageType,
        imageUrl,
        replyTo,
      } = data;
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
            receiverId,
            message,
            timestamp,
            messageType,
            imageUrl,
            replyTo,
            senderProfile: data.senderProfile,
            messageId: data.messageId,
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

    // ==================== REACTION EVENTS ====================

    socket.on("message_reaction", (data) => {
      const { messageId, emoji, userId, receiverId, username, action } = data;
      const senderId = socket.userId;

      // Notify both participants for multi-device sync
      [receiverId, senderId].forEach((id) => {
        if (!id) return;
        const sockets = connectedUsers.get(id);
        if (sockets) {
          sockets.forEach((sockId) => {
            io.to(sockId).emit("message_reaction_update", {
              messageId,
              emoji,
              userId,
              username,
              action,
            });
          });
        }
      });
    });

    // ==================== DELETE EVENTS ====================

    socket.on("message_deleted", (data) => {
      const { messageId, receiverId, deleteType } = data;
      const senderId = socket.userId;

      if (deleteType === "everyone") {
        // Notify both participants
        [receiverId, senderId].forEach((id) => {
          if (!id) return;
          const sockets = connectedUsers.get(id);
          if (sockets) {
            sockets.forEach((sockId) => {
              io.to(sockId).emit("message_deleted_update", {
                messageId,
                deleteType,
              });
            });
          }
        });
      }
    });

    // ==================== EDIT EVENTS ====================

    socket.on("message_edited", (data) => {
      const { messageId, content, receiverId, editedAt } = data;
      const senderId = socket.userId;

      // Notify both participants
      [receiverId, senderId].forEach((id) => {
        if (!id) return;
        const sockets = connectedUsers.get(id);
        if (sockets) {
          sockets.forEach((sockId) => {
            io.to(sockId).emit("message_edited_update", {
              messageId,
              content,
              editedAt,
            });
          });
        }
      });
    });

    // ==================== GROUP EVENTS ====================

    // Join a group room
    socket.on("join_group", (groupId) => {
      socket.join(`group:${groupId}`);
      console.log(`Socket ${socket.id} joined group:${groupId}`);
    });

    // Leave a group room
    socket.on("leave_group", (groupId) => {
      socket.leave(`group:${groupId}`);
      console.log(`Socket ${socket.id} left group:${groupId}`);
    });

    // Handle group message
    socket.on("group_message", (data) => {
      const {
        groupId,
        message,
        senderId,
        timestamp,
        senderProfile,
        messageId,
        messageType,
        imageUrl,
        replyTo,
      } = data;

      // Broadcast to all members in the group room (including sender for confirmation)
      io.to(`group:${groupId}`).emit("group_message", {
        groupId,
        senderId,
        message,
        timestamp,
        senderProfile,
        messageId,
        messageType,
        imageUrl,
        replyTo,
      });
    });

    // Handle group typing indicator
    socket.on("group_typing", (data) => {
      const { groupId, senderId, isTyping, senderName } = data;

      // Broadcast to other members in the group (exclude sender)
      socket.to(`group:${groupId}`).emit("group_typing_status", {
        groupId,
        userId: senderId,
        isTyping,
        senderName,
      });
    });

    // Mark group messages as read
    socket.on("group_mark_read", (data) => {
      const { groupId, userId } = data;

      // Notify other members that this user has read messages
      socket.to(`group:${groupId}`).emit("group_messages_read", {
        groupId,
        userId,
        readAt: new Date().toISOString(),
      });
    });

    // Group message reaction
    socket.on("group_message_reaction", (data) => {
      const { groupId, messageId, emoji, userId, username, action } = data;

      // Broadcast reaction to all group members
      io.to(`group:${groupId}`).emit("group_message_reaction_update", {
        messageId,
        emoji,
        userId,
        username,
        action,
      });
    });

    // Group message deleted
    socket.on("group_message_deleted", (data) => {
      const { groupId, messageId, deleteType } = data;

      if (deleteType === "everyone") {
        io.to(`group:${groupId}`).emit("group_message_deleted_update", {
          messageId,
          deleteType,
        });
      }
    });

    // Group message edited
    socket.on("group_message_edited", (data) => {
      const { groupId, messageId, content, editedAt } = data;

      io.to(`group:${groupId}`).emit("group_message_edited_update", {
        messageId,
        content,
        editedAt,
      });
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
