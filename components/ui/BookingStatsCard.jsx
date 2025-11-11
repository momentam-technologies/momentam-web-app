import React from 'react';
import { motion } from 'framer-motion';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

const BookingStatsCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/10">
          <Icon size={24} className="text-blue-500 dark:text-blue-400" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 ${
            trend >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend >= 0 ? (
              <IconArrowUpRight size={20} />
            ) : (
              <IconArrowDownRight size={20} />
            )}
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {title}
      </p>
    </motion.div>
  );
};

export default BookingStatsCard; 