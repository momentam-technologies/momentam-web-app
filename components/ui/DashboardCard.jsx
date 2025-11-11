import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconDownload, IconMaximize, IconShare, IconInfoCircle, IconAlertTriangle, 
         IconChartBar, IconArrowUpRight, IconArrowDownRight, IconDotsVertical, IconX } from '@tabler/icons-react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// Create a separate DetailedStatsModal component
const DetailedStatsModal = ({ isOpen, onClose, title, value, icon: Icon, change, yearOverYearChange }) => {
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
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
              <Icon className="text-blue-500 dark:text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold">{title} Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Value */}
          <div className="bg-gray-50 dark:bg-neutral-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Current Value</h3>
            <p className="text-4xl font-bold text-blue-500">{value}</p>
          </div>

          {/* Changes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-neutral-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Monthly Change</h3>
              <div className="flex items-center space-x-2">
                {change >= 0 ? (
                  <IconArrowUpRight className="text-green-500" size={24} />
                ) : (
                  <IconArrowDownRight className="text-red-500" size={24} />
                )}
                <p className={`text-2xl font-semibold ${
                  change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {change}%
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Year over Year</h3>
              <div className="flex items-center space-x-2">
                {yearOverYearChange >= 0 ? (
                  <IconArrowUpRight className="text-green-500" size={24} />
                ) : (
                  <IconArrowDownRight className="text-red-500" size={24} />
                )}
                <p className={`text-2xl font-semibold ${
                  yearOverYearChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {yearOverYearChange}%
                </p>
              </div>
            </div>
          </div>

          {/* Historical Chart */}
          <div className="bg-gray-50 dark:bg-neutral-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Historical Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { value: 40 }, { value: 30 }, { value: 45 }, 
                  { value: 35 }, { value: 50 }, { value: 45 }, 
                  { value: 60 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Average Growth
              </h4>
              <p className="text-xl font-semibold mt-1">+24.5%</p>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Peak Value
              </h4>
              <p className="text-xl font-semibold mt-1">{value}</p>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Growth Trend
              </h4>
              <p className="text-xl font-semibold mt-1 text-green-500">Positive</p>
            </div>
          </div>

          {/* Export Options */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center space-x-2"
            >
              <IconDownload size={16} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center space-x-2"
            >
              <IconDownload size={16} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardCard = ({ title, value, icon: Icon, change, yearOverYearChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    try {
      const data = {
        metric: title,
        value,
        monthlyChange: change,
        yearOverYearChange,
        exportedAt: new Date().toISOString(),
      };

      if (format === 'csv') {
        const csvContent = `Metric,Value,Monthly Change,Year over Year Change\n${title},${value},${change}%,${yearOverYearChange}%`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `${title.toLowerCase()}_stats.csv`);
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(title + ' Statistics', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Value: ${value}`, 20, 40);
        doc.text(`Monthly Change: ${change}%`, 20, 50);
        doc.text(`Year over Year: ${yearOverYearChange}%`, 20, 60);
        doc.text(`Exported: ${new Date().toLocaleString()}`, 20, 70);
        
        doc.save(`${title.toLowerCase()}_stats.pdf`);
      }

      setIsMenuOpen(false);
      toast.success(`Successfully exported ${title} data as ${format}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(`Failed to export data: ${error.message}`);
    }
  };

  const handleViewDetails = () => {
    setShowDetailedStats(true);
    setIsMenuOpen(false);
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      try {
        const shareData = {
          title: `${title} Statistics`,
          text: `Current ${title}: ${value}\nMonthly Change: ${change}%\nYear over Year: ${yearOverYearChange}%`,
          url: window.location.href
        };

        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback - copy to clipboard
          await navigator.clipboard.writeText(shareData.text);
          toast.success('Stats copied to clipboard');
        }
      } catch (error) {
        console.error('Error sharing:', error);
        toast.error('Failed to share stats');
      }
    }
    setIsMenuOpen(false);
  };

  const handleShowInfo = () => {
    // Define simpler metric descriptions
    const metricInfo = {
        'Total Users': 'Total number of clients registered on the platform.',
        'Total Photographers': 'Total number of photographers registered on the platform.',
        'Total Bookings': 'Total number of bookings made on the platform.',
        'Revenue': 'Total revenue from all completed bookings.',
    };

    // Show info modal or tooltip
    alert(metricInfo[title]); // Replace with your preferred UI component
    setIsMenuOpen(false);
  };

  const handleReportIssue = () => {
    // Open a modal or form for issue reporting
    const issueTypes = {
      'Data Discrepancy': 'Report incorrect numbers',
      'Display Issue': 'Report UI/display problems',
      'Calculation Error': 'Report wrong calculations',
      'Other': 'Report other issues'
    };

    // Implementation depends on your UI components
    // You might want to use a modal here
    console.log(`Reporting issue for ${title}`);
    setIsMenuOpen(false);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-visible group"
        role="region"
        aria-label={`${title} statistics`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Icon className="text-blue-500 dark:text-blue-400" size={24} aria-hidden="true" />
              </div>
              <h3 
                className="font-semibold text-lg text-gray-700 dark:text-gray-200" 
                id={`${title.toLowerCase()}-label`}
              >
                {title}
              </h3>
            </div>
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="More options"
              >
                <IconDotsVertical size={20} className="text-gray-400" />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 -mt-20 w-56 rounded-xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 z-[1000] overflow-visible"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                    }}
                  >
                    <div className="p-2 space-y-1">
                      {/* View Details */}
                      <button
                        onClick={handleViewDetails}
                        className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                      >
                        <IconChartBar size={18} className="mr-3 text-gray-400 group-hover:text-blue-500" />
                        View Detailed Stats
                      </button>

                      {/* Export Options */}
                      <div className="px-3 py-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Export As</p>
                        <div className="space-y-1">
                          <button
                            onClick={() => handleExport('csv')}
                            className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                          >
                            <IconDownload size={18} className="mr-3 text-gray-400 group-hover:text-green-500" />
                            CSV
                          </button>
                          <button
                            onClick={() => handleExport('pdf')}
                            className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                          >
                            <IconDownload size={18} className="mr-3 text-gray-400 group-hover:text-red-500" />
                            PDF
                          </button>
                        </div>
                      </div>

                      {/* Expand View */}
                      <button
                        onClick={() => {
                          console.log('Expanding view');
                          setIsMenuOpen(false);
                        }}
                        className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                      >
                        <IconMaximize size={18} className="mr-3 text-gray-400 group-hover:text-purple-500" />
                        Expand View
                      </button>

                      {/* Share */}
                      <button
                        onClick={handleShare}
                        className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                      >
                        <IconShare size={18} className="mr-3 text-gray-400 group-hover:text-blue-500" />
                        Share Stats
                      </button>

                      <div className="border-t border-gray-200 dark:border-neutral-700 my-2" />

                      {/* Info */}
                      <button
                        onClick={handleShowInfo}
                        className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                      >
                        <IconInfoCircle size={18} className="mr-3 text-gray-400 group-hover:text-blue-500" />
                        About This Metric
                      </button>

                      {/* Report Issue */}
                      <button
                        onClick={handleReportIssue}
                        className="group flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
                      >
                        <IconAlertTriangle size={18} className="mr-3 text-gray-400 group-hover:text-yellow-500" />
                        Report Issue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Value */}
          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <p 
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                aria-labelledby={`${title.toLowerCase()}-label`}
              >
                {value}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Stats */}
          <div className="space-y-2">
            {change !== null && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-neutral-700/50"
              >
                <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Change</span>
                <div className="flex items-center space-x-1">
                  {change > 0 ? (
                    <IconArrowUpRight className="text-green-500" size={16} />
                  ) : (
                    <IconArrowDownRight className="text-red-500" size={16} />
                  )}
                  <p className={`text-sm font-medium ${
                    change > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(change)}%
                  </p>
                </div>
              </motion.div>
            )}

            {yearOverYearChange !== null && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-neutral-700/50"
              >
                <span className="text-sm text-gray-500 dark:text-gray-400">Year over Year</span>
                <div className="flex items-center space-x-1">
                  {yearOverYearChange > 0 ? (
                    <IconArrowUpRight className="text-green-500" size={16} />
                  ) : (
                    <IconArrowDownRight className="text-red-500" size={16} />
                  )}
                  <p className={`text-sm font-medium ${
                    yearOverYearChange > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(yearOverYearChange)}%
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Mini Sparkline Chart */}
          <div className="mt-4 h-10 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { value: 40 }, { value: 30 }, { value: 45 }, 
                { value: 35 }, { value: 50 }, { value: 45 }, 
                { value: 60 }
              ]}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetailedStats && (
          <DetailedStatsModal
            isOpen={showDetailedStats}
            onClose={() => setShowDetailedStats(false)}
            title={title}
            value={value}
            icon={Icon}
            change={change}
            yearOverYearChange={yearOverYearChange}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardCard;
