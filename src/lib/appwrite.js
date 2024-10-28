import { Client, Account, Databases, Query, ID } from 'appwrite';

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
    admin: {
        projectId: 'your_admin_project_id',
        databaseId: 'your_admin_database_id',
        userCollectionId: 'your_admin_user_collection_id',
    }
};

// Initialize Appwrite clients
const createClient = (projectId) => {
    return new Client().setEndpoint(config.endpoint).setProject(projectId);
};

const photographerClient = createClient(config.photographer.projectId);
const userClient = createClient(config.user.projectId);
const adminClient = createClient(config.admin.projectId);

const photographerDatabases = new Databases(photographerClient);
const userDatabases = new Databases(userClient);
const adminDatabases = new Databases(adminClient);

// Admin Functions for User Management
export const createUser = async (userData) => {
    try {
        // Create user in user app
        const userDoc = await userDatabases.createDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            ID.unique(),
            {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                avatar: userData.avatar,
                status: 'active',
                registrationComplete: true,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                recentLocations: JSON.stringify([])
            }
        );

        return userDoc;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const updateUser = async (userId, userData) => {
    try {
        // First get the user to ensure valid ID
        const user = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.userCollectionId,
            [Query.equal('$id', userId)]
        );

        if (user.documents.length === 0) {
            throw new Error('User not found');
        }

        // Handle avatar upload if it's a file
        let avatarUrl = userData.avatar;
        if (userData.avatar instanceof File) {
            avatarUrl = await uploadToFirebase(userData.avatar);
        }

        const updatedUser = await userDatabases.updateDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            userId,
            {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                avatar: avatarUrl,
                lastUpdated: new Date().toISOString()
            }
        );

        return updatedUser;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const deleteUser = async (userId) => {
    try {
        // First get the user to ensure valid ID
        const user = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.userCollectionId,
            [Query.equal('$id', userId)]
        );

        if (user.documents.length === 0) {
            throw new Error('User not found');
        }

        // Delete user's bookings
        const bookings = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [Query.equal('userId', userId)]
        );

        // Delete each booking
        await Promise.all(bookings.documents.map(booking => 
            userDatabases.deleteDocument(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                booking.$id
            )
        ));

        // Finally delete the user
        await userDatabases.deleteDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            user.documents[0].$id
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

export const banUser = async (userId) => {
    try {
        // First get the user to ensure valid ID
        const user = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.userCollectionId,
            [Query.equal('$id', userId)]
        );

        if (user.documents.length === 0) {
            throw new Error('User not found');
        }

        const updatedUser = await userDatabases.updateDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            user.documents[0].$id,
            { 
                status: 'banned',
                bannedAt: new Date().toISOString()
            }
        );

        return updatedUser;
    } catch (error) {
        console.error('Error banning user:', error);
        throw error;
    }
};

export const unbanUser = async (userId) => {
    try {
        const updatedUser = await userDatabases.updateDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            userId,
            { 
                status: 'active',
                bannedAt: null
            }
        );

        return updatedUser;
    } catch (error) {
        console.error('Error unbanning user:', error);
        throw error;
    }
};

// Function to get all users with pagination and filters
export const getUsers = async (limit = 10, offset = 0, filters = {}) => {
    try {
        let queries = [Query.limit(limit), Query.offset(offset)];

        if (filters.status) {
            queries.push(Query.equal('status', filters.status));
        }
        if (filters.search) {
            queries.push(Query.search('name', filters.search));
        }
        if (filters.dateRange) {
            queries.push(Query.greaterThan('createdAt', filters.dateRange.start));
            queries.push(Query.lessThan('createdAt', filters.dateRange.end));
        }

        const users = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.userCollectionId,
            queries
        );

        // Enhance user data with additional information
        const enhancedUsers = await Promise.all(users.documents.map(async user => {
            const bookings = await userDatabases.listDocuments(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                [Query.equal('userId', user.$id)]
            );

            return {
                ...user,
                totalBookings: bookings.total,
                lastBooking: bookings.documents[0]?.$createdAt || null
            };
        }));

        return {
            users: enhancedUsers,
            total: users.total
        };
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};

// Function to get user statistics
export const getUserStats = async () => {
    try {
        const [users, photographers, bookings] = await Promise.all([
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.userCollectionId
            ),
            photographerDatabases.listDocuments(
                config.photographer.databaseId,
                config.photographer.userCollectionId
            ),
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.bookingsCollectionId
            )
        ]);

        const completedBookings = bookings.documents.filter(b => b.status === 'completed');
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + parseFloat(booking.price), 0);

        return {
            totalUsers: users.total,
            activeUsers: users.documents.filter(u => u.status === 'active').length,
            bannedUsers: users.documents.filter(u => u.status === 'banned').length,
            totalPhotographers: photographers.total,
            activePhotographers: photographers.documents.filter(p => p.status === 'active').length,
            totalBookings: bookings.total,
            completedBookings: completedBookings.length,
            pendingBookings: bookings.documents.filter(b => b.status === 'pending').length,
            totalRevenue,
            averageBookingValue: totalRevenue / completedBookings.length || 0
        };
    } catch (error) {
        console.error('Error getting user statistics:', error);
        throw error;
    }
};

