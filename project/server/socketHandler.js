// Map to store connected users
const connectedUsers = new Map();
// Map to store typing status
const typingUsers = new Map();

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // Handle user login
    socket.on('user_login', (userId) => {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} is online with socket ${socket.id}`);
      
      // Broadcast user online status to everyone
      io.emit('user_status', { userId, status: 'online' });
      
      // Send list of online users to newly connected user
      const onlineUsers = [...connectedUsers.keys()];
      socket.emit('online_users', onlineUsers);
    });
    
    // Handle private message
    socket.on('private_message', async (data) => {
      const { receiverId, message, senderId, timestamp } = data;
      
      const receiverSocketId = connectedUsers.get(receiverId);
      
      // Clear typing indicator when message is sent
      if (typingUsers.has(`${senderId}-${receiverId}`)) {
        typingUsers.delete(`${senderId}-${receiverId}`);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('typing_status', { userId: senderId, isTyping: false });
        }
      }
      
      // Send to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('private_message', {
          senderId,
          message,
          timestamp
        });
      }
      
      // Always send confirmation back to sender
      socket.emit('message_delivered', {
        messageId: data.messageId,
        receiverId,
        delivered: !!receiverSocketId
      });
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { senderId, receiverId, isTyping } = data;
      const typingKey = `${senderId}-${receiverId}`;
      
      if (isTyping) {
        typingUsers.set(typingKey, true);
      } else {
        typingUsers.delete(typingKey);
      }
      
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing_status', { userId: senderId, isTyping });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      
      // Find and remove user from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} went offline`);
          
          // Broadcast user offline status
          io.emit('user_status', { userId, status: 'offline' });
          
          // Clear any typing indicators
          for (const key of typingUsers.keys()) {
            if (key.startsWith(`${userId}-`)) {
              const receiverId = key.split('-')[1];
              const receiverSocketId = connectedUsers.get(receiverId);
              
              if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing_status', { userId, isTyping: false });
              }
              
              typingUsers.delete(key);
            }
          }
          
          break;
        }
      }
    });
  });
};