"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUserPlus, IconSearch, IconFilter, IconDownload, IconRefresh, IconUsers } from '@tabler/icons-react';
import dynamic from "next/dynamic";
import { getSession } from "next-auth/react";
import { toast } from "sonner";

// Server actions
import { getAllClients, editClient, deleteClient } from "./_action";


// Dynamically import UI components
const UsersTable = dynamic(() => import('@/components/ui/UsersTable'), { ssr: false });
const CreateUserModal = dynamic(() => import('@/components/ui/CreateUserModal'), { ssr: false });
const UserDetailsModal = dynamic(() => import('@/components/ui/UserDetailsModal'), { ssr: false });
const EditUserModal = dynamic(() => import('@/components/ui/EditUserModal'), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import('@/components/ui/DeleteConfirmationModal'), { ssr: false });

const UsersPage = () => {
  // State
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const usersPerPage = 10;

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");
      const result = await getAllClients(session.accessToken);
      setUsers(result);
      setTotalPages(Math.ceil(result.length / usersPerPage));
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Pagination helper
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(currentPage - 1, 2);
      let end = Math.min(currentPage + 1, totalPages - 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // const handleCreateUser = async (userData) => {
  //   try {
  //     // Implement user creation logic
  //     // await createUser(userData);
  //     // toast.success("User created successfully");
  //     // fetchUsers();
  //   } catch (error) {
  //     toast.error("Failed to create user");
  //     console.error(error);
  //   }
  // };

  const handleEditUser = async (userId, updatedData) => {
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      // ✅ Prepare FormData for backend
      const formData = new FormData();
      Object.entries(updatedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      await editClient(session.accessToken, userId, formData);

      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Edit failed:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");
      await deleteClient(session.accessToken, userToDelete._id);
      toast.success("User deleted successfully");
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    toast.loading("Refreshing users...");
    await fetchUsers();
    toast.dismiss();
    toast.success("Users list updated!");
  };

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || (filterType === "verified" ? user.verified : !user.verified);
    return matchesSearch && matchesFilter;
  });

  // Function to get page numbers to display
  // const getPageNumbers = () => {
  //   const pageNumbers = [];
  //   if (totalPages <= 5) {
  //     // If 5 or fewer pages, show all
  //     for (let i = 1; i <= totalPages; i++) {
  //       pageNumbers.push(i);
  //     }
  //   } else {
  //     // Always show first page
  //     pageNumbers.push(1);

  //     // Calculate start and end of page numbers to show
  //     let start = Math.max(currentPage - 1, 2);
  //     let end = Math.min(currentPage + 1, totalPages - 1);

  //     // Add ellipsis after first page if needed
  //     if (start > 2) {
  //       pageNumbers.push("...");
  //     }

  //     // Add pages around current page
  //     for (let i = start; i <= end; i++) {
  //       pageNumbers.push(i);
  //     }

  //     // Add ellipsis before last page if needed
  //     if (end < totalPages - 1) {
  //       pageNumbers.push("...");
  //     }

  //     // Always show last page
  //     pageNumbers.push(totalPages);
  //   }
  //   return pageNumbers;
  // };

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">

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
          onClick={() => {
            toast.info("Add User feature coming soon");
            setShowCreateModal(true);
          }}
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
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm ${filterType === type
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
            onClick={handleRefresh}
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
                className="px-4 py-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-sm">
                Ban Selected
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm">
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
        onEditUser={(user) => {
          setEditingUser(user);
          setSelectedUser(null);
        }}
        onDeleteUser={(user) => setUserToDelete(user)}
        selectedUsers={selectedUsers}
        isLoading={isLoading}
      />

      {/* Update Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${currentPage === 1
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
                  className={`px-4 py-2 rounded-lg ${currentPage === page
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
            className={`px-4 py-2 rounded-lg ${currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500"
              : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
              }`}
          >
            Next
          </button>
        </div>
      )
      }

      {/* Modals */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
        {editingUser && (
          <EditUserModal
            isOpen={!!editingUser}
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUpdateUser={handleEditUser}
          />
        )}
        {userToDelete && (
          <DeleteConfirmationModal
            isOpen={!!userToDelete}
            onClose={() => setUserToDelete(null)}
            onConfirm={handleDeleteUser} // This now safely deletes the selected user
            userName={userToDelete?.name} // optional chaining to avoid null errors
          />
        )}
        {showCreateModal && (
          <CreateUserModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            fetchUsers={fetchUsers}
          />
        )}
      </AnimatePresence>
    </div >
  );
};

export default UsersPage;