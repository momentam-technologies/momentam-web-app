import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const BookingTrendGraph = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Booking Trends
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly booking statistics
          </p>
        </div>
      </div>

      <div className="h-[400px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              tickFormatter={(value) => format(new Date(value), 'MMM yy')}
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#E5E7EB' }}
              labelFormatter={(value) => format(new Date(value), 'MMMM yyyy')}
              formatter={(value, name) => [
                name === 'revenue' ? `TZS ${value.toLocaleString()}` : value,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total"
              name="Total Bookings"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default BookingTrendGraph; 