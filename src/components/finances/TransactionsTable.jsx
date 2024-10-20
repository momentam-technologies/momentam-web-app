import React from 'react';
import { IconPrinter, IconDownload } from '@tabler/icons-react';

const TransactionsTable = ({ transactions }) => (
  <div className="dashboard-card mb-8">
    <div className="flex justify-between items-center mb-4">
      <h3 className="dashboard-subtitle">Recent Transactions</h3>
      <div className="space-x-2">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center">
          <IconPrinter size={16} className="mr-1" />
          Print
        </button>
        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center">
          <IconDownload size={16} className="mr-1" />
          Export
        </button>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  transaction.type === 'incoming' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={transaction.type === 'incoming' ? 'text-green-600' : 'text-red-600'}>
                  TZS {transaction.amount.toLocaleString()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{transaction.description}</td>
              <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TransactionsTable;
