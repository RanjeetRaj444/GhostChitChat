import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { currentUser, isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Group-related state
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const joinedGroupsRef = useRef(new Set());

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
          console.log("Socket connected:", newSocket.id);
          newSocket.emit("user_login", currentUser._id);

          // Rejoin previously joined groups on reconnect
          joinedGroupsRef.current.forEach((groupId) => {
            newSocket.emit("join_group", groupId);
          });
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

        // Group typing status
        newSocket.on(
          "group_typing_status",
          ({ groupId, userId, isTyping, senderName }) => {
            setGroupTypingUsers((prev) => {
              const groupTyping = prev[groupId] || {};
              if (isTyping) {
                return {
                  ...prev,
                  [groupId]: {
                    ...groupTyping,
                    [userId]: senderName || "Someone",
                  },
                };
              } else {
                const { [userId]: _, ...rest } = groupTyping;
                return {
                  ...prev,
                  [groupId]: rest,
                };
              }
            });
          },
        );

        newSocket.on("disconnect", () => {
          console.log("Socket disconnected");
          setOnlineUsers([]);
          setTypingUsers({});
          setGroupTypingUsers({});
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
        setGroupTypingUsers({});
        joinedGroupsRef.current.clear();
      }
    };
  }, [isAuthenticated, currentUser?._id, token]);

  const sendTypingStatus = useCallback(
    (receiverId, isTyping) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("typing", {
          senderId: currentUser._id,
          receiverId,
          isTyping,
        });
      }
    },
    [currentUser],
  );

  const sendMessage = useCallback(
    (receiverId, message, messageId) => {
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
    },
    [currentUser],
  );

  const markRead = useCallback(
    (senderId) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("mark_read", {
          senderId,
          receiverId: currentUser._id,
        });
      }
    },
    [currentUser],
  );

  // ==================== GROUP METHODS ====================

  const joinGroupRoom = useCallback((groupId) => {
    if (socketRef.current && groupId) {
      socketRef.current.emit("join_group", groupId);
      joinedGroupsRef.current.add(groupId);
    }
  }, []);

  const leaveGroupRoom = useCallback((groupId) => {
    if (socketRef.current && groupId) {
      socketRef.current.emit("leave_group", groupId);
      joinedGroupsRef.current.delete(groupId);
    }
  }, []);

  const sendGroupMessage = useCallback(
    (groupId, message, messageId) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("group_message", {
          groupId,
          senderId: currentUser._id,
          message,
          messageId,
          timestamp: new Date().toISOString(),
          senderProfile: {
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
        });
      }
    },
    [currentUser],
  );

  const sendGroupTypingStatus = useCallback(
    (groupId, isTyping) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("group_typing", {
          groupId,
          senderId: currentUser._id,
          isTyping,
          senderName: currentUser.username,
        });
      }
    },
    [currentUser],
  );

  const markGroupRead = useCallback(
    (groupId) => {
      if (socketRef.current && currentUser) {
        socketRef.current.emit("group_mark_read", {
          groupId,
          userId: currentUser._id,
        });
      }
    },
    [currentUser],
  );

  const getGroupTypingUsers = useCallback(
    (groupId) => {
      const typingMap = groupTypingUsers[groupId] || {};
      // Filter out the current user from typing users
      return Object.entries(typingMap)
        .filter(([userId]) => userId !== currentUser?._id)
        .map(([_, name]) => name);
    },
    [groupTypingUsers, currentUser?._id],
  );

  const isUserOnline = useCallback(
    (userId) => onlineUsers.includes(userId),
    [onlineUsers],
  );

  const isUserTyping = useCallback(
    (userId) => !!typingUsers[userId],
    [typingUsers],
  );

  const value = {
    socket,
    onlineUsers,
    typingUsers,
    sendTypingStatus,
    sendMessage,
    markRead,
    isUserOnline,
    isUserTyping,
    // Group methods
    groupTypingUsers,
    joinGroupRoom,
    leaveGroupRoom,
    sendGroupMessage,
    sendGroupTypingStatus,
    markGroupRead,
    getGroupTypingUsers,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
