"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { IconUsers, IconCamera, IconCalendar, IconCurrencyDollar, IconUserPlus, IconClock, IconBookmark, IconUserCheck, IconX, IconArrowUpRight, IconArrowDownRight, IconDotsVertical } from '@tabler/icons-react';
import { getYearlyStats, getLatestUsers, getRecentActivities, subscribeToRealtimeUpdates } from '@/lib/appwrite';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const DashboardCard = ({ title, value, icon: Icon, change }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">{title}</h3>
      <Icon className="text-blue-500 dark:text-blue-400" size={24} />
    </div>
    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    {change !== null && (
      <p className={`text-sm mt-2 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
      </p>
    )}
  </motion.div>
);

const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <IconX size={24} />
            </button>
          </div>
          <div className="flex items-center mb-6">
            <Image
              src={user.avatar || '/default-avatar.png'}
              alt={user.name}
              width={80}
              height={80}
              className="rounded-full mr-4"
            />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{user.phone || 'No phone number'}</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{user.type}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Joined</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{format(new Date(user.$createdAt), 'PPP')}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{user.status || 'Active'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Total Bookings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{user.totalBookings || 0}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Last Active</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{user.lastActive ? format(new Date(user.lastActive), 'PPP') : 'N/A'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Activities</h3>
            {user.recentActivities && user.recentActivities.length > 0 ? (
              <ul className="space-y-2">
                {user.recentActivities.map((activity, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-neutral-700 p-2 rounded">
                    <span className="font-semibold">{activity.type}: </span>
                    {activity.description}
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(activity.time), 'PPp')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">No recent activities</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const LatestUsersCard = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md h-[400px] overflow-hidden"
      >
        <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-4">Latest Users</h3>
        <div className="space-y-4 h-[calc(100%-2rem)] overflow-y-auto hide-scrollbar">
          {users.map((user, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
              onClick={() => setSelectedUser(user)}
            >
              <Image
                src={user.avatar || '/default-avatar.png'}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <span className="ml-auto text-xs font-medium text-gray-500 dark:text-gray-400">
                {user.type === 'photographer' ? 'Photographer' : 'User'}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
};

const RecentActivityCard = ({ activities }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md h-[400px] overflow-hidden"
  >
    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-4">Recent Activity</h3>
    <div className="space-y-4 h-[calc(100%-2rem)] overflow-y-auto hide-scrollbar">
      {activities.map((activity, index) => (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg"
        >
          {activity.type === 'booking' && <IconBookmark className="text-blue-500 mt-1" size={20} />}
          {activity.type === 'photographer_status' && <IconUserCheck className="text-green-500 mt-1" size={20} />}
          {activity.type === 'user_registration' && <IconUserPlus className="text-purple-500 mt-1" size={20} />}
          {activity.type === 'photographer_registration' && <IconCamera className="text-yellow-500 mt-1" size={20} />}
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">{activity.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(activity.time).toLocaleString()}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const TrendGraph = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.6 }}
    className="dashboard-card w-full mt-8"
  >
    <h3 className="dashboard-subtitle">12 Month Trend Overview</h3>
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="photographers" stroke="#82ca9d" activeDot={{ r: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#ffc658" activeDot={{ r: 8 }} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ff7300" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

const PhotographerMap = ({ photographers }) => {
  if (typeof window === 'undefined') {
    return null; // Return null on the server-side
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="dashboard-card h-[400px]"
    >
      <h3 className="dashboard-subtitle">Available Photographers</h3>
      <div className="h-[calc(100%-2rem)] w-full">
        <MapContainer center={[-6.776012, 39.178326]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {photographers.map((photographer, index) => (
            <Marker 
              key={index} 
              position={[photographer.lat, photographer.lng]}
              icon={L.divIcon({
                html: `<div class="bg-blue-500 rounded-full p-2"><span class="text-white">${photographer.name[0]}</span></div>`,
                className: 'custom-icon'
              })}
            >
              <Popup>
                <div>
                  <h4 className="font-bold">{photographer.name}</h4>
                  <p>Rating: {photographer.rating}</p>
                  <p>Available: {photographer.available ? 'Yes' : 'No'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
};

const RecentTransactionsCard = ({ transactions }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.8 }}
    className="dashboard-card h-[400px] overflow-hidden flex flex-col"
  >
    <div className="flex justify-between items-center mb-6">
      <h3 className="dashboard-subtitle mb-0">Recent Transactions</h3>
      <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <IconDotsVertical size={20} />
      </button>
    </div>
    <div className="space-y-4 overflow-y-auto flex-grow scrollbar-hide pr-2">
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white dark:bg-neutral-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {transaction.amount > 0 ? <IconArrowUpRight size={24} /> : <IconArrowDownRight size={24} />}
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{transaction.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(transaction.date), 'MMM dd, yyyy - HH:mm')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.amount > 0 ? '+' : '-'}TZS {Math.abs(transaction.amount).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.status}</p>
          </div>
        </motion.div>
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
      <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">
        View All Transactions
      </button>
    </div>
  </motion.div>
);

// Wrap any code that uses `window` in a check
const isBrowser = typeof window !== 'undefined';

// Use this check before accessing `window` anywhere in the file
if (isBrowser) {
  // Your code that uses `window`
}

export default function DashboardContent() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePhotographers: 0,
    pendingBookings: 0,
    revenue: 0,
  });
  const [latestUsers, setLatestUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState({
    totalUsers: 0,
    activePhotographers: 0,
    pendingBookings: 0,
    revenue: 0,
  });
  const [yearlyData, setYearlyData] = useState([]);
  const [availablePhotographers, setAvailablePhotographers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, description: 'Booking payment from John Doe', amount: 50000, date: '2023-06-01T14:30:00', category: 'Booking', status: 'Completed' },
    { id: 2, description: 'Photographer payout to Jane Smith', amount: -35000, date: '2023-06-02T09:15:00', category: 'Payout', status: 'Processed' },
    { id: 3, description: 'Service fee', amount: 5000, date: '2023-06-03T11:45:00', category: 'Fee', status: 'Completed' },
    { id: 4, description: 'Booking refund to Mike Johnson', amount: -20000, date: '2023-06-04T16:20:00', category: 'Refund', status: 'Pending' },
    { id: 5, description: 'Premium subscription from Sarah Lee', amount: 10000, date: '2023-06-05T10:00:00', category: 'Subscription', status: 'Completed' },
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [yearlyStatsData, latestUsersData, recentActivitiesData] = await Promise.all([
        getYearlyStats(),
        getLatestUsers(5),
        getRecentActivities(5)
      ]);

      console.log('Yearly stats:', yearlyStatsData);

      const { yearlyData, currentMonthStats, previousMonthStats } = yearlyStatsData;

      setStats({
        totalUsers: currentMonthStats.users,
        activePhotographers: currentMonthStats.photographers,
        pendingBookings: currentMonthStats.bookings,
        revenue: currentMonthStats.revenue,
      });

      setChanges({
        totalUsers: calculatePercentageChange(previousMonthStats.users, currentMonthStats.users),
        activePhotographers: calculatePercentageChange(previousMonthStats.photographers, currentMonthStats.photographers),
        pendingBookings: calculatePercentageChange(previousMonthStats.bookings, currentMonthStats.bookings),
        revenue: calculatePercentageChange(previousMonthStats.revenue, currentMonthStats.revenue),
      });

      setYearlyData(yearlyData);
      setLatestUsers(latestUsersData);
      setRecentActivities(recentActivitiesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = subscribeToRealtimeUpdates((eventType, payload) => {
      // Handle real-time updates here
      console.log('Received real-time update:', eventType, payload);
      fetchDashboardData(); // Refresh data on any update
    });

    return () => unsubscribe();
  }, [fetchDashboardData]);

  useEffect(() => {
    // Fetch available photographers
    const fetchPhotographers = async () => {
      // Replace this with actual API call
      const demoPhotographers = [
        { name: 'John Doe', lat: -6.776012, lng: 39.178326, rating: 4.5, available: true },
        { name: 'Jane Smith', lat: -6.786012, lng: 39.188326, rating: 4.8, available: true },
        // Add more demo photographers as needed
      ];
      setAvailablePhotographers(demoPhotographers);
    };
    fetchPhotographers();
  }, []);

  const calculatePercentageChange = (oldValue, newValue) => {
    if (oldValue === 0 && newValue === 0) return 0;
    if (oldValue === 0) return 100;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <AnimatePresence>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="dashboard-title"
        >
          Overview
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard title="Total Users" value={stats.totalUsers} icon={IconUsers} change={changes.totalUsers} />
          <DashboardCard title="Active Photographers" value={stats.activePhotographers} icon={IconCamera} change={changes.activePhotographers} />
          <DashboardCard title="Pending Bookings" value={stats.pendingBookings} icon={IconCalendar} change={changes.pendingBookings} />
          <DashboardCard title="Revenue" value={`TZS ${stats.revenue.toLocaleString()}`} icon={IconCurrencyDollar} change={changes.revenue} />
        </div>

        <TrendGraph data={yearlyData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <PhotographerMap photographers={availablePhotographers} />
          <RecentTransactionsCard transactions={recentTransactions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <LatestUsersCard users={latestUsers} />
          <RecentActivityCard activities={recentActivities} />
        </div>
      </AnimatePresence>
    </div>
  );
}
