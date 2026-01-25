import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import "./App.css";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-pulse flex space-x-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
