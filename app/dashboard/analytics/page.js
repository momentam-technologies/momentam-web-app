"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { IconChartBar, IconUsers, IconDownload, IconTrafficCone } from '@tabler/icons-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled
const AnalyticsCard = dynamic(() => import('@/components/analytics/AnalyticsCard'), { ssr: false });
const TrafficSourcesChart = dynamic(() => import('@/components/analytics/TrafficSourcesChart'), { ssr: false });
const UserEngagementChart = dynamic(() => import('@/components/analytics/UserEngagementChart'), { ssr: false });
const FrequentLocationsMap = dynamic(() => import('@/components/analytics/FrequentLocationsMap'), { ssr: false });

// Check for browser environment
const isBrowser = typeof window !== 'undefined';

const AnalyticsPage = () => {

  const handleDownloadAnalytics = () => {
    if (!isBrowser) return;
    alert('Downloading analytics data...');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
        <button
          onClick={handleDownloadAnalytics}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <IconDownload size={20} className="mr-2" />
          Download
        </button>
      </div>


      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-500 dark:text-gray-300">Loading analytics data...</p>
      </div>
    </motion.div>
  );
};

export default AnalyticsPage;