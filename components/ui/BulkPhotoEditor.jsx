import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { IconAdjustments, IconX, IconWand, IconDownload, IconCheck, IconEye, IconArrowsMaximize } from '@tabler/icons-react';

const BulkPhotoEditor = ({ photos, onClose, onSave }) => {
  const [previewPhoto, setPreviewPhoto] = useState(photos[0]);
  const [settings, setSettings] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    clarity: 0,
    vibrance: 0
  });

  const generateFilters = (settings) => {
    return {
      filter: `
        brightness(${100 + settings.brightness}%)
        contrast(${100 + settings.contrast}%)
        saturate(${100 + settings.saturation}%)
        hue-rotate(${settings.tint}deg)
        sepia(${settings.temperature}%)
      `,
      transform: `scale(1)`
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Photo Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-73px)]">
          {/* Left Panel - Preview */}
          <div className="flex-1 p-4 flex flex-col">
            {/* Main Preview */}
            <div className="relative flex-1 bg-neutral-900 rounded-lg overflow-hidden mb-4">
              <Image
                src={previewPhoto.thumbnailUrl || previewPhoto.photoUrl}
                alt="Preview"
                layout="fill"
                objectFit="contain"
                style={generateFilters(settings)}
              />
            </div>

            {/* Thumbnails Scroll */}
            <div className="h-24 flex space-x-2 overflow-x-auto">
              {photos.map((photo) => (
                <div
                  key={photo.$id}
                  onClick={() => setPreviewPhoto(photo)}
                  className={`relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer ${
                    previewPhoto.$id === photo.$id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <Image
                    src={photo.thumbnailUrl || photo.photoUrl}
                    alt="Thumbnail"
                    layout="fill"
                    objectFit="cover"
                    style={generateFilters(settings)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="w-96 border-l border-gray-200 dark:border-neutral-700 flex flex-col">
            {/* Settings Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize font-medium">{key}</span>
                      <span className="text-gray-500 dark:text-gray-400">{value}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={value}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        setSettings(prev => ({
                          ...prev,
                          [key]: newValue
                        }));
                      }}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 dark:border-neutral-700 space-y-2">
              <button
                onClick={() => setSettings({
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  sharpness: 0,
                  temperature: 0,
                  tint: 0,
                  highlights: 0,
                  shadows: 0,
                  clarity: 0,
                  vibrance: 0
                })}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => onSave(photos.map(photo => ({
                  ...photo,
                  settings
                })))}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Apply to All Photos
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BulkPhotoEditor; 