"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconFilter, IconCalendar, IconRefresh, IconDownload, IconChartBar, IconCurrencyDollar, IconUsers, IconClock, IconCalendarStats, IconChevronDown } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { getSession } from "next-auth/react";
import { getAllBookings } from "./_action";
import { toast } from 'sonner';


// Dynamically import components with SSR disabled
const BookingsTable = dynamic(() => import('@/components/ui/BookingsTable'), { ssr: false });
const BookingDetailsModal = dynamic(() => import('@/components/ui/BookingDetailsModal'), { ssr: false });
// const BookingStatsCard = dynamic(() => import('@/components/ui/BookingStatsCard'), { ssr: false });
// const BookingTrendGraph = dynamic(() => import('@/components/ui/BookingTrendGraph'), { ssr: false });

const BookingsPage = () => {
  // State for bookings data
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bookingsPerPage = 10;

  // const [selectedMonths, setSelectedMonths] = useState([]);

  // Function to get last 12 months
  // const getLast12Months = () => {
  //   const months = [];
  //   const today = new Date();
  //   for (let i = 0; i < 12; i++) {
  //     const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
  //     months.push({
  //       value: date.toISOString().slice(0, 7),
  //       label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
  //     });
  //   }
  //   return months;
  // };

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      const data = await getAllBookings(session.accessToken);
      setBookings(data);
      setTotalPages(Math.ceil(data.length / bookingsPerPage));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and monitor all bookings across the platform
        </p>
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
            onClick={() => toast.warning("Export feature coming soon")}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconRefresh size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => toast.warning("Export feature coming soon")}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
            >
              <IconDownload size={20} />
              <IconChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <BookingsTable
        bookings={bookings}
        onViewBooking={setSelectedBooking}
        isLoading={isLoading}
      />

      {/* Update Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${currentPage === 1
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
                  className={`px-4 py-2 rounded-lg ${currentPage === page
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
            className={`px-4 py-2 rounded-lg ${currentPage === totalPages
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingsPage;