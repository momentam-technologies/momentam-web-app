"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconFilter, IconCalendar, IconRefresh, IconDownload, 
         IconChartBar, IconCurrencyDollar, IconUsers, IconClock, IconCalendarStats, IconChevronDown } from '@tabler/icons-react';
import { getBookings, getBookingStats, getBookingTrends, updateBookingStatus } from '@/lib/bookings';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled
const BookingsTable = dynamic(() => import('@/components/ui/BookingsTable'), { ssr: false });
const BookingDetailsModal = dynamic(() => import('@/components/ui/BookingDetailsModal'), { ssr: false });
const BookingStatsCard = dynamic(() => import('@/components/ui/BookingStatsCard'), { ssr: false });
const BookingTrendGraph = dynamic(() => import('@/components/ui/BookingTrendGraph'), { ssr: false });

const BookingsPage = () => {
  // State for bookings data
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    platformRevenue: 0,
    photographerEarnings: 0
  });
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for UI controls
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bookingsPerPage = 10;

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);

  // Function to get last 12 months
  const getLast12Months = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        value: date.toISOString().slice(0, 7),
        label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined,
        dateRange: dateRange
      };

      const [bookingsData, statsData, trendsData] = await Promise.all([
        getBookings(bookingsPerPage, (currentPage - 1) * bookingsPerPage, filters),
        getBookingStats(),
        getBookingTrends()
      ]);

      setBookings(bookingsData.bookings);
      setTotalPages(Math.ceil(bookingsData.total / bookingsPerPage));
      setStats(statsData);
      setTrends(trendsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings data');
      toast.error('Failed to load bookings data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus, searchTerm, dateRange]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success('Booking status updated successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  // Handle export with filters
  const handleExport = async (format, period = 'all') => {
    try {
      let exportData = [...bookings];

      // Filter by selected months if any
      if (selectedMonths.length > 0) {
        exportData = exportData.filter(booking => 
          selectedMonths.includes((booking.$createdAt || booking.createdAt).slice(0, 7))
        );
      }
      // Filter by period
      else if (period !== 'all') {
        const today = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'thisMonth':
            startDate.setDate(1);
            break;
          case 'lastMonth':
            startDate.setMonth(today.getMonth() - 1, 1);
            today.setDate(0); // Last day of previous month
            break;
          case 'last3Months':
            startDate.setMonth(today.getMonth() - 3);
            break;
          case 'last6Months':
            startDate.setMonth(today.getMonth() - 6);
            break;
        }

        exportData = exportData.filter(booking => {
          const bookingDate = new Date(booking.$createdAt || booking.createdAt);
          return bookingDate >= startDate && bookingDate <= today;
        });
      }

      toast.success(`Exporting ${exportData.length} bookings as ${format.toUpperCase()}`);
      setIsExportMenuOpen(false);
      // Implement actual export logic here
    } catch (error) {
      console.error('Error exporting bookings:', error);
      toast.error('Failed to export bookings');
    }
  };

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
        pageNumbers.push('...');
      }

      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pageNumbers.push('...');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and monitor all bookings across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <BookingStatsCard
          title="Total Bookings"
          value={stats.total}
          icon={IconUsers}
          trend={trends[trends.length - 1]?.total - trends[trends.length - 2]?.total}
        />
        <BookingStatsCard
          title="Active Bookings"
          value={stats.active}
          icon={IconClock}
          trend={stats.active - stats.pending}
        />
        <BookingStatsCard
          title="Total Revenue"
          value={`TZS ${stats.totalRevenue.toLocaleString()}`}
          icon={IconCurrencyDollar}
          trend={(stats.totalRevenue - stats.platformRevenue) / stats.totalRevenue * 100}
        />
        <BookingStatsCard
          title="Platform Revenue"
          value={`TZS ${stats.platformRevenue.toLocaleString()}`}
          icon={IconChartBar}
          trend={stats.platformRevenue / stats.totalRevenue * 100}
        />
      </div>

      {/* Trend Graph */}
      <div className="mb-8">
        <BookingTrendGraph data={trends} />
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={fetchBookings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconRefresh size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
            >
              <IconDownload size={20} />
              <IconChevronDown size={16} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 z-10">
                {/* Quick Filters */}
                <div className="p-2 border-b border-gray-200 dark:border-neutral-700">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Export</div>
                  {[
                    { label: 'All Bookings', value: 'all' },
                    { label: 'This Month', value: 'thisMonth' },
                    { label: 'Last Month', value: 'lastMonth' },
                    { label: 'Last 3 Months', value: 'last3Months' },
                    { label: 'Last 6 Months', value: 'last6Months' }
                  ].map(period => (
                    <button
                      key={period.value}
                      onClick={() => handleExport('csv', period.value)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                {/* Custom Month Selection */}
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Select Months</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {getLast12Months().map(month => (
                      <label
                        key={month.value}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMonths.includes(month.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMonths([...selectedMonths, month.value]);
                            } else {
                              setSelectedMonths(selectedMonths.filter(m => m !== month.value));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{month.label}</span>
                      </label>
                    ))}
                  </div>
                  {selectedMonths.length > 0 && (
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedMonths([])}
                        className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Export Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <BookingsTable
        bookings={bookings}
        onViewBooking={setSelectedBooking}
        onUpdateStatus={handleStatusUpdate}
        isLoading={isLoading}
      />

      {/* Update Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500'
                : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {typeof page === 'number' ? (
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
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
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-neutral-700 dark:text-gray-500'
                : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onUpdateStatus={handleStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingsPage;