"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IconUsers, IconCamera, IconCalendar, IconCurrencyDollar, IconUserPlus, IconClock, IconBookmark, IconUserCheck, IconX, IconArrowUpRight, IconArrowDownRight, IconDotsVertical, IconSearch, IconFilter, IconSortAscending, IconSortDescending, IconZoomIn, IconUser } from '@tabler/icons-react';
import {
  getYearlyStats,
  getLatestUsers,
  getRecentActivities,
  subscribeToRealtimeUpdates,
  getRecentTransactions,
  getLivePhotographers,
  getUserRequests,
  getActiveBookings
} from '@/lib/appwrite';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';
import { getCurrentUser } from '@/lib/auth';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CSVLink } from "react-csv";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import Joyride, { STATUS } from 'react-joyride';

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

const DashboardCard = ({ title, value, icon: Icon, change, yearOverYearChange }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md"
    role="region"
    aria-label={`${title} statistics`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200" id={`${title.toLowerCase()}-label`}>{title}</h3>
      <Icon className="text-blue-500 dark:text-blue-400" size={24} aria-hidden="true" />
    </div>
    <AnimatePresence mode="wait">
      <motion.p
        key={value}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold text-gray-900 dark:text-white"
        aria-labelledby={`${title.toLowerCase()}-label`}
      >
        {value}
      </motion.p>
    </AnimatePresence>
    <div className="mt-2 space-y-1">
      {change !== null && (
        <div className="flex items-center">
          {change > 0 ? (
            <IconArrowUpRight className="text-green-500 mr-1" size={16} />
          ) : (
            <IconArrowDownRight className="text-red-500 mr-1" size={16} />
          )}
          <p className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`} aria-live="polite">
            {Math.abs(change)}% from last month
          </p>
        </div>
      )}
      {yearOverYearChange !== null && (
        <div className="flex items-center">
          {yearOverYearChange > 0 ? (
            <IconArrowUpRight className="text-green-500 mr-1" size={16} />
          ) : (
            <IconArrowDownRight className="text-red-500 mr-1" size={16} />
          )}
          <p className={`text-sm ${yearOverYearChange > 0 ? 'text-green-500' : 'text-red-500'}`} aria-live="polite">
            {Math.abs(yearOverYearChange)}% year-over-year
          </p>
        </div>
      )}
    </div>
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

const LatestUsersCard = ({ users, loadMoreUsers }) => {
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
        <InfiniteScroll
          dataLength={users.length}
          next={loadMoreUsers}
          hasMore={true}
          loader={<h4>Loading...</h4>}
          height={320}
          className="space-y-4"
        >
          {users.map((user, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
              onClick={() => setSelectedUser(user)}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedUser(user);
                }
              }}
              aria-label={`View details for ${user.name}`}
            >
              <Image
                src={user.avatar || '/default-avatar.png'}
                alt={`Avatar for ${user.name}`}
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
        </InfiniteScroll>
      </motion.div>
      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
};

const RecentActivityCard = ({ activities, loadMoreActivities }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md h-[400px] overflow-hidden"
  >
    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-4">Recent Activity</h3>
    <InfiniteScroll
      dataLength={activities.length}
      next={loadMoreActivities}
      hasMore={true}
      loader={<h4>Loading...</h4>}
      height={320}
      className="space-y-4"
    >
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
    </InfiniteScroll>
  </motion.div>
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

const TrendGraph = ({ data }) => {
  const [focusBar, setFocusBar] = useState(null);

  const handleClick = (_, index) => {
    setFocusBar(focusBar === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="dashboard-card w-full mt-8"
    >
      <h3 className="dashboard-subtitle">12 Month Trend Overview</h3>
      <div className="h-[400px] w-full" aria-label="Trend graph for users, photographers, bookings, and revenue over the last 12 months">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="users" 
              stroke="#8884d8" 
              activeDot={{ 
                r: 8, 
                onClick: handleClick,
                onKeyPress: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e, 0);
                  }
                },
                tabIndex: 0,
                role: "button",
                'aria-label': (props) => `View details for ${props.payload.name}, Users: ${props.payload.users}`
              }} 
              strokeWidth={focusBar === 0 ? 4 : 2}
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="photographers" 
              stroke="#82ca9d" 
              activeDot={{ 
                r: 8, 
                onClick: handleClick,
                onKeyPress: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e, 1);
                  }
                },
                tabIndex: 0,
                role: "button",
                'aria-label': (props) => `View details for ${props.payload.name}, Photographers: ${props.payload.photographers}`
              }} 
              strokeWidth={focusBar === 1 ? 4 : 2}
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="bookings" 
              stroke="#ffc658" 
              activeDot={{ 
                r: 8, 
                onClick: handleClick,
                onKeyPress: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e, 2);
                  }
                },
                tabIndex: 0,
                role: "button",
                'aria-label': (props) => `View details for ${props.payload.name}, Bookings: ${props.payload.bookings}`
              }} 
              strokeWidth={focusBar === 2 ? 4 : 2}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="revenue" 
              stroke="#ff7300" 
              activeDot={{ 
                r: 8, 
                onClick: handleClick,
                onKeyPress: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e, 3);
                  }
                },
                tabIndex: 0,
                role: "button",
                'aria-label': (props) => `View details for ${props.payload.name}, Revenue: TZS ${props.payload.revenue.toLocaleString()}`
              }} 
              strokeWidth={focusBar === 3 ? 4 : 2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {focusBar !== null && data[focusBar] && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-neutral-700 rounded-lg" aria-live="polite">
          <h4 className="font-bold text-lg mb-2">Detailed Information</h4>
          <p>Selected month: {data[focusBar].name}</p>
          <p>Users: {data[focusBar].users}</p>
          <p>Photographers: {data[focusBar].photographers}</p>
          <p>Bookings: {data[focusBar].bookings}</p>
          <p>Revenue: TZS {data[focusBar].revenue.toLocaleString()}</p>
        </div>
      )}
    </motion.div>
  );
};

const PhotographerMap = ({ photographers, userRequests, onExpandMap }) => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="dashboard-card h-[400px] relative"
    >
      <h3 className="dashboard-subtitle">Photographers & User Requests</h3>
      <div className="h-[calc(100%-2rem)] w-full">
        <MapContainer center={[-6.776012, 39.178326]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {photographers.map((photographer, index) => (
            <Marker 
              key={`photographer-${photographer.$id}`}
              position={[photographer.location.split(',')[0], photographer.location.split(',')[1]]}
              icon={L.divIcon({
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-bold text-sm">${photographer.name[0]}</div>`,
                className: 'custom-icon'
              })}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-lg mb-2">{photographer.name}</h4>
                  <p className="mb-1">Rating: {photographer.rating || 'N/A'} ⭐</p>
                  <p className="text-sm text-green-600">Available: Yes</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {userRequests.map((request, index) => (
            <Marker
              key={`request-${index}`}
              position={[request.lat, request.lng]}
              icon={L.divIcon({
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white font-bold text-sm">${request.name[0]}</div>`,
                className: 'custom-icon'
              })}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-lg mb-2">{request.name}</h4>
                  <p className="mb-1">Request: {request.requestType}</p>
                  <p className="text-sm text-gray-600">{format(new Date(request.timestamp), 'PPp')}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <button
        onClick={onExpandMap}
        className="absolute top-2 right-2 bg-white dark:bg-neutral-700 p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
        aria-label="Expand map"
      >
        <IconZoomIn size={24} className="text-blue-500 dark:text-blue-400" />
      </button>
    </motion.div>
  );
};

const RecentTransactionsCard = ({ transactions, onViewAllTransactions }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.8 }}
    className="dashboard-card h-[400px] overflow-hidden flex flex-col recent-transactions"
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
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <IconArrowUpRight size={24} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{transaction.description}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(transaction.date), 'MMM dd, yyyy - HH:mm')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-green-600">
              +TZS {transaction.amount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.status}</p>
          </div>
        </motion.div>
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
      <button 
        onClick={onViewAllTransactions}
        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
      >
        View All Transactions
      </button>
    </div>
  </motion.div>
);

