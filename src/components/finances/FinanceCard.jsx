"use client";
import React from 'react';
import { IconCurrencyDollar, IconChartBar, IconUsers, IconClock, IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

const FinanceCard = ({ title, value, iconType, change }) => {
  const getIcon = () => {
    switch (iconType) {
      case 'revenue':
        return <IconCurrencyDollar size={24} />;
      case 'profit':
        return <IconChartBar size={24} />;
      case 'payouts':
        return <IconUsers size={24} />;
      case 'dailyRevenue':
        return <IconClock size={24} />;
      case 'growth':
        return <IconArrowUpRight size={24} />;
      case 'losses':
        return <IconArrowDownRight size={24} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value.toLocaleString()}</p>
        {change !== undefined && (
          <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
      <div className="text-blue-500 dark:text-blue-400">
        {getIcon()}
      </div>
    </div>
  );
};

export default FinanceCard;
