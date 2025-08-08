import { api } from './api';
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
        console.log('📊 FRONTEND: Fetching dashboard stats from backend');
        const stats = await api.get('/dashboard/stats');
        
        console.log('✅ FRONTEND: Dashboard stats received:', stats);
        setCachedData(cacheKey, stats);
        return stats;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting dashboard stats:', error);
        throw error;
    }
};

// Fetch yearly stats for trend graph
export const getYearlyStats = async () => {
    try {
        console.log('📈 FRONTEND: Fetching yearly stats from backend');
        const result = await api.get('/dashboard/yearly-stats');
        
        console.log('✅ FRONTEND: Yearly stats received');
        return result;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting yearly stats:', error);
        throw error;
    }
};

// Fetch active bookings
export const getActiveBookings = async () => {
    try {
        console.log('📋 FRONTEND: Fetching active bookings from backend');
        const bookings = await api.get('/dashboard/active-bookings');
        
        console.log('✅ FRONTEND: Active bookings received:', bookings.length);
        return bookings;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting active bookings:', error);
        throw error;
    }
};

// Fetch latest users
export const getLatestUsers = async (limit = 5, offset = 0) => {
    try {
        console.log('👥 FRONTEND: Fetching latest users from backend');
        const users = await api.get(`/dashboard/latest-users?limit=${limit}&offset=${offset}`);
        
        console.log('✅ FRONTEND: Latest users received:', users.length);
        return users;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting latest users:', error);
        throw error;
    }
};

// Fetch recent activities
export const getRecentActivities = async (limit = 5, offset = 0) => {
    try {
        console.log('📝 FRONTEND: Fetching recent activities from backend');
        const activities = await api.get(`/dashboard/recent-activities?limit=${limit}&offset=${offset}`);
        
        console.log('✅ FRONTEND: Recent activities received:', activities.length);
        return activities;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting recent activities:', error);
        throw error;
    }
};

// Fetch recent transactions
export const getRecentTransactions = async (limit = 5) => {
    try {
        console.log('💰 FRONTEND: Fetching recent transactions from backend');
        const transactions = await api.get(`/dashboard/recent-transactions?limit=${limit}`);
        
        console.log('✅ FRONTEND: Recent transactions received:', transactions.length);
        return transactions;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting recent transactions:', error);
        throw error;
    }
};

// Fetch available photographers
export const getLivePhotographers = async () => {
    try {
        console.log('📸 FRONTEND: Fetching live photographers from backend');
        const photographers = await api.get('/dashboard/live-photographers');
        
        console.log('✅ FRONTEND: Live photographers received:', photographers.length);
        return photographers;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting live photographers:', error);
        throw error;
    }
};

// Fetch user requests
export const getUserRequests = async () => {
    try {
        console.log('📋 FRONTEND: Fetching user requests from backend');
        const requests = await api.get('/dashboard/user-requests');
        
        console.log('✅ FRONTEND: User requests received:', requests.length);
        return requests;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting user requests:', error);
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
        const monthKey = new Date(booking.createdAt).toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].bookings++;
            monthlyData[monthKey].revenue += parseFloat(booking.price);
        }
    });

    // Process users and photographers
    users.forEach(user => {
        const monthKey = new Date(user.createdAt).toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].users++;
        }
    });

    photographers.forEach(photographer => {
        const monthKey = new Date(photographer.createdAt).toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].photographers++;
        }
    });

    return Object.values(monthlyData);
};

// Realtime updates - for now, we'll use polling instead of WebSocket
export const subscribeToRealtimeUpdates = (callback) => {
    console.log('🔄 FRONTEND: Setting up polling for realtime updates');
    
    // Set up polling every 30 seconds
    const interval = setInterval(async () => {
        try {
            // Fetch latest data
            const [stats, bookings, users] = await Promise.all([
                getDashboardStats(),
                getActiveBookings(),
                getLatestUsers(5)
            ]);
            
            // Call the callback with updated data
            callback('update', { stats, bookings, users });
        } catch (error) {
            console.error('❌ FRONTEND: Error in polling update:', error);
        }
    }, 30000); // 30 seconds

    // Return unsubscribe function
    return () => {
        console.log('🔄 FRONTEND: Stopping polling updates');
        clearInterval(interval);
    };
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