const ExportDataButton = ({ data, filename, format }) => {
  const exportJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  };

  const exportCSV = () => {
    // CSVLink component will handle CSV export
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(JSON.stringify(data, null, 2), 10, 10);
    doc.save(`${filename}.pdf`);
  };

  return (
    <div className="flex space-x-2">
      {format === 'json' && (
        <button
          onClick={exportJSON}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Export JSON
        </button>
      )}
      {format === 'csv' && (
        <CSVLink
          data={data}
          filename={`${filename}.csv`}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Export CSV
        </CSVLink>
      )}
      {format === 'pdf' && (
        <button
          onClick={exportPDF}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Export PDF
        </button>
      )}
    </div>
  );
};

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

const ExpandedMapModal = ({ isOpen, onClose, photographers, userRequests }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    let data = [];
    if (activeTab === 'all' || activeTab === 'photographers') {
      data = [...data, ...photographers.map(p => ({
        ...p,
        type: 'photographer',
        lat: parseFloat(p.location.split(',')[0]),
        lng: parseFloat(p.location.split(',')[1])
      }))];
    }
    if (activeTab === 'all' || activeTab === 'users') {
      data = [...data, ...userRequests.map(u => ({ ...u, type: 'user' }))];
    }
    return data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.requestType && item.requestType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activeTab, searchTerm, photographers, userRequests]);

  const formatCoordinate = (coord) => {
    return typeof coord === 'number' ? coord.toFixed(4) : 'N/A';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-neutral-800 w-full max-w-6xl mx-auto rounded-lg shadow-xl overflow-hidden"
      >
        <div className="flex flex-col h-[80vh]">
          <div className="p-6 bg-gray-100 dark:bg-neutral-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Photographers & User Requests</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <IconX size={24} />
            </button>
          </div>
          <div className="flex-grow flex">
            <div className="w-1/3 p-4 overflow-y-auto border-r border-gray-200 dark:border-gray-600">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-neutral-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4 flex space-x-2">
                {['all', 'photographers', 'users'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-neutral-600 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-neutral-700 p-4 rounded-lg shadow-md"
                  >
                    <div className="flex items-center mb-2">
                      {item.type === 'photographer' ? (
                        <IconCamera size={24} className="text-blue-500 mr-2" />
                      ) : (
                        <IconUser size={24} className="text-green-500 mr-2" />
                      )}
                      <h4 className="font-bold text-lg">{item.name}</h4>
                    </div>
                    {item.rating && <p className="text-sm mb-1">Rating: {item.rating} ⭐</p>}
                    {item.requestType && <p className="text-sm mb-1">Request: {item.requestType}</p>}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Location: {formatCoordinate(item.lat)}, {formatCoordinate(item.lng)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="w-2/3">
              <MapContainer center={[-6.776012, 39.178326]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredData.map((item, index) => (
                  <Marker
                    key={index}
                    position={[item.lat, item.lng]}
                    icon={L.divIcon({
                      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${
                        item.type === 'photographer' ? 'bg-blue-500' : 'bg-green-500'
                      } text-white font-bold text-sm">${item.name[0]}</div>`,
                      className: 'custom-icon'
                    })}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-bold text-lg mb-2">{item.name}</h4>
                        {item.rating && <p className="mb-1">Rating: {item.rating} ⭐</p>}
                        {item.requestType && <p className="mb-1">Request: {item.requestType}</p>}
                        <p className="text-sm text-gray-600">
                          {item.type === 'photographer' ? 'Photographer' : 'User'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [yearOverYearChanges, setYearOverYearChanges] = useState({
    totalUsers: 0,
    activePhotographers: 0,
    pendingBookings: 0,
    revenue: 0,
  });
  const [runTour, setRunTour] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [isExpandedMapOpen, setIsExpandedMapOpen] = useState(false);
  const [userRequests, setUserRequests] = useState([]);

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

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        yearlyStatsData,
        latestUsersData,
        recentActivitiesData,
        allTransactionsData,
        livePhotographersData,
        userRequestsData,
        activeBookingsData
      ] = await Promise.all([
        getYearlyStats(),
        getLatestUsers(5),
        getRecentActivities(5),
        getRecentTransactions(100),
        getLivePhotographers(),
        getUserRequests(),
        getActiveBookings()
      ]);

      const { yearlyData, currentMonthStats, previousMonthStats, lastYearSameMonthStats } = yearlyStatsData;

      setStats({
        totalUsers: currentMonthStats.users,
        activePhotographers: livePhotographersData.length,
        pendingBookings: activeBookingsData.filter(booking => booking.status === 'pending').length,
        revenue: currentMonthStats.revenue,
      });

      setChanges({
        totalUsers: calculatePercentageChange(previousMonthStats.users, currentMonthStats.users),
        activePhotographers: calculatePercentageChange(previousMonthStats.photographers, livePhotographersData.length),
        pendingBookings: calculatePercentageChange(previousMonthStats.bookings, activeBookingsData.filter(booking => booking.status === 'pending').length),
        revenue: calculatePercentageChange(previousMonthStats.revenue, currentMonthStats.revenue),
      });

      setYearOverYearChanges({
        totalUsers: calculatePercentageChange(lastYearSameMonthStats.users, currentMonthStats.users),
        activePhotographers: calculatePercentageChange(lastYearSameMonthStats.photographers, livePhotographersData.length),
        pendingBookings: calculatePercentageChange(lastYearSameMonthStats.bookings, activeBookingsData.filter(booking => booking.status === 'pending').length),
        revenue: calculatePercentageChange(lastYearSameMonthStats.revenue, currentMonthStats.revenue),
      });

      setYearlyData(yearlyData);
      setLatestUsers(latestUsersData);
      setRecentActivities(recentActivitiesData);
      setAllTransactions(allTransactionsData);
      setRecentTransactions(allTransactionsData.slice(0, 5));
      setAvailablePhotographers(livePhotographersData);
      setUserRequests(userRequestsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRealtimeUpdate = useCallback((eventType, payload) => {
    console.log('Received real-time update:', eventType, payload);
    switch (eventType) {
      case 'user_created':
      case 'photographer_created':
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
        setLatestUsers(prev => [payload, ...prev].slice(0, 5));
        break;
      case 'user_deleted':
      case 'photographer_deleted':
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        setLatestUsers(prev => prev.filter(user => user.$id !== payload.$id));
        break;
      case 'booking_created':
        setStats(prev => ({ ...prev, pendingBookings: prev.pendingBookings + 1 }));
        setRecentActivities(prev => [{
          type: 'booking',
          description: `New booking: ${payload.package} by ${JSON.parse(payload.userDetails).name}`,
          time: payload.$createdAt
        }, ...prev].slice(0, 5));
        break;
      case 'booking_updated':
        if (payload.status === 'completed') {
          setStats(prev => ({
            ...prev,
            pendingBookings: prev.pendingBookings - 1,
            revenue: prev.revenue + parseFloat(payload.price)
          }));
        }
        break;
      case 'photographer_status_changed':
        if (payload.bookingStatus === 'available') {
          setStats(prev => ({ ...prev, activePhotographers: prev.activePhotographers + 1 }));
        } else {
          setStats(prev => ({ ...prev, activePhotographers: prev.activePhotographers - 1 }));
        }
        break;
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const unsubscribe = subscribeToRealtimeUpdates(handleRealtimeUpdate);

    return () => unsubscribe();
  }, [fetchDashboardData, handleRealtimeUpdate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getYearlyStats().then(({ yearlyData }) => setYearlyData(yearlyData));
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const calculatePercentageChange = (oldValue, newValue) => {
    if (oldValue === 0 && newValue === 0) return 0;
    if (oldValue === 0) return 100;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  };

  const loadMoreUsers = async () => {
    const newUsers = await getLatestUsers(5, userPage * 5);
    setLatestUsers([...latestUsers, ...newUsers]);
    setUserPage(userPage + 1);
  };

  const loadMoreActivities = async () => {
    const newActivities = await getRecentActivities(5, activityPage * 5);
    setRecentActivities([...recentActivities, ...newActivities]);
    setActivityPage(activityPage + 1);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen relative">
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
              value={stats.totalUsers} 
              icon={IconUsers} 
              change={changes.totalUsers} 
              yearOverYearChange={yearOverYearChanges.totalUsers}
            />
            <DashboardCard 
              title="Active Photographers" 
              value={stats.activePhotographers} 
              icon={IconCamera} 
              change={changes.activePhotographers} 
              yearOverYearChange={yearOverYearChanges.activePhotographers}
            />
            <DashboardCard 
              title="Pending Bookings" 
              value={stats.pendingBookings} 
              icon={IconCalendar} 
              change={changes.pendingBookings} 
              yearOverYearChange={yearOverYearChanges.pendingBookings}
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
            <TrendGraph data={yearlyData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="photographer-map">
              <PhotographerMap 
                photographers={availablePhotographers}
                userRequests={userRequests}
                onExpandMap={() => setIsExpandedMapOpen(true)}
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
              <LatestUsersCard users={latestUsers} loadMoreUsers={loadMoreUsers} />
            </div>
            <div className="recent-activity">
              <RecentActivityCard activities={recentActivities} loadMoreActivities={loadMoreActivities} />
            </div>
          </div>

          <div className="mt-8 export-data">
            <h2 className="dashboard-subtitle">Export Data</h2>
            <div className="flex space-x-4">
              <ExportDataButton data={yearlyData} filename="yearly_stats" format="csv" />
              <ExportDataButton data={latestUsers} filename="latest_users" format="json" />
              <ExportDataButton data={recentActivities} filename="recent_activities" format="csv" />
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
      <ExpandedMapModal
        isOpen={isExpandedMapOpen}
        onClose={() => setIsExpandedMapOpen(false)}
        photographers={availablePhotographers}
        userRequests={userRequests}
      />
    </div>
  );
}
