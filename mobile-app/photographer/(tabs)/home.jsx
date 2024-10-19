import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, StatusBar, Dimensions, Alert } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { images } from '../../constants';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Animatable from 'react-native-animatable';
import RequestsModal from '../../components/Home/RequestsModal';
import UploadModal from '../../components/Home/UploadModal';
import Animated, { useAnimatedStyle, interpolate, useAnimatedScrollHandler, Extrapolate } from 'react-native-reanimated';
import { 
  getUserById, 
  goLive, 
  goOffline, 
  isPhotographerLive, 
  getBookingsByPhotographerId, 
  getLastStatusChange, 
  getReadableAddress, 
  createPhotographerNotification, 
  getCurrentBooking, 
  acceptBooking, 
  rejectBooking, 
  completeBooking, 
  createCancellationNotification,
  subscribeToUserBookings, // This is the correct import
  fetchRecentWorks,
  createAndHandleNotification,
  getPhotographerNotifications
} from '../../lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookingsModal from '../../components/Home/BookingsModal';
import { MotiView } from 'moti';
import useScrollPosition from '../hooks/useScrollPosition';
import * as Location from 'expo-location';
import { client } from '../../lib/appwrite';
import { showMessage } from "react-native-flash-message";
import NotificationSystem from '../../components/NotificationSystem';
import { userAppDatabases } from '../../lib/appwrite';
import { userAppConfig } from '../../lib/userAppConfig';
import { Query } from 'react-native-appwrite';
import ActiveBookingModal from '../../components/ActiveBookingModal';
import BookingDetailsModal from '../../components/Home/BookingDetailsModal';
import LocationModal from '../../components/Home/LocationModal';
import renderBookingSection from '../../components/Home/renderBookingSection';
import RecentBookingsSection from '../../components/Home/RecentBookingsSection';
import { LinearGradient } from 'expo-linear-gradient';
import ImprovedLoadingOverlay from '../../components/ImprovedLoadingOverlay';

const { width } = Dimensions.get('window');

const formatBookingDate = (timestamp) => {
  if (!timestamp) return 'No date available';
  return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
};

const truncateLocation = (location, maxLength = 25) => {
  if (!location) return 'N/A';
  return location.length > maxLength ? location.substring(0, maxLength) + '...' : location;
};

const AvatarAnimation = ({ avatarUrl }) => (
  <MotiView
    from={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'timing', duration: 1000 }}
  >
    {avatarUrl ? (
      <Image
        source={{ uri: avatarUrl }}
        className="w-16 h-16 rounded-full border-2 border-white"
        alt="user avatar"
      />
    ) : (
      <View className="w-16 h-16 rounded-full bg-sky-200 items-center justify-center border-2 border-white">
        <FontAwesome5 name="user" size={30} color="#0284c7" />
      </View>
    )}
  </MotiView>
);

const LoadingBookingDetails = () => (
  <View className="bg-white rounded-xl p-4 mb-4">
    <View className="flex-row items-center mb-3">
      <View className="w-16 h-16 rounded-full bg-gray-200 mr-3" />
      <View>
        <View className="w-24 h-4 bg-gray-200 rounded mb-2" />
        <View className="w-20 h-4 bg-gray-200 rounded" />
      </View>
    </View>
    {[...Array(4)].map((_, index) => (
      <View key={index} className="flex-row items-center mt-2">
        <View className="w-4 h-4 rounded-full bg-gray-200 mr-2" />
        <View className="w-32 h-4 bg-gray-200 rounded" />
      </View>
    ))}
  </View>
);

const BookingDetailItem = ({ icon, label, value }) => (
  <View className="flex-row items-center mt-2">
    <Ionicons name={icon} size={16} color="#0284c7" style={{ marginRight: 8 }} />
    <Text className="font-pmedium text-sm text-sky-700">{label}: <Text className="font-pbold text-sky-900">{value}</Text></Text>
  </View>
);

