"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconFilter, IconPhoto, IconDownload, IconRefresh, IconCalendar, IconClock, IconCheck, IconX } from '@tabler/icons-react';
import { getPhotosByBookings, getPhotoStats } from '@/lib/photos';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Image from "next/image";
import { format } from 'date-fns';
import DashboardCard from '@/components/ui/DashboardCard';

// Dynamically import components
const BookingPhotosModal = dynamic(() => import('@/components/ui/BookingPhotosModal'), { ssr: false });
const BulkPhotoEditor = dynamic(() => import('@/components/ui/BulkPhotoEditor'), { ssr: false });

const PhotosPage = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalBookings: 0,
    photographerCount: 0,
    clientCount: 0,
    monthlyChange: 0,
    yearOverYearChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bookingsPerPage = 12;

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      };

      const [bookingsData, statsData] = await Promise.all([
        getPhotosByBookings(bookingsPerPage, (currentPage - 1) * bookingsPerPage, filters),
        getPhotoStats()
      ]);

      setBookings(bookingsData.bookings);
      setTotalPages(Math.ceil(bookingsData.total / bookingsPerPage));
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus, searchTerm]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    (<div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Photos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and review photos by bookings
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Photos"
          value={stats.total}
          icon={IconPhoto}
          change={stats.monthlyChange}
          yearOverYearChange={stats.yearOverYearChange}
          description="Total photos uploaded"
        />
        <DashboardCard
          title="Pending Review"
          value={stats.pending}
          icon={IconClock}
          change={((stats.pending / stats.total) * 100).toFixed(1)}
          yearOverYearChange={0}
          description="Photos awaiting review"
          colorClass="text-yellow-500"
        />
        <DashboardCard
          title="Approved"
          value={stats.approved}
          icon={IconCheck}
          change={((stats.approved / stats.total) * 100).toFixed(1)}
          yearOverYearChange={0}
          description="Photos approved"
          colorClass="text-green-500"
        />
        <DashboardCard
          title="Rejected"
          value={stats.rejected}
          icon={IconX}
          change={((stats.rejected / stats.total) * 100).toFixed(1)}
          yearOverYearChange={0}
          description="Photos rejected"
          colorClass="text-red-500"
        />
      </div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name or booking ID..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Photos</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchBookings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <IconRefresh size={20} />
          </button>
        </div>
      </div>
      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((booking) => (
          <motion.div
            key={booking.booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setSelectedBooking(booking)}
          >
            {/* Preview Grid */}
            <div className="grid grid-cols-2 gap-1 aspect-video">
              {booking.photos.slice(0, 4).map((photo, index) => (
                <div key={photo.$id} className="relative">
                  <Image
                    src={photo.photoUrl}
                    alt={`Preview ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>

            {/* Booking Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {booking.client.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(booking.booking.date), 'PP')}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {booking.totalPhotos} photos
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  booking.pendingPhotos > 0
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                    : 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                }`}>
                  {booking.pendingPhotos > 0 ? 'Pending Review' : 'All Reviewed'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Pagination */}
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

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
              }`}
            >
              {page}
            </button>
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
      {/* Booking Photos Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingPhotosModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onUpdate={fetchBookings}
          />
        )}
      </AnimatePresence>
    </div>)
  );
};

export default PhotosPage;