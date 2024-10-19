import { Account, Avatars, Client, Databases, ID, Query } from 'react-native-appwrite';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.momentam.user',
    projectId: '66d00db0003702a664b7',
    databaseId: '66d00ed8003231569fd0',
    userCollectionId: '66d00f0f00399b6036fd',
    photoCollectionId: '66d00f2c002f105a9682',
    storageId: '66d0104d00282cbfc0c8',
    bookingsCollectionId: '66f155ee0008ff041e8b',
    notificationCollectionId: '66fead61001e5ff6b52d',
    photographerDatabaseId: '66f66c740016da106c49', // Photographer's database ID
    uploadedPhotosCollectionId: '6704f38c001529b8ddbf', // Photographer's uploaded photos collection ID
}

export const photographerConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '66f66b4100323a1b831f', // Photographer's project ID
    databaseId: '66f66c740016da106c49', // Photographer's database ID
    livePhotographersCollectionId: '66f703a5001bcd7be8a9',
    bookingsCollectionId: '66f6f66b0034251d59d8'
};

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform)

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// Create a new client for the photographer's project
const photographerClient = new Client();
photographerClient
    .setEndpoint(config.endpoint)
    .setProject('66f66b4100323a1b831f'); // Photographer's project ID

const photographerDatabases = new Databases(photographerClient);

const TWILIO_ACCOUNT_SID = 'ACe78b60973ef141ef9b463d7ef97e25e5';
const TWILIO_AUTH_TOKEN = '5ea36937a5bc2806fa8cc5c741ced8c9'; // Make sure this is correct
const TWILIO_VERIFY_SERVICE_SID = 'VA6786a3498a85774851cef613ddb1967e';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzSrZbV3ib1Tuv6K4EwrUEy0iJr4ZOTqg",
  authDomain: "momentam-f9e3b.firebaseapp.com",
  projectId: "momentam-f9e3b",
  storageBucket: "momentam-f9e3b.appspot.com",
  messagingSenderId: "994849776896",
  appId: "1:994849776896:web:6b2c3847083feb7b8c7fe5"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

const GOOGLE_MAPS_API_KEY = 'AIzaSyCPcM29FmmoFnCSPkwPKZ51Qg3bJf90kYw'; // Replace with your actual API key

const geocodeCache = new Map();

