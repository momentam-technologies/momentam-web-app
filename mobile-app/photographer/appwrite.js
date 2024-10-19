import { Account, Avatars, Client, Databases, ID, Query } from 'react-native-appwrite';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios'; // Add this import
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add this import
import { userAppConfig } from './userAppConfig'; // Add this import
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.momentam.photographer',
    projectId: '66f66b4100323a1b831f',
    databaseId: '66f66c740016da106c49',
    userCollectionId: '66f66c970021be082279',
    livePhotographersCollectionId: '66f703a5001bcd7be8a9',
    photographerNotificationCollectionId: '670302070011aa1a320f',
    uploadedPhotosCollectionId: '6704f38c001529b8ddbf',
}

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform)

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

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

const GOOGLE_MAPS_API_KEY = 'AIzaSyCPcM29FmmoFnCSPkwPKZ51Qg3bJf90kYw'; // Make sure to use your actual API key

// Add a cache for geocoding results
const geocodeCache = new Map();

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.results.length > 0) {
      // You can customize this to return the level of detail you want
      // (e.g., street address, city, etc.)
      return response.data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
};

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

// Update the uploadToFirebase function
export const uploadToFirebase = async (imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);
    
    const uploadTask = uploadBytes(storageRef, blob);
    
    // You can add progress monitoring here if needed
    // uploadTask.on('state_changed', (snapshot) => {
    //   const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    // });

    await uploadTask;
    
    const url = await getDownloadURL(storageRef);
    
    return url;
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    throw error;
  }
};

// Update the updateAvatar function to use Firebase Storage
export const updateAvatar = async (userId, imageUri) => {
  try {

    // Upload to Firebase Storage
    const avatarUrl = await uploadToFirebase(imageUri);

    // Update the user document in Appwrite with the new avatar URL
    const updateResult = await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      { 
        avatar: avatarUrl,
        registrationComplete: true
      }
    );

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

export const updatePhotographerProfile = async (userId, profileData) => {
  try {
    const updatedUser = await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      {
        experience: profileData.experience,
        photosTaken: profileData.photosTaken,
        rating: profileData.rating,
        location: profileData.location,
        // Add any other fields you want to update
      }
    );
    return updatedUser;
  } catch (error) {
    console.error('Error updating photographer profile:', error);
    throw error;
  }
};

export const getPhotographerProfile = async (userId) => {
  try {
    const user = await databases.getDocument(
      config.databaseId,
      config.userCollectionId,
      userId
    );
    return {
      name: user.name,
      experience: user.experience,
      photosTaken: user.photosTaken,
      location: user.location,
      phoneNumber: user.phone,
      rating: user.rating,
    };
  } catch (error) {
    console.error('Error getting photographer profile:', error);
    throw error;
  }
};

export const goLive = async (userId, location) => {
  try {
    const user = await getUserById(userId);
    const livePhotographer = await databases.createDocument(
      config.databaseId,
      config.livePhotographersCollectionId,
      ID.unique(),
      {
        userId: userId,
        name: user.name,
        phoneNumber: user.phone,
        location: location, // Store only the original coordinates
        experience: user.experience || 'Experienced',
        rating: user.rating || 4.0,
        avatarUrl: user.avatar,
        bookingStatus: 'available',
        timestamp: new Date().toISOString()
      }
    );
    return livePhotographer;
  } catch (error) {
    console.error('Error going live:', error);
    throw error;
  }
};

export const goOffline = async (userId) => {
  try {
    const livePhotographers = await databases.listDocuments(
      config.databaseId,
      config.livePhotographersCollectionId,
      [Query.equal('userId', userId)]
    );
    if (livePhotographers.documents.length > 0) {
      await databases.deleteDocument(
        config.databaseId,
        config.livePhotographersCollectionId,
        livePhotographers.documents[0].$id
      );
    }
    
    // Update the user's lastOfflineTimestamp
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      { lastOfflineTimestamp: new Date().toISOString() }
    );
  } catch (error) {
    console.error('Error going offline:', error);
    throw error;
  }
};

export const isPhotographerLive = async (userId) => {
  try {
    const livePhotographers = await databases.listDocuments(
      config.databaseId,
      config.livePhotographersCollectionId,
      [Query.equal('userId', userId)]
    );
    return livePhotographers.documents.length > 0;
  } catch (error) {
    console.error('Error checking if photographer is live:', error);
    throw error;
  }
};

export const acceptBooking = async (bookingId) => {
  try {
    const updatedBooking = await userAppDatabases.updateDocument(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      bookingId,
      { status: 'accepted' }
    );

    // Remove the notification creation from here
    // The notification will be created by the real-time subscription

    return updatedBooking;
  } catch (error) {
    console.error('Error accepting booking:', error);
    throw error;
  }
};

export const rejectBooking = async (bookingId) => {
  try {
    const updatedBooking = await userAppDatabases.updateDocument(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      bookingId,
      { status: 'rejected' }
    );
    return updatedBooking;
  } catch (error) {
    console.error('Error rejecting booking:', error);
    throw error;
  }
};

