"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUserPlus, IconSearch, IconFilter, IconDownload, IconRefresh, IconUsers } from '@tabler/icons-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  // banUser,
  // unbanUser,
  // getUserDetails
} from '@/lib/users';
import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Dynamically import components with SSR disabled
const UsersTable = dynamic(() => import('@/components/ui/UsersTable'), { ssr: false });
const CreateUserModal = dynamic(() => import('@/components/ui/CreateUserModal'), { ssr: false });
const UserDetailsModal = dynamic(() => import('@/components/ui/UserDetailsModal'), { ssr: false });
const EditUserModal = dynamic(() => import('@/components/ui/EditUserModal'), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import('@/components/ui/DeleteConfirmationModal'), { ssr: false });

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const usersPerPage = 10;
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getUsers(
        usersPerPage,
        (currentPage - 1) * usersPerPage
      );
      setUsers(result.users);
      setTotalPages(Math.ceil(result.total / usersPerPage));
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (userData) => {
    try {
      // Implement user creation logic
      await createUser(userData);
      toast.success("User created successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to create user");
      console.error(error);
    }
  };

  const handleDeleteUser = async (user) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(userToDelete.$id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const handleBanUser = async (userId) => {
    // try {
    //   await banUser(userId);
    //   toast.success('User banned successfully');
    //   fetchUsers();
    // } catch (error) {
    //   toast.error('Failed to ban user');
    //   console.error(error);
    // }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setSelectedUser(null); // Close details modal if open
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await updateUser(userId, userData);
      toast.success("User updated successfully");
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.$id));
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkAction = async (action) => {
    try {
      switch (action) {
        case "delete":
          setUserToDelete(selectedUsers);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Failed to ${action} users`);
      console.error(error);
    }
  };

  const handleShare = async (userData) => {
    if (typeof window !== "undefined") {
      try {
        const shareData = {
          title: "User Details",
          text: `User: ${userData.name}\nEmail: ${userData.email}`,
          url: window.location.href,
        };

        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.text);
          toast.success("User details copied to clipboard");
        }
      } catch (error) {
        console.error("Error sharing:", error);
        toast.error("Failed to share user details");
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || user.status === filterType;
    return matchesSearch && matchesFilter;
  });

  // Function to get page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of page numbers to show
      let start = Math.max(currentPage - 1, 2);
      let end = Math.min(currentPage + 1, totalPages - 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        pageNumbers.push("...");
      }

      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor user accounts
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors"
        >
          <IconUserPlus size={20} />
          <span>Add User</span>
        </motion.button>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <IconSearch
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-lg flex items-center space-x-2 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <IconFilter size={20} />
              <span>Filter</span>
            </motion.button>

            <AnimatePresence>
              {isFilterMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 z-10"
                >
                  {["all", "active", "banned", "pending"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                        filterType === type
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchUsers}
            className="p-2 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            <IconRefresh size={20} />
          </motion.button>
        </div>

        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-sm"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedUsers.length} users selected
            </p>
            <div className="space-x-2">
              <button
                onClick={() => handleBulkAction("ban")}
                className="px-4 py-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-sm"
              >
                Ban Selected
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm"
              >
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        onViewUser={setSelectedUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onBanUser={handleBanUser}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        isLoading={isLoading}
      />

      {/* Update Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500"
                : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
            }`}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === "number" ? (
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span className="px-2 text-gray-500">...</span>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500"
                : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateUser={handleCreateUser}
          />
        )}
        {selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
        {editingUser && (
          <EditUserModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            user={editingUser}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {userToDelete && (
          <DeleteConfirmationModal
            isOpen={!!userToDelete}
            onClose={() => setUserToDelete(null)}
            onConfirm={handleConfirmDelete}
            userName={userToDelete.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
