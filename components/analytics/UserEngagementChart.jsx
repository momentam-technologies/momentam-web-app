import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IconChartBar, IconDownload, IconMaximize, IconShare, IconInfoCircle, IconZoomIn, IconZoomOut, IconArrowsMaximize, IconFilter } from '@tabler/icons-react';

const UserEngagementChart = ({ data }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState(['activeUsers', 'newSignups']);
  const [hoveredLine, setHoveredLine] = useState(null);

  const metricColors = {
    activeUsers: '#8884d8',
    newSignups: '#82ca9d'
  };

  const metricLabels = {
    activeUsers: 'Active Users',
    newSignups: 'New Sign-ups'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="font-bold text-gray-800 dark:text-white mb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between space-x-8"
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {metricLabels[entry.dataKey]}:
                  </p>
                </div>
                <p className="text-sm font-medium" style={{ color: entry.color }}>
                  {entry.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const handleExport = (format) => {
    console.log(`Exporting user engagement data as ${format}`);
    setIsMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className={`bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-md ${
        isExpanded ? 'fixed inset-4 z-50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
            <IconChartBar className="text-blue-500 dark:text-blue-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            User Engagement Overview
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('csv')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            aria-label="Export as CSV"
          >
            <IconDownload size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            aria-label="Expand view"
          >
            <IconMaximize size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            aria-label="Share graph"
          >
            <IconShare size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            aria-label="View information"
          >
            <IconInfoCircle size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            disabled={zoomLevel >= 2}
          >
            <IconZoomIn size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            disabled={zoomLevel <= 0.5}
          >
            <IconZoomOut size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
          >
            <IconArrowsMaximize size={20} />
          </motion.button>
        </div>
      </div>

      <motion.div 
        className="h-[400px] w-full transform-gpu"
        style={{ 
          scale: zoomLevel,
          transformOrigin: 'center center'
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={(e) => {
              if (e.isTooltipActive) {
                setHoveredLine(e.activeTooltipIndex);
              } else {
                setHoveredLine(null);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
            <XAxis 
              dataKey="name" 
              className="text-sm" 
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-sm" 
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', opacity: 0.8 }}
              formatter={(value) => (
                <span className="text-sm font-medium">{metricLabels[value]}</span>
              )}
            />
            {selectedMetrics.includes('activeUsers') && (
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                stroke={metricColors.activeUsers}
                strokeWidth={hoveredLine === 'activeUsers' ? 4 : 2}
                dot={{ r: 4 }}
                activeDot={{ 
                  r: 8, 
                  style: { cursor: 'pointer' }
                }}
              />
            )}
            {selectedMetrics.includes('newSignups') && (
              <Line 
                type="monotone" 
                dataKey="newSignups" 
                stroke={metricColors.newSignups}
                strokeWidth={hoveredLine === 'newSignups' ? 4 : 2}
                dot={{ r: 4 }}
                activeDot={{ 
                  r: 8, 
                  style: { cursor: 'pointer' }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default UserEngagementChart; 