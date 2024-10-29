import { userDB, photographerDB, config, userClient, photographerClient } from './appwrite-config';
import { Query } from 'appwrite';
import { getCachedData, setCachedData } from './cache';
import axios from 'axios';

// Update the calculatePercentageChange function to handle launch scenarios better
const calculatePercentageChange = (oldValue, newValue) => {
    // If both values are zero, there's no change
    if (oldValue === 0 && newValue === 0) return 0;
    
    // If we're just starting (oldValue is 0), we should show this as new growth
    if (oldValue === 0 && newValue > 0) return 100;
    
    // If we had value before but now zero, it's a 100% decrease
    if (oldValue > 0 && newValue === 0) return -100;
    
    // For normal cases, calculate the percentage change
    return Math.round(((newValue - oldValue) / oldValue) * 100);
};

// Fetch dashboard stats
export const getDashboardStats = async () => {
    const cacheKey = 'dashboardStats';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
        // Get current month's data - users are in user database, photographers in photographer database
        const [users, photographers, bookings] = await Promise.all([
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.users  // This collection only contains clients
            ),
            photographerDB.listDocuments(
                config.photographer.databaseId,
                config.photographer.collections.users  // This collection only contains photographers
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings
            )
        ]);

        // Calculate current values
        const totalUsers = users.total || 0;  // Already represents only clients since they're in the user database
        const totalPhotographers = photographers.total || 0;  // Photographers from photographer database
        const totalBookings = bookings.total || 0;
        const completedBookings = bookings.documents.filter(b => b.status === 'completed');
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + parseFloat(booking.price || 0), 0);

        // Get previous month's data
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const previousMonthStart = previousMonth.toISOString();

        const [prevUsers, prevPhotographers, prevBookings] = await Promise.all([
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.users,
                [Query.lessThan('$createdAt', previousMonthStart)]
            ),
            photographerDB.listDocuments(
                config.photographer.databaseId,
                config.photographer.collections.users,
                [Query.lessThan('$createdAt', previousMonthStart)]
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings,
                [Query.lessThan('$createdAt', previousMonthStart)]
            )
        ]);

        // Calculate previous month's values
        const prevTotalUsers = prevUsers.total || 0;
        const prevTotalPhotographers = prevPhotographers.total || 0;
        const prevTotalBookings = prevBookings.total || 0;
        const prevCompletedBookings = prevBookings.documents.filter(b => b.status === 'completed');
        const prevRevenue = prevCompletedBookings.reduce((sum, booking) => sum + parseFloat(booking.price || 0), 0);

        const stats = {
            totalUsers,  // Only clients from user database
            totalPhotographers,  // Only photographers from photographer database
            totalBookings,
            revenue: totalRevenue,
            changes: {
                totalUsers: calculatePercentageChange(prevTotalUsers, totalUsers),
                totalPhotographers: calculatePercentageChange(prevTotalPhotographers, totalPhotographers),
                totalBookings: calculatePercentageChange(prevTotalBookings, totalBookings),
                revenue: calculatePercentageChange(prevRevenue, totalRevenue)
            }
        };

        setCachedData(cacheKey, stats);
        return stats;
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        throw error;
    }
};

// Fetch yearly stats for trend graph
export const getYearlyStats = async () => {
    try {
        // Get data for the last 12 months
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 11); // Go back 11 months for a total of 12 months

        // Fetch data for the current period
        const [bookings, users, photographers] = await Promise.all([
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings,
                [
                    Query.greaterThan('$createdAt', startDate.toISOString()),
                    Query.orderDesc('$createdAt')
                ]
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.users,
                [
                    Query.greaterThan('$createdAt', startDate.toISOString()),
                    Query.orderDesc('$createdAt')
                ]
            ),
            photographerDB.listDocuments(
                config.photographer.databaseId,
                config.photographer.collections.users,
                [
                    Query.greaterThan('$createdAt', startDate.toISOString()),
                    Query.orderDesc('$createdAt')
                ]
            )
        ]);

        // Initialize monthly data structure
        const monthlyData = {};
        for (let i = 0; i <= 11; i++) {
            const date = new Date(endDate);
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
            monthlyData[monthKey] = {
                name: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                users: 0,
                photographers: 0,
                bookings: 0,
                revenue: 0
            };
        }

        // Process users
        users.documents.forEach(user => {
            const monthKey = new Date(user.$createdAt).toISOString().slice(0, 7);
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].users++;
            }
        });

        // Process photographers
        photographers.documents.forEach(photographer => {
            const monthKey = new Date(photographer.$createdAt).toISOString().slice(0, 7);
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].photographers++;
            }
        });

        // Process bookings and revenue
        bookings.documents.forEach(booking => {
            const monthKey = new Date(booking.$createdAt).toISOString().slice(0, 7);
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].bookings++;
                if (booking.status === 'completed' && booking.price) {
                    monthlyData[monthKey].revenue += parseFloat(booking.price);
                }
            }
        });

        // Convert to array and sort by date
        const yearlyData = Object.values(monthlyData).reverse();

        // Calculate cumulative totals
        let runningTotals = {
            users: 0,
            photographers: 0,
            bookings: 0,
            revenue: 0
        };

        yearlyData.forEach(month => {
            runningTotals.users += month.users;
            runningTotals.photographers += month.photographers;
            runningTotals.bookings += month.bookings;
            runningTotals.revenue += month.revenue;

            // Update the month's values to show cumulative totals
            month.users = runningTotals.users;
            month.photographers = runningTotals.photographers;
            month.bookings = runningTotals.bookings;
            month.revenue = runningTotals.revenue;
        });

        return {
            yearlyData,
            yearOverYearChanges: {
                totalUsers: calculatePercentageChange(yearlyData[11]?.users || 0, yearlyData[0]?.users || 0),
                totalPhotographers: calculatePercentageChange(yearlyData[11]?.photographers || 0, yearlyData[0]?.photographers || 0),
                totalBookings: calculatePercentageChange(yearlyData[11]?.bookings || 0, yearlyData[0]?.bookings || 0),
                revenue: calculatePercentageChange(yearlyData[11]?.revenue || 0, yearlyData[0]?.revenue || 0)
            }
        };
    } catch (error) {
        console.error('Error getting yearly stats:', error);
        throw error;
    }
};