export const getReadableAddress = async (location) => {
  if (geocodeCache.has(location)) {
    return geocodeCache.get(location);
  }

  const [latitude, longitude] = location.split(',').map(Number);
  const address = await reverseGeocode(latitude, longitude);

  if (address) {
    geocodeCache.set(location, address);
  }

  return address || location; // Fall back to coordinates if geocoding fails
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      let street = '';
      let city = '';
      let country = '';

      // Extract components
      for (let component of result.address_components) {
        if (component.types.includes('route')) {
          street = component.long_name;
        } else if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      // Construct the address string
      let addressParts = [];
      if (street) addressParts.push(street);
      if (city) addressParts.push(city);
      if (country) addressParts.push(country);

      return addressParts.join(', ');
    }
    return null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

// Function to send OTP via Twilio Verify
export const sendOTP = async (phoneNumber) => {
    try {
        // Check if the phone number already exists in the database
        const existingUser = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('phone', phoneNumber)]
        );

        let userExists = false;
        let registrationComplete = false;

        if (existingUser.documents.length > 0) {
            userExists = true;
            registrationComplete = existingUser.documents[0].registrationComplete;
        }

        // Always send OTP, regardless of user status
        const response = await axios.post(
            `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
            new URLSearchParams({ To: phoneNumber, Channel: 'sms' }),
            { auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN } }
        );

        if (response.status !== 201) {
            throw new Error('Failed to send OTP');
        }

        if (!userExists) {
            // Create a new user document only if it doesn't exist
            const placeholderName = 'Temporary User';
            const avatarUrl = avatars.getInitials(placeholderName);
            const accountId = ID.unique();
            const currentTimestamp = new Date().toISOString();

            await databases.createDocument(
                config.databaseId,
                config.userCollectionId,
                accountId,
                { 
                    accountId: accountId,
                    phone: phoneNumber,
                    verified: false,
                    email: `temp_${phoneNumber.replace(/[^0-9]/g, '')}@placeholder.com`,
                    name: placeholderName,
                    authProvider: 'phone',
                    avatar: avatarUrl,
                    createdAt: currentTimestamp,
                    lastLogin: true,
                    registrationComplete: false,
                    recentLocations: JSON.stringify([]) // Add this line
                }
            );
        }

        return { success: true, userExists, registrationComplete };
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { success: false, error: error.message };
    }
};

// Function to verify OTP
export const verifyOTP = async (phoneNumber, otp) => {
  try {
    // For testing purposes, always consider the OTP as verified
    // if (otp !== '123456') {
    //   return { verified: false };
    // }

    // Check if user exists
    let user = await getUserByPhone(phoneNumber);

    if (!user) {
      // Create new user if not exists
      const placeholderName = 'Temporary User';
      const avatarUrl = avatars.getInitials(placeholderName);
      const accountId = ID.unique();
      const currentTimestamp = new Date().toISOString();

      user = await databases.createDocument(
        config.databaseId,
        config.userCollectionId,
        accountId,
        { 
          accountId: accountId,
          phone: phoneNumber,
          verified: true,
          email: `temp_${phoneNumber.replace(/[^0-9]/g, '')}@placeholder.com`,
          name: placeholderName,
          authProvider: 'phone',
          avatar: avatarUrl,
          createdAt: currentTimestamp,
          lastLogin: true,
          registrationComplete: false,
          recentLocations: JSON.stringify([])
        }
      );
    } else {
      // Update existing user
      user = await databases.updateDocument(
        config.databaseId,
        config.userCollectionId,
        user.$id,
        { verified: true }
      );
    }

    return { verified: true, user };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Function to create or update user after Google/Apple auth
export const createOrUpdateUser = async (authProvider, userData) => {
    try {
        const { email, name, phone } = userData;
        
        // Get the user ID from AsyncStorage
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            throw new Error('User ID not found');
        }

        // Update existing user
        const updatedUser = await databases.updateDocument(
            config.databaseId,
            config.userCollectionId,
            userId,
            {
                name,
                email,
                authProvider,
                lastLogin: true,
                verified: true,
            }
        );
        return updatedUser;
    } catch (error) {
        console.error('Error creating/updating user:', error);
        throw error;
    }
};

// Function to sign in with Apple
export const signInWithApple = async () => {
    try {
        const session = await account.createOAuth2Session('apple');
        const userData = await account.get();
        return await createOrUpdateUser('apple', {
            email: userData.email,
            name: userData.name,
            phone: userData.phone // Assuming phone is stored in the account
        });
    } catch (error) {
        console.error('Error signing in with Apple:', error);
        throw error;
    }
};

// Function to upload image to Firebase Storage
export const uploadToFirebase = async (imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    
    const url = await getDownloadURL(storageRef);
    console.log('Firebase Storage upload result:', url);
    
    return url;
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    throw error;
  }
};

// Update the updateAvatar function to use Firebase Storage
export const updateAvatar = async (userId, imageUri) => {
  try {
    console.log('Starting avatar update for user:', userId);
    console.log('Image URI:', imageUri);

    // Upload to Firebase Storage
    const avatarUrl = await uploadToFirebase(imageUri);
    console.log('Generated avatar URL:', avatarUrl);

    // Update the user document in Appwrite with the new avatar URL
    console.log('Updating user document with new avatar URL');
    const updateResult = await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      { 
        avatar: avatarUrl,
        registrationComplete: true
      }
    );
    console.log('Appwrite update result:', updateResult);

    return avatarUrl;
  } catch (error) {
    console.error('Error updating avatar:', error);
    console.error('Error details:', error.message, error.code, error.response);
    throw error;
  }
};

export async function getCurrentUser() {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// ... other existing functions ...

export const getUserByPhone = async (phoneNumber) => {
    try {
        const user = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('phone', phoneNumber)]
        );

        if (user.documents.length > 0) {
            return user.documents[0];
        }
        return null;
    } catch (error) {
        console.error('Error getting user by phone:', error);
        throw error;
    }
};

export const updateUserField = async (phoneNumber, field, value) => {
  try {
    const user = await getUserByPhone(phoneNumber);
    if (user) {
      await databases.updateDocument(
        config.databaseId,
        config.userCollectionId,
        user.$id,
        { [field]: value }
      );
    }
  } catch (error) {
    console.error('Error updating user field:', error);
    throw error;
  }
};

export const checkUserStatus = async () => {
    try {
        const userId = await AsyncStorage.getItem('userId');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        
        if (userId && isLoggedIn === 'true') {
            const userDetails = await getUserById(userId);
            if (userDetails && userDetails.registrationComplete) {
                return { isLoggedIn: true, registrationComplete: true };
            }
            return { isLoggedIn: true, registrationComplete: false };
        }
        return { isLoggedIn: false, registrationComplete: false };
    } catch (error) {
        console.error('Error checking user status:', error);
        return { isLoggedIn: false, registrationComplete: false };
    }
};

export const getUserById = async (userId) => {
    try {
        const user = await databases.getDocument(
            config.databaseId,
            config.userCollectionId,
            userId
        );
        return user;
    } catch (error) {
        console.error('Error getting user by ID:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('isLoggedIn');
        // You might want to clear other user-related data from AsyncStorage here
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

// Function to add a booking
export const addBooking = async (userId, bookingData) => {
  try {
    const bookingId = ID.unique();
    const timestamp = new Date().toISOString();

    const booking = await databases.createDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId,
      {
        userId: userId,
        photographerId: bookingData.photographerId,
        package: bookingData.package,
        location: bookingData.location,
        date: timestamp,
        status: 'pending', // Initial status is always 'pending'
        price: bookingData.price,
        numberOfPhotos: bookingData.numberOfPhotos,
        userDetails: JSON.stringify(bookingData.userDetails),
        photographer: JSON.stringify(bookingData.photographer)
      }
    );

    // Create a notification for the new booking
    await createNotification({
      userId: userId,
      title: 'New Booking',
      message: `Your booking for ${bookingData.package} has been created and is pending confirmation.`,
      type: 'booking_created',
      relatedBookingId: bookingId
    });

    // Update photographer's status to 'pending'
    await updatePhotographerStatus(bookingData.photographerId, 'pending');

    return booking;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

// Function to get bookings for a user
export const getBookingsByUserId = async (userId) => {
  try {
    const bookings = await databases.listDocuments(
      config.databaseId,
      config.bookingsCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('date')
      ]
    );

    return bookings.documents;
  } catch (error) {
    console.error('Error getting bookings by user ID:', error);
    throw error;
  }
};

// Function to update recent locations
export const updateRecentLocations = async (userId, location) => {
  try {
    const user = await getUserById(userId);
    const recentLocations = user.recentLocations ? JSON.parse(user.recentLocations) : [];
    const updatedLocations = [location, ...recentLocations];

    // Keep only the last 5 locations
    if (updatedLocations.length > 5) {
      updatedLocations.pop();
    }

    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      { recentLocations: JSON.stringify(updatedLocations) } // Store recent locations as JSON string
    );
  } catch (error) {
    console.error('Error updating recent locations:', error);
    throw error;
  }
};

// Function to get recent locations for a user
export const getRecentLocations = async (userId) => {
  try {
    const user = await getUserById(userId);
    return user.recentLocations ? JSON.parse(user.recentLocations) : [];
  } catch (error) {
    console.error('Error getting recent locations:', error);
    throw error;
  }
};

// Improved Haversine formula for more accurate distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Update the getLivePhotographers function
export const getLivePhotographers = async (userLocation, initialRadius = 10, maxRadius = 100, maxPhotographers = 10) => {
  try {
    if (!userLocation || typeof userLocation !== 'string') {
      throw new Error('Invalid user location');
    }

    const [userLat, userLon] = userLocation.split(',').map(Number);

    if (isNaN(userLat) || isNaN(userLon)) {
      throw new Error('Invalid latitude or longitude');
    }

    let currentRadius = initialRadius;
    let nearbyPhotographers = [];
    let allPhotographers = new Set(); // Use a Set to avoid duplicates

    while (currentRadius <= maxRadius && nearbyPhotographers.length < maxPhotographers) {
      const photographers = await photographerDatabases.listDocuments(
        photographerConfig.databaseId,
        photographerConfig.livePhotographersCollectionId,
        [Query.equal('bookingStatus', 'available')]
      );

      const newPhotographers = photographers.documents
        .filter(photographer => !allPhotographers.has(photographer.$id)) // Only consider new photographers
        .map(photographer => {
          const [photographerLat, photographerLon] = photographer.location.split(',').map(Number);
          const distance = calculateDistance(userLat, userLon, photographerLat, photographerLon);
          return { ...photographer, distance };
        })
        .filter(photographer => photographer.distance <= currentRadius);

      // Add new photographers to the set
      newPhotographers.forEach(photographer => allPhotographers.add(photographer.$id));

      nearbyPhotographers = [...nearbyPhotographers, ...newPhotographers];
      nearbyPhotographers.sort((a, b) => a.distance - b.distance);

      if (nearbyPhotographers.length < maxPhotographers && allPhotographers.size < photographers.documents.length) {
        currentRadius *= 1.5; // Increase radius by 50% each iteration
      } else {
        break; // Exit loop if we've considered all available photographers
      }
    }

    return nearbyPhotographers.slice(0, maxPhotographers);
  } catch (error) {
    console.error('Error fetching live photographers:', error);
    throw error;
  }
};

export const getLivePhotographerLocations = async () => {
  try {
    const locations = await photographerDatabases.listDocuments(
      photographerConfig.databaseId,
      photographerConfig.livePhotographersCollectionId,
      [
        Query.select(['location']),
        Query.orderAsc('location')
      ]
    );
    return [...new Set(locations.documents.map(doc => doc.location))];
  } catch (error) {
    console.error('Error fetching live photographer locations:', error);
    throw error;
  }
};

export const requestBooking = async (photographerId, bookingDetails) => {
  try {
    // First, update the photographer's status to 'pending'
    await photographerDatabases.updateDocument(
      photographerConfig.databaseId,
      photographerConfig.livePhotographersCollectionId,
      photographerId,
      { bookingStatus: 'pending' }
    );

    // Then create the booking
    const booking = await databases.createDocument(
      config.databaseId,
      config.bookingsCollectionId,
      ID.unique(),
      {
        ...bookingDetails,
        status: 'pending',
        timestamp: new Date().toISOString(),
      }
    );

    return booking;
  } catch (error) {
    console.error('Error requesting booking:', error);
    throw error;
  }
};

export const checkBookingStatus = async (bookingId) => {
  try {
    const booking = await databases.getDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId
    );
    return booking.status;
  } catch (error) {
    console.error('Error checking booking status:', error);
    throw error;
  }
};

export const getBookingDetails = async (bookingId) => {
  try {
    const booking = await databases.getDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId
    );
    return booking;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

export const getActiveBooking = async (userId) => {
  try {
    const bookings = await databases.listDocuments(
      config.databaseId,
      config.bookingsCollectionId,
      [
        Query.equal('userId', userId),
        Query.notEqual('status', 'completed'),
        Query.notEqual('status', 'cancelled'),
        Query.orderDesc('date')
      ]
    );
    if (bookings.documents.length > 0) {
      const booking = bookings.documents[0];
      return {
        ...booking,
        photographer: JSON.parse(booking.photographer)
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting active booking:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const booking = await databases.getDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId
    );

    await databases.updateDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId,
      { status: 'cancelled' }
    );

    // Update photographer's status back to 'available'
    await updatePhotographerStatus(booking.photographerId, 'available');

    return { success: true, message: 'Booking cancelled successfully' };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

export const getCompletedBookings = async (userId) => {
    try {
      const bookings = await databases.listDocuments(
        config.databaseId,
        config.bookingsCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', ['confirmed', 'completed']),
          Query.orderDesc('date')
        ]
      );
  
      return bookings.documents.map(booking => ({
        ...booking,
        photographer: JSON.parse(booking.photographer)
      }));
    } catch (error) {
      console.error('Error getting completed bookings:', error);
      throw error;
    }
  };

export const processPayment = async (bookingId, amount, paymentMethod) => {
  try {
    const updatedBooking = await databases.updateDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId,
      { 
        paymentStatus: 'paid',
        paidAmount: amount,
        paymentMethod: paymentMethod,
        paidAt: new Date().toISOString(),
        isPaid: true // If we decide to keep this field
      }
    );
    return updatedBooking;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Add these new functions at the end of the file

export const getNotifications = async (userId) => {
  try {
    const notifications = await databases.listDocuments(
      config.databaseId,
      config.notificationCollectionId,  // Use the specific collection ID
      [
        Query.equal('userId', userId),
        Query.orderDesc('timestamp'),
        Query.limit(50)
      ]
    );
    return notifications.documents;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await databases.updateDocument(
      config.databaseId,
      config.notificationCollectionId,
      notificationId,
      { read: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId) => {
  try {
    const unreadNotifications = await databases.listDocuments(
      config.databaseId,
      config.notificationCollectionId,  // Use the specific collection ID
      [
        Query.equal('userId', userId),
        Query.equal('read', false)
      ]
    );
    return unreadNotifications.total;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    const bookingDetailsString = notificationData.bookingDetails ? JSON.stringify({
      photographer: notificationData.bookingDetails.photographer,
      package: notificationData.bookingDetails.package,
      price: notificationData.bookingDetails.price,
      numberOfPhotos: notificationData.bookingDetails.numberOfPhotos,
      date: notificationData.bookingDetails.date,
      location: notificationData.bookingDetails.location
    }) : null;

    const notification = await databases.createDocument(
      config.databaseId,
      config.notificationCollectionId,
      ID.unique(),
      {
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        timestamp: new Date().toISOString(),
        relatedBookingId: notificationData.relatedBookingId || null
      }
    );
    
    let pushMessage;
    if (notificationData.type === 'booking_accepted') {
      pushMessage = `Your booking for ${notificationData.bookingDetails.package} package has been accepted by ${notificationData.bookingDetails.photographer.name}. Tap to view details.`;
    } else if (notificationData.type === 'booking_rejected') {
      pushMessage = `Your booking for ${notificationData.bookingDetails.package} package has been rejected. Tap for more details.`;
    } else if (notificationData.type === 'booking_completed') {
      pushMessage = `Your booking for ${notificationData.bookingDetails.package} package has been marked as completed. Your photos will be available soon.`;
    } else {
      pushMessage = notificationData.message;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: pushMessage,
        data: { 
          notificationId: notification.$id, 
          type: notification.type, 
          relatedBookingId: notification.relatedBookingId,
          bookingDetails: bookingDetailsString
        },
      },
      trigger: null,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const updatePhotographerStatus = async (photographerId, status) => {
  try {
    const livePhotographers = await photographerDatabases.listDocuments(
      photographerConfig.databaseId,
      photographerConfig.livePhotographersCollectionId,
      [Query.equal('userId', photographerId)]
    );

    if (livePhotographers.documents.length > 0) {
      await photographerDatabases.updateDocument(
        photographerConfig.databaseId,
        photographerConfig.livePhotographersCollectionId,
        livePhotographers.documents[0].$id,
        { bookingStatus: status }
      );
    }
  } catch (error) {
    console.error('Error updating photographer status:', error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    let isLocationServicesEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationServicesEnabled) {
      throw new Error('Location services are not enabled');
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 20000,
    });
    
    if (!location) {
      throw new Error('Unable to retrieve current location');
    }

    return `${location.coords.latitude},${location.coords.longitude}`;
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

export const subscribeToBookingUpdates = (bookingId, onUpdate) => {
  return client.subscribe(`databases.${config.databaseId}.collections.${config.bookingsCollectionId}.documents.${bookingId}`, response => {
    if (response.events.includes('databases.*.collections.*.documents.*.update')) {
      const updatedBooking = response.payload;
      onUpdate(updatedBooking);
    }
  });
};

export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};

export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    const updatedBooking = await databases.updateDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId,
      { status: newStatus }
    );

    const user = await getUserById(updatedBooking.userId);
    const photographer = JSON.parse(updatedBooking.photographer);

    let notificationData = {
      userId: updatedBooking.userId,
      relatedBookingId: bookingId,
      bookingDetails: {
        photographer: photographer,
        package: updatedBooking.package,
        price: updatedBooking.price,
        numberOfPhotos: updatedBooking.numberOfPhotos,
        date: updatedBooking.date,
        location: updatedBooking.location
      }
    };

    switch (newStatus) {
      case 'accepted':
        notificationData.title = 'Booking Accepted';
        notificationData.message = `Your booking for ${updatedBooking.package} has been accepted by ${photographer.name}.`;
        notificationData.type = 'booking_accepted';
        break;
      case 'rejected':
        notificationData.title = 'Booking Rejected';
        notificationData.message = `Your booking for ${updatedBooking.package} has been rejected.`;
        notificationData.type = 'booking_rejected';
        break;
      case 'completed':
        notificationData.title = 'Booking Completed';
        notificationData.message = `Your booking for ${updatedBooking.package} has been marked as completed.`;
        notificationData.type = 'booking_completed';
        break;
    }

    await createNotification(notificationData);

    return updatedBooking;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Add this function to register the push token
export const registerForPushNotificationsAsync = async () => {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
    // TODO: Send this token to your server
  }

  return token;
};

export const getUploadedPhotosForUser = async (userId) => {
  try {
    const photos = await photographerDatabases.listDocuments(
      config.photographerDatabaseId,
      config.uploadedPhotosCollectionId,
      [Query.equal('clientId', userId), Query.orderDesc('uploadDate')]
    );
    return photos.documents.map(photo => ({
      ...photo,
      paymentStatus: photo.paymentStatus || 'unpaid' // Default to 'unpaid' if not set
    }));
  } catch (error) {
    console.error('Error fetching uploaded photos:', error);
    throw error;
  }
};

export const getCompletedBookingsWithPhotos = async (userId) => {
  try {
    const bookings = await databases.listDocuments(
      config.databaseId,
      config.bookingsCollectionId,
      [
        Query.equal('userId', userId),
        Query.equal('status', 'completed'),
        Query.orderDesc('date')
      ]
    );

    const bookingsWithPhotos = await Promise.all(bookings.documents.map(async (booking) => {
      const photos = await photographerDatabases.listDocuments(
        config.photographerDatabaseId,
        config.uploadedPhotosCollectionId,
        [
          Query.equal('bookingId', booking.$id),
          Query.orderDesc('uploadDate')
        ]
      );

      const photographer = JSON.parse(booking.photographer);

      // Get the event name from the first photo
      const eventName = photos.documents.length > 0 ? photos.documents[0].event : 'Event not specified';

      return {
        ...booking,
        photos: photos.documents,
        isComplete: photos.documents.length >= booking.numberOfPhotos,
        photographer: {
          name: photographer.name,
          avatarUrl: photographer.avatarUrl,
          phoneNumber: photographer.phoneNumber // Include the phone number
        },
        eventName: eventName
      };
    }));

    return bookingsWithPhotos;
  } catch (error) {
    console.error('Error fetching completed bookings with photos:', error);
    throw error;
  }
};

// Add this function to your existing appwrite.js file
export const updateBookingRating = async (bookingId, rating) => {
  try {
    const updatedBooking = await databases.updateDocument(
      config.databaseId,
      config.bookingsCollectionId,
      bookingId,
      { rating: rating }
    );
    return updatedBooking;
  } catch (error) {
    console.error('Error updating booking rating:', error);
    throw error;
  }
};

export default {
  // ... (export all functions)
  getLivePhotographers,
  getLivePhotographerLocations,
};

export { client };