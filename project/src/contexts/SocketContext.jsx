import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { currentUser, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (!socketRef.current) {
        const newSocket = io("http://localhost:5000");
        socketRef.current = newSocket;

        newSocket.on("connect", () => {
          newSocket.emit("user_login", currentUser._id);
        });

        newSocket.on("online_users", (users) => {
          setOnlineUsers(users);
        });

        newSocket.on("user_status", ({ userId, status }) => {
          setOnlineUsers((prev) =>
            status === "online"
              ? [...prev, userId]
              : prev.filter((id) => id !== userId)
          );
        });

        newSocket.on("typing_status", ({ userId, isTyping }) => {
          setTypingUsers((prev) => ({
            ...prev,
            [userId]: isTyping,
          }));
        });
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setOnlineUsers([]);
        setTypingUsers({});
      }
    }
    // Only run when auth state changes
    // eslint-disable-next-line
  }, [isAuthenticated, currentUser?._id]);

  const sendTypingStatus = (receiverId, isTyping) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit("typing", {
        senderId: currentUser._id,
        receiverId,
        isTyping,
      });
    }
  };

  const sendMessage = (receiverId, message, messageId) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit("private_message", {
        senderId: currentUser._id,
        receiverId,
        message,
        messageId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const value = {
    socket: socketRef.current,
    onlineUsers,
    typingUsers,
    sendTypingStatus,
    sendMessage,
    isUserOnline: (userId) => onlineUsers.includes(userId),
    isUserTyping: (userId) => typingUsers[userId] || false,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