const BookingDetails = ({ booking }) => (
  <MotiView
    from={{ opacity: 0, translateY: 10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 300, delay: 200 }}
  >
    <View className="bg-white rounded-xl p-4 mb-4">
      <View className="flex-row items-center mb-3">
        <View className="w-16 h-16 rounded-full bg-white items-center justify-center mr-3">
          {booking.userDetails?.avatarUrl ? (
            <Image
              source={{ uri: booking.userDetails.avatarUrl }}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <FontAwesome5 name="user" size={24} color="#0284c7" />
          )}
        </View>
        <View>
          <Text className="font-pbold text-base text-sky-800">{booking.userDetails?.name || 'N/A'}</Text>
          <Text className="font-pmedium text-sm text-sky-700">{booking.userDetails?.phone || 'N/A'}</Text>
        </View>
      </View>
      <BookingDetailItem icon="camera" label="Package" value={booking.package || 'N/A'} />
      <BookingDetailItem icon="images" label="Photos" value={booking.numberOfPhotos || 'N/A'} />
      <BookingDetailItem icon="map" label="Location" value={truncateLocation(booking.readableLocation || booking.location)} />
      <BookingDetailItem icon="calendar" label="Date" value={booking.date ? formatBookingDate(booking.date) : 'N/A'} />
    </View>
  </MotiView>
);

