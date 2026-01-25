import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { currentUser, isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null); // keep socket in state to trigger rerenders

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (isAuthenticated && currentUser && token) {
      if (!socketRef.current) {
        const newSocket = io(import.meta.env.VITE_API_URL, {
          auth: {
            token: token,
          },
          reconnectionAttempts: 5,
        });
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("connect", () => {
          newSocket.emit("user_login", currentUser._id);
        });

        newSocket.on("online_users", (users) => {
          setOnlineUsers(users);
        });

        newSocket.on("user_status", ({ userId, status }) => {
          setOnlineUsers((prev) =>
            status === "online"
              ? [...new Set([...prev, userId])]
              : prev.filter((id) => id !== userId),
          );
        });

        newSocket.on("typing_status", ({ userId, isTyping }) => {
          setTypingUsers((prev) => ({
            ...prev,
            [userId]: isTyping,
          }));
        });

        newSocket.on("disconnect", () => {
          setOnlineUsers([]);
          setTypingUsers({});
        });
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers([]);
        setTypingUsers({});
      }
    };
  }, [isAuthenticated, currentUser?._id, token]);

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
        senderProfile: {
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
      });
    }
  };

  const markRead = (senderId) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit("mark_read", {
        senderId, // The person who sent the messages we are reading
        receiverId: currentUser._id, // Us
      });
    }
  };

  const value = {
    socket,
    onlineUsers,
    typingUsers,
    sendTypingStatus,
    sendMessage,
    markRead,
    isUserOnline: (userId) => onlineUsers.includes(userId),
    isUserTyping: (userId) => !!typingUsers[userId],
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
