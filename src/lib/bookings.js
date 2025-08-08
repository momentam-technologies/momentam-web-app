import { api } from './api';

// Function to get readable address from coordinates
const getReadableAddress = async (coordinates) => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].formatted_address;
        }
        return coordinates;
    } catch (error) {
        console.error('Error getting readable address:', error);
        return coordinates;
    }
};

// Get all bookings with pagination and filters
export const getBookings = async (limit = 10, offset = 0, filters = {}) => {
    try {
        console.log('📋 FRONTEND: Fetching bookings from backend');
        
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });

        // Add filters to params
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.dateRange) params.append('dateRange', JSON.stringify(filters.dateRange));

        const response = await api.get(`/bookings?${params.toString()}`);
        
        console.log('✅ FRONTEND: Bookings received:', response.bookings.length);
        return response;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting bookings:', error);
        throw error;
    }
};

// Get booking statistics
export const getBookingStats = async () => {
    try {
        console.log('📊 FRONTEND: Fetching booking statistics from backend');
        const stats = await api.get('/bookings/stats');
        
        console.log('✅ FRONTEND: Booking statistics received');
        return stats;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting booking stats:', error);
        throw error;
    }
};

// Get monthly booking trends
export const getBookingTrends = async () => {
    try {
        console.log('📈 FRONTEND: Fetching booking trends from backend');
        const trends = await api.get('/bookings/trends');
        
        console.log('✅ FRONTEND: Booking trends received');
        return trends;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting booking trends:', error);
        throw error;
    }
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
    try {
        console.log('📋 FRONTEND: Fetching booking by ID from backend');
        const booking = await api.get(`/bookings/${bookingId}`);
        
        console.log('✅ FRONTEND: Booking details received');
        return booking;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting booking by ID:', error);
        throw error;
    }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status) => {
    try {
        console.log('✏️ FRONTEND: Updating booking status via backend');
        const result = await api.put(`/bookings/${bookingId}/status`, { status });
        
        console.log('✅ FRONTEND: Booking status updated successfully');
        return result;
    } catch (error) {
        console.error('❌ FRONTEND: Error updating booking status:', error);
        throw error;
    }
};

// Delete booking
export const deleteBooking = async (bookingId) => {
    try {
        console.log('🗑️ FRONTEND: Deleting booking via backend');
        const result = await api.delete(`/bookings/${bookingId}`);
        
        console.log('✅ FRONTEND: Booking deleted successfully');
        return result;
    } catch (error) {
        console.error('❌ FRONTEND: Error deleting booking:', error);
        throw error;
    }
};
