import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import {
  IconX,
  IconCheck,
  IconX as IconReject,
  IconEdit,
  IconDownload,
  IconUser,
  IconCalendar,
  IconCurrencyDollar,
  IconPhoto,
  IconUpload,
  IconWand,
} from "@tabler/icons-react";
import {
  updatePhoto,
  bulkUpdatePhotos,
  bulkDownloadAsZip,
  uploadPhotoToFirebase,
  saveEditedPhotos,
} from "@/lib/photos";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

// Dynamically import BulkPhotoEditor with SSR disabled
const BulkPhotoEditor = dynamic(() => import("./BulkPhotoEditor"), {
  ssr: false,
});

const BookingPhotosModal = ({ booking, onClose, onUpdate }) => {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState("original"); // 'original' or 'edited'
  const fileInputRef = useRef(null);

  const handleStatusUpdate = async (photoId, status) => {
    try {
      setIsProcessing(true);
      await updatePhoto(photoId, { status });
      toast.success(`Photo ${status} successfully`);
      onUpdate();
    } catch (error) {
      console.error("Error updating photo status:", error);
      toast.error("Failed to update photo status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPhotos.length === 0) {
      toast.error("No photos selected");
      return;
    }

    try {
      setIsProcessing(true);
      if (action === "edit") {
        setShowBulkEditor(true);
      } else {
        await bulkUpdatePhotos(selectedPhotos, { status: action });
        toast.success(`${selectedPhotos.length} photos ${action}`);
        setSelectedPhotos([]);
        onUpdate();
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to update photos");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to select all photos
  const handleSelectAll = () => {
    setSelectedPhotos(booking.photos.map((photo) => photo.$id));
    setShowBulkEditor(true);
  };

  const handleBulkDownload = async () => {
    if (selectedPhotos.length === 0) {
      toast.error("No photos selected");
      return;
    }

    try {
      setIsProcessing(true);
      const photos = booking.photos.filter((photo) =>
        selectedPhotos.includes(photo.$id)
      );
      const formattedPhotos = photos.map((photo) => {
        return { url: photo.photoUrl, photoId: photo.$id };
      });

      await bulkDownloadAsZip(formattedPhotos);
      setSelectedPhotos([]);
    } catch (error) {
      console.error("Error downloading photos:", error);
      toast.error("Failed to download photos");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle file change
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    try {
      const photos = await Promise.all(
        files.map((file) => uploadPhotoToFirebase(file))
      );

      const {success} = await saveEditedPhotos(photos);

      if (success) {
        toast.success("Photos uploaded successfully");
        onUpdate();
      } else {
        toast.error("Failed to upload photos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photos");
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
        <div className="sticky top-0 z-20">
          {/* Header */}
          <div className="p-4 border-b bg-white border-gray-200 dark:border-neutral-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {booking.client.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(booking.booking.date), "PPP")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Add Edit All Button */}
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <IconUser className="text-blue-500" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {booking.photographer.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <IconCalendar className="text-green-500" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {booking.booking.package}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <IconCurrencyDollar className="text-yellow-500" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  TZS {parseFloat(booking.booking.price).toLocaleString()}
                </span>
              </div>

              {/* Upload input & btn */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <IconUpload size={20} />
                <span>Upload Photos</span>
              </button>

              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <IconWand size={20} />
                <span>Edit All Photos</span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-700/50 border-b border-gray-200 dark:border-neutral-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() =>
                    setViewMode((prev) =>
                      prev === "original" ? "edited" : "original"
                    )
                  }
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                >
                  {viewMode === "original" ? "Show Edited" : "Show Original"}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedPhotos.length} selected
                </span>
              </div>
              {selectedPhotos.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkAction("edit")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <IconWand size={20} />
                    <span>Edit Selected</span>
                  </button>

                  <button
                    onClick={() => handleBulkDownload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                  >
                    <IconDownload size={20} />
                    <span>Download Selected</span>
                  </button>

                  <button
                    onClick={() => handleBulkAction("approved")}
                    className="px-4 py-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction("rejected")}
                    className="px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                  >
                    Reject Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 h-full overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {booking.photos.map((photo) => (
              <div
                key={photo.$id}
                className={`relative aspect-square group ${
                  selectedPhotos.includes(photo.$id)
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                {/* Selection Overlay */}
                <div
                  className="absolute inset-0 z-10 cursor-pointer"
                  onClick={() => {
                    setSelectedPhotos((prev) =>
                      prev.includes(photo.$id)
                        ? prev.filter((id) => id !== photo.$id)
                        : [...prev, photo.$id]
                    );
                  }}
                />

                {/* Photo */}
                <Image
                  src={
                    viewMode === "edited" && photo.editedVersion
                      ? photo.editedVersion.editedUrl
                      : photo.photoUrl
                  }
                  alt="Photo"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />

                {/* Status Badge */}
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    photo.status === "approved"
                      ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                      : photo.status === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                  }`}
                >
                  {photo.status || "pending"}
                </div>

                {/* Edited Badge */}
                {photo.editedVersion && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400">
                    Edited
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(photo.$id, "approved")}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                  >
                    <IconCheck size={20} />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(photo.$id, "rejected")}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <IconReject size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPhotos([photo.$id]);
                      setShowBulkEditor(true);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <IconEdit size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bulk Editor Modal */}
      <AnimatePresence>
        {showBulkEditor && (
          <BulkPhotoEditor
            photos={booking.photos.filter((photo) =>
              selectedPhotos.includes(photo.$id)
            )}
            onClose={() => setShowBulkEditor(false)}
            onSave={async (enhancedPhotos) => {
              try {
                await Promise.all(
                  enhancedPhotos.map((photo) =>
                    updatePhoto(photo.$id, {
                      photoUrl: photo.enhancedUrl,
                      isEnhanced: true,
                      enhancedAt: new Date().toISOString(),
                      settings: photo.settings,
                    })
                  )
                );
                toast.success("Photos enhanced successfully");
                setShowBulkEditor(false);
                setSelectedPhotos([]);
                onUpdate();
              } catch (error) {
                console.error("Error saving enhanced photos:", error);
                toast.error("Failed to save enhanced photos");
              }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingPhotosModal;
