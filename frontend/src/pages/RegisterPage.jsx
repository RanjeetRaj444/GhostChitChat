import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { FaMoon, FaSun, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import toast from "react-hot-toast";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return setError("Passwords do not match");
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      const msg = "An unexpected error occurred. Please try again.";
      setError(msg);
      toast.error(msg);
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4 sm:px-6 lg:px-8">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        aria-label="Toggle theme"
      >
        {darkMode ? (
          <FaSun className="w-5 h-5" />
        ) : (
          <FaMoon className="w-5 h-5" />
        )}
      </button>

      <div className="w-full max-w-md space-y-8 bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-chat dark:shadow-chat-dark animate-fade-in">
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="G-ChitChat"
            className="w-24 h-24 object-contain mb-4 drop-shadow-lg bg-neutral-800 rounded-lg p-1"
          />
          <h1 className="text-center text-3xl font-bold text-primary-600 dark:text-primary-500">
            G-ChitChat
          </h1>
          <h2 className="mt-2 text-center text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Create a new account
          </h2>
        </div>

        {error && (
          <div className="bg-error-500/10 border border-error-500/50 text-error-600 dark:text-error-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign up"
              )}
            </button>
          </div>

          <div className="text-sm text-center">
            <span className="text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="font-medium text-primary-600 dark:text-primary-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