// Fetch active bookings
export const getActiveBookings = async () => {
    try {
        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
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

// Fetch latest users
export const getLatestUsers = async (limit = 5, offset = 0) => {
    try {
        const users = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.users,
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

// Fetch recent activities
export const getRecentActivities = async (limit = 5, offset = 0) => {
    try {
        const [bookings, userActivities] = await Promise.all([
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.notifications,
                [Query.orderDesc('$createdAt'), Query.limit(limit)]
            )
        ]);

        // Transform booking activities
        const bookingActivities = bookings.documents.map(booking => {
            const userDetails = JSON.parse(booking.userDetails);
            let description;
            
            switch(booking.status) {
                case 'pending':
                    description = `${userDetails.name} requested a ${booking.package}`;
                    break;
                case 'accepted':
                    description = `${userDetails.name}'s ${booking.package} was accepted`;
                    break;
                case 'completed':
                    description = `${userDetails.name}'s ${booking.package} was completed`;
                    break;
                case 'cancelled':
                    description = `${userDetails.name} cancelled their ${booking.package}`;
                    break;
                default:
                    description = `${userDetails.name} made a ${booking.package} booking`;
            }

            return {
                type: 'booking',
                description,
                time: booking.$createdAt,
                details: booking,
                status: booking.status
            };
        });

        // Transform notification activities
        const notificationActivities = userActivities.documents.map(activity => {
            let description = activity.message || activity.description;
            
            // Replace personal pronouns with third-person references
            description = description
                .replace(/Your booking/g, 'Booking')
                .replace(/your booking/g, 'booking')
                .replace(/You have/g, 'User has')
                .replace(/your/g, 'user\'s')
                .replace(/You/g, 'User')
                .replace(/has been/g, 'was');

            // If we have user details, use them
            if (activity.userDetails) {
                const userDetails = typeof activity.userDetails === 'string' 
                    ? JSON.parse(activity.userDetails) 
                    : activity.userDetails;
                description = description.replace('User', userDetails.name);
            }

            return {
                type: activity.type || 'notification',
                description,
                time: activity.$createdAt,
                details: activity,
                status: activity.status || 'info'
            };
        });

        // Combine and sort activities
        const allActivities = [...bookingActivities, ...notificationActivities]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(offset, offset + limit);

        return allActivities;
    } catch (error) {
        console.error('Error getting recent activities:', error);
        throw error;
    }
};

// Fetch recent transactions
export const getRecentTransactions = async (limit = 5) => {
    try {
        const completedBookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
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

// Fetch available photographers
export const getLivePhotographers = async () => {
    try {
        const photographers = await photographerDB.listDocuments(
            config.photographer.databaseId,
            config.photographer.collections.livePhotographers,
            [Query.equal('bookingStatus', 'available')]
        );
        return photographers.documents;
    } catch (error) {
        console.error('Error getting live photographers:', error);
        throw error;
    }
};

// Fetch user requests
export const getUserRequests = async () => {
    try {
        const requests = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
            [Query.equal('status', 'pending')]
        );
        
        // Transform the data to match what PhotographerMap expects
        return requests.documents.map(request => {
            const userDetails = JSON.parse(request.userDetails);
            const [lat, lng] = request.location.split(',').map(Number);
            
            return {
                id: request.$id,
                name: userDetails.name,
                lat: lat,
                lng: lng,
                requestType: request.package,
                timestamp: request.$createdAt,
                eventLocation: request.location, // You might want to use getReadableAddress here
                status: request.status,
                userDetails: userDetails
            };
        });
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
            `databases.${config.user.databaseId}.collections.${config.user.collections.users}.documents`,
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
            `databases.${config.photographer.databaseId}.collections.${config.photographer.collections.users}.documents`,
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
            `databases.${config.user.databaseId}.collections.${config.user.collections.bookings}.documents`,
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

// Ensure this function is defined
export const getReadableAddress = async (location) => {
    try {
        const [latitude, longitude] = location.split(',').map(Number);
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCPcM29FmmoFnCSPkwPKZ51Qg3bJf90kYw`);
        
        if (response.data.results.length > 0) {
            return response.data.results[0].formatted_address;
        }
        return 'Address not found';
    } catch (error) {
        console.error('Error fetching address:', error);
        return 'Error fetching address';
    }
};
