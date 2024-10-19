import { Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Modal, ActivityIndicator, FlatList, Linking, StatusBar, Dimensions, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { icons, images } from '../../constants';
import CustomButton from '../../components/CustomButton';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserById, getRecentLocations, getBookingsByUserId, getLivePhotographers, getLivePhotographerLocations, addBooking, updateRecentLocations, checkBookingStatus, getActiveBooking, cancelBooking, client, config, getNotifications, markNotificationAsRead, getUnreadNotificationCount, createNotification, getReadableAddress, subscribeToBookingUpdates, registerForPushNotificationsAsync } from '../../lib/appwrite';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Animatable from 'react-native-animatable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  interpolateColor,
  interpolate,
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  Extrapolate,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { getCurrentLocation } from '../../lib/appwrite';
import { showMessage } from "react-native-flash-message";
import HowItWorksStep from '../../components/Home/HowItWorksStep';
import LocationSelectionModal from "../../components/Home/LocationSelectionModal";
import ErrorModal from '../../components/Home/ErrorModal';
import LoadingComponent from '../../components/Home/LoadingComponent';
import PhotographerSelectionModal from '../../components/Home/PhotographerSelectionModal';
import BookingSummaryModal from '../../components/Home/BookingSummaryModal';
import PackageSelectionModal from '../../components/Home/PackageSelectionModal';
import ConfirmationModal from '../../components/Home/ConfirmationModal';
import { MaterialIcons } from '@expo/vector-icons';
import BookingStatusCard from '../../components/Home/BookingStatusCard';
import NotificationSystem from '../../components/NotificationSystem';

const { width, height } = Dimensions.get('window');

const AvatarAnimation = ({ avatarUrl }) => (
  <MotiView
    from={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'timing', duration: 1000 }}
  >
    <Image
      source={{ uri: avatarUrl || 'https://via.placeholder.com/64' }}
      style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'white' }}
      contentFit="cover"
    />
  </MotiView>
);




const NotificationItem = ({ notification, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(notification)}
    className={`p-4 border-b border-sky-100 ${notification.read ? 'bg-sky-50' : 'bg-sky-100'}`}
  >
    <View className="flex-row justify-between items-start">
      <View className="flex-1 mr-2">
        <Text className={`font-pbold ${notification.read ? 'text-sky-700' : 'text-sky-800'}`}>
          {notification.title}
        </Text>
        <Text className={`text-sm mt-1 ${notification.read ? 'text-sky-600' : 'text-sky-700'}`}>
          {notification.message}
        </Text>
      </View>
      {!notification.read && (
        <View className="w-3 h-3 rounded-full bg-sky-500" />
      )}
    </View>
    <Text className="text-xs text-sky-400 mt-2">
      {new Date(notification.timestamp).toLocaleString()}
    </Text>
  </TouchableOpacity>
);

