import { Client, Account, Databases, Query } from 'appwrite';

// Photographer app configuration
const photographerConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '66f66b4100323a1b831f',
    databaseId: '66f66c740016da106c49',
    userCollectionId: '66f66c970021be082279',
    livePhotographersCollectionId: '66f703a5001bcd7be8a9',
    photographerNotificationCollectionId: '670302070011aa1a320f',
    uploadedPhotosCollectionId: '6704f38c001529b8ddbf',
};

// User app configuration
const userConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '66d00db0003702a664b7',
    databaseId: '66d00ed8003231569fd0',
    userCollectionId: '66d00f0f00399b6036fd',
    photoCollectionId: '66d00f2c002f105a9682',
    storageId: '66d0104d00282cbfc0c8',
    bookingsCollectionId: '66f155ee0008ff041e8b',
    notificationCollectionId: '66fead61001e5ff6b52d',
};

// Initialize Appwrite clients for both apps
export const photographerClient = new Client()
    .setEndpoint(photographerConfig.endpoint)
    .setProject(photographerConfig.projectId);

export const userClient = new Client()
    .setEndpoint(userConfig.endpoint)
    .setProject(userConfig.projectId);

export const photographerDatabases = new Databases(photographerClient);
export const userDatabases = new Databases(userClient);

// Helper functions

export const getUserCount = async () => {
    try {
        const users = await userDatabases.listDocuments(
            userConfig.databaseId,
            userConfig.userCollectionId,
            [Query.limit(1)]
        );
        return users.total;
    } catch (error) {
        console.error('Error in getUserCount:', error);
        throw new Error(`Failed to get user count: ${error.message}`);
    }
};

export const getActivePhotographersCount = async () => {
    try {
        const photographers = await photographerDatabases.listDocuments(
            photographerConfig.databaseId,
            photographerConfig.livePhotographersCollectionId,
            [Query.equal('bookingStatus', 'available'), Query.limit(1)]
        );
        return photographers.total;
    } catch (error) {
        console.error('Error in getActivePhotographersCount:', error);
        throw new Error(`Failed to get active photographers count: ${error.message}`);
    }
};

export const getPendingBookingsCount = async () => {
    try {
        const bookings = await userDatabases.listDocuments(
            userConfig.databaseId,
            userConfig.bookingsCollectionId,
            [Query.equal('status', 'pending'), Query.limit(1)]
        );
        return bookings.total;
    } catch (error) {
        console.error('Error in getPendingBookingsCount:', error);
        throw new Error(`Failed to get pending bookings count: ${error.message}`);
    }
};

export const getRevenue = async () => {
    try {
        const completedBookings = await userDatabases.listDocuments(
            userConfig.databaseId,
            userConfig.bookingsCollectionId,
            [Query.equal('status', 'completed')]
        );
        
        return completedBookings.documents.reduce((total, booking) => total + parseFloat(booking.price), 0);
    } catch (error) {
        console.error('Error in getRevenue:', error);
        throw new Error(`Failed to calculate revenue: ${error.message}`);
    }
};