// Export all necessary functions and clients
export {
    photographerClient,
    userClient,
    adminClient,
    photographerDatabases,
    userDatabases,
    adminDatabases
};

// Add this function to handle unread messages
export const getUnreadMessagesCount = async () => {
    try {
        // Get unread notifications from both user and photographer collections
        const [userNotifications, photographerNotifications] = await Promise.all([
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.notificationCollectionId,
                [Query.equal('read', false)]
            ),
            photographerDatabases.listDocuments(
                config.photographer.databaseId,
                config.photographer.notificationCollectionId,
                [Query.equal('read', false)]
            )
        ]);

        // Return total count of unread messages
        return userNotifications.total + photographerNotifications.total;
    } catch (error) {
        console.error('Error getting unread messages count:', error);
        return 0;
    }
};

// Add this function to mark messages as read
export const markMessageAsRead = async (messageId, isPhotographerMessage = false) => {
    try {
        const databases = isPhotographerMessage ? photographerDatabases : userDatabases;
        const collectionId = isPhotographerMessage 
            ? config.photographer.notificationCollectionId 
            : config.user.notificationCollectionId;

        await databases.updateDocument(
            isPhotographerMessage ? config.photographer.databaseId : config.user.databaseId,
            collectionId,
            messageId,
            { read: true }
        );
    } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
    }
};

// Add this function to get all messages
export const getAllMessages = async () => {
    try {
        // Get messages from both user and photographer collections
        const [userMessages, photographerMessages] = await Promise.all([
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.notificationCollectionId,
                [Query.orderDesc('$createdAt')]
            ),
            photographerDatabases.listDocuments(
                config.photographer.databaseId,
                config.photographer.notificationCollectionId,
                [Query.orderDesc('$createdAt')]
            )
        ]);

        // Combine and sort messages
        const allMessages = [
            ...userMessages.documents.map(msg => ({ ...msg, type: 'user' })),
            ...photographerMessages.documents.map(msg => ({ ...msg, type: 'photographer' }))
        ].sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

        return allMessages;
    } catch (error) {
        console.error('Error getting all messages:', error);
        return [];
    }
};

// Add this function for realtime updates
export const subscribeToRealtimeUpdates = (callback) => {
    try {
        // Subscribe to user updates
        const userSubscription = userClient.subscribe(`databases.${config.user.databaseId}.collections.${config.user.userCollectionId}.documents`, response => {
            if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                response.events.includes('databases.*.collections.*.documents.*.update') ||
                response.events.includes('databases.*.collections.*.documents.*.delete')) {
                callback('user', response.payload);
            }
        });

        // Subscribe to photographer updates
        const photographerSubscription = photographerClient.subscribe(`databases.${config.photographer.databaseId}.collections.${config.photographer.userCollectionId}.documents`, response => {
            if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                response.events.includes('databases.*.collections.*.documents.*.update') ||
                response.events.includes('databases.*.collections.*.documents.*.delete')) {
                callback('photographer', response.payload);
            }
        });

        // Subscribe to booking updates
        const bookingSubscription = userClient.subscribe(`databases.${config.user.databaseId}.collections.${config.user.bookingsCollectionId}.documents`, response => {
            if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                response.events.includes('databases.*.collections.*.documents.*.update') ||
                response.events.includes('databases.*.collections.*.documents.*.delete')) {
                callback('booking', response.payload);
            }
        });

        // Return unsubscribe function
        return () => {
            userSubscription();
            photographerSubscription();
            bookingSubscription();
        };
    } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
        return () => {}; // Return empty function if subscription fails
    }
};

// Dashboard-specific functions
export const getYearlyStats = async () => {
    try {
        // Implementation for dashboard stats
        const yearlyData = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [Query.orderDesc('$createdAt')]
        );
        return { yearlyData: yearlyData.documents };
    } catch (error) {
        console.error('Error getting yearly stats:', error);
        throw error;
    }
};

export const getLatestUsers = async (limit = 5, offset = 0) => {
    // Implementation for latest users
};

export const getRecentActivities = async (limit = 5, offset = 0) => {
    // Implementation for recent activities
};

export const getRecentTransactions = async (limit = 5) => {
    // Implementation for recent transactions
};

export const getLivePhotographers = async () => {
    // Implementation for live photographers
};

export const getUserRequests = async () => {
    // Implementation for user requests
};
