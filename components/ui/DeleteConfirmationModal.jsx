import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAlertTriangle, IconLock, IconX } from '@tabler/icons-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, userName }) => {
  const [step, setStep] = useState(1); // 1 for confirmation, 2 for password
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSubmit = () => {
    if (password === '12345678') {
      setError('');
      onConfirm();
      onClose();
    } else {
      setError('Incorrect password');
    }
  };

  if (!isOpen) return null;

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
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="confirm"
                initial={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                className="p-6"
              >
                <div className="flex items-center justify-center mb-4 text-red-500">
                  <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-full">
                    <IconAlertTriangle size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Delete User</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-700 dark:text-gray-300">{userName}</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="password"
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                className="p-6"
              >
                <div className="flex items-center justify-center mb-4 text-blue-500">
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full">
                    <IconLock size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Enter Admin Password</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                  Please enter your admin password to confirm deletion.
                </p>
                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        error ? 'border-red-500' : 'border-gray-200 dark:border-neutral-700'
                      } bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter password"
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-500">{error}</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePasswordSubmit}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeleteConfirmationModal; 