export const getLatestUsers = async (limit = 5) => {
    try {
        const [users, photographers] = await Promise.all([
            userDatabases.listDocuments(
                userConfig.databaseId,
                userConfig.userCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            photographerDatabases.listDocuments(
                photographerConfig.databaseId,
                photographerConfig.userCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            )
        ]);

        const allUsers = [
            ...users.documents.map(user => ({ ...user, type: 'user' })),
            ...photographers.documents.map(photographer => ({ ...photographer, type: 'photographer' }))
        ];

        // Fetch recent activities for each user
        const usersWithActivities = await Promise.all(allUsers.map(async user => {
            const activities = await getRecentActivitiesForUser(user.$id, user.type, 5);
            return { ...user, recentActivities: activities };
        }));

        usersWithActivities.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

        return usersWithActivities.slice(0, limit);
    } catch (error) {
        console.error('Error in getLatestUsers:', error);
        throw new Error(`Failed to get latest users: ${error.message}`);
    }
};

const getRecentActivitiesForUser = async (userId, userType, limit = 5) => {
    try {
        let activities = [];

        if (userType === 'user') {
            const bookings = await userDatabases.listDocuments(
                userConfig.databaseId,
                userConfig.bookingsCollectionId,
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
                    userConfig.databaseId,
                    userConfig.bookingsCollectionId,
                    [Query.equal('photographerId', userId), Query.orderDesc('$createdAt'), Query.limit(limit)]
                ),
                photographerDatabases.listDocuments(
                    photographerConfig.databaseId,
                    photographerConfig.livePhotographersCollectionId,
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

        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        return activities.slice(0, limit);
    } catch (error) {
        console.error('Error fetching user activities:', error);
        return [];
    }
};

export const getRecentActivities = async (limit = 5) => {
    try {
        const [userBookings, photographerLiveStatus, userRegistrations, photographerRegistrations] = await Promise.all([
            userDatabases.listDocuments(
                userConfig.databaseId,
                userConfig.bookingsCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            photographerDatabases.listDocuments(
                photographerConfig.databaseId,
                photographerConfig.livePhotographersCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            userDatabases.listDocuments(
                userConfig.databaseId,
                userConfig.userCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            photographerDatabases.listDocuments(
                photographerConfig.databaseId,
                photographerConfig.userCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            )
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

        // Sort all activities by time, most recent first
        allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

        return allActivities.slice(0, limit);
    } catch (error) {
        console.error('Error in getRecentActivities:', error);
        throw new Error(`Failed to get recent activities: ${error.message}`);
    }
};

// Add more helper functions as needed

export const getUsers = async (limit = 20, offset = 0) => {
    try {
        const users = await userDatabases.listDocuments(
            userConfig.databaseId,
            userConfig.userCollectionId,
            [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]
        );

        return {
            users: users.documents,
            total: users.total
        };
    } catch (error) {
        console.error('Error in getUsers:', error);
        throw new Error(`Failed to get users: ${error.message}`);
    }
};

// Add this new function for real-time updates
export const subscribeToRealtimeUpdates = (callback) => {
    const userSubscription = userClient.subscribe([`databases.${userConfig.databaseId}.collections.${userConfig.userCollectionId}.documents`], (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callback('user_created', response.payload);
        }
    });

    const photographerSubscription = photographerClient.subscribe([`databases.${photographerConfig.databaseId}.collections.${photographerConfig.userCollectionId}.documents`], (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callback('photographer_created', response.payload);
        }
    });

    const bookingSubscription = userClient.subscribe([`databases.${userConfig.databaseId}.collections.${userConfig.bookingsCollectionId}.documents`], (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            callback('booking_created', response.payload);
        }
    });

    return () => {
        userSubscription();
        photographerSubscription();
        bookingSubscription();
    };
};

// New function to get monthly stats
export const getMonthlyStats = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const [currentMonthStats, previousMonthStats] = await Promise.all([
        fetchStatsForMonth(currentYear, currentMonth),
        fetchStatsForMonth(previousYear, previousMonth)
    ]);

    return {
        current: currentMonthStats,
        previous: previousMonthStats
    };
};

const fetchStatsForMonth = async (year, month) => {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0).toISOString();

    const [users, photographers, bookings, revenue] = await Promise.all([
        getUserCountForPeriod(startDate, endDate),
        getActivePhotographersCountForPeriod(startDate, endDate),
        getPendingBookingsCountForPeriod(startDate, endDate),
        getRevenueForPeriod(startDate, endDate)
    ]);

    return { users, photographers, bookings, revenue };
};

const getUserCountForPeriod = async (startDate, endDate) => {
    const users = await userDatabases.listDocuments(
        userConfig.databaseId,
        userConfig.userCollectionId,
        [
            Query.greaterThanEqual('$createdAt', startDate),
            Query.lessThanEqual('$createdAt', endDate),
            Query.limit(1)
        ]
    );
    return users.total;
};

const getActivePhotographersCountForPeriod = async (startDate, endDate) => {
    const photographers = await photographerDatabases.listDocuments(
        photographerConfig.databaseId,
        photographerConfig.livePhotographersCollectionId,
        [
            Query.greaterThanEqual('$createdAt', startDate),
            Query.lessThanEqual('$createdAt', endDate),
            Query.equal('bookingStatus', 'available'),
            Query.limit(1)
        ]
    );
    return photographers.total;
};

const getPendingBookingsCountForPeriod = async (startDate, endDate) => {
    const bookings = await userDatabases.listDocuments(
        userConfig.databaseId,
        userConfig.bookingsCollectionId,
        [
            Query.greaterThanEqual('$createdAt', startDate),
            Query.lessThanEqual('$createdAt', endDate),
            Query.equal('status', 'pending'),
            Query.limit(1)
        ]
    );
    return bookings.total;
};

const getRevenueForPeriod = async (startDate, endDate) => {
    const completedBookings = await userDatabases.listDocuments(
        userConfig.databaseId,
        userConfig.bookingsCollectionId,
        [
            Query.greaterThanEqual('$createdAt', startDate),
            Query.lessThanEqual('$createdAt', endDate),
            Query.equal('status', 'completed')
        ]
    );
    
    return completedBookings.documents.reduce((total, booking) => total + parseFloat(booking.price), 0);
};

// Add these new functions

export const getUserDetails = async (userId) => {
    try {
        const user = await userDatabases.getDocument(
            userConfig.databaseId,
            userConfig.userCollectionId,
            userId
        );

        // Fetch additional user details
        const [bookings, photos, interactions, activities] = await Promise.all([
            userDatabases.listDocuments(
                userConfig.databaseId,
                userConfig.bookingsCollectionId,
                [Query.equal('userId', userId)]
            ),
            userDatabases.listDocuments(
                userConfig.databaseId,
                userConfig.photoCollectionId,
                [Query.equal('userId', userId)]
            ),
            userDatabases.listDocuments(
                userConfig.databaseId,
                'photographer_interactions',
                [Query.equal('userId', userId)]
            ),
            userDatabases.listDocuments(
                userConfig.databaseId,
                'user_activities',
                [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(10)]
            )
        ]);

        const photographersInteracted = interactions.documents.map(interaction => ({
            name: interaction.photographerName,
            avatar: interaction.photographerAvatar,
            rating: interaction.rating
        }));

        return {
            ...user,
            totalBookings: bookings.total,
            completedBookings: bookings.documents.filter(b => b.status === 'completed').length,
            cancelledBookings: bookings.documents.filter(b => b.status === 'cancelled').length,
            photos: photos.documents,
            photographersInteracted,
            recentActivities: activities.documents.map(a => ({
                description: a.description,
                time: a.$createdAt
            }))
        };
    } catch (error) {
        console.error('Error in getUserDetails:', error);
        throw new Error(`Failed to get user details: ${error.message}`);
    }
};

export const updateUser = async (userId, updatedData) => {
    try {
        const updatedUser = await userDatabases.updateDocument(
            userConfig.databaseId,
            userConfig.userCollectionId,
            userId,
            updatedData
        );
        return updatedUser;
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw new Error(`Failed to update user: ${error.message}`);
    }
};

export const deleteUser = async (userId) => {
    try {
        await userDatabases.deleteDocument(
            userConfig.databaseId,
            userConfig.userCollectionId,
            userId
        );
    } catch (error) {
        console.error('Error in deleteUser:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
};

export const banUser = async (userId) => {
    try {
        const user = await userDatabases.getDocument(
            userConfig.databaseId,
            userConfig.userCollectionId,
            userId
        );

        const updatedUser = await userDatabases.updateDocument(
            userConfig.databaseId,
            userConfig.userCollectionId,
            userId,
            {
                ...user,
                status: 'banned'
            }
        );

        return updatedUser;
    } catch (error) {
        console.error('Error in banUser:', error);
        throw new Error(`Failed to ban user: ${error.message}`);
    }
};

// Export Query at the end if it's not used in this file
export { Query };
