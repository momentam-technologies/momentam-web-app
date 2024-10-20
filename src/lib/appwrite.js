import { Client, Account, Databases, Query } from 'appwrite';

// Configuration
const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    photographer: {
        projectId: '66f66b4100323a1b831f',
        databaseId: '66f66c740016da106c49',
        userCollectionId: '66f66c970021be082279',
        livePhotographersCollectionId: '66f703a5001bcd7be8a9',
        notificationCollectionId: '670302070011aa1a320f',
        uploadedPhotosCollectionId: '6704f38c001529b8ddbf',
    },
    user: {
        projectId: '66d00db0003702a664b7',
        databaseId: '66d00ed8003231569fd0',
        userCollectionId: '66d00f0f00399b6036fd',
        photoCollectionId: '66d00f2c002f105a9682',
        storageId: '66d0104d00282cbfc0c8',
        bookingsCollectionId: '66f155ee0008ff041e8b',
        notificationCollectionId: '66fead61001e5ff6b52d',
    },
    messages: {
        collectionId: 'your_messages_collection_id',
        conversationsCollectionId: 'your_conversations_collection_id',
    },
};

// Initialize Appwrite clients
const createClient = (projectId) => {
    return new Client().setEndpoint(config.endpoint).setProject(projectId);
};

const photographerClient = createClient(config.photographer.projectId);
const userClient = createClient(config.user.projectId);

const photographerDatabases = new Databases(photographerClient);
const userDatabases = new Databases(userClient);

// Helper functions
const getDocumentCount = async (databases, databaseId, collectionId, queries = []) => {
    try {
        const result = await databases.listDocuments(databaseId, collectionId, [...queries, Query.limit(1)]);
        return result.total;
    } catch (error) {
        console.error(`Error in getDocumentCount: ${error.message}`);
        throw new Error(`Failed to get document count: ${error.message}`);
    }
};

export const getUserCount = () => getDocumentCount(userDatabases, config.user.databaseId, config.user.userCollectionId);

export const getActivePhotographersCount = () => getDocumentCount(
    photographerDatabases, 
    config.photographer.databaseId, 
    config.photographer.livePhotographersCollectionId, 
    [Query.equal('bookingStatus', 'available')]
);

export const getPendingBookingsCount = () => getDocumentCount(
    userDatabases, 
    config.user.databaseId, 
    config.user.bookingsCollectionId, 
    [Query.equal('status', 'pending')]
);

export const getRevenue = async () => {
    try {
        const completedBookings = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [Query.equal('status', 'completed')]
        );
        return completedBookings.documents.reduce((total, booking) => total + parseFloat(booking.price), 0);
    } catch (error) {
        console.error(`Error in getRevenue: ${error.message}`);
        throw new Error(`Failed to calculate revenue: ${error.message}`);
    }
};

export const getLatestUsers = async (limit = 5) => {
    try {
        const [users, photographers] = await Promise.all([
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.userCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            photographerDatabases.listDocuments(
                config.photographer.databaseId,
                config.photographer.userCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            )
        ]);

        const allUsers = [
            ...users.documents.map(user => ({ ...user, type: 'user' })),
            ...photographers.documents.map(photographer => ({ ...photographer, type: 'photographer' }))
        ];

        const usersWithActivities = await Promise.all(allUsers.map(async user => ({
            ...user,
            recentActivities: await getRecentActivitiesForUser(user.$id, user.type, 5)
        })));

        return usersWithActivities
            .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
            .slice(0, limit);
    } catch (error) {
        console.error(`Error in getLatestUsers: ${error.message}`);
        throw new Error(`Failed to get latest users: ${error.message}`);
    }
};

const getRecentActivitiesForUser = async (userId, userType, limit = 5) => {
    try {
        let activities = [];
        if (userType === 'user') {
            const bookings = await userDatabases.listDocuments(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(limit)]
            );
            activities = bookings.documents.map(booking => ({
                type: 'Booking',
                description: `Made a booking for ${booking.package}`,
                time: booking.$createdAt
            }));
        } else if (userType === 'photographer') {
            const [bookings, statusUpdates] = await Promise.all([
                userDatabases.listDocuments(
                    config.user.databaseId,
                    config.user.bookingsCollectionId,
                    [Query.equal('photographerId', userId), Query.orderDesc('$createdAt'), Query.limit(limit)]
                ),
                photographerDatabases.listDocuments(
                    config.photographer.databaseId,
                    config.photographer.livePhotographersCollectionId,
                    [Query.equal('photographerId', userId), Query.orderDesc('$createdAt'), Query.limit(limit)]
                )
            ]);
            activities = [
                ...bookings.documents.map(booking => ({
                    type: 'Booking',
                    description: `Accepted a booking for ${booking.package}`,
                    time: booking.$createdAt
                })),
                ...statusUpdates.documents.map(status => ({
                    type: 'Status Update',
                    description: `Changed status to ${status.bookingStatus}`,
                    time: status.$createdAt
                }))
            ];
        }
        return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);
    } catch (error) {
        console.error(`Error fetching user activities: ${error.message}`);
        return [];
    }
};

