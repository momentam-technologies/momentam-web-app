import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBookmark, IconUserCheck, IconUserPlus, IconCamera, IconActivity, 
         IconFilter, IconSearch, IconDotsVertical, IconClock } from '@tabler/icons-react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { safeFormatDate } from '@/utils/dateUtils';

const RecentActivitiesCard = ({ activities }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden h-[536px]"
    >
      {/* Header - 116px total (p-6 + content) */}
      <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-400/10">
              <IconActivity className="text-purple-500 dark:text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Recent Activities
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Platform updates and events
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              <IconFilter size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              <IconDotsVertical size={20} />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Activities List - remaining height: 420px */}
      <div className="h-[420px] overflow-y-auto">
        <InfiniteScroll
          dataLength={activities.length}
          // next={loadMoreActivities}
          hasMore={true}
          loader={
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          }
          height={420}
          className="p-4 space-y-3"
        >
          {activities.map((activity, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group bg-white dark:bg-neutral-700/50 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-300 border border-gray-100 dark:border-neutral-600"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300
                  ${activity.type === 'booking' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500' : ''}
                  ${activity.type === 'photographer_status' ? 'bg-green-100 dark:bg-green-500/20 text-green-500' : ''}
                  ${activity.type === 'user_registration' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-500' : ''}
                  ${activity.type === 'photographer_registration' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-500' : ''}
                `}>
                  {activity.type === 'booking' && <IconBookmark size={24} />}
                  {activity.type === 'photographer_status' && <IconUserCheck size={24} />}
                  {activity.type === 'user_registration' && <IconUserPlus size={24} />}
                  {activity.type === 'photographer_registration' && <IconCamera size={24} />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-200 font-medium group-hover:text-purple-500 transition-colors">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <IconClock size={16} className="mr-1" />
                    {safeFormatDate(activity.time, 'MMM dd, yyyy - HH:mm')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </InfiniteScroll>
      </div>
    </motion.div>
  );
};

export default RecentActivitiesCard;
