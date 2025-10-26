import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { safeFormatDate } from "@/utils/dateUtils";
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
// import {
//   updatePhoto,
//   bulkUpdatePhotos,
//   bulkDownloadAsZip,
//   uploadPhotoToFirebase,
//   saveEditedPhotos,
//   downloadPhoto,
//   replacePhoto,
// } from "@/lib/photos";
import { validateFileSize, validateFileFormat } from "@/lib/imageUtils";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const handleStatusUpdate = async (photoId, status) => {
    try {
      // setIsProcessing(true);
      // await updatePhoto(photoId, { status });
      // toast.success(`Photo ${status} successfully`);
      // onUpdate();
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
      // setIsProcessing(true);
      // if (action === "edit") {
      //   setShowBulkEditor(true);
      // } else {
      //   await bulkUpdatePhotos(selectedPhotos, { status: action });
      //   toast.success(`${selectedPhotos.length} photos ${action}`);
      //   setSelectedPhotos([]);
      //   onUpdate();
      // }
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
      // setIsProcessing(true);
      // const photos = booking.photos.filter((photo) =>
      //   selectedPhotos.includes(photo.$id)
      // );
      // const formattedPhotos = photos.map((photo) => {
      //   // Use original filename from database if available, otherwise extract from URL
      //   let fileName = photo.fileName;
      //   if (!fileName) {
      //     // Extract extension from photoUrl if fileName is not available
      //     const urlPath = photo.photoUrl.split('?')[0].split('#')[0]; // Remove query params and fragments
      //     const pathParts = urlPath.split('/');
      //     const filename = pathParts[pathParts.length - 1]; // Get the last part (filename)
      //     const filenameParts = filename.split('.');
      //     const extension = filenameParts.length > 1 ? filenameParts[filenameParts.length - 1] : 'jpg';
      //     fileName = `photo_${photo.$id}.${extension}`;
      //   }
        
      //   return { 
      //     url: photo.photoUrl, 
      //     photoId: photo.$id,
      //     fileName: fileName 
      //   };
      // });

      // await bulkDownloadAsZip(formattedPhotos);
      // setSelectedPhotos([]);
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
    
    // Validate files
    for (const file of files) {
      if (!validateFileSize(file)) {
        toast.error(`File "${file.name}" exceeds 60MB limit`);
        return;
      }
      
      if (!validateFileFormat(file)) {
        toast.error(`File "${file.name}" is not a valid image format (JPG, PNG, WebP)`);
        return;
      }
    }
    
    // If photos are selected, replace them. Otherwise, upload new photos
    if (selectedPhotos.length > 0) {
      // Replace selected photos
      try {
        console.log(`🔄 Starting replacement of ${Math.min(files.length, selectedPhotos.length)} photo(s)`);
        
        for (let i = 0; i < Math.min(files.length, selectedPhotos.length); i++) {
          const photoId = selectedPhotos[i];
          const file = files[i];
          
          console.log(`🔄 Replacing photo ${i + 1}/${Math.min(files.length, selectedPhotos.length)}:`, {
            photoId,
            fileName: file.name,
            fileSize: (file.size / 1024 / 1024).toFixed(2) + 'MB'
          });
          
          await handleReplacePhoto(photoId, file);
        }
        
        setSelectedPhotos([]);
        onUpdate();
      } catch (error) {
        console.error("Error replacing photos:", error);
        toast.error(error.message || "Failed to replace photos");
      }
    } else {
      // Upload new photos (existing functionality)
      try {
        // const photos = await Promise.all(
        //   files.map((file) => uploadPhotoToFirebase(file))
        // );

        // const {success} = await saveEditedPhotos(photos);

        // if (success) {
        //   toast.success("Photos uploaded successfully");
        //   onUpdate();
        // } else {
        //   toast.error("Failed to upload photos");
        // }
      } catch (error) {
        console.error(error);
        toast.error("Failed to upload photos");
      }
    }
  };

  // Function to handle single photo download
  const handleDownloadPhoto = async (photo) => {
    try {
      // setIsProcessing(true);
      
      // // Use original filename from database if available, otherwise extract from URL
      // let fileName = photo.fileName;
      // if (!fileName) {
      //   // Extract extension from photoUrl if fileName is not available
      //   const urlPath = photo.photoUrl.split('?')[0].split('#')[0]; // Remove query params and fragments
      //   const pathParts = urlPath.split('/');
      //   const filename = pathParts[pathParts.length - 1]; // Get the last part (filename)
      //   const filenameParts = filename.split('.');
      //   const extension = filenameParts.length > 1 ? filenameParts[filenameParts.length - 1] : 'jpg';
      //   fileName = `photo_${photo.$id}.${extension}`;
        
      //   console.log('🔍 [Download] Extension extraction:', {
      //     originalUrl: photo.photoUrl,
      //     extractedFilename: filename,
      //     extractedExtension: extension,
      //     finalFileName: fileName
      //   });
      // } else {
      //   console.log('🔍 [Download] Using original filename from database:', fileName);
      // }
      
      // await downloadPhoto(photo.photoUrl, fileName);
      // toast.success("Photo downloaded successfully");
    } catch (error) {
      console.error("Error downloading photo:", error);
      toast.error("Failed to download photo");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle photo replacement with progress
  const handleReplacePhoto = async (photoId, file) => {
    try {
      // setIsUploading(true);
      // setUploadingPhotoId(photoId);
      // setUploadProgress(0);
      
      // console.log('🔄 Starting photo replacement for:', photoId);
      
      // // Simulate progress updates
      // const progressInterval = setInterval(() => {
      //   setUploadProgress(prev => {
      //     if (prev >= 90) return prev;
      //     return prev + Math.random() * 10;
      //   });
      // }, 500);
      
      // await replacePhoto(photoId, file);
      
      // clearInterval(progressInterval);
      // setUploadProgress(100);
      
      // // Small delay to show 100% completion
      // setTimeout(() => {
      //   setIsUploading(false);
      //   setUploadingPhotoId(null);
      //   setUploadProgress(0);
      //   toast.success("Photo replaced successfully");
      //   onUpdate();
      // }, 500);
      
    } catch (error) {
      console.error("Error replacing photo:", error);
      setIsUploading(false);
      setUploadingPhotoId(null);
      setUploadProgress(0);
      toast.error(error.message || "Failed to replace photo");
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
          <div className="p-4 border-b bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {booking.client.name}
                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {safeFormatDate(booking.booking.$createdAt || booking.booking.created || booking.booking.date || booking.photos?.[0]?.uploadDate, "PPP")}
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
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              
              {/* Edit/Replace input */}
              <input
                type="file"
                ref={editFileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              

              <button
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <IconUpload size={20} />
                <span>{selectedPhotos.length > 0 ? `Replace ${selectedPhotos.length} Photo${selectedPhotos.length > 1 ? 's' : ''}` : 'Upload Photos'}</span>
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
                      : photo.thumbnailUrl || photo.photoUrl // Use thumbnail if available, fallback to original
                  }
                  alt="Photo"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                  onLoad={() => {
                    console.log('🖼️ Photo loaded:', {
                      photoId: photo.$id,
                      thumbnailUrl: photo.thumbnailUrl,
                      photoUrl: photo.photoUrl,
                      viewMode,
                      hasEditedVersion: !!photo.editedVersion
                    });
                  }}
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

                {/* Upload Progress Overlay */}
                {isUploading && uploadingPhotoId === photo.$id && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-20">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 w-48">
                      <div className="text-center mb-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Replacing Photo...
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                        {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions Overlay */}
                <div className={`absolute inset-0 bg-black/50 transition-opacity rounded-lg flex items-center justify-center space-x-2 ${
                  isUploading && uploadingPhotoId === photo.$id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <button
                    onClick={() => handleDownloadPhoto(photo)}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    title="Download"
                  >
                    <IconDownload size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPhotos([photo.$id]);
                      setShowBulkEditor(true);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                    title="Edit"
                  >
                    <IconEdit size={20} />
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Replace button clicked for photo:', photo.$id);
                      setSelectedPhotos([photo.$id]);
                      editFileInputRef.current.click();
                    }}
                    className={`p-2 rounded-full transition-colors ${
                      isUploading && uploadingPhotoId === photo.$id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-500 hover:bg-purple-600'
                    } text-white`}
                    title="Replace"
                    disabled={isUploading && uploadingPhotoId === photo.$id}
                  >
                    {isUploading && uploadingPhotoId === photo.$id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <IconUpload size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(photo.$id, "approved")}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                    title="Approve"
                  >
                    <IconCheck size={20} />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(photo.$id, "rejected")}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Reject"
                  >
                    <IconReject size={20} />
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
                // await Promise.all(
                //   enhancedPhotos.map((photo) =>
                //     updatePhoto(photo.$id, {
                //       photoUrl: photo.enhancedUrl,
                //       isEnhanced: true,
                //       enhancedAt: new Date().toISOString(),
                //       settings: photo.settings,
                //     })
                //   )
                // );
                // toast.success("Photos enhanced successfully");
                // setShowBulkEditor(false);
                // setSelectedPhotos([]);
                // onUpdate();
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