export const getRecentActivities = async (limit = 5) => {
    try {
        const [userBookings, photographerLiveStatus, userRegistrations, photographerRegistrations] = await Promise.all([
            userDatabases.listDocuments(config.user.databaseId, config.user.bookingsCollectionId, [Query.orderDesc('$createdAt'), Query.limit(limit)]),
            photographerDatabases.listDocuments(config.photographer.databaseId, config.photographer.livePhotographersCollectionId, [Query.orderDesc('$createdAt'), Query.limit(limit)]),
            userDatabases.listDocuments(config.user.databaseId, config.user.userCollectionId, [Query.orderDesc('$createdAt'), Query.limit(limit)]),
            photographerDatabases.listDocuments(config.photographer.databaseId, config.photographer.userCollectionId, [Query.orderDesc('$createdAt'), Query.limit(limit)])
        ]);

        const allActivities = [
            ...userBookings.documents.map(doc => ({
                type: 'booking',
                description: `New booking: ${doc.package} by ${JSON.parse(doc.userDetails).name}`,
                time: doc.$createdAt
            })),
            ...photographerLiveStatus.documents.map(doc => ({
                type: 'photographer_status',
                description: `Photographer ${doc.name} is now ${doc.bookingStatus}`,
                time: doc.$createdAt
            })),
            ...userRegistrations.documents.map(doc => ({
                type: 'user_registration',
                description: `New user registered: ${doc.name}`,
                time: doc.$createdAt
            })),
            ...photographerRegistrations.documents.map(doc => ({
                type: 'photographer_registration',
                description: `New photographer registered: ${doc.name}`,
                time: doc.$createdAt
            }))
        ];

        return allActivities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit);
    } catch (error) {
        console.error(`Error in getRecentActivities: ${error.message}`);
        throw new Error(`Failed to get recent activities: ${error.message}`);
    }
};

export const getUsers = async (limit = 20, offset = 0) => {
    try {
        const users = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.userCollectionId,
            [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]
        );
        return { users: users.documents, total: users.total };
    } catch (error) {
        console.error(`Error in getUsers: ${error.message}`);
        throw new Error(`Failed to get users: ${error.message}`);
    }
};

export const subscribeToRealtimeUpdates = (callback) => {
    const subscriptions = [
        userClient.subscribe([`databases.${config.user.databaseId}.collections.${config.user.userCollectionId}.documents`], (response) => {
            if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                callback('user_created', response.payload);
            } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
                callback('user_updated', response.payload);
            } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
                callback('user_deleted', response.payload);
            }
        }),
        photographerClient.subscribe([`databases.${config.photographer.databaseId}.collections.${config.photographer.userCollectionId}.documents`], (response) => {
            if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                callback('photographer_created', response.payload);
            }
        }),
        userClient.subscribe([`databases.${config.user.databaseId}.collections.${config.user.bookingsCollectionId}.documents`], (response) => {
            if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                callback('booking_created', response.payload);
            }
        })
    ];

    return () => subscriptions.forEach(unsubscribe => unsubscribe());
};

export const getUserDetails = async (userId) => {
    try {
        const user = await userDatabases.getDocument(config.user.databaseId, config.user.userCollectionId, userId);
        const [bookings, photos, interactions, activities] = await Promise.all([
            userDatabases.listDocuments(config.user.databaseId, config.user.bookingsCollectionId, [Query.equal('userId', userId)]),
            userDatabases.listDocuments(config.user.databaseId, config.user.photoCollectionId, [Query.equal('userId', userId)]),
            userDatabases.listDocuments(config.user.databaseId, 'photographer_interactions', [Query.equal('userId', userId)]),
            userDatabases.listDocuments(config.user.databaseId, 'user_activities', [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(10)])
        ]);

        return {
            ...user,
            totalBookings: bookings.total,
            completedBookings: bookings.documents.filter(b => b.status === 'completed').length,
            cancelledBookings: bookings.documents.filter(b => b.status === 'cancelled').length,
            photos: photos.documents,
            photographersInteracted: interactions.documents.map(interaction => ({
                name: interaction.photographerName,
                avatar: interaction.photographerAvatar,
                rating: interaction.rating
            })),
            recentActivities: activities.documents.map(a => ({
                description: a.description,
                time: a.$createdAt
            }))
        };
    } catch (error) {
        console.error(`Error in getUserDetails: ${error.message}`);
        throw new Error(`Failed to get user details: ${error.message}`);
    }
};

export const updateUser = async (userId, updatedData) => {
    try {
        return await userDatabases.updateDocument(config.user.databaseId, config.user.userCollectionId, userId, updatedData);
    } catch (error) {
        console.error(`Error in updateUser: ${error.message}`);
        throw new Error(`Failed to update user: ${error.message}`);
    }
};