const Home = () => {
  const [firstName, setFirstName] = useState('');
  const [lastBooking, setLastBooking] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isRequestsModalVisible, setIsRequestsModalVisible] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [pendingBookings, setPendingBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [isBookingsModalVisible, setIsBookingsModalVisible] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [lastStatusChange, setLastStatusChange] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [readableLocation, setReadableLocation] = useState('');
  const [userId, setUserId] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [isActiveBookingModalVisible, setIsActiveBookingModalVisible] = useState(false);
  const [currentBookingStatus, setCurrentBookingStatus] = useState(null);
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingIcon, setLoadingIcon] = useState('spinner');
  const [isFullPageLoading, setIsFullPageLoading] = useState(false);
  const [isCurrentBookingLoading, setIsCurrentBookingLoading] = useState(true);

  const fetchCurrentBooking = async (userId) => {
    try {
      setIsCurrentBookingLoading(true);
      const booking = await getCurrentBooking(userId);
      setCurrentBooking(booking);
      setCurrentBookingStatus(booking ? booking.status : null);
      setActiveBooking(booking);
      return booking;
    } catch (error) {
      console.error('Error fetching current booking:', error);
      return null;
    } finally {
      setIsCurrentBookingLoading(false);
    }
  };

  const handleBookingPress = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseBookingDetails = () => {
    setSelectedBooking(null);
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      setIsFullPageLoading(true);
      setLoadingMessage('Accepting booking...');
      setLoadingIcon('check');
      
      const updatedBooking = await acceptBooking(bookingId);
      
      // Immediately update the UI
      setCurrentBooking(updatedBooking);
      setCurrentBookingStatus('accepted');
      setActiveBooking(updatedBooking);
      
      showMessage({
        message: "Booking Accepted",
        description: "You have successfully accepted the booking.",
        type: "success",
        duration: 3000,
      });

      // Add a small delay before closing the loading overlay
      setTimeout(() => {
        setIsFullPageLoading(false);
      }, 1000); // 1 second delay
    } catch (error) {
      console.error('Error accepting booking:', error);
      showMessage({
        message: "Error",
        description: "Failed to accept the booking. Please try again.",
        type: "danger",
        duration: 3000,
      });
      setIsFullPageLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setIsFullPageLoading(true);
      setLoadingMessage('Rejecting booking...');
      setLoadingIcon('times');
      await rejectBooking(bookingId);
      showMessage({
        message: "Booking Rejected",
        description: "You have successfully rejected the booking.",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error rejecting booking:', error);
      showMessage({
        message: "Error",
        description: "Failed to reject the booking. Please try again.",
        type: "danger",
        duration: 3000,
      });
    } finally {
      // The loading overlay will automatically close after 6 seconds
      // due to the timer in ImprovedLoadingOverlay
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      setIsFullPageLoading(true);
      setLoadingMessage('Completing booking...');
      setLoadingIcon('check-circle');
      await completeBooking(bookingId);
      setCurrentBookingStatus(null);
      setActiveBooking(null);
      setIsLive(true);
      showMessage({
        message: "Booking Completed",
        description: "The booking has been successfully completed and you're now available for new bookings.",
        type: "success",
        duration: 3000,
      });
      await fetchCurrentBooking(userId);
      checkLiveStatus(userId);
    } catch (error) {
      console.error('Error completing booking:', error);
      showMessage({
        message: "Error",
        description: "Failed to complete the booking. Please try again.",
        type: "danger",
        duration: 3000,
      });
    } finally {
      setIsFullPageLoading(false);
    }
  };

  

  const scrollY = useScrollPosition();
  const logoScale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(scrollY.value, [0, 50], [1, 0.8], Extrapolate.CLAMP) }]
    };
  });
  const textOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolate.CLAMP)
    };
  });

  const fetchData = useCallback(async () => {
    // Fetch your data here
    // For example:
    if (userId) {
      const newBookings = await getBookingsByPhotographerId(userId);
      setRecentBookings(newBookings);
    }
    // ... fetch other necessary data
  }, [userId]);

  useEffect(() => {
    fetchData(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = client.subscribe(`databases.${userAppConfig.databaseId}.collections.${userAppConfig.bookingsCollectionId}.documents`, response => {
      if (response.events.includes('databases.*.collections.*.documents.*.create') ||
        response.events.includes('databases.*.collections.*.documents.*.update')) {
        fetchData(); // Refresh data when a new document is created or updated
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchData]);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          fetchUserData(storedUserId);
          checkLiveStatus(storedUserId);
          fetchAcceptedBookings(storedUserId);
          fetchAllBookings(storedUserId);
          fetchLastStatusChange(storedUserId);
          fetchCurrentBooking(storedUserId);

          // Retrieve stored location
          const storedLocation = await AsyncStorage.getItem('lastLocation');
          if (storedLocation) {
            const [latitude, longitude] = storedLocation.split(',').map(Number);
            setLocation(storedLocation);
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
            const address = await getReadableAddress(storedLocation);
            setReadableLocation(address);
          } else {
            // If no stored location, get current location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              let location = await Location.getCurrentPositionAsync({});
              const { latitude, longitude } = location.coords;
              const newLocation = `${latitude},${longitude}`;
              setLocation(newLocation);
              setMapRegion({
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              });
              const address = await getReadableAddress(newLocation);
              setReadableLocation(address);
            }
          }

          const unsubscribeUserBookings = subscribeToUserBookings(storedUserId, handleNewBooking);

          return () => {
            unsubscribe();
            unsubscribeUserBookings();
          };
        } else {
          console.warn('No userId found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error initializing component:', error);
      }
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    if (location) {
      getReadableAddress(location).then(address => {
        setReadableLocation(address);
      });
    }
  }, [location]);

  useEffect(() => {
    const setupSubscriptions = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        const unsubscribe = subscribeToUserBookings(storedUserId, handleBookingUpdate);
        return () => unsubscribe();
      }
    };

    setupSubscriptions();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRecentBookings(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToUserBookings(userId, handleNewBooking);
      return () => unsubscribe();
    }
  }, [userId]);

  useEffect(() => {
    const fetchCurrentBookingStatus = async () => {
      if (userId) {
        try {
          const bookings = await userAppDatabases.listDocuments(
            userAppConfig.databaseId,
            userAppConfig.bookingsCollectionId,
            [
              Query.equal('photographerId', userId),
              Query.notEqual('status', 'completed'),
              Query.notEqual('status', 'rejected'),
              Query.orderDesc('$createdAt'),
              Query.limit(1)
            ]
          );

          if (bookings.documents.length > 0) {
            const currentBooking = bookings.documents[0];
            setCurrentBookingStatus(currentBooking.status);
            
            // Parse userDetails JSON string
            const userDetails = JSON.parse(currentBooking.userDetails);
            
            // Fetch readable address
            const readableAddress = await getReadableAddress(currentBooking.location);
            
            setActiveBooking({
              ...currentBooking,
              userDetails,
              readableLocation: readableAddress
            });
          } else {
            setCurrentBookingStatus(null);
            setActiveBooking(null);
          }
        } catch (error) {
          console.error('Error fetching current booking status:', error);
        }
      }
    };

    fetchCurrentBookingStatus();
    // Set up a timer to check for updates every 30 seconds
    const intervalId = setInterval(fetchCurrentBookingStatus, 30000);

    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    const fetchLastBooking = async () => {
      if (userId) {
        try {
          const bookings = await getBookingsByPhotographerId(userId);
          if (bookings.length > 0) {
            setLastBooking(bookings[0]); // The first booking is the most recent one
          }
        } catch (error) {
          console.error('Error fetching last booking:', error);
        }
      }
    };

    fetchLastBooking();
  }, [userId]);

  useEffect(() => {
    const fetchAndUpdateRecentWorks = async () => {
      if (userId) {
        try {
          const works = await fetchRecentWorks(userId);
          setFeaturedWorks(works);
        } catch (error) {
          console.error('Error fetching recent works:', error);
        }
      }
    };

    fetchAndUpdateRecentWorks(); // Initial fetch
    const intervalId = setInterval(fetchAndUpdateRecentWorks, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [userId]);

  const fetchRecentBookings = async (photographerId) => {
    try {

      if (!userAppDatabases) {
        console.error('userAppDatabases is undefined');
        setRecentBookings([]);
        return;
      }

      if (!userAppConfig.databaseId || !userAppConfig.bookingsCollectionId) {
        console.error('Database ID or Collection ID is undefined');
        setRecentBookings([]);
        return;
      }

      // Ensure photographerId is a string
      const photographerIdString = String(photographerId);

      const bookings = await userAppDatabases.listDocuments(
        userAppConfig.databaseId,
        userAppConfig.bookingsCollectionId,
        [
          Query.equal('photographerId', photographerIdString),
          Query.notEqual('status', 'cancelled'),
          Query.orderDesc('date'),
          Query.limit(5)
        ]
      );


      if (bookings && bookings.documents) {
        setRecentBookings(bookings.documents);
      } else {
        console.error('Bookings or bookings.documents is undefined');
        setRecentBookings([]);
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      console.error('Error details:', error.message, error.code, error.response);
      setRecentBookings([]);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
        case 'completed':
            return 'bg-green-800';
        case 'pending':
            return 'bg-yellow-500';
        case 'accepted':
            return 'bg-green-500';
        default:
            return 'bg-red-500';
    }
};

  const fetchUserData = async (userId) => {
    try {
      const userData = await getUserById(userId);
      const nameParts = userData.name.split(' ');
      setFirstName(nameParts[0]);
      setAvatarUrl(userData.avatar || '');
      setLocation(userData.location || '');
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const checkLiveStatus = async (userId) => {
    try {
      const liveStatus = await isPhotographerLive(userId);
      setIsLive(liveStatus);
    } catch (error) {
      console.error('Error checking live status:', error);
    }
  };

  const toggleLiveStatus = async () => {
    try {
      if (userId) {
        setIsUpdatingStatus(true);
        if (!isLive) {
          setIsLocationModalVisible(true);
        } else {
          await goOffline(userId);
          setIsLive(false);
          await fetchLastStatusChange(userId);
        }
      }
    } catch (error) {
      console.error('Error toggling live status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLocationUpdate = async (newLocation) => {
    try {
      if (userId) {
        setIsLocationModalVisible(false);
        setIsUpdatingStatus(true);
        const locationString = `${newLocation.latitude},${newLocation.longitude}`;
        const readableAddress = await getReadableAddress(locationString);
        await goLive(userId, locationString, readableAddress);
        setIsLive(true);
        setLocation(locationString);
        setReadableLocation(readableAddress);
        setMapRegion({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        await AsyncStorage.setItem('lastLocation', locationString);
        await fetchLastStatusChange(userId);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  

  const fetchAcceptedBookings = async (userId) => {
    try {
      const bookings = await getBookingsByPhotographerId(userId, 'accepted');
      setAcceptedBookings(bookings);
    } catch (error) {
      console.error('Error fetching accepted bookings:', error);
    }
  };

  const fetchAllBookings = async (userId) => {
    try {
      const bookings = await getBookingsByPhotographerId(userId);
      setAllBookings(bookings);
    } catch (error) {
      console.error('Error fetching all bookings:', error);
    }
  };

  const fetchLastStatusChange = async (userId) => {
    try {
      const lastChange = await getLastStatusChange(userId);
      setLastStatusChange(lastChange);
    } catch (error) {
      console.error('Error fetching last status change:', error);
    }
  };

  

  const handleCloseBooking = async (bookingId) => {
    try {
      await completeBooking(bookingId);
      // Refresh the bookings list
      if (userId) {
        await fetchRecentBookings(userId);
      }
      showMessage({
        message: "Booking Closed",
        description: "The booking has been successfully closed.",
        type: "success",
      });
    } catch (error) {
      console.error('Error closing booking:', error);
      showMessage({
        message: "Error",
        description: "Failed to close the booking. Please try again.",
        type: "danger",
      });
    }
  };


  const handleNewBooking = (newBooking) => {
    if (newBooking && newBooking.photographerId === userId && newBooking.status === 'pending') {
      // Remove this call to prevent duplicate notifications
      // createPhotographerNotification({
      //   userId: userId,
      //   title: 'New Booking Request',
      //   message: `You have a new booking request for ${newBooking.package}`,
      //   type: 'new_request',
      //   relatedBookingId: newBooking.$id
      // });
      fetchRecentBookings(userId);
    }
  };

  const handleBookingComplete = async () => {
    setIsActiveBookingModalVisible(false);
    setActiveBooking(null);
    // Refresh the bookings list
    if (userId) {
      await fetchRecentBookings(userId);
    }
  };

  const handleRenderBookingSection = () => {
    if (currentBookingStatus === 'pending' || currentBookingStatus === 'accepted') {
      return (
        <Animatable.View animation="fadeIn" className="w-full mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.0)', 'rgba(59, 130, 246, 0.0)']}
              className="p-4 bg-sky-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-pmedium text-base text-sky-800">
                  {currentBookingStatus === 'pending' ? 'New Request !' : 'Current Booking !'}
                </Text>
                <View className={`px-3 py-1.5 rounded-full ${getStatusColor(currentBookingStatus)}`}>
                  <Text className={`font-pmedium text-xs text-white`}>
                    {currentBookingStatus.charAt(0).toUpperCase() + currentBookingStatus.slice(1)}
                  </Text>
                </View>
              </View>

              {isCurrentBookingLoading ? (
                <LoadingBookingDetails />
              ) : activeBooking ? (
                <BookingDetails booking={activeBooking} />
              ) : (
                <Text className="text-sky-600">No active booking found.</Text>
              )}

              {currentBookingStatus === 'pending' && activeBooking && (
                <View className="flex-row justify-between mt-4">
                  <ActionButton
                    onPress={() => handleRejectBooking(activeBooking.$id)}
                    icon="times"
                    text="Reject"
                    color="bg-red-500"
                  />
                  <ActionButton
                    onPress={() => handleAcceptBooking(activeBooking.$id)}
                    icon="check"
                    text="Accept"
                    color="bg-green-500"
                  />
                </View>
              )}

              {currentBookingStatus === 'accepted' && activeBooking && (
                <View className="mt-4">
                  <ActionButton
                    onPress={() => handleCompleteBooking(activeBooking.$id)}
                    icon="check-circle"
                    text="Complete Booking"
                    color="bg-sky-500"
                    fullWidth
                  />
                  <ActionButton
                    onPress={() => handleUploadPhotos(activeBooking.$id)}
                    icon="cloud-upload-alt"
                    text="Upload Photos"
                    color="bg-sky-700"
                    fullWidth
                  />
                </View>
              )}
            </LinearGradient>
          </MotiView>
        </Animatable.View>
      );
    } else {
      // Render the original renderBookingSection (live toggle section)
      return renderBookingSection({
        mapRegion,
        activeBooking: null,
        isLive,
        readableLocation,
        lastStatusChange,
        isUpdatingStatus,
        toggleLiveStatus,
        handleAcceptBooking,
        handleRejectBooking,
        handleCompleteBooking,
        truncateLocation
      });
    }
  };

  const ActionButton = ({ onPress, icon, text, color, fullWidth = false }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`${color} py-2 px-4 rounded-full ${fullWidth ? 'w-full mb-2' : 'flex-1 mx-1'} flex-row items-center justify-center`}
    >
      <FontAwesome5 name={icon} size={14} color="white" style={{ marginRight: 6 }} />
      <Text className="text-white font-pbold text-center text-xs">{text}</Text>
    </TouchableOpacity>
  );

  const handleUploadPhotos = (bookingId) => {
    Alert.alert(
      "Upload Photos",
      "Have you finished taking all the photos for this booking?",
      [
        {
          text: "No, not yet",
          style: "cancel"
        },
        { 
          text: "Yes, finished", 
          onPress: async () => {
            try {
              setIsFullPageLoading(true);
              setLoadingMessage('Completing booking...');
              setLoadingIcon('check-circle');
              await completeBooking(bookingId);
              setCurrentBookingStatus(null);
              setActiveBooking(null);
              setIsLive(true);
              showMessage({
                message: "Booking Completed",
                description: "You've confirmed that all photos have been taken. You can now upload them.",
                type: "success",
                duration: 4000,
              });
              setSelectedBookingId(bookingId);
              setIsUploadModalVisible(true);
              await fetchCurrentBooking(userId);
              checkLiveStatus(userId);
            } catch (error) {
              console.error('Error completing booking:', error);
              showMessage({
                message: "Error",
                description: "Failed to complete the booking. Please try again.",
                type: "danger",
                duration: 4000,
              });
            } finally {
              setIsFullPageLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBookingUpdate = useCallback(async (updatedBooking) => {
    if (updatedBooking.photographerId === userId) {
      const existingNotifications = await getPhotographerNotifications(userId);
      const userDetails = JSON.parse(updatedBooking.userDetails);

      if (updatedBooking.status === 'pending') {
        const alreadyNotified = existingNotifications.some(
          n => n.relatedBookingId === updatedBooking.$id && n.type === 'new_request'
        );

        if (!alreadyNotified) {
          await createPhotographerNotification({
            userId: userId,
            title: 'New Booking Request',
            message: `You have a new booking request for ${updatedBooking.package}`,
            type: 'new_request',
            relatedBookingId: updatedBooking.$id,
            userDetails: userDetails,
            package: updatedBooking.package,
            price: updatedBooking.price,
            numberOfPhotos: updatedBooking.numberOfPhotos,
            date: updatedBooking.date
          });
        }
      } else if (updatedBooking.status === 'cancelled') {
        const alreadyNotified = existingNotifications.some(
          n => n.relatedBookingId === updatedBooking.$id && n.type === 'booking_cancelled'
        );

        if (!alreadyNotified) {
          await createPhotographerNotification({
            userId: userId,
            title: 'Booking Cancelled',
            message: `Booking for ${updatedBooking.package} has been cancelled`,
            type: 'booking_cancelled',
            relatedBookingId: updatedBooking.$id,
            userDetails: userDetails,
            package: updatedBooking.package,
            price: updatedBooking.price,
            numberOfPhotos: updatedBooking.numberOfPhotos,
            date: updatedBooking.date
          });
        }
      }
      fetchRecentBookings(userId);
    }
  }, [userId]);

  useEffect(() => {
    let unsubscribe;
    if (userId) {
      unsubscribe = subscribeToUserBookings(userId, handleBookingUpdate);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const handleNotificationReceived = useCallback((notification) => {
    // Refresh necessary data when a notification is received
    fetchData();
    // You can add more specific logic here based on the notification content if needed
  }, [fetchData]);

  const handleLoadingOverlayClose = useCallback(() => {
    setIsFullPageLoading(false);
    
    // Force an immediate update of the UI
    fetchCurrentBooking(userId).then(booking => {
      if (booking) {
        setCurrentBooking(booking);
        setCurrentBookingStatus(booking.status);
        setActiveBooking(booking);
      } else {
        setCurrentBooking(null);
        setCurrentBookingStatus(null);
        setActiveBooking(null);
      }
    });
    
    checkLiveStatus(userId);
    fetchRecentBookings(userId);
  }, [userId]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'left', 'bottom']}>
        <View style={{
          position: 'absolute',
          top: StatusBar.currentHeight,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'white',
        }}>
          <View className="flex-row items-center justify-between w-full px-5 rounded-b-2xl pb-4 pt-5">
            <View className="flex-row items-center justify-center">
              <Animated.Image
                source={images.logo_blue}
                style={[
                  { width: 24, height: 24, marginRight: 8 },
                  logoScale
                ]}
                resizeMode="contain"
              />
              <Animated.Text
                style={[
                  textOpacity,
                  { fontWeight: 'bold', fontSize: 20, color: '#075985' }
                ]}
                className="font-pbold"
              >
                <Text className="font-pbold">Momentam Studio</Text>
              </Animated.Text>
            </View>
            <NotificationSystem userId={userId} onNotificationReceived={handleNotificationReceived} />
          </View>
        </View>

        <Animated.ScrollView
          className="w-full h-full"
          contentContainerStyle={{ paddingTop: StatusBar.currentHeight + 70 }}
          onScroll={useAnimatedScrollHandler((event) => {
            scrollY.value = event.contentOffset.y;
          })}
          scrollEventThrottle={16}
        >
          <View className="w-full items-start justify-start px-4 pt-5">
            {/* Header Section */}
            <Animatable.View animation="fadeInDown" className="w-full mb-8 ">
              <BlurView intensity={20} tint="light" className="rounded-3xl overflow-hidden">
                <View className="bg-sky-700 p-5">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-pmedium text-base text-sky-200">Welcome back,</Text>
                      <Animatable.Text
                        animation="fadeIn"
                        delay={500}
                        className="font-pbold text-2xl text-white mt-1"
                      >
                        {firstName}!
                      </Animatable.Text>
                    </View>
                    <AvatarAnimation avatarUrl={avatarUrl} />
                  </View>
                  <Animatable.View
                    animation="fadeInUp"
                    delay={800}
                    className="mt-4 bg-white rounded-xl p-3"
                  >
                    <Text className="font-pmedium text-sm text-sky-700">Ready to capture some moments?</Text>
                    <View className="flex-row items-center mt-2">
                      <FontAwesome5 name="calendar-check" size={16} color="#0284c7" style={{ marginRight: 8 }} />
                      <Text className="font-psemibold text-sky-800">
                        Last booking: {lastBooking ? formatBookingDate(lastBooking.date) : 'No bookings yet'}
                      </Text>
                    </View>
                  </Animatable.View>
                </View>
              </BlurView>
            </Animatable.View>

            {/* Booking Status or Live Status Section */}
            {handleRenderBookingSection()}

            {/* Recent Bookings Section */}
            <RecentBookingsSection
              userId={userId}
              onViewAll={() => setIsBookingsModalVisible(true)}
              onBookingPress={handleBookingPress}
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
            />

          

            {/* Recent Works Section */}
            <Animatable.Text
              animation="fadeInUp"
              delay={2100}
              className="font-pbold text-lg text-sky-800 mb-4 px-2"
            >
              Recent Works
            </Animatable.Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-8 px-2"
            >
              {featuredWorks.map((work, index) => (
                <Animatable.View
                  key={work.id}
                  animation="fadeInRight"
                  delay={2200 + index * 300}
                >
                  <TouchableOpacity className="mr-4">
                    <Image
                      source={{ uri: work.image }}
                      className="w-64 h-40 rounded-lg"
                      resizeMode="cover"
                    />
                    <BlurView intensity={80} tint="dark" className="absolute bottom-0 left-0 right-0 p-2">
                      <Text className="text-white font-pmedium text-center">{work.title}</Text>
                    </BlurView>
                  </TouchableOpacity>
                </Animatable.View>
              ))}
            </ScrollView>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
      <UploadModal
        visible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        bookingId={selectedBookingId}
      />
      <RequestsModal
        visible={isRequestsModalVisible}
        onClose={() => setIsRequestsModalVisible(false)}
        requests={pendingBookings}
        onAccept={handleAcceptBooking}
        onReject={handleRejectBooking}
      />
      <LocationModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onUpdateLocation={handleLocationUpdate}
      />
      <BookingsModal
        visible={isBookingsModalVisible}
        onClose={() => setIsBookingsModalVisible(false)}
        photographerId={userId}
        onViewBookingDetails={handleBookingPress}
        onUploadPhotos={(booking) => {
          setSelectedBookingId(booking.$id);
          setIsUploadModalVisible(true);
        }}
        onAccept={handleAcceptBooking}
        onReject={handleRejectBooking}
        onCloseBooking={handleCloseBooking}
      />
      <BookingDetailsModal
        visible={!!selectedBooking}
        booking={selectedBooking}
        onClose={handleCloseBookingDetails}
        onUploadPhotos={(bookingId) => {
          setSelectedBookingId(bookingId);
          setIsUploadModalVisible(true);
          handleCloseBookingDetails();
        }}
      />
      <ActiveBookingModal
        visible={isActiveBookingModalVisible}
        booking={activeBooking}
        onClose={() => setIsActiveBookingModalVisible(false)}
        onBookingComplete={handleBookingComplete}
      />
      <ImprovedLoadingOverlay 
        visible={isFullPageLoading} 
        message={loadingMessage}
        icon={loadingIcon}
        onClose={handleLoadingOverlayClose}
      />
    </View>
  );
};


export default Home;