"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconFilter, IconPrinter, IconDownload } from '@tabler/icons-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import FinanceCard from '@/components/finances/FinanceCard';
import RevenueChart from '@/components/finances/RevenueChart';
import PaymentMethodsChart from '@/components/finances/PaymentMethodsChart';
import TransactionsTable from '@/components/finances/TransactionsTable';
import PayoutManagement from '@/components/finances/PayoutManagement';

const FinancePage = () => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    pendingPayouts: 0,
    dailyRevenue: 0,
    monthlyGrowth: 0,
    losses: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');

  useEffect(() => {
    // Simulating data fetching
    setFinancialData({
      totalRevenue: 1500000,
      totalProfit: 750000,
      pendingPayouts: 250000,
      dailyRevenue: 50000,
      monthlyGrowth: 15,
      losses: 50000,
    });
    setRevenueData([
      { name: 'Jan', revenue: 400000, profit: 240000, loss: 40000 },
      { name: 'Feb', revenue: 300000, profit: 139800, loss: 20000 },
      { name: 'Mar', revenue: 500000, profit: 300000, loss: 50000 },
      { name: 'Apr', revenue: 450000, profit: 280000, loss: 45000 },
      { name: 'May', revenue: 600000, profit: 380000, loss: 60000 },
      { name: 'Jun', revenue: 550000, profit: 330000, loss: 55000 },
    ]);
    setRecentTransactions([
      { id: 1, type: 'incoming', amount: 50000, description: 'Booking payment from John Doe', date: '2023-06-15' },
      { id: 2, type: 'outgoing', amount: 35000, description: 'Photographer payout to Jane Smith', date: '2023-06-14' },
      { id: 3, type: 'incoming', amount: 75000, description: 'Booking payment from Alice Johnson', date: '2023-06-13' },
      { id: 4, type: 'outgoing', amount: 5000, description: 'Refund to Bob Williams', date: '2023-06-12' },
      { id: 5, type: 'incoming', amount: 60000, description: 'Booking payment from Charlie Brown', date: '2023-06-11' },
    ]);
    setPaymentMethods([
      { name: 'Credit Card', value: 400 },
      { name: 'Bank Transfer', value: 300 },
      { name: 'PayPal', value: 200 },
      { name: 'Mobile Money', value: 100 },
    ]);
  }, [selectedTimeRange]);

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
            <IconFilter size={20} className="mr-2" />
            Filter
          </button>
        </div>
      </div>
      
      <ErrorBoundary>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <FinanceCard title="Total Revenue" value={financialData.totalRevenue} iconType="revenue" change={financialData.monthlyGrowth} />
          <FinanceCard title="Total Profit" value={financialData.totalProfit} iconType="profit" change={financialData.monthlyGrowth} />
          <FinanceCard title="Pending Payouts" value={financialData.pendingPayouts} iconType="payouts" />
          <FinanceCard title="Daily Revenue" value={financialData.dailyRevenue} iconType="dailyRevenue" />
          <FinanceCard title="Monthly Growth" value={financialData.monthlyGrowth} iconType="growth" />
          <FinanceCard title="Losses" value={financialData.losses} iconType="losses" />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={revenueData} />
          <PaymentMethodsChart data={paymentMethods} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <TransactionsTable transactions={recentTransactions} />
      </ErrorBoundary>

      <ErrorBoundary>
        <PayoutManagement pendingPayouts={financialData.pendingPayouts} />
      </ErrorBoundary>
    </div>
  );
};

export default FinancePage;
