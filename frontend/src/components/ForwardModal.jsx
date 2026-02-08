import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaSearch, FaUser, FaUsers, FaShare } from "react-icons/fa";

function ForwardModal({
  isOpen,
  onClose,
  onForward,
  users,
  groups,
  currentUser,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u._id !== currentUser._id &&
      u.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
      >
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Forward to...
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Select a contact or group
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search people and groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border-none focus:ring-2 focus:ring-primary-500 text-sm transition-all shadow-inner"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <div className="space-y-6">
              {/* Groups Section */}
              {filteredGroups.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-2">
                    Groups
                  </h3>
                  <div className="space-y-1">
                    {filteredGroups.map((group) => (
                      <button
                        key={group._id}
                        onClick={() =>
                          onForward({ type: "group", id: group._id })
                        }
                        className="w-full flex items-center gap-4 p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-all group border border-transparent hover:border-primary-100 dark:hover:border-primary-800"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                          <FaUsers className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {group.name}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {group.members?.length || 0} members
                          </p>
                        </div>
                        <FaShare className="w-3.5 h-3.5 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contacts Section */}
              {filteredUsers.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 px-2">
                    Recent Contacts
                  </h3>
                  <div className="space-y-1">
                    {filteredUsers.map((user) => (
                      <button
                        key={user._id}
                        onClick={() =>
                          onForward({ type: "private", id: user._id })
                        }
                        className="w-full flex items-center gap-4 p-3 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 rounded-2xl transition-all group border border-transparent hover:border-secondary-100 dark:hover:border-secondary-800"
                      >
                        <div className="relative">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              className="w-11 h-11 rounded-2xl object-cover shadow-md"
                              alt=""
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                              <FaUser className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-white text-sm group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors">
                            {user.username}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Personal contact
                          </p>
                        </div>
                        <FaShare className="w-3.5 h-3.5 text-neutral-300 group-hover:text-secondary-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 && filteredGroups.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaSearch className="text-neutral-300 w-6 h-6" />
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    No contacts or groups found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/30 text-center">
          <p className="text-[10px] text-neutral-400 font-medium">
            Forwarded messages will be marked as "Forwarded"
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default ForwardModal;
