import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IconChartBar, IconDownload, IconMaximize, IconShare, IconInfoCircle, IconZoomIn, IconZoomOut, IconArrowsMaximize, IconChevronRight, IconFilter } from '@tabler/icons-react';

const TrendGraph = ({ data }) => {
  const [focusBar, setFocusBar] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState(['users', 'photographers', 'bookings', 'revenue']);
  const [hoveredLine, setHoveredLine] = useState(null);

  // Add color mapping for consistency
  const metricColors = {
    users: '#8884d8',
    photographers: '#82ca9d',
    bookings: '#ffc658',
    revenue: '#ff7300'
  };

  const metricLabels = {
    users: 'Total Users',
    photographers: 'Photographers',
    bookings: 'Bookings',
    revenue: 'Revenue'
  };

  // Move CustomTooltip here, after metricLabels is defined
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
                  {entry.dataKey === 'revenue' ? 'TZS ' : ''}{entry.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          {/* Add percentage changes */}
          {payload[0] && data.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                vs Previous Month: 
                {payload.map(entry => {
                  const currentIndex = data.findIndex(item => item.name === label);
                  const previousValue = currentIndex > 0 ? data[currentIndex - 1][entry.dataKey] : 0;
                  const change = ((entry.value - previousValue) / previousValue * 100).toFixed(1);
                  return (
                    <span key={entry.dataKey} className={`ml-2 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  );
                })}
              </p>
            </div>
          )}
        </motion.div>
      );
    }
    return null;
  };

  const handleClick = (_, index) => {
    setFocusBar(focusBar === index ? null : index);
  };

  const handleExport = (format) => {
    // Implementation for exporting data
    console.log(`Exporting trend data as ${format}`);
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
            12 Month Trend Overview
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
          {/* Add zoom controls */}
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
          
          {/* Metric Filter */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              <IconFilter size={20} />
            </motion.button>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2"
              >
                {Object.keys(metricLabels).map(metric => (
                  <label
                    key={metric}
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMetrics([...selectedMetrics, metric]);
                        } else {
                          setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {metricLabels[metric]}
                    </span>
                  </label>
                ))}
              </motion.div>
            )}
          </div>

          {/* Expand/Collapse button */}
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

      {/* Chart container with zoom effect */}
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
              yAxisId="left" 
              className="text-sm" 
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
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
            {selectedMetrics.includes('users') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="users" 
                stroke={metricColors.users}
                strokeWidth={hoveredLine === 'users' ? 4 : 2}
                dot={{ r: 4 }}
                activeDot={{ 
                  r: 8, 
                  onClick: handleClick,
                  style: { cursor: 'pointer' }
                }}
              />
            )}
            {selectedMetrics.includes('photographers') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="photographers" 
                stroke={metricColors.photographers}
                strokeWidth={hoveredLine === 'photographers' ? 4 : 2}
                dot={{ r: 4 }}
                activeDot={{ 
                  r: 8, 
                  onClick: handleClick,
                  style: { cursor: 'pointer' }
                }}
              />
            )}
            {selectedMetrics.includes('bookings') && (
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="bookings" 
                stroke={metricColors.bookings}
                strokeWidth={hoveredLine === 'bookings' ? 4 : 2}
                dot={{ r: 4 }}
                activeDot={{ 
                  r: 8, 
                  onClick: handleClick,
                  style: { cursor: 'pointer' }
                }}
              />
            )}
            {selectedMetrics.includes('revenue') && (
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="revenue" 
                stroke={metricColors.revenue}
                strokeWidth={hoveredLine === 'revenue' ? 4 : 2}
                dot={{ r: 4 }}
                activeDot={{ 
                  r: 8, 
                  onClick: handleClick,
                  style: { cursor: 'pointer' }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Enhanced details panel */}
      {focusBar !== null && data[focusBar] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-4 p-4 bg-gray-100 dark:bg-neutral-700 rounded-lg"
        >
          <h4 className="font-bold text-lg mb-2">Detailed Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Month</p>
              <p className="font-medium">{data[focusBar].name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
              <p className="font-medium">{data[focusBar].users.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Photographers</p>
              <p className="font-medium">{data[focusBar].photographers.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="font-medium">TZS {data[focusBar].revenue.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TrendGraph;
