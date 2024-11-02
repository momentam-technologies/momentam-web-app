import React, { useState } from 'react';
import PayoutProcessingModal from './PayoutProcessingModal';

const PayoutManagement = ({ pendingPayouts }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payout Management</h3>
      <p className="text-sm text-gray-500 dark:text-gray-300">Pending Payouts: TZS {pendingPayouts.toLocaleString()}</p>
      <button
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        onClick={() => setShowModal(true)}
      >
        Process Payouts
      </button>
      <PayoutProcessingModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default PayoutManagement;
