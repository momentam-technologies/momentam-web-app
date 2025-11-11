"use client";

import React from "react";
import { motion } from "framer-motion";
import { IconCamera, IconUser, IconUserCircle } from "@tabler/icons-react";
import Image from "next/image";

const PhotosGrid = ({ groups = [], onSelectGroup, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="text-center text-gray-500 py-10">
        <IconCamera size={40} className="mx-auto mb-3 opacity-60" />
        <p>No photos found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {groups.map((group, idx) => {
        const firstPhoto = group.photos?.[0];
        const cover = firstPhoto?.thumbnailUrl || null;
        const clientName = group.client?.name || "Unknown Client";
        const photographerName = group.photographer?.name || "Unknown Photographer";
        const photoCount = group.photos?.length || 0;
        const status = group.status || "pending";

        // color by status
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-700",
          approved: "bg-green-100 text-green-700",
          rejected: "bg-red-100 text-red-700",
        };

        return (
          <motion.div
            key={group.bookingId || idx}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectGroup(group)}
            className="cursor-pointer bg-white dark:bg-neutral-800 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-200 dark:border-neutral-700"
          >
            {/* Thumbnail */}
            <div className="relative w-full h-48 bg-gray-100 dark:bg-neutral-700">
              {cover && cover.endsWith(".jpg") || cover.endsWith(".png") ? (
                <Image
                  src={cover}
                  alt="Photo Group"
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <IconCamera size={40} />
                </div>
              )}
              {/* Status Badge */}
              <div
                className={`absolute top-2 right-2 text-xs px-3 py-1 rounded-full font-medium ${statusColors[status]}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <IconUserCircle size={16} />
                  <span className="truncate">{clientName}</span>
                </div>
                <span className="text-xs text-gray-400">{photoCount} photos</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <IconUser size={14} />
                <span className="truncate">{photographerName}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PhotosGrid;