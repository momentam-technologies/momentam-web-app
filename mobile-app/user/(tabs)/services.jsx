import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Dimensions, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserById, getBookingsByUserId, getCurrentLocation, addBooking, updateRecentLocations } from '../../lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import MyBookings from '../../components/Services/MyBookings';
import { Image } from 'expo-image';
import SupportChat from '../../components/Services/SupportChat';
import PackageSelectionModal from '../../components/Home/PackageSelectionModal';
import LocationSelectionModal from '../../components/Home/LocationSelectionModal';
import PhotographerSelectionModal from '../../components/Home/PhotographerSelectionModal';
import BookingSummaryModal from '../../components/Home/BookingSummaryModal';
import QuickActionCard from '../../components/Services/QuickActionCard';
import SpecialOffersModal from '../../components/Services/SpecialOffersModal';

const { width, height } = Dimensions.get('window');

const Particle = ({ size, color, speed }) => {
  const position = useSharedValue({ x: Math.random() * width, y: -size });

  useEffect(() => {
    position.value = withRepeat(
      withTiming(
        { x: Math.random() * width, y: height + size },
        { duration: speed, easing: Easing.linear }
      ),
      -1,
      false
    );
  }, []);

  

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: size / 2,
    transform: [
      { translateX: position.value.x },
      { translateY: position.value.y },
    ],
  }));

  return <Animated.View style={animatedStyle} />;
};

const AnimatedBackground = () => {
  const particles = Array(20).fill().map((_, i) => (
    <Particle
      key={i}
      size={Math.random() * 5 + 2}
      color={`rgba(135, 206, 235, ${Math.random() * 0.3 + 0.1})`}
      speed={Math.random() * 10000 + 5000}
    />
  ));

  return <View style={{ position: 'absolute', width, height }}>{particles}</View>;
};

// Update the AvatarAnimation component:
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

