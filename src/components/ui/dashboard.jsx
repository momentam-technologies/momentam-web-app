"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IconUsers, IconCamera, IconCalendar, IconCurrencyDollar, IconUserPlus, IconClock, IconBookmark, IconUserCheck, IconX, IconArrowUpRight, IconArrowDownRight, IconDotsVertical, IconSearch, IconFilter, IconSortAscending, IconSortDescending, IconZoomIn, IconUser, IconMail, IconPhone, IconStar, IconRefresh, IconDownload, IconMaximize, IconShare, IconInfoCircle, IconAlertTriangle, IconChartBar } from '@tabler/icons-react';
// import {
//   getDashboardStats,
//   getYearlyStats,
//   getActiveBookings,
//   getLatestUsers,
//   getRecentActivities,
//   getRecentTransactions,
//   getLivePhotographers,
//   getUserRequests,
//   subscribeToRealtimeUpdates  // Make sure this is imported
// } from '@/lib/dashboard';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';
// import { getCurrentUser } from '@/lib/auth';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CSVLink } from "react-csv";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import Joyride, { STATUS } from 'react-joyride';
import UserDetailsModal from './UserDetailsModal';
import TrendGraph from './TrendGraph';
import DashboardCard from './DashboardCard';
import { Toaster } from 'react-hot-toast';
import RecentTransactionsCard from './RecentTransactions';
import PhotographerMap from './PhotographerMap';
import RecentActivitiesCard from './RecentActivities';
import LatestUsersCard from './LatestUsers';

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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-bold text-gray-800 dark:text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnimatedMarker = ({ children }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
  >
    {children}
  </motion.div>
);

const AllTransactionsModal = ({ isOpen, onClose, transactions }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

  useEffect(() => {
    const filtered = transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm)
    );
    const sorted = [...filtered].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredTransactions(sorted);
  }, [transactions, searchTerm, sortField, sortDirection]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl mx-auto rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Transactions</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <IconX size={24} />
            </button>
          </div>
          <div className="mb-4 flex flex-col md:flex-row justify-between items-center">
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex space-x-2">
              <button onClick={() => toggleSort('amount')} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md">
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => toggleSort('date')} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md">
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">+TZS {transaction.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap any code that uses `window` in a check
const isBrowser = typeof window !== 'undefined';

// Use this check before accessing `window` anywhere in the file
if (isBrowser) {
  // Your code that uses `window`
}