export const deleteUser = async (userId) => {
    try {
        await userDatabases.deleteDocument(config.user.databaseId, config.user.userCollectionId, userId);
    } catch (error) {
        console.error(`Error in deleteUser: ${error.message}`);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
};

export const banUser = async (userId) => {
    try {
        const user = await userDatabases.getDocument(config.user.databaseId, config.user.userCollectionId, userId);
        return await userDatabases.updateDocument(config.user.databaseId, config.user.userCollectionId, userId, { ...user, status: 'banned' });
    } catch (error) {
        console.error(`Error in banUser: ${error.message}`);
        throw new Error(`Failed to ban user: ${error.message}`);
    }
};

export const getYearlyStats = async () => {
    try {
        const currentDate = new Date();
        const monthlyStats = [];

        for (let i = 11; i >= 0; i--) {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
            
            const stats = await fetchStatsForMonth(startDate, endDate);
            monthlyStats.push({
                name: startDate.toLocaleString('default', { month: 'short' }),
                ...stats
            });
        }

        return {
            yearlyData: monthlyStats,
            currentMonthStats: monthlyStats[11],
            previousMonthStats: monthlyStats[10]
        };
    } catch (error) {
        console.error(`Error in getYearlyStats: ${error.message}`);
        throw new Error(`Failed to get yearly stats: ${error.message}`);
    }
};

const fetchStatsForMonth = async (startDate, endDate) => {
    const [users, photographers, bookings, revenue] = await Promise.all([
        getUserCountForPeriod(startDate, endDate),
        getActivePhotographersCountForPeriod(startDate, endDate),
        getPendingBookingsCountForPeriod(startDate, endDate),
        getRevenueForPeriod(startDate, endDate)
    ]);
    return { users, photographers, bookings, revenue };
};

const getUserCountForPeriod = (startDate, endDate) => 
    getDocumentCount(userDatabases, config.user.databaseId, config.user.userCollectionId, 
        [Query.greaterThanEqual('$createdAt', startDate), Query.lessThanEqual('$createdAt', endDate)]);

const getActivePhotographersCountForPeriod = (startDate, endDate) => 
    getDocumentCount(photographerDatabases, config.photographer.databaseId, config.photographer.livePhotographersCollectionId, 
        [Query.greaterThanEqual('$createdAt', startDate), Query.lessThanEqual('$createdAt', endDate), Query.equal('bookingStatus', 'available')]);

const getPendingBookingsCountForPeriod = (startDate, endDate) => 
    getDocumentCount(userDatabases, config.user.databaseId, config.user.bookingsCollectionId, 
        [Query.greaterThanEqual('$createdAt', startDate), Query.lessThanEqual('$createdAt', endDate), Query.equal('status', 'pending')]);

const getRevenueForPeriod = async (startDate, endDate) => {
    const completedBookings = await userDatabases.listDocuments(
        config.user.databaseId,
        config.user.bookingsCollectionId,
        [Query.greaterThanEqual('$createdAt', startDate), Query.lessThanEqual('$createdAt', endDate), Query.equal('status', 'completed')]
    );
    return completedBookings.documents.reduce((total, booking) => total + parseFloat(booking.price), 0);
};

// Add these functions to your existing appwrite.js file

export const getUnreadMessagesCount = async () => {
  try {
    // Check if the collection exists before querying
    const collections = await userDatabases.listCollections(config.user.databaseId);
    const messagesCollection = collections.find(c => c.$id === config.messages.collectionId);
    
    if (!messagesCollection) {
      console.warn('Messages collection not found. Returning 0 unread messages.');
      return 0;
    }

    const messages = await userDatabases.listDocuments(
      config.user.databaseId,
      config.messages.collectionId,
      [Query.equal('read', false), Query.limit(1)]
    );
    return messages.total;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
};

export const getMessages = async (conversationId = null) => {
  try {
    if (conversationId) {
      const messages = await userDatabases.listDocuments(
        config.user.databaseId,
        config.messages.collectionId,
        [Query.equal('conversationId', conversationId), Query.orderDesc('$createdAt')]
      );
      return messages.documents;
    } else {
      const conversations = await userDatabases.listDocuments(
        config.user.databaseId,
        config.messages.conversationsCollectionId,
        [Query.orderDesc('lastMessageAt')]
      );
      return conversations.documents;
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (conversationId, content) => {
  try {
    const message = await userDatabases.createDocument(
      config.user.databaseId,
      config.messages.collectionId,
      ID.unique(),
      {
        conversationId,
        content,
        sender: 'me', // You might want to replace this with the actual user ID
        read: false,
        createdAt: new Date().toISOString(),
      }
    );

    // Update the conversation's last message
    await userDatabases.updateDocument(
      config.user.databaseId,
      config.messages.conversationsCollectionId,
      conversationId,
      {
        lastMessage: content,
        lastMessageAt: new Date().toISOString(),
      }
    );

    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export { Query };
