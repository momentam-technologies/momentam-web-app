import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { format } from 'date-fns';
import { safeFormatDate } from '@/utils/dateUtils';
import { IconX, IconCheck, IconX as IconReject, IconDownload, IconUser, IconCalendar, IconPhoto } from '@tabler/icons-react';

const PhotoDetailsModal = ({ photo, onClose, onStatusChange }) => {
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
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex h-[80vh]">
          {/* Photo Preview */}
          <div className="flex-1 relative bg-black">
            <Image
              src={photo.photoUrl}
              alt="Photo preview"
              layout="fill"
              objectFit="contain"
            />
          </div>

          {/* Details Sidebar */}
          <div className="w-96 flex flex-col border-l border-gray-200 dark:border-neutral-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Photo Details</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  photo.status === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                    : photo.status === 'rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                }`}>
                  {photo.status || 'pending'}
                </span>
              </div>

              {/* Photographer */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Photographer</h4>
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src={photo.photographer?.avatar || '/default-avatar.png'}
                      alt={photo.photographer?.name}
                      layout="fill"
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{photo.photographer?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{photo.photographer?.email}</p>
                  </div>
                </div>
              </div>

              {/* Client */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Client</h4>
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src={photo.client?.avatar || '/default-avatar.png'}
                      alt={photo.client?.name}
                      layout="fill"
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{photo.client?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{photo.client?.email}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Booking</h4>
                <div className="space-y-2">
                  <p className="text-sm">{photo.booking?.package}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {safeFormatDate(photo.booking?.date, 'PPP')}
                  </p>
                </div>
              </div>

              {/* Upload Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Upload Info</h4>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>Uploaded: {safeFormatDate(photo.$createdAt, 'PPp')}</p>
                  {photo.status === 'approved' && photo.approvedAt && (
                    <p>Approved: {safeFormatDate(photo.approvedAt, 'PPp')}</p>
                  )}
                  {photo.status === 'rejected' && photo.rejectedAt && (
                    <p>Rejected: {safeFormatDate(photo.rejectedAt, 'PPp')}</p>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {photo.adminNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
                  <p className="text-sm">{photo.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-neutral-700 space-y-2">
              {photo.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onStatusChange('approved')}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <IconCheck size={20} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => onStatusChange('rejected')}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <IconReject size={20} />
                    <span>Reject</span>
                  </button>
                </div>
              )}
              <button
                onClick={() => window.open(photo.photoUrl, '_blank')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <IconDownload size={20} />
                <span>Download Original</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhotoDetailsModal; 