const NotificationsModal = ({ visible, onClose, notifications, onNotificationPress }) => (
  <Modal
    transparent={true}
    visible={visible}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View className="flex-1 bg-black/50 justify-end">
      <BlurView intensity={20} tint="light" className="w-full h-[70%] rounded-t-3xl overflow-hidden">
        <View className="bg-white/90 p-6 rounded-t-3xl w-full h-full">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="font-pbold text-2xl text-sky-800">Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#0284c7" />
            </TouchableOpacity>
          </View>
          {notifications.length > 0 ? (
            <FlatList
              data={notifications}
              renderItem={({ item }) => (
                <NotificationItem
                  notification={item}
                  onPress={onNotificationPress}
                />
              )}
              keyExtractor={(item) => item.$id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text className="text-center text-sky-600">No notifications</Text>
          )}
        </View>
      </BlurView>
    </View>
  </Modal>
);


const PopUpNotification = ({ notification, onClose }) => {
  return (
    <Animatable.View
      animation="slideInDown"
      duration={500}
      className="absolute top-0 left-0 right-0 bg-sky-500 p-4 z-50"
    >
      <TouchableOpacity onPress={onClose} className="absolute top-2 right-2">
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      <Text className="text-white font-pbold">{notification.title}</Text>
      <Text className="text-white">{notification.message}</Text>
    </Animatable.View>
  );
};

const Home = () => {

  const items = [
    { id: 1, title: 'Conference Event', details: '10 Photos', price: 'Tsh 20,000' },
    { id: 2, title: 'Conference Event', details: '15 Photos', price: 'Tsh 30,000' },
    { id: 3, title: 'Conference Event', details: '20 Photos', price: 'Tsh 40,000' },
    { id: 4, title: 'Uni Offer', details: '50 Photos', price: 'Tsh 50,000' },
    { id: 5, title: 'Uni Offer', details: '70 Photos', price: 'Tsh 70,000' },
    { id: 6, title: 'Business Exhibition', details: '100 Photos', price: 'Tsh 200,000' },

    // Add more items as needed
  ];

  const [form, setForm] = useState({
    search_request: '',
  });

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [customModalVisible, setCustomModalVisible] = useState(false); // State for the custom button modal
  const [summaryModalVisible, setSummaryModalVisible] = useState(false); // State for the summary modal
  const [successModalVisible, setSuccessModalVisible] = useState(false); // State for the success modal
  const [firstName, setFirstName] = useState(''); // State to store the user's first name
  const [location, setLocation] = useState(''); // State to store the location
  const [isLoading, setIsLoading] = useState(false); // State for the loader
  const [filteredLocations, setFilteredLocations] = useState([]); // State for filtered locations
  const [selectedPhotographer, setSelectedPhotographer] = useState(null); // State for selected photographer
  const [recentLocations, setRecentLocations] = useState([]); // State for recent locations
  const [lastBooking, setLastBooking] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isSearchingPhotographer, setIsSearchingPhotographer] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState('');
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availablePhotographers, setAvailablePhotographers] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPhotographerSelectionModal, setShowPhotographerSelectionModal] = useState(false);
  const [errorToast, setErrorToast] = useState({ visible: false, message: '' });
  const [popUpNotification, setPopUpNotification] = useState(null);
  const [userId, setUserId] = useState(null);
  const [readableLocation, setReadableLocation] = useState('');
  const [activeBookingLocation, setActiveBookingLocation] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [showPackageSelectionModal, setShowPackageSelectionModal] = useState(false);
  const [showLocationSelectionModal, setShowLocationSelectionModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBookingSummaryModal, setShowBookingSummaryModal] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');

  const router = useRouter();

  const scrollY = useSharedValue(0);
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

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const statusScale = useSharedValue(1);
  const statusOpacity = useSharedValue(1);

  useEffect(() => {
    if (activeBooking) {
      statusScale.value = withRepeat(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      statusOpacity.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [activeBooking, bookingStatus]);

  const animatedStatusStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: statusScale.value }],
      opacity: statusOpacity.value,
    };
  });

  useEffect(() => {
    const setupSubscriptions = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const unsubscribe = subscribeToBookingUpdates(userId, handleBookingUpdate);
        return () => unsubscribe();
      }
    };

    setupSubscriptions();
  }, []);

  const handleBookingUpdate = (updatedBooking) => {
    setActiveBooking(prevBooking => {
      if (prevBooking && prevBooking.$id === updatedBooking.$id) {
        // Show a pop-up notification for status changes
        if (updatedBooking.status !== prevBooking.status) {
          let message = '';
          switch (updatedBooking.status) {
            case 'accepted':
              message = "Your booking request has been accepted by the photographer.";
              break;
            case 'rejected':
              message = "Your booking request has been rejected by the photographer.";
              break;
            case 'completed':
              message = "Your booking has been marked as completed.";
              break;
            case 'cancelled':
              message = "Your booking has been cancelled.";
              break;
          }
          if (message) {
            showMessage({
              message: `Booking ${updatedBooking.status}`,
              description: message,
              type: updatedBooking.status === 'accepted' ? "success" : "info",
              duration: 4000,
            });
          }
        }
        return updatedBooking;
      }
      return prevBooking;
    });

    setBookingStatus(updatedBooking.status);
  };

  const fetchUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        setUserId(id);
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  const fetchActiveBooking = useCallback(async () => {
    if (userId) {
      const booking = await getActiveBooking(userId);
      if (booking) {
        setActiveBooking(booking);
        setBookingStatus(booking.status);
      } else {
        setActiveBooking(null);
        setBookingStatus(null);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchUserId();
    fetchUserData();
    fetchRecentLocations();
    fetchLastBooking();
    checkForActiveBooking();
    fetchNotifications();
    const intervalId = setInterval(fetchUnreadCount, 60000);

    // Set up real-time subscription for notifications
    let unsubscribe;
    if (userId) {
      unsubscribe = client.subscribe(`databases.${config.databaseId}.collections.${config.notificationCollectionId}.documents`, response => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const newNotification = response.payload;
          if (newNotification.userId === userId) {
            // Add the new notification to the state
            setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
            // Increment unread count
            setUnreadNotifications(prevCount => prevCount + 1);
            // Show the pop-up notification
            showPopUpNotification(newNotification);
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      clearInterval(intervalId);
    };
  }, [userId]); // Add userId as a dependency

  useEffect(() => {
    fetchActiveBooking();
    const intervalId = setInterval(fetchActiveBooking, 5000); // Poll every 5 seconds

    // Set up real-time subscription
    let unsubscribe;
    if (userId) {
      unsubscribe = subscribeToBookingUpdates(userId, (updatedBooking) => {
        setActiveBooking(updatedBooking);
        setBookingStatus(updatedBooking.status);
      });
    }

    return () => {
      clearInterval(intervalId);
      if (unsubscribe) unsubscribe();
    };
  }, [userId, fetchActiveBooking]);

  // Add this new useEffect hook
  useEffect(() => {
    const fetchActiveBookingLocation = async () => {
      if (activeBooking && activeBooking.location) {
        const address = await getReadableAddress(activeBooking.location);
        setActiveBookingLocation(address);
      }
    };
    fetchActiveBookingLocation();
  }, [activeBooking]);

  // Function to show pop-up notification
  const showPopUpNotification = (notification) => {
    setPopUpNotification(notification);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setPopUpNotification(null);
    }, 5000);
  };

  const fetchNotifications = async () => {
    try {
      if (userId) {
        const fetchedNotifications = await getNotifications(userId);
        setNotifications(fetchedNotifications);
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (userId) {
        const count = await getUnreadNotificationCount(userId);
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.$id);
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.$id === notification.$id ? { ...n, read: true } : n
        )
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    }
    // Handle navigation or other actions based on the notification type
    if (notification.type === 'booking_request') {
      // Navigate to booking details
      router.push(`/bookings/${notification.relatedBookingId}`);
    } else if (notification.type === 'booking_confirmed') {
      // Navigate to active booking
      router.push('/active-booking');
    }
    setShowNotifications(false);
  };

  const fetchUserData = async () => {
    try {
      if (userId) {
        const userData = await getUserById(userId);
        const nameParts = userData.name.split(' ');
        setFirstName(nameParts[0]); // Set the first name
        setAvatarUrl(userData.avatar || ''); // Set the avatar URL
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRecentLocations = async () => {
    try {
      if (userId) {
        const locations = await getRecentLocations(userId);
        setRecentLocations(Array.isArray(locations) ? locations : []);
      }
    } catch (error) {
      console.error('Error fetching recent locations:', error);
      handleError('Failed to fetch recent locations');
      setRecentLocations([]);
    }
  };

  const fetchLastBooking = async () => {
    try {
      if (userId) {
        const bookings = await getBookingsByUserId(userId);
        // Sort all bookings by date, regardless of status
        const sortedBookings = bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedBookings.length > 0) {
          setLastBooking(sortedBookings[0]);
        } else {
          setLastBooking(null);
        }
      }
    } catch (error) {
      console.error('Error fetching last booking:', error);
    }
  };

  const checkForActiveBooking = async () => {
    try {
      if (userId) {
        const booking = await getActiveBooking(userId);
        if (booking) {
          setActiveBooking(booking);
          setBookingStatus(booking.status);
          subscribeToBookingUpdates(booking.$id);
        }
      }
    } catch (error) {
      console.error('Error checking for active booking:', error);
    }
  };

  const subscribeToBookingUpdates = (bookingId) => {
    return client.subscribe(`databases.${config.databaseId}.collections.${config.bookingsCollectionId}.documents.${bookingId}`, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        const updatedBooking = response.payload;
        setActiveBooking(updatedBooking);
        setBookingStatus(updatedBooking.status);
        showNotification(`Booking status updated to ${updatedBooking.status}`);
      }
    });
  };

  const showNotification = (message) => {
    // Implement local notification here
    // You can use a library like react-native-push-notification for this
    console.log('Notification:', message);
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes", onPress: async () => {
            setIsCancellingBooking(true);
            try {
              const result = await cancelBooking(activeBooking.$id);
              if (result.success) {
                setActiveBooking(null);
                setBookingStatus(null);
                setCancellationSuccess(true);
                setCancellationMessage("Your booking has been successfully cancelled.");
              } else {
                throw new Error('Cancellation failed');
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              setCancellationSuccess(false);
              setCancellationMessage("Failed to cancel booking. Please try again.");
            } finally {
              setIsCancellingBooking(false);
              setShowCancellationModal(true);
            }
          }
        }
      ]
    );
  };

  const CancellationLoadingModal = () => (
    <Modal
      transparent={true}
      visible={isCancellingBooking}
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <BlurView intensity={20} tint="light" className="p-6 rounded-3xl">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-4 text-sky-800 font-pbold text-lg">Cancelling Booking...</Text>
        </BlurView>
      </View>
    </Modal>
  );

  const CancellationFeedbackModal = () => (
    <Modal
      transparent={true}
      visible={showCancellationModal}
      animationType="fade"
      onRequestClose={() => setShowCancellationModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <BlurView intensity={20} tint="light" className="w-[90%] rounded-3xl overflow-hidden">
          <View className="bg-white/90 p-6 rounded-3xl">
            <Ionicons
              name={cancellationSuccess ? "checkmark-circle" : "close-circle"}
              size={64}
              color={cancellationSuccess ? "#10b981" : "#ef4444"}
              style={{ alignSelf: 'center', marginBottom: 16 }}
            />
            <Text className="text-xl font-pbold text-center mb-4 text-sky-800">
              {cancellationSuccess ? "Booking Cancelled" : "Cancellation Failed"}
            </Text>
            <Text className="text-base font-pmedium text-center mb-6 text-sky-600">
              {cancellationMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCancellationModal(false)}
              className="bg-sky-500 py-3 px-6 rounded-full"
            >
              <Text className="text-white font-pbold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  

  const formatBookingDate = (timestamp) => {
    if (!timestamp) return 'No bookings yet';
    return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
  };

  const handlePress = (index) => {
    setSelectedIndex(index);
  };

  const openModal = () => {
    // Reset states before opening the modal
    setSelectedIndex(null);
    setSelectedPackage(null);
    setLocation('');
    setSelectedPhotographer(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const openCustomModal = () => {
    if (selectedIndex !== null) {
      setModalVisible(false); // Close the package selection modal
      setCustomModalVisible(true);
    }
  };

  const closeCustomModal = () => {
    setCustomModalVisible(false); // Close custom modal
  };

  const openSummaryModal = () => {
    if (selectedPackage && location && selectedPhotographer) {
      setSummaryModalVisible(true);
    } else {
      handleError('Please select a package and location before proceeding.');
    }
  };

  const closeSummaryModal = () => {
    setSummaryModalVisible(false); // Close summary modal
  };

  const handleBooking = async () => {
    if (!userId || !selectedPackage || !location || !selectedPhotographer) {
      handleError('Please make sure you have selected a package, location, and photographer.');
      return;
    }

    setIsBookingLoading(true);

    try {
      const user = await getUserById(userId);

      // Convert price to integer by removing non-numeric characters and parsing
      const priceInteger = parseInt(selectedPackage.price.replace(/[^0-9]/g, ''), 10);

      const bookingData = {
        photographerId: selectedPhotographer.userId,
        location: location,
        package: selectedPackage.title,
        price: priceInteger, // Use the converted integer price
        numberOfPhotos: parseInt(selectedPackage.details.split(' ')[0]),
        userDetails: {
          name: user.name,
          phone: user.phone,
          avatarUrl: user.avatar
        },
        photographer: {
          name: selectedPhotographer.name,
          avatarUrl: selectedPhotographer.avatarUrl,
          experience: selectedPhotographer.experience,
          distance: selectedPhotographer.distance.toFixed(2),
          rating: selectedPhotographer.rating,
          phoneNumber: selectedPhotographer.phoneNumber
        }
      };

      const booking = await addBooking(userId, bookingData);
      await updateRecentLocations(userId, location);

      setBookingStatus('pending');
      setActiveBooking(booking);
      setSuccessModalVisible(true);

      // Close all other modals
      closeAllModals();
    } catch (error) {
      console.error('Error creating booking:', error);
      handleError('Failed to create booking. Please try again.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const checkBookingStatusPeriodically = async (bookingId) => {
    const checkStatus = async () => {
      try {
        const status = await checkBookingStatus(bookingId);
        setBookingStatus(status);
        if (status === 'accepted' || status === 'rejected') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error checking booking status:', error);
      }
    };

    const intervalId = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false); // Close success modal
  };

  const closeSuccessModalAndReturnHome = () => {
    setSuccessModalVisible(false);
    setModalVisible(false);
    setCustomModalVisible(false);
    setSummaryModalVisible(false);
    setSelectedIndex(null);
    setSelectedPackage(null);
    setLocation('');
    setSelectedPhotographer(null);
    setSearchText('');
    setFilteredLocations([]);
    setIsSearchingPhotographer(false);
    // Reset any other state variables that need to be cleared
  };

  const handleLocationChange = async (text) => {
    setSearchText(text);
    if (text.length > 0) {
      try {
        const locations = await getLivePhotographerLocations();
        const filtered = locations.filter((loc) => loc.toLowerCase().includes(text.toLowerCase()));
        setFilteredLocations(filtered);
      } catch (error) {
        console.error('Error fetching photographer locations:', error);
        setFilteredLocations([]);
      }
    } else {
      setFilteredLocations([]);
    }
  };

  const selectLocation = (loc) => {
    setLocation(loc);
    setSearchText(loc);
    setFilteredLocations([]);
  };

  const handleShortcutPackageSelect = (packageDetails) => {
    // Reset states before starting a new booking
    setSelectedLocation(null);
    setSelectedPhotographer(null);

    const selectedIndex = items.findIndex(item =>
      item.details === packageDetails.details && item.price === packageDetails.price
    );

    if (selectedIndex !== -1) {
      setSelectedPackage(items[selectedIndex]);
      setShowLocationSelectionModal(true);
    } else {
      console.error('Package not found in items array');
    }
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handlePackageSelect = (selectedPackage) => {
    setSelectedPackage(selectedPackage);
    setShowPackageSelectionModal(false);
    setShowLocationSelectionModal(true);
  };

  const closeAllModals = () => {
    setModalVisible(false);
    setCustomModalVisible(false);
    setSummaryModalVisible(false);
    setSuccessModalVisible(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowLocationSelectionModal(false); // Close the location modal
    setShowPhotographerSelectionModal(true); // Open the photographer selection modal
  };

  const handleChooseAnotherPhotographer = () => {
    const currentIndex = availablePhotographers.findIndex(p => p.userId === selectedPhotographer.userId);
    const nextIndex = (currentIndex + 1) % availablePhotographers.length;
    setSelectedPhotographer(availablePhotographers[nextIndex]);
  };

  

  const NotificationIcon = () => (
    <TouchableOpacity onPress={() => setShowNotifications(true)}>
      <View>
        <Ionicons name="notifications-outline" size={24} color="#0284c7" />
        {unreadNotifications > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-white text-xs font-bold">{unreadNotifications}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  

  const searchPhotographers = async (selectedLocation) => {
    setIsSearchingPhotographer(true);
    try {
      const photographers = await getLivePhotographers(selectedLocation);
      if (photographers.length > 0) {
        setAvailablePhotographers(photographers);
        setSelectedPhotographer(photographers[0]);
        setCustomModalVisible(false); // Close the custom modal
        setSummaryModalVisible(true);
      } else {
        setErrorMessage('No photographers available in your area. Please try again later.');
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error('Error searching photographers:', error);
      setErrorMessage('Failed to search photographers. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsSearchingPhotographer(false);
    }
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await getCurrentLocation(); // Implement this function to get user's current location
        setUserLocation(location);
      } catch (error) {
        console.error('Error getting user location:', error);
        // Handle the error, maybe set a default location or show an error message
      }
    };

    getUserLocation();
  }, []);

  const handlePhotographerSelect = (photographer) => {
    setSelectedPhotographer(photographer);
    setShowPhotographerSelectionModal(false);
    setShowBookingSummaryModal(true);
  };

  const handleFindPhotographers = () => {
    setShowPackageSelectionModal(true);
  };

  const handleBookingConfirm = async () => {
    if (!userId || !selectedPackage || !selectedLocation || !selectedPhotographer) {
      handleError('Please make sure you have selected a package, location, and photographer.');
      return;
    }

    setIsBookingLoading(true);
    setShowBookingSummaryModal(false); // Close the summary modal immediately

    try {
      const user = await getUserById(userId);
      const priceInteger = parseInt(selectedPackage.price.replace(/[^0-9]/g, ''), 10);

      const bookingData = {
        photographerId: selectedPhotographer.userId,
        location: selectedLocation,
        package: selectedPackage.title,
        price: priceInteger,
        numberOfPhotos: parseInt(selectedPackage.details.split(' ')[0]),
        userDetails: {
          name: user.name,
          phone: user.phone,
          avatarUrl: user.avatar
        },
        photographer: {
          name: selectedPhotographer.name,
          avatarUrl: selectedPhotographer.avatarUrl,
          experience: selectedPhotographer.experience,
          distance: selectedPhotographer.distance.toFixed(2),
          rating: selectedPhotographer.rating,
          phoneNumber: selectedPhotographer.phoneNumber
        }
      };

      const booking = await addBooking(userId, bookingData);
      await updateRecentLocations(userId, selectedLocation);

      setBookingStatus('pending');
      setActiveBooking(booking);
      setIsBookingSuccess(true);

      // Show success message
      showMessage({
        message: "Booking Confirmed!",
        description: "Your booking request has been sent to the photographer.",
        type: "success",
        duration: 4000,
      });

      // Reset states
      setSelectedPackage(null);
      setSelectedLocation(null);
      setSelectedPhotographer(null);

      // Refresh user data
      fetchUserData();
    } catch (error) {
      console.error('Error creating booking:', error);
      handleError('Failed to create booking. Please try again.');
    } finally {
      setIsBookingLoading(false);
      setTimeout(() => setIsBookingSuccess(false), 3000); // Hide success message after 3 seconds
    }
  };

  // Add this new component for the success message
  const BookingSuccessMessage = () => (
    <Modal transparent visible={isBookingSuccess} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <BlurView intensity={20} tint="light" className="p-6 rounded-3xl">
          <Animatable.View animation="zoomIn" duration={500}>
            <View className="bg-white p-8 rounded-full mb-4 w-full items-center justify-center">
              <MaterialIcons name="check-circle" size={64} color="#10b981" />
            </View>
          </Animatable.View>
          <Text className="text-2xl font-pbold text-white text-center mb-2">Booking Confirmed!</Text>
          <Text className="text-lg font-pmedium text-white text-center">Your request has been sent to the photographer.</Text>
        </BlurView>
      </View>
    </Modal>
  );

  useEffect(() => {
    if (activeBooking) {
      const unsubscribe = subscribeToBookingUpdates(activeBooking.$id, (updatedBooking) => {
        setActiveBooking(updatedBooking);
        setBookingStatus(updatedBooking.status);
      });

      return () => unsubscribe();
    }
  }, [activeBooking]);

  const handleNotificationReceived = useCallback((notification) => {
    console.log('Notification received:', notification);
    // Handle the notification, e.g., update UI, fetch new data, etc.
    fetchActiveBooking();
    fetchNotifications();
  }, [fetchActiveBooking, fetchNotifications]);

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
    };

    setupNotifications();
  }, []);

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
                  {fontSize: 20, color: '#075985' }
                ]}
                className="font-pbold"
              >
                Momentam
              </Animated.Text>
            </View>
            <NotificationSystem 
              userId={userId} 
              onNotificationReceived={handleNotificationReceived}
            />
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
            <View className="w-full mb-8">
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
            </View>

            {/* Booking Status or Need Photos Section */}
            {activeBooking ? (
              <BookingStatusCard 
                activeBooking={activeBooking}
                bookingStatus={bookingStatus}
                activeBookingLocation={activeBookingLocation}
                handleCancelBooking={handleCancelBooking}
              />
            ) : (
              <View className="w-full bg-sky-500 rounded-2xl p-5 mb-6">
                <Text className="font-pbold text-xl text-white mb-2">Need Photos?</Text>
                <Text className="font-pmedium text-base text-white mb-4">Request a Photographer Now</Text>
                <TouchableOpacity
                  className="bg-white rounded-full py-3 px-4 flex-row items-center justify-between"
                  onPress={handleFindPhotographers}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="search" size={20} color="#0284c7" style={{ marginRight: 8 }} />
                    <Text className="text-sky-800 font-pmedium">Find a Photographer</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={16} color="#0284c7" />
                </TouchableOpacity>
              </View>
            )}

            {/* Modal */}
            <PackageSelectionModal
              visible={showPackageSelectionModal}
              onClose={() => setShowPackageSelectionModal(false)}
              handlePackageSelect={handlePackageSelect}
              openCustomModal={() => setShowLocationSelectionModal(true)}
            />

            {/* Custom Modal for Location */}
            <LocationSelectionModal
              visible={customModalVisible}
              onClose={() => setCustomModalVisible(false)}
              onSelectLocation={handleLocationSelect}
            />

            <BookingSummaryModal
              visible={summaryModalVisible}
              onClose={closeAllModals}
              selectedPackage={items[selectedIndex]}
              location={location}
              readableLocation={readableLocation}
              isSearchingPhotographer={isSearchingPhotographer}
              selectedPhotographer={selectedPhotographer}
              isBookingLoading={isBookingLoading}
              handleBooking={handleBooking}
              handleChooseAnotherPhotographer={handleChooseAnotherPhotographer}
            />

            <ConfirmationModal
              visible={successModalVisible}
              onClose={closeSuccessModalAndReturnHome}
              selectedPackage={items[selectedIndex]}
              location={location}
              selectedPhotographer={selectedPhotographer}
              bookingStatus={bookingStatus}
              handleCall={handleCall}
            />
            <CancellationLoadingModal />
            <CancellationFeedbackModal />
            <LocationSelectionModal
              visible={isLocationModalVisible}
              onClose={() => setIsLocationModalVisible(false)}
              onSelectLocation={handleLocationSelect}
              recentLocations={recentLocations} // Make sure this is always an array
            />
            <ErrorModal
              visible={errorModalVisible}
              message={errorMessage}
              onClose={() => setErrorModalVisible(false)}
            />

            <View className="flex flex-row items-center justify-between w-full mt-6">
              <Text className="font-pbold text-lg text-sky-800">Quick Packages</Text>
              <TouchableOpacity onPress={openModal} disabled={!!activeBooking}>
                <Text className={`font-pmedium ${activeBooking ? 'text-gray-400' : 'text-sky-500'}`}>See All</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4 w-full">
              {items.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleShortcutPackageSelect(item)}
                  disabled={!!activeBooking}
                  className={`mb-3 ${activeBooking ? 'opacity-50' : ''}`}
                >
                  <BlurView intensity={10} tint="light" className="rounded-xl overflow-hidden">
                    <View className="flex-row justify-between items-center p-4 border border-sky-200">
                      <View className="flex-row items-center">
                        <FontAwesome5 name="camera" size={20} color="#0284c7" style={{ marginRight: 12 }} />
                        <Text className="font-pmedium text-sky-800">{item.details}</Text>
                      </View>
                      <Text className="font-pbold text-sky-800">{item.price}</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>

            <View className="pb-10 pt-7">
              <Text className="font-pbold text-xl text-sky-800 mb-4">How it Works</Text>
              <View className="bg-sky-50 rounded-3xl p-4">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="max-h-96"
                >
                  <HowItWorksStep
                    step="1"
                    title="Request a Photographer"
                    description="Choose your event type and location to find available photographers near you."
                    icon="camera"
                    color="#0ea5e9"
                  />
                  <HowItWorksStep
                    step="2"
                    title="Select Your Package"
                    description="Browse through customized packages and choose the one that fits your needs."
                    icon="images"
                    color="#f59e0b"
                  />
                  <HowItWorksStep
                    step="3"
                    title="Confirm & Pay"
                    description="Review your booking details, make the payment, and get ready for your shoot."
                    icon="credit-card"
                    color="#10b981"
                  />
                  <HowItWorksStep
                    step="4"
                    title="Enjoy Your Session"
                    description="Meet your photographer at the specified time and location for a great photo session."
                    icon="camera-retro"
                    color="#8b5cf6"
                  />
                  <HowItWorksStep
                    step="5"
                    title="Receive Your Photos"
                    description="Get your professionally edited photos through our secure platform within 48 hours."
                    icon="photo-video"
                    color="#ec4899"
                  />
                </ScrollView>
              </View>
            </View>
            
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onNotificationPress={handleNotificationPress}
      />
      {isSearchingPhotographer && (
        <LoadingComponent message="Searching for available photographers..." />
      )}
      {isBookingLoading && (
        <LoadingComponent message="Processing your booking..." />
      )}
      <PhotographerSelectionModal
        visible={showPhotographerSelectionModal}
        onClose={() => setShowPhotographerSelectionModal(false)}
        userLocation={userLocation}
        onSelect={handlePhotographerSelect}
      />
      {errorToast.visible && (
        <ErrorToast
          message={errorToast.message}
          onClose={() => setErrorToast({ visible: false, message: '' })}
        />
      )}
      {popUpNotification && (
        <PopUpNotification
          notification={popUpNotification}
          onClose={() => setPopUpNotification(null)}
        />
      )}
      <PackageSelectionModal
        visible={showPackageSelectionModal}
        onClose={() => setShowPackageSelectionModal(false)}
        handlePackageSelect={handlePackageSelect}
        openCustomModal={() => setShowLocationSelectionModal(true)}
      />

      <LocationSelectionModal
        visible={showLocationSelectionModal}
        onClose={() => setShowLocationSelectionModal(false)}
        onSelectLocation={handleLocationSelect}
      />

      <PhotographerSelectionModal
        visible={showPhotographerSelectionModal}
        onClose={() => setShowPhotographerSelectionModal(false)}
        userLocation={userLocation}
        onSelect={handlePhotographerSelect}
      />

      <BookingSummaryModal
        visible={showBookingSummaryModal}
        onClose={() => setShowBookingSummaryModal(false)}
        selectedPackage={selectedPackage}
        location={selectedLocation}
        selectedPhotographer={selectedPhotographer}
        onConfirm={handleBookingConfirm}
        isBookingLoading={isBookingLoading}
      />
      <BookingSuccessMessage />
    </View>
  )
}
export default Home;

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
    marginHorizontal: 4,
  },
});