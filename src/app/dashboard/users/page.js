"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUserPlus, IconSearch, IconFilter, IconDownload, IconRefresh, IconUsers } from '@tabler/icons-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  getUserDetails
} from '@/lib/users';  // Using the users-specific functions
import UsersTable from '@/components/ui/UsersTable';
import CreateUserModal from '@/components/ui/CreateUserModal';
import UserDetailsModal from '@/components/ui/UserDetailsModal';
import EditUserModal from '@/components/ui/EditUserModal';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getUsers(usersPerPage, (currentPage - 1) * usersPerPage);
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (error) {
      toast.error('Failed to fetch users');
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
      toast.success('User created successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
      console.error(error);
    }
  };

  const handleDeleteUser = async (user) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(userToDelete.$id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await banUser(userId);
      toast.success('User banned successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to ban user');
      console.error(error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setSelectedUser(null); // Close details modal if open
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await updateUser(userId, userData);
      toast.success('User updated successfully');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.$id));
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkAction = async (action) => {
    try {
      switch (action) {
        case 'delete':
          const shouldDelete = typeof window !== 'undefined' && 
            window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`);
          
          if (shouldDelete) {
            await Promise.all(selectedUsers.map(userId => deleteUser(userId)));
            toast.success('Users deleted successfully');
          }
          break;
        default:
          break;
      }
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${action} users`);
      console.error(error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.status === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
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
            <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
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
                  {['all', 'active', 'banned', 'pending'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                        filterType === type
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-neutral-700'
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
                onClick={() => handleBulkAction('ban')}
                className="px-4 py-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-sm"
              >
                Ban Selected
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
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
      />

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
