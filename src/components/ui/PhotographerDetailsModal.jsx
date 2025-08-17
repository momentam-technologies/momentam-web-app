import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { format } from 'date-fns';
import { IconX, IconRefresh, IconUser, IconMail, IconPhone, IconCalendar, 
         IconClock, IconBookmark, IconStar, IconMapPin, IconCamera, IconCurrencyDollar } from '@tabler/icons-react';
import { getPhotographerDetails } from '@/lib/photographers';

const InfoItem = ({ icon: Icon, label, value }) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-700/50"
  >
    <Icon size={20} className="text-blue-500 dark:text-blue-400" />
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-base text-gray-900 dark:text-white">{value}</p>
    </div>
  </motion.div>
);

const StatItem = ({ label, value }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-neutral-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-600"
  >
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
  </motion.div>
);

const PhotographerDetailsModal = ({ photographer, onClose }) => {
  const [photographerDetails, setPhotographerDetails] = useState(photographer);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPhotographerDetails = async () => {
      setIsLoading(true);
      try {
        const details = await getPhotographerDetails(photographer.$id);
        setPhotographerDetails({
          ...details,
          totalBookings: details.stats?.totalBookings || 0,
          completedBookings: details.stats?.completedBookings || 0,
          totalEarnings: details.stats?.totalEarnings || 0,
          rating: details.stats?.rating || 0
        });
      } catch (error) {
        console.error('Error fetching photographer details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhotographerDetails();
  }, [photographer.$id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16">
                <Image
                  src={photographerDetails.avatar || '/default-avatar.png'}
                  alt={photographerDetails.name}
                  layout="fill"
                  className="rounded-xl"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {photographerDetails.name}
                </h2>
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <IconStar size={16} className="text-yellow-400" />
                  <span>{photographerDetails.rating.toFixed(1)}/5</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
            >
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={IconMail} label="Email" value={photographerDetails.email} />
            <InfoItem icon={IconPhone} label="Phone" value={photographerDetails.phone || 'N/A'} />
            <InfoItem icon={IconCalendar} label="Joined" value={format(new Date(photographerDetails.$createdAt), 'PPP')} />
            <InfoItem icon={IconMapPin} label="Location" value={photographerDetails.location || 'Not specified'} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem label="Total Bookings" value={photographerDetails.totalBookings} />
            <StatItem label="Completed" value={photographerDetails.completedBookings} />
            <StatItem label="Rating" value={`${photographerDetails.rating.toFixed(1)}/5`} />
            <StatItem label="Earnings" value={`TZS ${photographerDetails.totalEarnings.toLocaleString()}`} />
          </div>

          {/* Recent Activity */}
          {photographerDetails.bookings && photographerDetails.bookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
              <div className="space-y-3">
                {photographerDetails.bookings.slice(0, 5).map((booking, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{booking.package}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(booking.$createdAt || booking.created || booking.date), 'PPp')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        booking.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-neutral-700/50 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {}}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
            >
              <IconRefresh size={16} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhotographerDetailsModal; 