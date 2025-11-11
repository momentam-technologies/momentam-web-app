"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getSession } from "next-auth/react";
import { IconRefresh, IconSearch, IconPhoto, IconClock, IconCheck, IconX } from "@tabler/icons-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import DashboardCard from "@/components/ui/DashboardCard";
import { getAllPhotos } from "./_action";

// UI components
const PhotosGrid = dynamic(() => import("@/components/ui/PhotosGrid"), { ssr: false });
const BookingPhotosModal = dynamic(() => import("@/components/ui/BookingPhotosModal"), { ssr: false });

export default function PhotosPage() {
  const [photos, setPhotos] = useState([]);
  const [groupedPhotos, setGroupedPhotos] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      const data = await getAllPhotos(session.accessToken);

      setPhotos(data);
      groupByBooking(data);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Failed to fetch photos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Group photos by booking._id
  const groupByBooking = (data) => {
    const grouped = Object.values(
      data.reduce((acc, photo) => {
        const key = photo.booking?._id || "unassigned";
        if (!acc[key]) {
          acc[key] = {
            bookingId: photo.booking?._id || "unassigned",
            booking: photo.booking || {},
            photographer: photo.photographer || {},
            client: photo.client || {},
            status: photo.status,
            uploadedAt: photo.uploadDate,
            photos: [],
          };
        }
        acc[key].photos.push(photo);
        return acc;
      }, {})
    );

    setGroupedPhotos(grouped);
  };

  // Initial fetch
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Search filtering
  const filteredGroups = groupedPhotos.filter((group) => {
    if (!searchTerm.trim()) return true;
    const clientName = group.client?.name?.toLowerCase() || "";
    const photographerName = group.photographer?.name?.toLowerCase() || "";
    return (
      clientName.includes(searchTerm.toLowerCase()) ||
      photographerName.includes(searchTerm.toLowerCase())
    );
  });

  // Compute stats
  const stats = {
    total: photos.length,
    pending: photos.filter((p) => p.status === "pending").length,
    approved: photos.filter((p) => p.status === "approved").length,
    rejected: photos.filter((p) => p.status === "rejected").length,
  };

  // Modal handlers
  const handleOpenBooking = (booking) => setSelectedBooking(booking);
  const handleCloseModal = () => setSelectedBooking(null);

  return (
    <div className="p-6 bg-gray-50 dark:bg-neutral-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <IconPhoto /> Photos
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by client or photographer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchPhotos}
            disabled={loading}
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            <IconRefresh size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard
          title="Total Photos"
          value={stats.total}
          icon={IconPhoto}
          description="All uploaded photos"
        />
        <DashboardCard
          title="Pending"
          value={stats.pending}
          icon={IconClock}
          colorClass="text-yellow-500"
          description="Awaiting review"
        />
        <DashboardCard
          title="Approved"
          value={stats.approved}
          icon={IconCheck}
          colorClass="text-green-500"
          description="Approved photos"
        />
        <DashboardCard
          title="Rejected"
          value={stats.rejected}
          icon={IconX}
          colorClass="text-red-500"
          description="Rejected photos"
        />
      </div>

      {/* Grid of grouped photos */}
      <PhotosGrid
        groups={filteredGroups}
        onSelectGroup={handleOpenBooking}
        loading={loading}
      />

      {/* Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingPhotosModal
            isOpen={!!selectedBooking}
            onClose={handleCloseModal}
            booking={selectedBooking}
            refreshPhotos={fetchPhotos}
          />
        )}
      </AnimatePresence>
    </div>
  );
}