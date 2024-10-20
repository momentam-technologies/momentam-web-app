import React from 'react';
import { IconBuildingBank, IconCreditCard, IconWallet } from '@tabler/icons-react';

const PayoutManagement = ({ pendingPayouts }) => (
  <div className="dashboard-card">
    <h3 className="dashboard-subtitle mb-4">Payout Management</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold text-lg mb-2">Pending Payouts</h4>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-4">TZS {pendingPayouts.toLocaleString()}</p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Process Payouts
        </button>
      </div>
      <div>
        <h4 className="font-semibold text-lg mb-2">Payout Methods</h4>
        <ul className="space-y-2">
          <li className="flex items-center">
            <IconBuildingBank className="mr-2 text-gray-600 dark:text-gray-400" />
            Bank Transfer
          </li>
          <li className="flex items-center">
            <IconCreditCard className="mr-2 text-gray-600 dark:text-gray-400" />
            PayPal
          </li>
          <li className="flex items-center">
            <IconWallet className="mr-2 text-gray-600 dark:text-gray-400" />
            Mobile Money
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export default PayoutManagement;
