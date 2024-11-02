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
import { getFinancialMetrics, getRecentTransactions, getPaymentMethods } from '@/lib/finances';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metrics, transactions, methods] = await Promise.all([
          getFinancialMetrics(),
          getRecentTransactions(),
          getPaymentMethods()
        ]);

        setFinancialData(metrics);
        setRecentTransactions(transactions);
        setPaymentMethods(methods);

        // Example revenue data for the chart
        setRevenueData([
          { name: 'Jan', revenue: 400000, profit: 240000, loss: 40000 },
          { name: 'Feb', revenue: 300000, profit: 139800, loss: 20000 },
          { name: 'Mar', revenue: 500000, profit: 300000, loss: 50000 },
          { name: 'Apr', revenue: 450000, profit: 280000, loss: 45000 },
          { name: 'May', revenue: 600000, profit: 380000, loss: 60000 },
          { name: 'Jun', revenue: 550000, profit: 330000, loss: 55000 },
        ]);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeRange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen"
    >
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
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-500 dark:text-gray-300">Loading financial data...</p>
        </div>
      ) : (
        <>
          <ErrorBoundary>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: { opacity: 1, scale: 1, transition: { delay: 0.2, staggerChildren: 0.1 } }
              }}
            >
              {Object.entries(financialData).map(([key, value], index) => (
                <motion.div key={index} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                  <FinanceCard title={key.replace(/([A-Z])/g, ' $1')} value={value} iconType={key} />
                </motion.div>
              ))}
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <RevenueChart data={revenueData} />
              <PaymentMethodsChart data={paymentMethods} />
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <TransactionsTable transactions={recentTransactions} />
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <PayoutManagement pendingPayouts={financialData.pendingPayouts} />
            </motion.div>
          </ErrorBoundary>
        </>
      )}
    </motion.div>
  );
};

export default FinancePage;