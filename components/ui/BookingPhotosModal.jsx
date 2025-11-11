"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getSession } from "next-auth/react";
import { safeFormatDate } from "@/utils/dateUtils";
import { IconX, IconCheck, IconEdit, IconDownload, IconUser, IconCalendar, IconCurrencyDollar, IconUpload, IconWand } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { replacePhoto, handleStatusUpdate as handleStatusUpdateAction } from "./../../app/dashboard/photos/_action";
import { validateFileSize, validateFileFormat, generateThumbnail } from "@/lib/imageUtils";

const BulkPhotoEditor = dynamic(() => import("./BulkPhotoEditor"), { ssr: false });

const BookingPhotosModal = ({ booking, onClose, refreshPhotos: onUpdate }) => {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [viewMode, setViewMode] = useState("original");
  const fileInputRef = useRef(null);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState(null);

  // ---------- Photo Status Update ---------- //
  const handleStatusUpdate = async (photoId, status) => {
    try {
      if (!photoId || !status) return;

      const actionText = status === "approved" ? "Approving" : "Rejecting";
      const successText = status === "approved" ? "Photo approved successfully!" : "Photo rejected successfully!";

      const loadingToast = toast.loading(`${actionText} photo...`);

      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      const clientId = booking.client?._id;
      const clientName = booking.client?.name;

      await handleStatusUpdateAction(session.accessToken, photoId, status, clientId, clientName);

      toast.dismiss(loadingToast);
      toast.success(successText);
      onUpdate();
    } catch (error) {
      console.error("Error updating photo status:", error);
      toast.error("Failed to update photo status");
    }
  };

  // ---------- Photo Download ---------- //
  const handleDownloadPhoto = async (photo) => {
    try {
      setDownloadingPhotoId(photo._id);

      const fileUrl = photo.fileUrl;
      const fileName = photo.fileName || fileUrl.split("/").pop();

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch photo");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download complete ✅");

    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download photo");
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  // ----------- Select All Photos ---------- //
  const handleSelectAll = () => {
    setSelectedPhotos(booking.photos.map((p) => p._id));
    setShowBulkEditor(true);
  };

  // ---------- Replace Photo ----------- //
  const handleReplacePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1️⃣ Validate file
    if (!validateFileSize(file)) {
      toast.error(`File "${file.name}" exceeds 60MB`);
      e.target.value = "";
      return;
    }
    if (!validateFileFormat(file)) {
      toast.error(`Invalid format: "${file.name}"`);
      e.target.value = "";
      return;
    }

    // 2️⃣ Ensure exactly one photo selected
    if (selectedPhotos.length !== 1) {
      toast.info("Please select exactly one photo to replace");
      e.target.value = "";
      return;
    }

    const photoId = selectedPhotos[0];
    setUploadingPhotoId(photoId);

    try {
      // 3️⃣ Generate thumbnail
      const thumbnailFile = await generateThumbnail(file);

      // 4️⃣ Set uploading states
      setIsUploading(true);
      setUploadProgress(0);

      const session = await getSession();
      if (!session?.accessToken) throw new Error("Not authenticated");

      // Call the backend API
      await replacePhoto(session.accessToken, photoId, file, thumbnailFile,
        (percent) => setUploadProgress(percent)
      );

      // 6️⃣ Progress simulation (optional)
      const interval = setInterval(() => {
        setUploadProgress((p) => (p >= 100 ? 100 : p + Math.random() * 10));
      }, 200);

      // Wait a bit to show progress
      await new Promise((resolve) => setTimeout(resolve, 500));
      clearInterval(interval);
      setUploadProgress(100);

      toast.success("Photo replaced successfully ✅");
      setSelectedPhotos([]);
      onUpdate();
    } catch (error) {
      console.error("Replace error:", error);
      toast.error(error.message || "Failed to replace photo");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadingPhotoId(null);
        setUploadProgress(0);
      }, 500);
    }
  };

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
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 border-b dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {booking.client?.name || "Unknown Client"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{safeFormatDate(booking.uploadedAt)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full">
              <IconX size={20} />
            </button>
          </div>

          {/* Booking Info + Upload */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
              <IconUser size={18} /> {booking.photographer?.name || "Unknown Photographer"}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
              <IconCalendar size={18} /> {booking.booking.package}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
              <IconCurrencyDollar size={18} /> TZS {booking.booking.price}
            </div>

            {/* Upload Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleReplacePhoto}
            />

            <button
              onClick={() => {
                if (selectedPhotos.length > 0) {
                  fileInputRef.current.click();
                } else { toast.info("Select photo to replace first") }
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
            >
              <IconUpload size={18} />
              <span>
                {selectedPhotos.length > 0
                  ? `Replace ${selectedPhotos.length} Photo${selectedPhotos.length > 1 ? "s" : ""}`
                  : "Select Photos to Replace"}
              </span>
            </button>
            <button onClick={handleSelectAll} className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1">
              <IconWand size={18} /> Edit All Photos
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b bg-gray-50 dark:bg-neutral-700/50 flex justify-between items-center dark:border-neutral-700">
          <div>
            <button
              onClick={() =>
                setViewMode((prev) => (prev === "original" ? "edited" : "original"))
              }
              className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              {viewMode === "original" ? "Show Edited" : "Show Original"}
            </button>
            <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
              {selectedPhotos.length} selected
            </span>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="flex gap-2">
              {/* Download Selected */}
              <button onClick={() => {
                if (selectedPhotos.length > 1) return toast.error("Select only 1 photo");
                const photo = booking.photos.find(p => p._id === selectedPhotos[0]);
                if (!photo) return toast.error("Photo not found");
                handleDownloadPhoto(photo)
              }}
                className="px-3 py-1 bg-gray-500 text-white rounded-lg flex items-center gap-2 hover:bg-gray-600 relative" disabled={!!downloadingPhotoId}>
                {downloadingPhotoId ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin cursor-not-allowed" />
                ) : (
                  <IconDownload size={18} />
                )}
                {downloadingPhotoId ? "Downloading..." : "Download"}
              </button>

              {/* Edit Selected */}
              <button onClick={() => {
                if (selectedPhotos.length === 0) return toast.error("Select photo(s) first");
                setShowBulkEditor(true);
              }}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg flex items-center gap-1 hover:bg-blue-600">
                <IconWand size={18} /> Edit Selected
              </button>

              {/* Approve Selected */}
              <button onClick={() => {
                if (selectedPhotos.length > 1) return toast.error("Select only 1 photo");
                handleStatusUpdate(selectedPhotos[0], "approved")
              }}
                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Approve Selected
              </button>

              {/* Reject Selected */}
              <button onClick={() => {
                if (selectedPhotos.length > 1) return toast.error("Select only 1 photo");
                handleStatusUpdate(selectedPhotos[0], "rejected")
              }}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Reject Selected
              </button>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {booking.photos.map((photo) => (
              <div key={photo._id} className="relative aspect-square group rounded-lg overflow-hidden">

                {/* Photo */}
                <Image
                  src={viewMode === "edited" && photo.editedVersion ? photo.editedVersion.editedUrl : photo.thumbnailUrl || photo.fileUrl}
                  alt={photo.fileName || "Photo"}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg cursor-pointer"
                  onClick={() => {
                    setSelectedPhotos((prev) =>
                      prev.includes(photo._id)
                        ? prev.filter((id) => id !== photo._id)
                        : [...prev, photo._id]
                    );
                  }}
                />

                {/* Uploading Overlay (shows live progress) */}
                {isUploading && uploadingPhotoId === photo._id && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-sm font-medium">
                    <div className="w-3/4 bg-white/30 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p>{uploadProgress}%</p>
                  </div>
                )}

                {/* Status Badge */}
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${photo.status === "approved"
                    ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                    : photo.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                    }`}
                >
                  {photo.status || "pending"}
                </div>

                {/* Icon Actions */}
                <div className="absolute inset-0 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {/* Download Icon */}
                  <button
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 pointer-events-auto"
                    title="Download">
                    <IconDownload size={18} />
                  </button>

                  {/* Edit Icon */}
                  <button
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 pointer-events-auto"
                    title="Edit">
                    <IconEdit size={18} />
                  </button>

                  {/* Replace Icon */}
                  <button
                    className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 pointer-events-auto"
                    title="Replace">
                    <IconUpload size={18} />
                  </button>

                  {/* Approve Icon */}
                  <button
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 pointer-events-auto"
                    title="Approve" >
                    <IconCheck size={18} />
                  </button>

                  {/* Reject Icon */}
                  <button
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 pointer-events-auto"
                    title="Reject">
                    <IconX size={18} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Bulk Editor */}
        <AnimatePresence>
          {showBulkEditor && (
            <BulkPhotoEditor
              photos={booking.photos.filter((p) => selectedPhotos.includes(p._id))}
              onClose={() => setShowBulkEditor(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div >
  );
};

export default BookingPhotosModal;