export const completeBooking = async (bookingId) => {
  try {
    const updateData = { 
      status: 'completed',
    };
    
    if (userAppConfig.bookingsSchemaIncludesCompletedAt) {
      updateData.completedAt = new Date().toISOString();
    }

    const updatedBooking = await userAppDatabases.updateDocument(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      bookingId,
      updateData
    );

    // Update photographer status to 'available'
    await updatePhotographerStatus(updatedBooking.photographerId, 'available');

    return updatedBooking;
  } catch (error) {
    console.error('Error completing booking:', error);
    throw error;
  }
};

export const updatePhotographerStatus = async (photographerId, status) => {
  try {
    const livePhotographer = await databases.listDocuments(
      config.databaseId,
      config.livePhotographersCollectionId,
      [Query.equal('userId', photographerId)]
    );
    
    if (livePhotographer.documents.length > 0) {
      await databases.updateDocument(
        config.databaseId,
        config.livePhotographersCollectionId,
        livePhotographer.documents[0].$id,
        { bookingStatus: status }
      );
    }
  } catch (error) {
    console.error('Error updating photographer status:', error);
    throw error;
  }
};

// Add this function to appwrite.js
export const getLastStatusChange = async (userId) => {
  try {
    const livePhotographers = await databases.listDocuments(
      config.databaseId,
      config.livePhotographersCollectionId,
      [Query.equal('userId', userId), Query.orderDesc('timestamp'), Query.limit(1)]
    );
    
    if (livePhotographers.documents.length > 0) {
      return livePhotographers.documents[0].timestamp;
    }
    
    // If no live record found, check the user document for last offline timestamp
    const user = await getUserById(userId);
    return user.lastOfflineTimestamp || null;
  } catch (error) {
    console.error('Error getting last status change:', error);
    throw error;
  }
}; 

