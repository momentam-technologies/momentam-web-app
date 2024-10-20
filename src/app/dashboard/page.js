"use client";
import React from 'react';
import DashboardContent from '@/components/ui/dashboard';

export default function Dashboard() {
  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>
      <DashboardContent />
    </div>
  );
}
