import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { IconMapPin, IconZoomIn, IconFilter, IconRefresh, IconDotsVertical, 
         IconUser, IconCamera, IconMapPinFilled, IconRadar, IconMapSearch, IconX } from '@tabler/icons-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { getReadableAddress } from '@/lib/dashboard';

const AnimatedMarker = ({ children }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
  >
    {children}
  </motion.div>
);

const PhotographerMap = ({ 
  photographers, 
  userRequests, 
  onExpandMap,
  isExpanded,
  onClose 
}) => {
  const [filterType, setFilterType] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [addresses, setAddresses] = useState({});

  const totalActive = photographers.length;
  const totalRequests = userRequests.length;

  const handleRefresh = () => {
    // Add refresh functionality
    console.log('Refreshing map data...');
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      const newAddresses = {};
      for (const photographer of photographers) {
        newAddresses[photographer.$id] = await getReadableAddress(photographer.location);
      }
      setAddresses(newAddresses);
    };

    fetchAddresses();
  }, [photographers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden ${
        isExpanded ? 'h-full' : 'h-[536px]'
      }`}
    >
      {/* Header section */}
      <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
              <IconRadar className="text-blue-500 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Live Tracking
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time location monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              >
                <IconFilter size={20} />
              </motion.button>
              
              <AnimatePresence>
                {isFilterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 z-10"
                  >
                    {['all', 'photographers', 'requests'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilterType(type);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                          filterType === type
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              <IconRefresh size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isExpanded ? onClose : onExpandMap}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              {isExpanded ? <IconX size={20} /> : <IconZoomIn size={20} />}
            </motion.button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-50 dark:bg-neutral-700/50 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <IconCamera className="text-blue-500" size={20} />
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Photographers</p>
            </div>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalActive}</p>
              <span className="text-xs text-green-500">Live Now</span>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gray-50 dark:bg-neutral-700/50 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <IconMapPinFilled className="text-red-500" size={20} />
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Requests</p>
            </div>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalRequests}</p>
              <span className="text-xs text-yellow-500">Pending</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[420px]">
        <MapContainer
          center={[-6.776012, 39.178326]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ZoomControl position="bottomright" />

          {(filterType === 'all' || filterType === 'photographers') &&
            photographers.map((photographer) => (
              <AnimatedMarker key={`photographer-${photographer.$id}`}>
                <Marker
                  position={photographer.location.split(',').map(Number)}
                  icon={L.divIcon({
                    html: `
                      <div class="relative group">
                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        <div class="w-10 h-10 rounded-xl bg-blue-500 text-white font-bold text-sm shadow-lg transform transition-transform hover:scale-110 flex items-center justify-center">
                          ${photographer.name[0]}
                        </div>
                      </div>
                    `,
                    className: 'custom-icon'
                  })}
                  eventHandlers={{
                    mouseover: () => setHoveredMarker(photographer.$id),
                    mouseout: () => setHoveredMarker(null),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
                          {photographer.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{photographer.name}</h4>
                          <div className="flex items-center">
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="text-sm">{photographer.rating || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Available
                        </p>
                        <p className="text-gray-600">{addresses[photographer.$id] || 'Loading address...'}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </AnimatedMarker>
            ))}

          {(filterType === 'all' || filterType === 'requests') &&
            userRequests.map((request, index) => (
              <AnimatedMarker key={`request-${index}`}>
                <Marker
                  position={[request.lat, request.lng]}
                  icon={L.divIcon({
                    html: `
                      <div class="relative group">
                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white animate-pulse"></div>
                        <div class="w-10 h-10 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg transform transition-transform hover:scale-110 flex items-center justify-center">
                          ${request.name ? request.name[0] : 'U'}
                        </div>
                      </div>
                    `,
                    className: 'custom-icon'
                  })}
                  eventHandlers={{
                    mouseover: () => setHoveredMarker(`request-${index}`),
                    mouseout: () => setHoveredMarker(null),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">
                          {request.name ? request.name[0] : 'U'}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{request.name || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-600">{request.requestType}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-yellow-600 flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                          Pending Request
                        </p>
                        <p className="text-gray-600">{format(new Date(request.timestamp), 'PPp')}</p>
                        <p className="text-gray-600">{request.eventLocation}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </AnimatedMarker>
            ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 z-[400]">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Photographers</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Requests</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PhotographerMap;
