import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { IconX, IconFilter, IconSearch, IconMapPin, IconCamera, IconUser, 
         IconCalendar, IconClock, IconStar, IconMapPinFilled, IconList, IconLayoutGrid } from '@tabler/icons-react';
import L from 'leaflet';
import { getReadableAddress } from '@/lib/appwrite';

const ExpandedMapModal = ({ isOpen, onClose, photographers, userRequests }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [selectedMarker, setSelectedMarker] = useState(null);

  const filteredData = {
    photographers: photographers.filter(p => 
      filterType === 'all' || filterType === 'photographers'
    ).filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    requests: userRequests.filter(r => 
      filterType === 'all' || filterType === 'requests'
    ).filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="absolute inset-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <IconMapPin className="text-blue-500 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Tracking</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredData.photographers.length} photographers • {filteredData.requests.length} active requests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-neutral-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white dark:bg-neutral-600 text-blue-500 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <IconMapPin size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-neutral-600 text-blue-500 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <IconList size={20} />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500"
              >
                <IconX size={24} />
              </motion.button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, location, or request type..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <IconSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <div className="flex items-center space-x-2">
              {['all', 'photographers', 'requests'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map View */}
          <div className={`flex-1 ${viewMode === 'list' ? 'hidden' : ''}`}>
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

              {filteredData.photographers.map((photographer) => (
                <Marker
                  key={photographer.$id}
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
                    click: () => setSelectedMarker(photographer)
                  }}
                >
                  <Popup>
                    <div className="p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
                          {photographer.name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{photographer.name}</h3>
                          <div className="flex items-center text-yellow-500">
                            <IconStar size={16} className="mr-1" />
                            <span>{photographer.rating || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Available Now
                        </p>
                        <p className="text-gray-600">{getReadableAddress(photographer.location)}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {filteredData.requests.map((request, index) => (
                <Marker
                  key={index}
                  position={[request.lat, request.lng]}
                  icon={L.divIcon({
                    html: `
                      <div class="relative group">
                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white animate-pulse"></div>
                        <div class="w-10 h-10 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg transform transition-transform hover:scale-110 flex items-center justify-center">
                          ${request.name[0]}
                        </div>
                      </div>
                    `,
                    className: 'custom-icon'
                  })}
                  eventHandlers={{
                    click: () => setSelectedMarker(request)
                  }}
                >
                  <Popup>
                    <div className="p-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">
                          {request.name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.requestType}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center text-yellow-600">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                          Pending Request
                        </p>
                        <p className="text-gray-600">{format(new Date(request.timestamp), 'PPp')}</p>
                        <p className="text-gray-600">{request.eventLocation}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredData.photographers.map((photographer) => (
                  <motion.div
                    key={photographer.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold">
                        {photographer.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{photographer.name}</h3>
                        <div className="flex items-center text-yellow-500">
                          <IconStar size={16} className="mr-1" />
                          <span>{photographer.rating || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Available Now
                      </p>
                      <p className="text-gray-600">{getReadableAddress(photographer.location)}</p>
                    </div>
                  </motion.div>
                ))}

                {filteredData.requests.map((request, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white font-bold">
                        {request.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{request.name}</h3>
                        <p className="text-sm text-gray-600">{request.requestType}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center text-yellow-600">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                        Pending Request
                      </p>
                      <p className="text-gray-600">{format(new Date(request.timestamp), 'PPp')}</p>
                      <p className="text-gray-600">{request.eventLocation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExpandedMapModal;
