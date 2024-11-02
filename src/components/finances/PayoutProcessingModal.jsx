import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPhotographerPayouts, processPayouts } from '@/lib/finances';
import { IconDownload, IconSearch } from '@tabler/icons-react';

const PayoutProcessingModal = ({ show, onClose }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        const data = await getPhotographerPayouts();
        setPayouts(data);
      } catch (error) {
        console.error('Error fetching payouts:', error);
        setError('Failed to load payouts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchPayouts();
    }
  }, [show]);

  const handleProcessPayouts = async () => {
    if (!window.confirm('Are you sure you want to process these payouts?')) return;

    try {
      setLoading(true);
      await processPayouts(payouts);
      alert('Payouts processed successfully!');
      onClose();
    } catch (error) {
      console.error('Error processing payouts:', error);
      setError('Failed to process payouts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(payout =>
    payout.photographerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Process Payouts</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                &times;
              </button>
            </div>
            <div className="flex items-center mb-4">
              <input
                type="text"
                placeholder="Search photographers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-md dark:bg-neutral-700 dark:text-white"
              />
              <IconSearch size={20} className="ml-2 text-gray-500 dark:text-gray-300" />
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="text-center">Loading payouts...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-neutral-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Photographer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Completed Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending Payout</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayouts.map((payout) => (
                      <tr key={payout.photographerId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payout.photographerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{payout.completedBookings}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{payout.pendingPayout.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{payout.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => alert('Exporting data...')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                <IconDownload size={16} className="mr-2" />
                Export
              </button>
              <div>
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md mr-2"
                >
                  Close
                </button>
                <button
                  onClick={handleProcessPayouts}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  disabled={loading}
                >
                  Process Payouts
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PayoutProcessingModal; 