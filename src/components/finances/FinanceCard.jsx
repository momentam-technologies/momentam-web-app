"use client";
import React from 'react';

const FinanceCard = ({ title, value, iconType, change }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md">
      <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">TZS {value.toLocaleString()}</p>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
        </p>
      )}
    </div>
  );
};

export default FinanceCard;
