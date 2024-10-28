import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { format, isValid } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { IconX, IconRefresh, IconUser, IconMail, IconPhone, IconCalendar, 
         IconClock, IconBookmark, IconStar, IconMapPin, IconClock as IconHistory, IconPhoto } from '@tabler/icons-react';
import { getUserDetails } from '@/lib/appwrite';
import { getReadableAddress } from '@/lib/appwrite';

const InfoItem = ({ icon: Icon, label, value }) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-700/50"
  >
    <Icon size={20} className="text-blue-500 dark:text-blue-400" />
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-base text-gray-900 dark:text-white">{value}</p>
    </div>
  </motion.div>
);

const StatItem = ({ label, value }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-neutral-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-600"
  >
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
  </motion.div>
);

// Add this new component for the gallery view
const ClientGalleryGroup = ({ client, photos }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm mb-4"
  >
    {/* Client Header */}
    <div className="flex items-center space-x-3 mb-4">
      <Image
        src={client.avatar || '/default-avatar.png'}
        alt={client.name}
        width={40}
        height={40}
        className="rounded-lg"
      />
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white">{client.name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} • {photos[0].package}
        </p>
      </div>
      <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
        {format(new Date(photos[0].date), 'MMM dd, yyyy')}
      </div>
    </div>

    {/* Thumbnail Grid */}
    <div className="grid grid-cols-4 gap-2">
      {photos.map((photo, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.05 }}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
        >
          <Image
            src={photo.url || photo.photoUrl} // Add fallback for both url formats
            alt={`${client.name}'s photo ${index + 1}`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              console.error('Error loading image:', photo.url || photo.photoUrl);
              e.target.src = '/default-photo.png'; // Add a default photo placeholder
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <p className="text-white text-sm">View Full</p>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const UserDetailsModal = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(user);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const details = await getUserDetails(user.$id);
      setUserDetails(details);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    const interval = setInterval(fetchUserDetails, 30000);
    return () => clearInterval(interval);
  }, [user.$id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'PPP') : 'Unknown';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[400px]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
              <InfoItem icon={IconUser} label="Name" value={userDetails.name} />
              <InfoItem icon={IconMail} label="Email" value={userDetails.email} />
              <InfoItem icon={IconPhone} label="Phone" value={userDetails.phone || 'N/A'} />
              <InfoItem icon={IconCalendar} label="Joined" value={formatDate(userDetails.$createdAt)} />
              <InfoItem icon={IconClock} label="Last Login" value={userDetails.lastLogin ? formatDate(userDetails.lastLogin) : 'Never'} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatItem label="Total Bookings" value={userDetails.totalBookings || 0} />
                <StatItem label="Completed" value={userDetails.completedBookings || 0} />
                <StatItem label="Cancelled" value={userDetails.cancelledBookings || 0} />
                {userDetails.type === 'photographer' && (
                  <>
                    <StatItem label="Rating" value={`${userDetails.rating || 0}/5`} />
                    <StatItem label="Earnings" value={`TZS ${(userDetails.grossEarnings || 0).toLocaleString()}`} />
                  </>
                )}
              </div>
            </motion.div>
          </div>
        );

      case 'gallery':
        if (userDetails.type === 'photographer' && userDetails.clientPhotos?.length > 0) {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Gallery Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Photos</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {userDetails.clientPhotos.reduce((acc, client) => acc + client.photos.length, 0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clients</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {userDetails.clientPhotos.length}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Latest Upload</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(new Date(userDetails.clientPhotos[0].photos[0].date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {/* Client Groups */}
              {userDetails.clientPhotos.map((clientGroup, index) => (
                <ClientGalleryGroup
                  key={index}
                  client={clientGroup.client}
                  photos={clientGroup.photos}
                />
              ))}
            </motion.div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <IconPhoto size={48} className="mb-4 opacity-50" />
            <p>No photos available</p>
          </div>
        );

      case 'interactions':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {userDetails.type === 'photographer' ? (
              userDetails.usersInteracted?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userDetails.usersInteracted.map((client, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-700 rounded-xl shadow-sm"
                    >
                      <Image
                        src={client.avatar || '/default-avatar.png'}
                        alt={client.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {client.bookings} booking{client.bookings !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No interactions yet</p>
              )
            ) : (
              // Render photographer interactions for regular users
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {userDetails.photographersInteracted?.map((photographer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-700 rounded-xl shadow-sm"
                  >
                    <Image
                      src={photographer.avatar || '/default-avatar.png'}
                      alt={photographer.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{photographer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <IconStar size={16} className="text-yellow-400 mr-1" />
                        {photographer.rating.toFixed(1)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 'activity':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {userDetails.recentActivities?.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-neutral-700 p-4 rounded-xl shadow-sm"
              >
                <p className="text-gray-900 dark:text-white">{activity.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(activity.time), 'PPp')}
                  </p>
                  {activity.amount && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      TZS {activity.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        );

      case 'locations':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Current Location */}
            {userDetails.currentLocation && (
              <div className="bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white mb-3">
                  <IconMapPin className="mr-2 text-blue-500" />
                  Current Location
                </h3>
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <MapContainer
                    center={userDetails.currentLocation.split(',').map(Number)}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={userDetails.currentLocation.split(',').map(Number)}>
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold">{userDetails.name}</h4>
                          <p className="text-sm">Current Location</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Location History */}
            <div className="bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white mb-3">
                <IconHistory className="mr-2 text-blue-500" />
                Location History
              </h3>
              <div className="space-y-4">
                {userDetails.locationHistory ? (
                  userDetails.locationHistory.map((location, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-600 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {location.address || 'Unknown Location'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(location.timestamp), 'PPp')}
                        </p>
                      </div>
                      {location.duration && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Duration: {location.duration}
                        </span>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No location history available
                  </p>
                )}
              </div>
            </div>

            {/* For photographers: Booking Locations */}
            {userDetails.type === 'photographer' && userDetails.bookingLocations && (
              <div className="bg-white dark:bg-neutral-700 rounded-xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white mb-3">
                  <IconBookmark className="mr-2 text-blue-500" />
                  Booking Locations
                </h3>
                <div className="h-[300px] rounded-lg overflow-hidden">
                  <MapContainer
                    center={[-6.776012, 39.178326]} // Default center (Tanzania)
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {userDetails.bookingLocations.map((location, index) => (
                      <Marker
                        key={index}
                        position={location.coordinates.split(',').map(Number)}
                      >
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-bold">{location.eventType}</h4>
                            <p className="text-sm">{location.address}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(location.date), 'PPp')}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white dark:bg-neutral-800 w-full max-w-6xl rounded-2xl shadow-2xl my-4 relative flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-sky-600 via-sky-700 to-sky-900 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <IconX size={24} className="text-white" />
          </motion.button>
          
          <div className="absolute -bottom-16 left-8 flex items-end space-x-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-neutral-800 shadow-lg"
            >
              <Image
                src={userDetails.avatar || '/default-avatar.png'}
                alt={userDetails.name}
                layout="fill"
                objectFit="cover"
                className="rounded-xl"
              />
            </motion.div>
            <div className="mb-4 text-white">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold"
              >
                {userDetails.name}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/80"
              >
                {userDetails.type === 'photographer' ? 'Photographer' : 'User'}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-20 px-8 flex-shrink-0">
          <motion.div 
            className="flex space-x-6 border-b border-gray-200 dark:border-neutral-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {['overview', 'gallery', 'interactions', 'activity', 'locations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab 
                    ? 'text-blue-500' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 py-4 bg-gray-50 dark:bg-neutral-700/50 flex justify-end space-x-4 flex-shrink-0 border-t border-gray-200 dark:border-neutral-700"
        >
          <button
            onClick={fetchUserDetails}
            className="px-4 py-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center space-x-2"
          >
            <IconRefresh size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default UserDetailsModal;