const Services = () => {

  
  const [form, setForm] = useState({
    search_request: '',
  });

  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [userName, setUserName] = useState('');
  const [recentBookings, setRecentBookings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [clientScore, setClientScore] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bookingStats, setBookingStats] = useState({
    completed: 0,
    cancelled: 0,
    ongoing: 0,
    total: 0
  });
  const [completionRate, setCompletionRate] = useState(0);
  const scoreColor = useSharedValue('rgb(239, 68, 68)'); // Start with red
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showPackageSelectionModal, setShowPackageSelectionModal] = useState(false);
  const [showLocationSelectionModal, setShowLocationSelectionModal] = useState(false);
  const [showPhotographerSelectionModal, setShowPhotographerSelectionModal] = useState(false);
  const [showBookingSummaryModal, setShowBookingSummaryModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  

  const languages = ['English', 'Swahili'];

  const router = useRouter();

  const scale = useSharedValue(1);
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  const fetchUserData = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        setUserId(userId);
        const userData = await getUserById(userId);
        const firstName = userData.name.split(' ')[0];
        setUserName(firstName);
        setAvatarUrl(userData.avatar || '');
        const userBookings = await getBookingsByUserId(userId);
        
        const activeBookings = userBookings.filter(booking => booking.status !== 'cancelled');
        setRecentBookings(activeBookings.length);
        
        const totalRating = activeBookings.reduce((sum, booking) => sum + (booking.rating || 0), 0);
        setAverageRating(activeBookings.length > 0 ? (totalRating / activeBookings.length).toFixed(1) : 0);
        
        setBookings(userBookings);

        const stats = userBookings.reduce((acc, booking) => {
          if (booking.status === 'completed') acc.completed++;
          else if (booking.status === 'cancelled') acc.cancelled++;
          else acc.ongoing++;
          acc.total++;
          return acc;
        }, { completed: 0, cancelled: 0, ongoing: 0, total: 0 });

        setBookingStats(stats);

        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        setCompletionRate(rate);

        if (rate >= 80) {
          scoreColor.value = withTiming('rgb(34, 197, 94)', { duration: 1000, easing: Easing.inOut(Easing.ease) });
        } else if (rate >= 60) {
          scoreColor.value = withTiming('rgb(234, 179, 8)', { duration: 1000, easing: Easing.inOut(Easing.ease) });
        } else {
          scoreColor.value = withTiming('rgb(239, 68, 68)', { duration: 1000, easing: Easing.inOut(Easing.ease) });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchUserData().finally(() => setIsLoading(false));

    // Set up periodic polling
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 60000); // Fetch data every 60 seconds

    return () => {
      clearInterval(intervalId); // Clean up the interval on component unmount
    };
  }, [fetchUserData]);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    );

    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 })
      ),
      -1,
      true
    );
    dot2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 300 }),
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      true
    );
    dot3Opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    return () => {
      // Clean up animations if necessary
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setShowDropdown(false);
  };

  const handleRequestPhotographer = () => {
    router.push({
      pathname: '/home',
      params: { openModal: true }
    });
  };

  const handleViewPhotos = () => {
    router.push('/gallery');
  };

  const handleViewBookings = async () => {
    setIsBookingsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const userBookings = await getBookingsByUserId(userId);
        setBookings(userBookings);
      }
      setShowBookingsModal(true);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsBookingsLoading(false);
    }
  };

  useEffect(() => {
    const { params } = router;
    if (params?.showBookingsModal === 'true') {
      handleViewBookings();
    }
  }, [router]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    backgroundColor: scoreColor.value,
  }));

  const [showOffersModal, setShowOffersModal] = useState(false);

  const ExploreMoreItem = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity onPress={onPress} className="w-full mb-4">
      <BlurView intensity={10} tint="light" className="rounded-2xl overflow-hidden">
        <View className="p-4 border-2 rounded-2xl" style={{ borderColor: `${color}40` }}>
          <View className="flex-row items-center">
            <View className="bg-white rounded-full p-2 w-12 h-12 items-center justify-center mr-4" style={{ backgroundColor: `${color}20` }}>
              {icon}
            </View>
            <View className="flex-1">
              <Text className="font-pbold text-lg" style={{ color }}>{title}</Text>
              <Text className="font-pmedium text-sm text-gray-600">{subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={24} color={color} />
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  useEffect(() => {
    // Calculate client score based on booking frequency
    const bookingsPerMonth = recentBookings / 6; // Assuming recentBookings is for the last 6 months
    const score = Math.min(Math.round((bookingsPerMonth / 5) * 100), 100); // Cap at 100%
    setClientScore(score);
  }, [recentBookings]);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocation();
  }, []);

  const handleFindPhotographers = () => {
    setShowPackageSelectionModal(true);
  };

  const handlePackageSelect = (selectedPackage) => {
    setSelectedPackage(selectedPackage);
    setShowPackageSelectionModal(false);
    setShowLocationSelectionModal(true);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowLocationSelectionModal(false);
    setShowPhotographerSelectionModal(true);
  };

  const handlePhotographerSelect = (photographer) => {
    setSelectedPhotographer(photographer);
    setShowPhotographerSelectionModal(false);
    setShowBookingSummaryModal(true);
  };

  const handleBookingConfirm = async () => {
    if (!userId || !selectedPackage || !selectedLocation || !selectedPhotographer) {
      // Show an error message
      console.error('Missing required booking information');
      return;
    }

    setIsBookingLoading(true);

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

      // Handle successful booking (e.g., show a success message, update UI)
      console.log('Booking confirmed:', booking);

      // Close all modals
      setShowBookingSummaryModal(false);
      setShowPackageSelectionModal(false);
      setShowLocationSelectionModal(false);
      setShowPhotographerSelectionModal(false);

      // Refresh user data to update bookings and stats
      fetchUserData();

    } catch (error) {
      console.error('Error creating booking:', error);
      // Show an error message to the user
    } finally {
      setIsBookingLoading(false);
    }
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 50], [1, 0.9], Extrapolate.CLAMP),
      backgroundColor: 'white',
    };
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sky-50">
        <BlurView intensity={20} tint="light" className="flex-1 justify-center items-center">
          <View className="bg-white/80 p-8 rounded-3xl items-center">
            <Animated.View style={animatedStyle}>
              <FontAwesome5 name="concierge-bell" size={64} color="#0284c7" />
            </Animated.View>
            <Text className="mt-4 text-sky-800 font-pbold text-lg">Loading Services...</Text>
            <View className="flex-row mt-4">
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>
          </View>
        </BlurView>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <AnimatedBackground />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'left', 'bottom']}>
        <View style={{
          position: 'absolute',
          top: StatusBar.currentHeight,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}>
          <Animated.View style={headerStyle}>
            <View className="flex-row items-center justify-between w-full px-5 rounded-b-2xl pb-4 pt-5 bg-white">
              <View className="flex-row items-center">
                <FontAwesome5 name="concierge-bell" size={24} color="#0284c7" style={{ marginRight: 8 }} />
                <Text className="font-pbold text-xl text-sky-800">Services</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="notifications-outline" size={24} color="#0284c7" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <Animated.ScrollView 
          className="w-full h-full"
          contentContainerStyle={{ paddingTop: StatusBar.currentHeight + 70 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full items-start justify-start px-4">
            {/* Header Section */}
            <View className="w-full mb-8">
              <BlurView intensity={20} tint="light" className="rounded-3xl overflow-hidden mt-5">
                <View className="bg-sky-700 p-5">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-pmedium text-base text-sky-200">Welcome back,</Text>
                      <Text className="font-pbold text-2xl text-white mt-1">{userName}!</Text>
                    </View>
                    <AvatarAnimation avatarUrl={avatarUrl} />
                  </View>
                  <View className="mt-4 bg-white rounded-xl p-3">
                    <Text className="font-pmedium text-sm text-sky-700">Booking Performance</Text>
                    <View className="flex-row justify-between mt-2">
                      <View>
                        <Text className="font-psemibold text-sky-800">Completion Rate</Text>
                        <Text className="font-pbold text-2xl text-sky-800">{completionRate.toFixed(1)}%</Text>
                      </View>
                      <Animated.View 
                        style={[animatedScoreStyle, { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }]}
                      >
                        <FontAwesome5 name="star" size={30} color="white" />
                      </Animated.View>
                    </View>
                    <View className="flex-row justify-between mt-3">
                      <View className="items-center">
                        <Text className="font-pmedium text-xs text-sky-600">Completed</Text>
                        <Text className="font-pbold text-lg text-green-500">{bookingStats.completed}</Text>
                      </View>
                      <View className="items-center">
                        <Text className="font-pmedium text-xs text-sky-600">Ongoing</Text>
                        <Text className="font-pbold text-lg text-yellow-500">{bookingStats.ongoing}</Text>
                      </View>
                      <View className="items-center">
                        <Text className="font-pmedium text-xs text-sky-600">Cancelled</Text>
                        <Text className="font-pbold text-lg text-red-500">{bookingStats.cancelled}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Quick Actions Section */}
            <Text className="font-pbold text-xl text-sky-800 mt-8 mb-4">Quick Actions</Text>
            <View className="w-full mb-8">
              <QuickActionCard
                title="View Photos"
                icon={<FontAwesome5 name="images" size={24} color="white" />}
                description="Browse your captured moments"
                onPress={handleViewPhotos}
              />
              <QuickActionCard
                title="My Bookings"
                icon={<MaterialCommunityIcons name="calendar-check" size={24} color="white" />}
                description="Manage your photography sessions"
                onPress={handleViewBookings}
                loading={isBookingsLoading}
              />
              <QuickActionCard
                title="Support"
                icon={<Feather name="help-circle" size={24} color="white" />}
                description="Get help and answers"
                onPress={() => setShowSupportChat(true)}
              />
            </View>

            {/* Explore More Section */}
            <Text className="font-pbold text-xl text-sky-800 mt-8 mb-4">Explore More</Text>
            <View className="w-full pb-20">
              <ExploreMoreItem
                title="Find Photographers"
                subtitle="Discover top talent near you"
                icon={<Ionicons name="search" size={24} color="#0284c7" />}
                color="#0284c7"
                onPress={handleFindPhotographers}
              />
              <ExploreMoreItem
                title="Special Offers"
                subtitle="Check out our latest deals"
                icon={<Ionicons name="gift" size={24} color="#0284c7" />}
                color="#0284c7"
                onPress={() => setShowOffersModal(true)}
              />
            </View>
          </View>
        </Animated.ScrollView>

        {/* MyBookings Modal */}
        <MyBookings
          visible={showBookingsModal}
          onClose={() => setShowBookingsModal(false)}
          bookings={bookings}
        />

        {/* Support Chat */}
        {showSupportChat && (
          <SupportChat
            visible={showSupportChat}
            onClose={() => setShowSupportChat(false)}
          />
        )}

        {/* Special Offers Modal */}
        <SpecialOffersModal
          visible={showOffersModal}
          onClose={() => setShowOffersModal(false)}
        />

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
      </SafeAreaView>
    </View>
  )
}

const styles = {
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
    marginHorizontal: 4,
  },
};

export default Services;