export const getPhotographerNotifications = async (userId) => {
  try {
    const lastFetchTime = await AsyncStorage.getItem('lastNotificationFetchTime') || new Date(0).toISOString();
    
    const notifications = await databases.listDocuments(
      config.databaseId,
      config.photographerNotificationCollectionId,
      [
        Query.equal('userId', userId),
        Query.greaterThan('timestamp', lastFetchTime),
        Query.orderDesc('timestamp'),
        Query.limit(50)
      ]
    );
    return notifications.documents;
  } catch (error) {
    console.error('Error fetching photographer notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await databases.updateDocument(
      config.databaseId,
      config.photographerNotificationCollectionId,
      notificationId,
      { read: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await databases.deleteDocument(
      config.databaseId,
      config.photographerNotificationCollectionId,
      notificationId
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export const createPhotographerNotification = async (notificationData) => {
  try {
    const bookingDetailsString = JSON.stringify({
      userDetails: notificationData.userDetails,
      package: notificationData.package,
      price: notificationData.price,
      numberOfPhotos: notificationData.numberOfPhotos,
      date: notificationData.date
    });

    const notification = await databases.createDocument(
      config.databaseId,
      config.photographerNotificationCollectionId,
      ID.unique(),
      {
        userId: notificationData.userId,
        title: notificationData.title,
        message: `${notificationData.message}\n\nBooking Details: ${bookingDetailsString}`,
        type: notificationData.type,
        read: false,
        timestamp: new Date().toISOString(),
        relatedBookingId: notificationData.relatedBookingId || null
      }
    );
    
    let pushMessage;
    if (notificationData.type === 'new_request') {
      pushMessage = `New booking request from ${notificationData.userDetails.name}: ${notificationData.package} package (${notificationData.numberOfPhotos} photos) for ${notificationData.price}. Tap to view details and respond.`;
    } else if (notificationData.type === 'booking_cancelled') {
      pushMessage = `Booking request cancelled from ${notificationData.userDetails.name} for ${notificationData.package} package. Tap for more details.`;
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
    console.error('Error creating photographer notification:', error);
    throw error;
  }
};

// Create a new client for the user app
const userAppClient = new Client();
userAppClient
    .setEndpoint(config.endpoint)
    .setProject(userAppConfig.projectId);


export const userAppDatabases = new Databases(userAppClient);

// Add this function to subscribe to bookings
export const subscribeToUserBookings = (photographerId, onBookingUpdate) => {
  return userAppClient.subscribe(`databases.${userAppConfig.databaseId}.collections.${userAppConfig.bookingsCollectionId}.documents`, response => {
    if (response.events.includes('databases.*.collections.*.documents.*.create') ||
        response.events.includes('databases.*.collections.*.documents.*.update')) {
      const booking = response.payload;
      if (booking.photographerId === photographerId) {
        onBookingUpdate(booking);
      }
    }
  });
};

// At the top of the file, after initializing the client
export { client, userAppClient };

// At the bottom of the file, make sure to include client in the default export
export default {
  // ... (other exports)
  client,
  userAppClient,
  userAppDatabases,
};

export const getCurrentBooking = async (photographerId) => {
  try {
    const bookings = await userAppDatabases.listDocuments(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      [
        Query.equal('photographerId', photographerId),
        Query.equal('status', 'pending'),
        Query.orderDesc('date'),
        Query.limit(1)
      ]
    );
    
    if (bookings.documents.length > 0) {
      return bookings.documents[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting current booking:', error);
    throw error;
  }
};

export const uploadPhotoToFirebase = async (uri) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

export const saveUploadedPhotos = async (photographerId, clientId, bookingId, photoUrls, eventName, venue) => {
  try {
    // Create a document for each photo
    const uploadPromises = photoUrls.map(photoUrl => 
      databases.createDocument(
        config.databaseId,
        config.uploadedPhotosCollectionId,
        ID.unique(),
        {
          photographerId,
          clientId,
          bookingId,
          photoUrl,
          event: eventName,
          venue,
          uploadDate: new Date().toISOString(),
        }
      )
    );

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    return { success: true, message: 'All photos uploaded successfully' };
  } catch (error) {
    console.error('Error saving uploaded photos:', error);
    throw error;
  }
};

export const getUploadedPhotosByBooking = async (bookingId) => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.uploadedPhotosCollectionId,
      [Query.equal('bookingId', bookingId)]
    );
    return response.documents.map(doc => doc.photoUrl);
  } catch (error) {
    console.error('Error fetching uploaded photos:', error);
    throw error;
  }
};

export const getPhotographerClients = async (photographerId) => {
  try {
    const bookings = await userAppDatabases.listDocuments(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      [Query.equal('photographerId', photographerId)]
    );

    const uniqueClients = bookings.documents.reduce((acc, booking) => {
      const userDetails = JSON.parse(booking.userDetails);
      if (!acc.find(client => client.id === booking.userId)) {
        acc.push({
          id: booking.userId,
          name: userDetails.name,
          avatar: userDetails.avatarUrl
        });
      }
      return acc;
    }, []);

    return uniqueClients;
  } catch (error) {
    console.error('Error fetching photographer clients:', error);
    throw error;
  }
};

export const getBookingsByPhotographerId = async (photographerId, status = null) => {
  try {
    let queries = [Query.equal('photographerId', photographerId)];
    if (status) {
      queries.push(Query.equal('status', status));
    } else {
      queries.push(Query.notEqual('status', 'cancelled'));
    }
    queries.push(Query.orderDesc('date'));

    const bookings = await userAppDatabases.listDocuments(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      queries
    );

    return bookings.documents;
  } catch (error) {
    console.error('Error getting bookings by photographer ID:', error);
    throw error;
  }
};

export const getUploadedPhotoDetails = async (bookingId) => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.uploadedPhotosCollectionId,
      [Query.equal('bookingId', bookingId), Query.limit(1)]
    );
    return response.documents[0];
  } catch (error) {
    console.error('Error fetching uploaded photo details:', error);
    throw error;
  }
};

// Add this function to fetch recent works
export const fetchRecentWorks = async (photographerId) => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.uploadedPhotosCollectionId,
      [
        Query.equal('photographerId', photographerId),
        Query.orderDesc('uploadDate'),
        Query.limit(100) // Fetch more than we need to ensure we get 5 unique clients
      ]
    );

    const uniqueClientWorks = response.documents.reduce((acc, photo) => {
      if (acc.length < 5 && !acc.some(work => work.clientId === photo.clientId)) {
        acc.push({
          id: photo.$id,
          image: photo.photoUrl,
          title: photo.event,
          clientId: photo.clientId
        });
      }
      return acc;
    }, []);

    return uniqueClientWorks.slice(0, 5); // Ensure we only return 5 works
  } catch (error) {
    console.error('Error fetching recent works:', error);
    return [];
  }
};

const formatBookingDate = (timestamp) => {
  if (!timestamp) return 'No date available';
  return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
};

export const createCancellationNotification = async (photographerId, bookingDetails) => {
  try {
    await databases.createDocument(
      config.databaseId,
      config.photographerNotificationCollectionId,
      ID.unique(),
      {
        userId: photographerId,
        title: 'Booking Cancelled',
        message: `The booking for ${bookingDetails.package} on ${formatBookingDate(bookingDetails.date)} has been cancelled.`,
        type: 'booking_cancelled',
        read: false,
        timestamp: new Date().toISOString(),
        relatedBookingId: bookingDetails.$id
      }
    );
  } catch (error) {
    console.error('Error creating cancellation notification:', error);
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const booking = await userAppDatabases.getDocument(
      userAppConfig.databaseId,
      userAppConfig.bookingsCollectionId,
      bookingId
    );
    const readableAddress = await getReadableAddress(booking.location);
    return { ...booking, readableAddress };
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    throw error;
  }
};