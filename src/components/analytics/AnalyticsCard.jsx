import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconDotsVertical, IconChartBar, IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

const AnalyticsCard = ({ title, value, icon: Icon, change }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-visible group"
      role="region"
      aria-label={`${title} statistics`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
              <Icon className="text-blue-500 dark:text-blue-400" size={24} aria-hidden="true" />
            </div>
            <h3 
              className="font-semibold text-lg text-gray-700 dark:text-gray-200" 
              id={`${title.toLowerCase()}-label`}
            >
              {title}
            </h3>
          </div>
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="More options"
            >
              <IconDotsVertical size={20} className="text-gray-400" />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 -mt-20 w-56 rounded-xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 z-[1000] overflow-visible"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                  }}
                >
                  <div className="p-2 space-y-1">
                    {/* View Details */}
                    <button
                      className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                      <IconChartBar size={18} className="mr-3 text-gray-400 group-hover:text-blue-500" />
                      View Detailed Stats
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Value */}
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <p 
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              aria-labelledby={`${title.toLowerCase()}-label`}
            >
              {value}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        {change !== null && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-neutral-700/50"
          >
            <span className="text-sm text-gray-500 dark:text-gray-400">Change</span>
            <div className="flex items-center space-x-1">
              {change > 0 ? (
                <IconArrowUpRight className="text-green-500" size={16} />
              ) : (
                <IconArrowDownRight className="text-red-500" size={16} />
              )}
              <p className={`text-sm font-medium ${
                change > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {Math.abs(change)}%
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AnalyticsCard; 