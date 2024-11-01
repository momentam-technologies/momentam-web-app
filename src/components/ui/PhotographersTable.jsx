import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { IconEye, IconEdit, IconTrash, IconBookmark, IconStar, IconCheck, IconX } from '@tabler/icons-react';
import { format } from 'date-fns';

const PhotographersTable = ({ 
  photographers, 
  onViewPhotographer, 
  onEditPhotographer, 
  onDeletePhotographer,
  selectedPhotographers,
  onSelectPhotographer,
  onSelectAll,
  isLoading 
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-neutral-700">
          <tr>
            <th scope="col" className="px-6 py-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedPhotographers.length === photographers.length}
                  onChange={onSelectAll}
                />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Photographer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Stats
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Last Active
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
          {photographers.map((photographer) => (
            <motion.tr
              key={photographer.$id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedPhotographers.includes(photographer.$id)}
                  onChange={() => onSelectPhotographer(photographer.$id)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 relative">
                    <Image
                      src={photographer.avatar || '/default-avatar.png'}
                      alt=""
                      layout="fill"
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {photographer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {photographer.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <IconBookmark size={16} className="text-blue-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{photographer.totalBookings || 0} Bookings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconStar size={16} className="text-yellow-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{photographer.rating || 0} Rating</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  photographer.verified 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                }`}>
                  {photographer.verified ? (
                    <>
                      <IconCheck size={12} className="mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <IconX size={12} className="mr-1" />
                      Unverified
                    </>
                  )}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(photographer.lastLogin || photographer.$updatedAt), 'PPp')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onViewPhotographer(photographer)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <IconEye size={20} />
                </button>
                <button
                  onClick={() => onEditPhotographer(photographer)}
                  className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                >
                  <IconEdit size={20} />
                </button>
                <button
                  onClick={() => onDeletePhotographer(photographer)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <IconTrash size={20} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PhotographersTable; 