"use client";
import React, { useState, useEffect } from 'react';
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
  const [userEngagement, setUserEngagement] = useState([]);
  const [trafficSources, setTrafficSources] = useState([]);
  const [frequentLocations, setFrequentLocations] = useState([]);
  const [mostUsedBooking, setMostUsedBooking] = useState({});
  const [mostBookedPhotographer, setMostBookedPhotographer] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isBrowser) return; // Only fetch data in browser environment
        
        const { 
          getUserEngagement, 
          getTrafficSources, 
          getFrequentLocations, 
          getMostUsedBooking, 
          getMostBookedPhotographer 
        } = await import('@/lib/analytics');

        setLoading(true);
        const [engagement, traffic, locations, booking, photographer] = await Promise.all([
          getUserEngagement(),
          getTrafficSources(),
          getFrequentLocations(),
          getMostUsedBooking(),
          getMostBookedPhotographer()
        ]);

        setUserEngagement(engagement);
        setTrafficSources(traffic);
        setFrequentLocations(locations);
        setMostUsedBooking(booking);
        setMostBookedPhotographer(photographer);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-500 dark:text-gray-300">Loading analytics data...</p>
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
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <AnalyticsCard title="Active Users" value={userEngagement.activeUsers} icon={IconUsers} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <AnalyticsCard title="New Sign-ups" value={userEngagement.newSignups} icon={IconUsers} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <AnalyticsCard title="Most Used Booking" value={mostUsedBooking.name} icon={IconChartBar} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <AnalyticsCard title="Most Booked Photographer" value={mostBookedPhotographer.name} icon={IconUsers} />
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <AnalyticsCard title="Traffic Sources" value={trafficSources.length} icon={IconTrafficCone} />
              </motion.div>
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <UserEngagementChart data={userEngagement.trends} />
              <TrafficSourcesChart data={trafficSources} />
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <FrequentLocationsMap locations={frequentLocations} />
            </motion.div>
          </ErrorBoundary>
        </>
      )}
    </motion.div>
  );
};

export default AnalyticsPage;