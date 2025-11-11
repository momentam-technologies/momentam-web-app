import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { IconCreditCard, IconCheck, IconX } from '@tabler/icons-react';

const PaymentDetails = ({ payment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <IconCreditCard size={24} className="text-blue-500" />
          <div>
            <p className="font-medium">Payment Status</p>
            <p className="text-sm text-gray-500">{payment.paymentMethod}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          payment.isPaid
            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
        }`}>
          {payment.isPaid ? (
            <div className="flex items-center space-x-1">
              <IconCheck size={16} />
              <span>Paid</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <IconX size={16} />
              <span>Pending</span>
            </div>
          )}
        </span>
      </div>

      {payment.isPaid && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg">
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-medium">{payment.transactionId}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 rounded-lg">
              <p className="text-sm text-gray-500">Payment Date</p>
              <p className="font-medium">
                {format(new Date(payment.paymentDate), 'PPp')}
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PaymentDetails; 