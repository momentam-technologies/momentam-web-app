import { userDatabases, photographerDatabases, config, userClient, photographerClient } from './appwrite-config';
import { Query } from 'appwrite';

// Get dashboard stats
export const getDashboardStats = async () => {
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

        const activePhotographers = photographers.documents.filter(p => p.status === 'active');
        const pendingBookings = bookings.documents.filter(b => b.status === 'pending');
        const completedBookings = bookings.documents.filter(b => b.status === 'completed');
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + parseFloat(booking.price), 0);

        return {
            totalUsers: users.total,
            activePhotographers: activePhotographers.length,
            pendingBookings: pendingBookings.length,
            revenue: totalRevenue
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        throw error;
    }
};

// Get yearly stats for trend graph
export const getYearlyStats = async () => {
    try {
        const [bookings, users, photographers] = await Promise.all([
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                [Query.orderDesc('$createdAt')]
            ),
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.userCollectionId
            ),
            photographerDatabases.listDocuments(
                config.photographer.databaseId,
                config.photographer.userCollectionId
            )
        ]);

        return {
            yearlyData: processYearlyData(bookings.documents, users.documents, photographers.documents)
        };
    } catch (error) {
        console.error('Error getting yearly stats:', error);
        throw error;
    }
};

// Get active bookings
export const getActiveBookings = async () => {
    try {
        const bookings = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [
                Query.notEqual('status', 'completed'),
                Query.notEqual('status', 'cancelled'),
                Query.orderDesc('$createdAt')
            ]
        );
        return bookings.documents;
    } catch (error) {
        console.error('Error getting active bookings:', error);
        throw error;
    }
};

// Get latest users
export const getLatestUsers = async (limit = 5, offset = 0) => {
    try {
        const users = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.userCollectionId,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );
        return users.documents;
    } catch (error) {
        console.error('Error getting latest users:', error);
        throw error;
    }
};

// Get recent activities
export const getRecentActivities = async (limit = 5, offset = 0) => {
    try {
        const [bookings, userActivities] = await Promise.all([
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.notificationCollectionId,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            )
        ]);

        const activities = [
            ...bookings.documents.map(booking => ({
                type: 'booking',
                description: `New booking created`,
                time: booking.$createdAt,
                details: booking
            })),
            ...userActivities.documents
        ].sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(offset, offset + limit);

        return activities;
    } catch (error) {
        console.error('Error getting recent activities:', error);
        throw error;
    }
};

// Get recent transactions
export const getRecentTransactions = async (limit = 5) => {
    try {
        const completedBookings = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [
                Query.equal('status', 'completed'),
                Query.orderDesc('$createdAt'),
                Query.limit(limit)
            ]
        );

        return completedBookings.documents.map(booking => ({
            id: booking.$id,
            description: `Booking payment for ${booking.package}`,
            amount: parseFloat(booking.price),
            date: booking.$createdAt,
            category: 'Booking',
            status: 'Completed',
            userDetails: JSON.parse(booking.userDetails)
        }));
    } catch (error) {
        console.error('Error getting recent transactions:', error);
        throw error;
    }
};

// Get available photographers
export const getLivePhotographers = async () => {
    try {
        const photographers = await photographerDatabases.listDocuments(
            config.photographer.databaseId,
            config.photographer.livePhotographersCollectionId,
            [Query.equal('bookingStatus', 'available')]
        );
        return photographers.documents;
    } catch (error) {
        console.error('Error getting live photographers:', error);
        throw error;
    }
};

// Get user requests
export const getUserRequests = async () => {
    try {
        const requests = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [Query.equal('status', 'pending')]
        );
        return requests.documents;
    } catch (error) {
        console.error('Error getting user requests:', error);
        throw error;
    }
};

// Helper function to process yearly data
const processYearlyData = (bookings, users, photographers) => {
    const monthlyData = {};
    const now = new Date();
    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

    // Initialize monthly data
    for (let d = new Date(oneYearAgo); d <= now; d.setMonth(d.getMonth() + 1)) {
        const monthKey = d.toISOString().slice(0, 7);
        monthlyData[monthKey] = {
            name: new Date(d).toLocaleString('default', { month: 'short', year: 'numeric' }),
            users: 0,
            photographers: 0,
            bookings: 0,
            revenue: 0
        };
    }

    // Process bookings
    bookings.forEach(booking => {
        const monthKey = new Date(booking.$createdAt).toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].bookings++;
            monthlyData[monthKey].revenue += parseFloat(booking.price);
        }
    });

    // Process users and photographers
    users.forEach(user => {
        const monthKey = new Date(user.$createdAt).toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].users++;
        }
    });

    photographers.forEach(photographer => {
        const monthKey = new Date(photographer.$createdAt).toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].photographers++;
        }
    });

    return Object.values(monthlyData);
};

// Fix the subscribeToRealtimeUpdates function
export const subscribeToRealtimeUpdates = (callback) => {
    try {
        // Subscribe to user updates
        const userSubscription = userClient.subscribe(
            `databases.${config.user.databaseId}.collections.${config.user.userCollectionId}.documents`,
            response => {
                if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                    response.events.includes('databases.*.collections.*.documents.*.update') ||
                    response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    callback('user', response.payload);
                }
            }
        );

        // Subscribe to photographer updates
        const photographerSubscription = photographerClient.subscribe(
            `databases.${config.photographer.databaseId}.collections.${config.photographer.userCollectionId}.documents`,
            response => {
                if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                    response.events.includes('databases.*.collections.*.documents.*.update') ||
                    response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    callback('photographer', response.payload);
                }
            }
        );

        // Subscribe to booking updates
        const bookingSubscription = userClient.subscribe(
            `databases.${config.user.databaseId}.collections.${config.user.bookingsCollectionId}.documents`,
            response => {
                if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                    response.events.includes('databases.*.collections.*.documents.*.update') ||
                    response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    callback('booking', response.payload);
                }
            }
        );

        // Return a proper unsubscribe function that cleans up all subscriptions
        return () => {
            if (userSubscription) userSubscription();
            if (photographerSubscription) photographerSubscription();
            if (bookingSubscription) bookingSubscription();
        };
    } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
        // Return a no-op function if subscriptions fail
        return () => {};
    }
};
