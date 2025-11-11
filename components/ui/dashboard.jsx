"use client";
import React, { useState, useEffect } from 'react';
import { IconUsers, IconCamera, IconCalendar, IconCurrencyDollar, IconX } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import TrendGraph from './TrendGraph';
import DashboardCard from './DashboardCard';
import RecentTransactionsCard from './RecentTransactions';
import PhotographerMap from './PhotographerMap';
import { getAllClients } from '@/app/dashboard/users/_action';
import { getAllPhotographers } from '@/app/dashboard/photographers/_action';
import { getAllBookings } from "@/app/dashboard/bookings/_action";
import { getSession } from "next-auth/react";

// Dummy data
const DUMMY_YEARLY_DATA = [
  { month: 'Jan', users: 100, bookings: 50, revenue: 500000 },
  { month: 'Feb', users: 150, bookings: 60, revenue: 600000 },
  { month: 'Mar', users: 130, bookings: 55, revenue: 550000 },
];
const DUMMY_REQUESTS = [
  { $id: 'r1', lat: -6.775, lng: 39.179, name: 'Charlie', requestType: 'Photography', eventLocation: 'Dar es Salaam', $createdAt: new Date().toISOString() },
];
const DUMMY_TRANSACTIONS = [
  { id: 't1', date: new Date().toISOString(), description: 'Booking Payment', category: 'Booking', amount: 50000, status: 'Completed' },
  { id: 't2', date: new Date().toISOString(), description: 'Service Fee', category: 'Fee', amount: 10000, status: 'Completed' },
];
const DUMMY_ACTIVITIES = [
  { id: 'a1', type: 'booking', description: 'Alice booked a session', time: new Date().toISOString() },
  { id: 'a2', type: 'photographer', description: 'Bob became available', time: new Date().toISOString() },
];

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

export default function DashboardContent() {
  const [stats, setStats] = useState({ totalUsers: 0, totalPhotographers: 0, totalBookings: 0, revenue: 0 });

  const [availablePhotographers, setAvailablePhotographers] = useState([]);
  const [latestUsers, setLatestUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState(DUMMY_ACTIVITIES);
  const [yearlyData, setYearlyData] = useState(DUMMY_YEARLY_DATA);
  const [recentTransactions, setRecentTransactions] = useState(DUMMY_TRANSACTIONS);
  const [userRequests, setUserRequests] = useState(DUMMY_REQUESTS);
  const [allTransactions, setAllTransactions] = useState(DUMMY_TRANSACTIONS);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [changes, setChanges] = useState({ totalUsers: 0, totalPhotographers: 0, totalBookings: 0, revenue: 0 });
  const [yearOverYearChanges, setYearOverYearChanges] = useState({ totalUsers: 0, totalPhotographers: 0, totalBookings: 0, revenue: 0 });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const session = await getSession();
        if (!session?.accessToken) throw new Error("Not authenticated");

        const clients = await getAllClients(session.accessToken);
        const photographers = await getAllPhotographers(session.accessToken);
        const bookings = await getAllBookings(session.accessToken);

        setUserEmail(session.user?.email || "User");

        setStats({
          totalUsers: clients?.length || 0,
          totalPhotographers: photographers?.length || 0,
          totalBookings: bookings?.length || 0,
          revenue: bookings?.reduce((sum, b) => sum + (b.amount || 0), 0),
        });

        setChanges({
          totalUsers: clients?.length || 0,
          totalPhotographers: photographers?.length || 0,
          totalBookings: bookings?.length || 0,
          revenue: 500000,
        });

        setYearOverYearChanges({
          totalUsers: clients?.length || 0,
          totalPhotographers: photographers?.length || 0,
          totalBookings: bookings?.length || 0,
          revenue: 500000,
        });

        setLatestUsers(clients?.slice(0, 5));
        
        setAvailablePhotographers(
          photographers?.map(p => ({
            $id: p.$id,
            name: p.name,
            location: p.location,
            rating: p.rating || 0,
          }))
        );

        setUserRequests(
          bookings?.map(b => ({
            $id: b.$id,
            lat: b.lat || 0,
            lng: b.lng || 0,
            name: b.clientName || 'Unknown',
            requestType: b.type || 'Photography',
            eventLocation: b.eventLocation || 'N/A',
            $createdAt: b.$createdAt,
          }))
        );

        setRecentTransactions(
          bookings?.slice(0, 5).map(b => ({
            id: b.$id,
            date: b.$createdAt,
            description: b.description || 'Booking Payment',
            category: 'Booking',
            amount: b.amount || 0,
            status: b.status || 'Pending',
          }))
        );

        setAllTransactions(
          bookings?.map(b => ({
            id: b.$id,
            date: b.$createdAt,
            description: b.description || 'Booking Payment',
            category: 'Booking',
            amount: b.amount || 0,
            status: b.status || 'Completed',
          }))
        );

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen relative">
      <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
      <AnimatePresence>
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="dashboard-title">
          Welcome back, {userEmail.split('@')[0]}
        </motion.h1>

        <main id="main-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={IconUsers} change={changes.totalUsers} yearOverYearChange={yearOverYearChanges.totalUsers} />
            <DashboardCard title="Total Photographers" value={stats.totalPhotographers.toLocaleString()} icon={IconCamera} change={changes.totalPhotographers} yearOverYearChange={yearOverYearChanges.totalPhotographers} />
            <DashboardCard title="Total Bookings" value={stats.totalBookings.toLocaleString()} icon={IconCalendar} change={changes.totalBookings} yearOverYearChange={yearOverYearChanges.totalBookings} />
            <DashboardCard title="Revenue" value={`TZS ${stats.revenue.toLocaleString()}`} icon={IconCurrencyDollar} change={changes.revenue} yearOverYearChange={yearOverYearChanges.revenue} />
          </div>

          <div className="trend-graph">
            <TrendGraph data={yearlyData || []} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="photographer-map">
              <PhotographerMap photographers={availablePhotographers} userRequests={userRequests} onExpandMap={() => setIsMapExpanded(true)} />
            </div>
            <div className="recent-transactions">
              <RecentTransactionsCard transactions={recentTransactions} onViewAllTransactions={() => setIsAllTransactionsModalOpen(true)} />
            </div>
          </div>
        </main>
      </AnimatePresence>

      {isAllTransactionsModalOpen && (
        <AllTransactionsModal isOpen={isAllTransactionsModalOpen} onClose={() => setIsAllTransactionsModalOpen(false)} transactions={allTransactions} />
      )}

      <AnimatePresence>
        {isMapExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="absolute inset-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl">
              <PhotographerMap photographers={availablePhotographers} userRequests={userRequests} isExpanded={true} onClose={() => setIsMapExpanded(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}