"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconUserPlus, IconChevronLeft, IconChevronRight, IconX, IconEye, IconEdit, IconTrash, IconUser, IconMail, IconPhone, IconCalendar, IconClock, IconBookmark, IconCamera, IconBan, IconStar, IconRefresh } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsers, getUserDetails, updateUser, deleteUser, banUser, subscribeToRealtimeUpdates } from '@/lib/appwrite';
import Image from 'next/image';
import { format, isValid } from 'date-fns';

const UserModal = ({ user, onClose, onUpdate, onDelete, onBan, onRefresh }) => {
  const [editedUser, setEditedUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const details = await getUserDetails(user.$id);
      setEditedUser(details);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    const interval = setInterval(fetchUserDetails, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user.$id]);

  const handleEdit = () => setIsEditing(true);
  const handleSave = async () => {
    await onUpdate(editedUser);
    setIsEditing(false);
  };
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      await onDelete(user.$id);
      onClose();
    }
  };
  const handleBan = async () => {
    if (window.confirm(`Are you sure you want to ban ${user.name}? This action cannot be undone.`)) {
      await onBan(user.$id);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'PPP') : 'Unknown';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-[90%] h-[90%] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          <div className="flex items-center space-x-2">
            <button onClick={onRefresh} className="text-blue-500 hover:text-blue-600 transition-colors">
              <IconRefresh size={24} />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              <IconX size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="relative w-full aspect-square mb-4">
                <Image
                  src={editedUser.avatar || '/default-avatar.png'}
                  alt={editedUser.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <button onClick={handleEdit} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
                  <IconEdit size={20} className="inline-block mr-2" />
                  Edit Profile
                </button>
                <button onClick={handleDelete} className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors">
                  <IconTrash size={20} className="inline-block mr-2" />
                  Delete User
                </button>
                <button onClick={handleBan} className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors">
                  <IconBan size={20} className="inline-block mr-2" />
                  Ban User
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={IconUser} label="Name" value={editedUser.name} />
                <InfoItem icon={IconMail} label="Email" value={editedUser.email} />
                <InfoItem icon={IconPhone} label="Phone" value={editedUser.phone || 'N/A'} />
                <InfoItem icon={IconCalendar} label="Joined" value={formatDate(editedUser.$createdAt)} />
                <InfoItem icon={IconClock} label="Last Login" value={editedUser.lastLogin ? formatDate(editedUser.lastLogin) : 'Never'} />
                <InfoItem icon={IconBookmark} label="Total Bookings" value={editedUser.totalBookings || 0} />
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Booking Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <StatItem label="Total Bookings" value={editedUser.totalBookings || 0} />
                  <StatItem label="Completed Bookings" value={editedUser.completedBookings || 0} />
                  <StatItem label="Cancelled Bookings" value={editedUser.cancelledBookings || 0} />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Photographers Interacted</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {editedUser.photographersInteracted && editedUser.photographersInteracted.length > 0 ? (
                    editedUser.photographersInteracted.map((photographer, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-gray-100 dark:bg-neutral-700 p-2 rounded-lg">
                        <Image
                          src={photographer.avatar || '/default-avatar.png'}
                          alt={photographer.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{photographer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <IconStar size={16} className="text-yellow-400 mr-1" />
                            {photographer.rating.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300 col-span-3">No interactions with photographers yet.</p>
                  )}
                </div>
              </div>

              {editedUser.recentActivities && editedUser.recentActivities.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Recent Activities</h3>
                  <div className="space-y-2">
                    {editedUser.recentActivities.map((activity, index) => (
                      <div key={index} className="bg-gray-100 dark:bg-neutral-700 p-2 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(activity.time), 'PPp')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-2">
    <Icon size={20} className="text-gray-500 dark:text-gray-400" />
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-base text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const StatItem = ({ label, value }) => (
  <div className="bg-gray-100 dark:bg-neutral-700 p-3 rounded-lg">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getUsers(usersPerPage, (currentPage - 1) * usersPerPage);
      setUsers(result.users);
      setTotalUsers(result.total);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchUsers();

    const unsubscribe = subscribeToRealtimeUpdates((eventType, payload) => {
      if (eventType === 'user_created') {
        setUsers(prevUsers => [payload, ...prevUsers.slice(0, -1)]);
        setTotalUsers(prevTotal => prevTotal + 1);
      } else if (eventType === 'user_updated') {
        setUsers(prevUsers => prevUsers.map(user => user.$id === payload.$id ? payload : user));
        if (selectedUser && selectedUser.$id === payload.$id) {
          setSelectedUser(payload);
        }
      } else if (eventType === 'user_deleted') {
        setUsers(prevUsers => prevUsers.filter(user => user.$id !== payload.$id));
        setTotalUsers(prevTotal => prevTotal - 1);
        if (selectedUser && selectedUser.$id === payload.$id) {
          setSelectedUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, [fetchUsers, selectedUser]);

  const handleUserClick = async (userId) => {
    try {
      const userDetails = await getUserDetails(userId);
      setSelectedUser(userDetails);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setSelectedUser({
        $id: userId,
        name: 'User information unavailable',
        email: 'N/A',
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        recentActivities: [],
      });
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      await updateUser(updatedUser.$id, updatedUser);
      setUsers(users.map(user => user.$id === updatedUser.$id ? updatedUser : user));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user.$id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await banUser(userId);
      setUsers(users.map(user => user.$id === userId ? { ...user, status: 'banned' } : user));
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  // Add this function to refresh user details
  const refreshUserDetails = async () => {
    if (selectedUser) {
      try {
        const updatedUserDetails = await getUserDetails(selectedUser.$id);
        setSelectedUser(updatedUserDetails);
      } catch (error) {
        console.error('Error refreshing user details:', error);
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  if (isLoading) return <div className="flex justify-center items-center h-full">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-gray-900 dark:text-white mb-8"
      >
        User Management
      </motion.h1>

      <div className="mb-6 flex justify-between items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={20} />
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md flex items-center">
          <IconUserPlus size={20} className="mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-neutral-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Booking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr 
                key={user.$id} 
                className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors duration-150 ease-in-out cursor-pointer"
                onClick={() => handleUserClick(user.$id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <Image className="h-10 w-10 rounded-full" src={user.avatar || '/default-avatar.png'} alt="" width={40} height={40} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">{user.lastBooking}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    className="text-indigo-600 hover:text-indigo-900 mr-4" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserClick(user.$id);
                    }}
                  >
                    <IconEye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center items-center space-x-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
        >
          <IconChevronLeft size={20} />
        </button>
        <span className="text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
        >
          <IconChevronRight size={20} />
        </button>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
            onBan={handleBanUser}
            onRefresh={refreshUserDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
