import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  IconUsers,
  IconSearch,
  IconFilter,
  IconDotsVertical,
  IconUserCheck,
} from "@tabler/icons-react";
import InfiniteScroll from "react-infinite-scroll-component";
import UserDetailsModal from "./UserDetailsModal";

const LatestUsersCard = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || user.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden h-[536px]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10">
                <IconUsers
                  className="text-indigo-500 dark:text-indigo-400"
                  size={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Latest Users
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recently joined members
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                >
                  <IconFilter size={20} />
                </motion.button>

                <AnimatePresence>
                  {isFilterMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 z-10"
                    >
                      {["all", "photographer", "user"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setFilterType(type);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                            filterType === type
                              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                              : "hover:bg-gray-100 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}s
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
              >
                <IconDotsVertical size={20} />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <IconSearch
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="h-[420px] overflow-y-auto">
          <InfiniteScroll
            dataLength={filteredUsers.length}
            // next={loadMoreUsers}
            hasMore={true}
            loader={
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            }
            height={420}
            className="p-4 space-y-3"
          >
            {filteredUsers.map((user, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => setSelectedUser(user)}
                className="group bg-white dark:bg-neutral-700/50 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-300 border border-gray-100 dark:border-neutral-600 cursor-pointer"
                tabIndex={0}
                role="button"
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedUser(user);
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Image
                      src={user.avatar || "/default-avatar.png"}
                      alt={`Avatar for ${user.name}`}
                      width={48}
                      height={48}
                      className="rounded-xl"
                    />
                    {user.type === "photographer" && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <IconUserCheck size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        user.type === "photographer"
                          ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      }`}
                    >
                      {user.type === "photographer" ? "Photographer" : "User"}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </InfiniteScroll>
        </div>
      </motion.div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
};

export default LatestUsersCard;
