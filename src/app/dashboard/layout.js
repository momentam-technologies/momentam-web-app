"use client";
import React from 'react';
import Sidebar from '@/components/global/Sidebar';
import Navbar from '@/components/global/Navbar';
import Footer from '@/components/global/Footer';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-neutral-800">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto scrollbar-hide">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
