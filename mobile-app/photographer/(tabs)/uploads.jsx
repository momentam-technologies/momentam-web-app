import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, FlatList, StatusBar, Modal, Dimensions, RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import UploadModal from '../components/UploadModal';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import useScrollPosition from '../hooks/useScrollPosition';
import AnimatedHeader from '../components/AnimatedHeader';
import LoadingScreen from '../components/LoadingScreen';
import { getUploadedPhotosByBooking, getBookingsByPhotographerId, getReadableAddress } from '../../lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const truncateLocation = (location, maxLength = 30) => {
  if (!location) return 'N/A';
  return location.length > maxLength ? location.substring(0, maxLength) + '...' : location;
};

const UploadDetailsModal = ({ visible, onClose, upload, onViewAllPhotos, onUploadMore }) => {
  if (!upload) return null;

  const remainingPhotos = upload.numberOfPhotos - upload.photoUrls.length;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <BlurView intensity={20} tint="light" className="rounded-t-3xl overflow-hidden">
          <SafeAreaView className="bg-white/90 rounded-t-3xl">
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.0)', 'rgba(59, 130, 246, 0.05)']}
              className="p-6"
            >
              <View className="flex-row justify-between items-center mb-4">
                <MotiText 
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500 }}
                  className="font-pbold text-lg text-sky-800"
                >
                  {upload.event}
                </MotiText>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#0284c7" />
                </TouchableOpacity>
              </View>
              
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 200 }}
                className="bg-white/80 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center mb-3">
                  <Image 
                    source={{ uri: upload.clientAvatar || 'https://via.placeholder.com/40' }} 
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View>
                    <Text className="font-pbold text-lg text-sky-800">{upload.clientName}</Text>
                    <Text className="font-pmedium text-sm text-sky-600">{upload.package}</Text>
                  </View>
                </View>
                <View className="flex-row justify-between mb-2">
                  <DetailItem icon="calendar" label="Date" value={new Date(upload.uploadDate).toLocaleDateString()} />
                  <DetailItem icon="images" label="Photos" value={`${upload.photoUrls.length} uploaded`} />
                </View>
                <DetailItem icon="map-pin" label="Venue" value={upload.venue} />
              </MotiView>

              <MotiText
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 400 }}
                className="font-pbold text-base text-sky-800 mb-3"
              >
                Preview
              </MotiText>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={upload.photoUrls.slice(0, 5)}
                renderItem={({ item, index }) => (
                  <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 500 + index * 100 }}
                    className="mr-2"
                  >
                    <Image source={{ uri: item }} className="w-20 h-20 rounded-lg" />
                  </MotiView>
                )}
                keyExtractor={(item, index) => index.toString()}
                className="mb-4"
              />
              
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 800 }}
              >
                {remainingPhotos > 0 ? (
                  <TouchableOpacity 
                    className="bg-sky-500 p-4 rounded-xl mb-4"
                    onPress={() => onUploadMore(upload)}
                  >
                    <Text className="font-pbold text-base text-white text-center">
                      Upload {remainingPhotos} More Photo{remainingPhotos > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity 
                  className="bg-sky-800 p-4 rounded-xl"
                  onPress={() => onViewAllPhotos(upload.photoUrls, upload.event)}
                >
                  <Text className="font-pbold text-base text-white text-center">View All Photos</Text>
                </TouchableOpacity>
              </MotiView>
            </LinearGradient>
          </SafeAreaView>
        </BlurView>
      </View>
    </Modal>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <View className="flex-row items-center">
    <FontAwesome5 name={icon} size={14} color="#0284c7" style={{ marginRight: 6 }} />
    <Text className="font-pmedium text-sm text-sky-700">{label}: <Text className="font-pbold">{value}</Text></Text>
  </View>
);

const UploadItem = ({ item, onPress }) => {
  const cameraScale = useSharedValue(1);
  const photoCountOpacity = useSharedValue(0);

  useEffect(() => {
    cameraScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    );

    photoCountOpacity.value = withTiming(1, { duration: 1000 });
  }, []);

  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  const photoCountAnimatedStyle = useAnimatedStyle(() => ({
    opacity: photoCountOpacity.value,
  }));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 300 }}
      className="mb-4"
    >
      <TouchableOpacity onPress={() => onPress(item)}>
        <LinearGradient
          colors={['rgba(56, 189, 248, 0.0)', 'rgba(59, 130, 246, 0.05)']}
          className="p-4 rounded-xl bg-sky-900"
        >
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1">
              <Text className="font-pbold text-base text-sky-200">{item.event}</Text>
              <Text className="font-pmedium text-sm text-sky-100">{truncateLocation(item.venue || 'No venue specified')}</Text>
            </View>
            <Animated.View style={cameraAnimatedStyle} className="bg-sky-100 rounded-full p-2">
              <MaterialCommunityIcons name="camera-wireless" size={24} color="#0284c7" />
            </Animated.View>
          </View>
          
          <View className="flex-row items-center mb-3">
            <Image 
              source={{ uri: item.clientAvatar || 'https://via.placeholder.com/40' }} 
              className="w-10 h-10 rounded-full mr-3"
            />
            <View>
              <Text className="font-psemibold text-sky-200">{item.clientName}</Text>
              <Text className="font-pmedium text-xs text-sky-100">{item.package}</Text>
            </View>
          </View>

          <Animated.View style={photoCountAnimatedStyle} className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <FontAwesome5 name="images" size={16} color="#ffffff" className="mr-2" />
              <Text className="font-pmedium text-sm text-white ml-2">
                {item.photoUrls.length} / {item.numberOfPhotos} uploaded
              </Text>
            </View>
            <Text className="font-pmedium text-xs text-sky-100">
              {new Date(item.uploadDate).toLocaleDateString()}
            </Text>
          </Animated.View>

          {item.photoUrls.length > 0 && (
            <View className="flex-row mt-2">
              <Image 
                source={{ uri: item.photoUrls[0] }} 
                className="w-20 h-20 rounded-lg mr-2" 
              />
              <LinearGradient
                colors={['rgba(56, 189, 248, 0.0)', 'rgba(59, 130, 246, 0.15)']}
                className="flex-1 rounded-lg bg-sky-200 justify-center items-center"
              >
                <Text className="font-pbold text-sky-700 text-lg">+{item.photoUrls.length - 1}</Text>
                <Text className="font-pmedium text-sky-600 text-xs">more photos</Text>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
};

const CustomRefreshControl = ({ refreshing }) => {
  if (!refreshing) return null;

  return (
    <View className="w-full h-full flex bg-white/80">
      <LoadingScreen />
    </View>
  );
};

const Gallery = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [isUploadDetailsModalVisible, setIsUploadDetailsModalVisible] = useState(false);
  const [isPhotoGalleryModalVisible, setIsPhotoGalleryModalVisible] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryEventName, setGalleryEventName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingMoreFor, setUploadingMoreFor] = useState(null);

  const scrollY = useScrollPosition();
  const bellRotate = useSharedValue(0);

  const fetchUploads = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const bookings = await getBookingsByPhotographerId(userId, 'completed');
      const uploadPromises = bookings.map(async (booking) => {
        const photos = await getUploadedPhotosByBooking(booking.$id);
        const userDetails = JSON.parse(booking.userDetails);
        const readableAddress = await getReadableAddress(booking.location);
        return {
          id: booking.$id,
          event: booking.event || booking.package,
          venue: booking.venue || readableAddress,
          clientName: userDetails.name,
          clientAvatar: userDetails.avatarUrl,
          package: booking.package,
          numberOfPhotos: booking.numberOfPhotos,
          uploadDate: booking.date,
          photoUrls: photos
        };
      });
      const uploadResults = await Promise.all(uploadPromises);
      setUploads(uploadResults.filter(upload => upload.photoUrls.length > 0));
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isFetching]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUploads();
  }, [fetchUploads]);

  const sortedUploads = useMemo(() => {
    return [...uploads].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  }, [uploads]);

  const handleUploadPress = useCallback((upload) => {
    setSelectedUpload(upload);
    setIsUploadDetailsModalVisible(true);
  }, []);

  const handleViewAllPhotos = useCallback((photos, eventName) => {
    setGalleryPhotos(photos);
    setGalleryEventName(eventName);
    setIsPhotoGalleryModalVisible(true);
  }, []);

  const animateBell = useCallback(() => {
    bellRotate.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(-1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
  }, [bellRotate]);

  const handleUploadMore = useCallback((upload) => {
    setUploadingMoreFor(upload);
    setIsUploadModalVisible(true);
    setIsUploadDetailsModalVisible(false);
  }, []);

  const renderUploadItem = useCallback(({ item, index }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100)}
      className="px-4"
    >
      <UploadItem 
        item={item} 
        onPress={handleUploadPress}
      />
    </Animated.View>
  ), [handleUploadPress]);

  const renderHeader = useCallback(() => (
    <View className="px-4 pt-5">
      <Animated.View 
        entering={FadeInDown}
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
              <View className="bg-sky-600 rounded-full p-2">
                <FontAwesome5 name="images" size={24} color="white" />
              </View>
            </View>
            <View className="mt-4 bg-sky-300 rounded-xl p-3">
              <TouchableOpacity 
                className="bg-sky-500 w-full py-3  rounded-xl flex-row items-center justify-center"
                onPress={() => setIsUploadModalVisible(true)}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="white" className="mr-5" />
                <Text className="text-white font-pbold text-base ml-3">New Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.delay(300)}
        className="w-full mb-4"
      >
        <Text className="font-pbold text-lg text-sky-800">
          Recent Uploads
        </Text>
      </Animated.View>
    </View>
  ), [setIsUploadModalVisible]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />
      <AnimatedHeader 
        scrollY={scrollY} 
        title="Uploads" 
        onBellPress={animateBell}
        bellRotate={bellRotate}
      />
      <SafeAreaView className="flex-1" edges={['right', 'left', 'bottom']}>
        <FlatList
          data={sortedUploads}
          renderItem={renderUploadItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: StatusBar.currentHeight + 70, paddingBottom: 20 }}
          ListHeaderComponent={renderHeader}
          onScroll={scrollY.scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="transparent"
              colors={['transparent']}
              style={{ backgroundColor: 'transparent' }}
            />
          }
        />
        <CustomRefreshControl refreshing={refreshing} />
      </SafeAreaView>

      <UploadModal 
        visible={isUploadModalVisible} 
        onClose={() => {
          setIsUploadModalVisible(false);
          setUploadingMoreFor(null);
        }}
        bookingId={uploadingMoreFor ? uploadingMoreFor.id : null}
        existingPhotos={uploadingMoreFor ? uploadingMoreFor.photoUrls : []}
        maxPhotos={uploadingMoreFor ? uploadingMoreFor.numberOfPhotos : null}
      />

      <UploadDetailsModal
        visible={isUploadDetailsModalVisible}
        onClose={() => setIsUploadDetailsModalVisible(false)}
        upload={selectedUpload}
        onViewAllPhotos={handleViewAllPhotos}
        onUploadMore={handleUploadMore}
      />

      <PhotoGalleryModal
        visible={isPhotoGalleryModalVisible}
        onClose={() => setIsPhotoGalleryModalVisible(false)}
        photos={galleryPhotos}
        eventName={galleryEventName}
      />
    </View>
  );
};

export default Gallery;