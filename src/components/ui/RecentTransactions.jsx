import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { IconArrowUpRight, IconDotsVertical, IconDownload, IconFilter, IconSearch, IconSortAscending, IconCurrencyDollar } from '@tabler/icons-react';

const RecentTransactionsCard = ({ transactions, onViewAllTransactions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden h-[536px]"
    >
      {/* Header - 116px total (p-6 + content) */}
      <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-green-500/10 dark:bg-green-400/10">
              <IconCurrencyDollar className="text-green-500 dark:text-green-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Recent Transactions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Latest financial activities
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
              <IconDownload size={20} />
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

        {/* Search and Sort */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
          >
            <IconSortAscending size={20} />
          </motion.button>
        </div>
      </div>

      {/* Transactions List - remaining height: 420px */}
      <div className="h-[420px] overflow-y-auto">
        <div className="p-4 space-y-3">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group bg-white dark:bg-neutral-700/50 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-300 border border-gray-100 dark:border-neutral-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconArrowUpRight size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-500 transition-colors">
                      {transaction.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-600 px-2 py-0.5 rounded-full">
                        {transaction.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy - HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <motion.p 
                    className="font-bold text-lg text-green-600 dark:text-green-400"
                    whileHover={{ scale: 1.05 }}
                  >
                    +TZS {transaction.amount.toLocaleString()}
                  </motion.p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    {transaction.status}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewAllTransactions}
          className="w-full py-2 text-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
        >
          View All Transactions
        </motion.button>
      </div>
    </motion.div>
  );
};

export default RecentTransactionsCard;
