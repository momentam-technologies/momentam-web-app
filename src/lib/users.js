import { api } from './api';

// Get all users with pagination and filters
export const getUsers = async (limit = 10, offset = 0, filters = {}) => {
    try {
        console.log('👥 FRONTEND: Fetching users from backend');
        
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });

        // Add filters to params
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.dateRange) params.append('dateRange', JSON.stringify(filters.dateRange));

        const response = await api.get(`/users?${params.toString()}`);
        
        console.log('✅ FRONTEND: Users received:', response.users.length);
        return response;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting users:', error);
        throw error;
    }
};

// Get detailed user information
export const getUserDetails = async (userId) => {
    try {
        console.log('👤 FRONTEND: Fetching user details from backend');
        const userDetails = await api.get(`/users/${userId}`);
        
        console.log('✅ FRONTEND: User details received');
        return userDetails;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting user details:', error);
        throw error;
    }
};

// Create new user
export const createUser = async (userData) => {
    try {
        console.log('➕ FRONTEND: Creating user via backend');
        const user = await api.post('/users', userData);
        
        console.log('✅ FRONTEND: User created successfully');
        return user;
    } catch (error) {
        console.error('❌ FRONTEND: Error creating user:', error);
        throw error;
    }
};

// Update user
export const updateUser = async (userId, userData) => {
    try {
        console.log('✏️ FRONTEND: Updating user via backend');
        const updatedUser = await api.put(`/users/${userId}`, userData);
        
        console.log('✅ FRONTEND: User updated successfully');
        return updatedUser;
    } catch (error) {
        console.error('❌ FRONTEND: Error updating user:', error);
        throw error;
    }
};

// Delete user
export const deleteUser = async (userId) => {
    try {
        console.log('🗑️ FRONTEND: Deleting user via backend');
        const result = await api.delete(`/users/${userId}`);
        
        console.log('✅ FRONTEND: User deleted successfully');
        return result;
    } catch (error) {
        console.error('❌ FRONTEND: Error deleting user:', error);
        throw error;
    }
};

// Get user bookings
export const getUserBookings = async (userId) => {
    try {
        console.log('📋 FRONTEND: Fetching user bookings from backend');
        const bookings = await api.get(`/users/${userId}/bookings`);
        
        console.log('✅ FRONTEND: User bookings received:', bookings.length);
        return bookings;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting user bookings:', error);
        throw error;
    }
};

// Get user activities (placeholder - implement if needed)
export const getUserActivities = async (userId) => {
    try {
        console.log('📝 FRONTEND: Fetching user activities from backend');
        // For now, return empty array - implement when needed
        return [];
    } catch (error) {
        console.error('❌ FRONTEND: Error getting user activities:', error);
        throw error;
    }
};