export default function DashboardContent() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPhotographers: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [latestUsers, setLatestUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState({
    totalUsers: 0,
    totalPhotographers: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [yearlyData, setYearlyData] = useState([]);
  const [availablePhotographers, setAvailablePhotographers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [yearOverYearChanges, setYearOverYearChanges] = useState({
    totalUsers: 0,
    totalPhotographers: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [runTour, setRunTour] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [isExpandedMapOpen, setIsExpandedMapOpen] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const tourSteps = [
    {
      target: '.dashboard-title',
      content: 'Welcome to the Momentam HQ Dashboard! This is where you can monitor all key metrics and activities.',
      disableBeacon: true,
    },
    {
      target: '.dashboard-card:nth-child(1)',
      content: 'Here you can see the total number of users on the platform.',
    },
    {
      target: '.dashboard-card:nth-child(2)',
      content: 'This shows the number of active photographers available for bookings.',
    },
    {
      target: '.dashboard-card:nth-child(3)',
      content: 'Keep track of pending bookings that need attention.',
    },
    {
      target: '.dashboard-card:nth-child(4)',
      content: 'Monitor your platform\'s revenue here.',
    },
    {
      target: '.trend-graph',
      content: 'This graph shows trends over the past 12 months for key metrics.',
    },
    {
      target: '.photographer-map',
      content: 'View the current locations of available photographers on this map.',
    },
    {
      target: '.recent-transactions', // Add this class to the RecentTransactionsCard component
      content: 'Here you can see the most recent financial transactions on the platform.',
    },
    {
      target: '.latest-users',
      content: 'See the most recently registered users and their activities.',
    },
    {
      target: '.recent-activity',
      content: 'Keep track of recent platform activities here.',
    },
    {
      target: '.export-data',
      content: 'You can export various data from the dashboard using these buttons.',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  useEffect(() => {
    // Check if it's the user's first visit
    const isFirstVisit = !localStorage.getItem('dashboardTourCompleted');
    if (isFirstVisit) {
      setRunTour(true);
      localStorage.setItem('dashboardTourCompleted', 'true');
    }
  }, []);

  // useEffect(() => {
  //   setUser(getCurrentUser());
  // }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // const [
      //   stats,
      //   yearlyStatsData,
      //   activeBookings,
      //   latestUsers,
      //   recentActivities,
      //   recentTransactions,
      //   livePhotographers,
      //   userRequests
      // ] = await Promise.all([
      //   getDashboardStats(),
      //   getYearlyStats(),
      //   getActiveBookings(),
      //   getLatestUsers(5),
      //   getRecentActivities(5),
      //   getRecentTransactions(5),
      //   getLivePhotographers(),
      //   getUserRequests()
      // ]);

      // setStats({
      //   totalUsers: stats.totalUsers,
      //   totalPhotographers: stats.totalPhotographers,
      //   totalBookings: stats.totalBookings,
      //   revenue: stats.revenue
      // });

      // setChanges(stats.changes);
      // setYearOverYearChanges(yearlyStatsData.yearOverYearChanges);
      // setYearlyData(yearlyStatsData.yearlyData);
      // setLatestUsers(latestUsers);
      // setRecentActivities(recentActivities);
      // setRecentTransactions(recentTransactions);
      // setAvailablePhotographers(livePhotographers);
      // setUserRequests(userRequests);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRealtimeUpdate = useCallback((eventType, payload) => {
    console.log('Received real-time update:', eventType, payload);
    switch (eventType) {
      case 'user_created':
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        setLatestUsers(prev => [payload, ...prev].slice(0, 5));
        break;
      case 'photographer_created':
        setStats(prev => ({ ...prev, totalPhotographers: prev.totalPhotographers + 1 }));
        break;
      case 'user_deleted':
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        setLatestUsers(prev => prev.filter(user => user.$id !== payload.$id));
        break;
      case 'photographer_deleted':
        setStats(prev => ({ ...prev, totalPhotographers: prev.totalPhotographers - 1 }));
        break;
      case 'booking_created':
        setStats(prev => ({ ...prev, totalBookings: prev.totalBookings + 1 }));
        setRecentActivities(prev => [{
          type: 'booking',
          description: `${JSON.parse(payload.userDetails).name} made a new ${payload.package} booking`,
          time: payload.$createdAt
        }, ...prev].slice(0, 5));
        break;
      case 'booking_completed':
        setStats(prev => ({
          ...prev,
          revenue: prev.revenue + parseFloat(payload.price || 0)
        }));
        break;
    }
  }, []);

  // useEffect(() => {
  //   const unsubscribe = subscribeToRealtimeUpdates(handleRealtimeUpdate);
  //   return () => {
  //     if (unsubscribe) unsubscribe();
  //   };
  // }, [handleRealtimeUpdate]);

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     getYearlyStats().then(({ yearlyData }) => setYearlyData(yearlyData));
  //   }, 5 * 60 * 1000); // Refresh every 5 minutes

  //   return () => clearInterval(intervalId);
  // }, []);

  const calculatePercentageChange = (oldValue, newValue) => {
    if (oldValue === 0 && newValue === 0) return 0;
    if (oldValue === 0) return 100;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  };

  // const loadMoreUsers = async () => {
  //   const newUsers = await getLatestUsers(5, userPage * 5);
  //   setLatestUsers([...latestUsers, ...newUsers]);
  //   setUserPage(userPage + 1);
  // };

  // const loadMoreActivities = async () => {
  //   const newActivities = await getRecentActivities(5, activityPage * 5);
  //   setRecentActivities([...recentActivities, ...newActivities]);
  //   setActivityPage(activityPage + 1);
  // };

  useEffect(() => {
    console.log('Yearly Data:', yearlyData); // Add this to check the data structure
  }, [yearlyData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen relative">
      <Toaster position="top-right" />
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        styles={{
          options: {
            primaryColor: '#0284c7',
          },
        }}
        callback={handleJoyrideCallback}
      />
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <AnimatePresence>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="dashboard-title"
        >
          Welcome, {user?.name}
        </motion.h1>
        
        <main id="main-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard 
              title="Total Users" 
              value={stats.totalUsers.toLocaleString()} 
              icon={IconUsers} 
              change={changes.totalUsers}
              yearOverYearChange={yearOverYearChanges.totalUsers}
            />
            <DashboardCard 
              title="Total Photographers" 
              value={stats.totalPhotographers.toLocaleString()} 
              icon={IconCamera} 
              change={changes.totalPhotographers}
              yearOverYearChange={yearOverYearChanges.totalPhotographers}
            />
            <DashboardCard 
              title="Total Bookings" 
              value={stats.totalBookings.toLocaleString()} 
              icon={IconCalendar} 
              change={changes.totalBookings}
              yearOverYearChange={yearOverYearChanges.totalBookings}
            />
            <DashboardCard 
              title="Revenue" 
              value={`TZS ${stats.revenue.toLocaleString()}`} 
              icon={IconCurrencyDollar} 
              change={changes.revenue}
              yearOverYearChange={yearOverYearChanges.revenue}
            />
          </div>

          <div className="trend-graph">
            <TrendGraph data={yearlyData || []} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="photographer-map">
              <PhotographerMap 
                photographers={availablePhotographers}
                userRequests={userRequests}
                onExpandMap={() => setIsMapExpanded(true)}
              />
            </div>
            <div className="recent-transactions">
              <RecentTransactionsCard 
                transactions={recentTransactions} 
                onViewAllTransactions={() => setIsAllTransactionsModalOpen(true)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="latest-users">
              <LatestUsersCard users={latestUsers} />
            </div>
            <div className="recent-activity">
              <RecentActivitiesCard 
                activities={recentActivities} 
              />
            </div>
          </div>
        </main>
      </AnimatePresence>
      <div role="status" aria-live="polite" className="sr-only">
        {/* Update this content when real-time updates occur */}
        Dashboard data updated
      </div>
      {isAllTransactionsModalOpen && (
        <AllTransactionsModal 
          isOpen={isAllTransactionsModalOpen}
          onClose={() => setIsAllTransactionsModalOpen(false)}
          transactions={allTransactions}
        />
      )}
      <AnimatePresence>
        {isMapExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="absolute inset-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl"
            >
              <PhotographerMap 
                photographers={availablePhotographers}
                userRequests={userRequests}
                isExpanded={true}
                onClose={() => setIsMapExpanded(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
