import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  StatusBar, 
  Dimensions,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
  Linking,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing,
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolate
} from 'react-native-reanimated';
import { getUserById, getCompletedBookingsWithPhotos } from '../../lib/appwrite';
import { LinearGradient } from 'expo-linear-gradient';
import PaymentModal from '../../components/PaymentModal';
import PhotoGalleryModal from '../../components/PhotoGalleryModal';
import * as Animatable from 'react-native-animatable';
import { Image as ExpoImage } from 'expo-image'; // Make sure to import Image from expo-image

const { width, height } = Dimensions.get('window');

const Gallery = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentBookings, setRecentBookings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPhotoGalleryModal, setShowPhotoGalleryModal] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [allPhotosSearchQuery, setAllPhotosSearchQuery] = useState('');

  const scale = useSharedValue(1);
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

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

  const { height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    fetchUserData();
    fetchBookings();

    // Animation setup
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    );

    // ... (keep other animations)

  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const userData = await getUserById(userId);
        setFirstName(userData.name.split(' ')[0]);
        setAvatarUrl(userData.avatar || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const fetchedBookings = await getCompletedBookingsWithPhotos(userId);
      setBookings(fetchedBookings);
      setRecentBookings(fetchedBookings.length);
      
      // Calculate total photos from paid packages
      const totalPaidPhotos = fetchedBookings.reduce((sum, booking) => {
        return booking.paymentStatus === 'paid' ? sum + booking.numberOfPhotos : sum;
      }, 0);
      setTotalPhotos(totalPaidPhotos);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = bookings.filter(booking => 
      (booking.eventName?.toLowerCase().includes(query.toLowerCase()) || 
       booking.package?.toLowerCase().includes(query.toLowerCase()) ||
       booking.venue?.toLowerCase().includes(query.toLowerCase()) ||
       booking.photographer?.name?.toLowerCase().includes(query.toLowerCase())) ?? false
    );
    setFilteredBookings(filtered);
  };

  const handleAllPhotosSearch = (query) => {
    setAllPhotosSearchQuery(query);
    const filtered = bookings.filter(booking => 
      (booking.eventName?.toLowerCase().includes(query.toLowerCase()) || 
       booking.package?.toLowerCase().includes(query.toLowerCase()) ||
       booking.venue?.toLowerCase().includes(query.toLowerCase()) ||
       booking.photographer?.name?.toLowerCase().includes(query.toLowerCase())) ?? false
    );
    setFilteredBookings(filtered);
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    if (booking.paymentStatus === 'paid') {
      setShowPhotoGalleryModal(true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePayment = (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    // Refresh the bookings after successful payment
    fetchBookings();
    setShowPaymentModal(false);
    setShowPhotoGalleryModal(true);
  };

  const handleCallPhotographer = (booking) => {
    const phoneNumber = booking.photographer?.phoneNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      alert('Photographer phone number not available');
    }
  };

  const renderHeader = () => (
    <View className="px-4 pt-5">
      <Animatable.View 
        animation="fadeInDown"
        duration={500}
        className="w-full mb-8"
      >
        <BlurView intensity={20} tint="light" className="rounded-3xl overflow-hidden">
          <View className="bg-sky-700 p-5">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-pmedium text-base text-sky-200">Manage your uploads</Text>
                <Text className="font-pbold text-xl text-white mt-1">
                  Photo Gallery
                </Text>
              </View>
              <Image 
                source={{ uri: avatarUrl || 'https://via.placeholder.com/64' }}
                style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'white' }}
                contentFit="cover"
              />
            </View>
            <View className="mt-4 bg-sky-300 rounded-xl p-3">
              <View className="bg-white/50 rounded-xl p-3 flex-row justify-between">
                <View>
                  <Text className="font-pmedium text-sm text-sky-700">Recent Bookings</Text>
                  <Text className="font-pbold text-xl text-sky-800 mt-1">{recentBookings}</Text>
                </View>
                <View>
                  <Text className="font-pmedium text-sm text-sky-700">Total Photos</Text>
                  <Text className="font-pbold text-xl text-sky-800 mt-1">{totalPhotos}</Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Animatable.View>

      <Animatable.View 
        animation="fadeInUp"
        delay={300}
        duration={500}
        className="w-full mb-4"
      >
        <View className="w-full bg-sky-50 rounded-2xl p-4 mb-6">
          <Text className="font-pbold text-sky-800 text-lg mb-3">Find Your Photos</Text>
          <View className="flex-row items-center bg-white rounded-full overflow-hidden border border-sky-200">
            <Ionicons name="search" size={20} color="#0284c7" style={{ marginLeft: 12 }} />
            <TextInput
              placeholder="Search by event, photographer ..."
              value={searchQuery}
              onChangeText={handleSearch}
              className="flex-1 py-2 px-3 font-pmedium text-sky-800"
            />
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-pbold text-lg text-sky-800">Recent Photos</Text>
          <TouchableOpacity onPress={() => setShowAllPhotosModal(true)}>
            <Text className="font-pmedium text-sky-600">View All</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          {filteredBookings.slice(0, 5).map((item, index) => (
            <View key={item.$id} className="mb-4">
              {renderBookingCard({ item, index })}
            </View>
          ))}
        </View>
      </Animatable.View>
    </View>
  );

  const renderAllPhotosModal = () => (
    <Modal
      visible={showAllPhotosModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAllPhotosModal(false)}
    >
      <View className="flex-1 bg-black/50">
        <BlurView intensity={20} tint="light" className="flex-1">
          <SafeAreaView className="flex-1 bg-white">
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              className="flex-1"
            >
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <Text className="font-pbold text-2xl text-sky-800">All Photos</Text>
                <TouchableOpacity onPress={() => setShowAllPhotosModal(false)}>
                  <Ionicons name="close" size={28} color="#0284c7" />
                </TouchableOpacity>
              </View>
              
              <View className="p-4">
                <View className="flex-row items-center bg-white rounded-full overflow-hidden border border-sky-200 mb-4">
                  <Ionicons name="search" size={20} color="#0284c7" style={{ marginLeft: 12 }} />
                  <TextInput
                    placeholder="Search all photos"
                    value={allPhotosSearchQuery}
                    onChangeText={handleAllPhotosSearch}
                    className="flex-1 py-2 px-3 font-pmedium text-sky-800"
                  />
                </View>
              </View>

              <FlatList
                data={filteredBookings}
                renderItem={renderBookingCard}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
              />
            </LinearGradient>
          </SafeAreaView>
        </BlurView>
      </View>
    </Modal>
  );

  const renderBookingCard = ({ item }) => {
    const isPhotoUploadComplete = item.photos.length >= item.numberOfPhotos;
    const isPaid = item.paymentStatus === 'paid';

    const renderActionButton = () => {
      if (isPaid) {
        return (
          <TouchableOpacity
            className="mt-3 p-2 rounded-lg bg-sky-700"
            onPress={() => handleViewBooking(item)}
          >
            <Text className="font-pbold text-white text-center">View Photos</Text>
          </TouchableOpacity>
        );
      } else {
        return (
          <TouchableOpacity
            className="mt-3 p-2 rounded-lg bg-yellow-600"
            onPress={() => handlePayment(item)}
          >
            <Text className="font-pbold text-white text-center">Pay for Package</Text>
          </TouchableOpacity>
        );
      }
    };

    const renderPhotoCount = () => {
      if (isPhotoUploadComplete) {
        return (
          <Animatable.View 
            animation="pulse" 
            iterationCount="infinite" 
            className="flex-row items-center bg-green-500 rounded-full px-3 py-1"
          >
            <FontAwesome5 name="check-circle" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Animatable.Text 
              animation="zoomIn" 
              className="font-pbold text-sm text-white"
            >
              {item.photos.length} / {item.numberOfPhotos}
            </Animatable.Text>
          </Animatable.View>
        );
      } else {
        return (
          <View className="flex-row items-center">
            <FontAwesome5 name="images" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text className="font-pmedium text-sm text-white">
              {item.photos.length} / {item.numberOfPhotos}
            </Text>
          </View>
        );
      }
    };

    return (
      <Animatable.View animation="fadeInUp" className="mb-4 mt-5">
        <TouchableOpacity 
          onPress={() => isPaid ? handleViewBooking(item) : handlePayment(item)}
          className="overflow-hidden rounded-xl shadow-lg"
        >
          <LinearGradient
            colors={['rgba(56, 189, 248, 0.8)', 'rgba(59, 130, 246, 0.1)']}
            className="p-4 bg-sky-300"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-pbold text-lg text-white">{item.package}</Text>            
              <View className={`px-2 py-1 rounded-full ${isPaid ? 'bg-green-500' : 'bg-yellow-500'}`}>
                <Text className="font-pmedium text-xs text-white">
                  {isPaid ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar" size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text className="font-pmedium text-sm text-white">{item.eventName || 'Event not specified'}</Text>
            </View>
            
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar-outline" size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text className="font-pmedium text-sm text-white">{new Date(item.date).toLocaleDateString()}</Text>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Image 
                  source={{ uri: item.photographer?.avatarUrl || 'https://via.placeholder.com/40' }} 
                  className="w-8 h-8 rounded-full mr-2"
                />
                <Text className="font-pmedium text-sm text-white">{item.photographer?.name || 'Photographer'}</Text>
              </View>
              {renderPhotoCount()}
            </View>

            {item.photos.length > 0 && (
              <View className="flex-row mt-2">
                <Image 
                  source={{ uri: item.photos[0].photoUrl }} 
                  className="w-20 h-20 rounded-lg mr-2" 
                />
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)']}
                  className="flex-1 rounded-lg justify-center items-center"
                >
                  <Text className="font-pbold text-white text-lg">+{item.photos.length - 1}</Text>
                  <Text className="font-pmedium text-white text-xs">more photos</Text>
                </LinearGradient>
              </View>
            )}

            {renderActionButton()}
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  useEffect(() => {
    setFilteredBookings(bookings);
  }, [bookings]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-sky-50">
        <BlurView intensity={20} tint="light" className="flex-1 justify-center items-center">
          <View className="bg-white/80 p-8 rounded-3xl items-center">
            <Animated.View style={animatedStyle}>
              <FontAwesome5 name="images" size={64} color="#0284c7" />
            </Animated.View>
            <Text className="mt-4 text-sky-800 font-pbold text-lg">Loading Gallery...</Text>
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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
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
                <FontAwesome5 name="images" size={24} color="#0284c7" style={{ marginRight: 8 }} />
                <Text className="font-pbold text-xl text-sky-800">Gallery</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="notifications-outline" size={24} color="#0284c7" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: StatusBar.currentHeight + 70, paddingBottom: 20 }}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {renderHeader()}
        </Animated.ScrollView>
        
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={selectedBooking}
          onPaymentComplete={handlePaymentComplete}
        />
        <PhotoGalleryModal
          visible={showPhotoGalleryModal}
          onClose={() => setShowPhotoGalleryModal(false)}
          photos={selectedBooking?.photos || []}
          bookingDetails={selectedBooking}
        />
        {renderAllPhotosModal()}
      </SafeAreaView>
    </View>
  );
};

const styles = {
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284c7',
    marginHorizontal: 4,
  },
};

export default Gallery;