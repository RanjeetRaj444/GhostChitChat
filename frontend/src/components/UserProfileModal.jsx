import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaTimes } from "react-icons/fa";

function UserProfileModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { updateProfile } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Update profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generate avatar options
  const generateAvatarOptions = () => {
    const colors = [
      "6366f1",
      "8b5cf6",
      "ec4899",
      "ef4444",
      "f97316",
      "eab308",
      "22c55e",
      "06b6d4",
    ];

    return colors.map((color) => {
      const avatarUrl = `https://ui-avatars.com/api/?name=${formData.username || user?.username || "User"}&background=${color}&color=fff`;

      return (
        <button
          key={color}
          type="button"
          onClick={() =>
            setFormData((prev) => ({ ...prev, avatar: avatarUrl }))
          }
          className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
            formData.avatar === avatarUrl
              ? "border-primary-500 scale-110"
              : "border-transparent hover:border-primary-300"
          }`}
        >
          <img
            src={avatarUrl}
            alt="Avatar option"
            className="w-full h-full object-cover"
          />
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-[95%] sm:w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Your Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-error-500/10 border border-error-500/50 text-error-600 dark:text-error-500 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success-500/10 border border-success-500/50 text-success-600 dark:text-success-500 p-3 rounded-lg text-sm mb-4">
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <img
                src={formData.avatar || user?.avatar || "/default-avatar.svg"}
                alt={user?.username}
                className="w-24 h-24 rounded-full object-cover mb-4"
              />

              <div className="flex flex-wrap justify-center gap-2">
                {generateAvatarOptions()}
              </div>
            </div>

            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="Your username"
              />
            </div>

            <div>
              <label htmlFor="bio" className="form-label">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Write a short bio about yourself..."
              />
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfileModal;
