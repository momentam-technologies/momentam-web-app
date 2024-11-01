import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { IconCheck, IconX, IconLoader } from '@tabler/icons-react';

const PhotosGrid = ({ photos, onPhotoClick, selectedPhotos, onSelectPhoto, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <IconLoader className="animate-spin" size={32} />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p>No photos found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {photos.map((photo) => (
        <motion.div
          key={photo.$id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group aspect-square"
        >
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={selectedPhotos.includes(photo.$id)}
              onChange={() => onSelectPhoto(photo.$id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Status Badge */}
          <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-medium ${
            photo.status === 'approved'
              ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
              : photo.status === 'rejected'
              ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
          }`}>
            {photo.status || 'pending'}
          </div>

          {/* Photo */}
          <div 
            className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => onPhotoClick(photo)}
          >
            <Image
              src={photo.photoUrl}
              alt={`Photo by ${photo.photographer?.name}`}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-110"
            />

            {/* Overlay with Info */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
              <p className="text-white text-sm font-medium truncate">
                {photo.photographer?.name}
              </p>
              <p className="text-white/80 text-xs">
                {new Date(photo.$createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PhotosGrid; 