import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => (
  <div className="dashboard-card">
    <h3 className="dashboard-subtitle">Revenue vs Profit vs Loss</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="profit" stroke="#82ca9d" />
        <Line type="monotone" dataKey="loss" stroke="#ff7300" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default RevenueChart;
