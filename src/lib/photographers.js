import { api } from './api';

// Get all photographers with pagination and filters
export const getPhotographers = async (limit = 10, offset = 0, filters = {}) => {
    try {
        console.log('📸 FRONTEND: Fetching photographers from backend');
        
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });

        // Add filters to params
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.dateRange) params.append('dateRange', JSON.stringify(filters.dateRange));

        const response = await api.get(`/photographers?${params.toString()}`);
        
        console.log('✅ FRONTEND: Photographers received:', response.photographers.length);
        return response;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting photographers:', error);
        throw error;
    }
};

// Get detailed photographer information
export const getPhotographerDetails = async (photographerId) => {
    try {
        console.log('📸 FRONTEND: Fetching photographer details from backend');
        const photographerDetails = await api.get(`/photographers/${photographerId}`);
        
        console.log('✅ FRONTEND: Photographer details received');
        return photographerDetails;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting photographer details:', error);
        throw error;
    }
};

// Create new photographer
export const createPhotographer = async (photographerData) => {
    try {
        console.log('➕ FRONTEND: Creating photographer via backend');
        const photographer = await api.post('/photographers', photographerData);
        
        console.log('✅ FRONTEND: Photographer created successfully');
        return photographer;
    } catch (error) {
        console.error('❌ FRONTEND: Error creating photographer:', error);
        throw error;
    }
};

// Update photographer
export const updatePhotographer = async (photographerId, photographerData) => {
    try {
        console.log('✏️ FRONTEND: Updating photographer via backend');
        const updatedPhotographer = await api.put(`/photographers/${photographerId}`, photographerData);
        
        console.log('✅ FRONTEND: Photographer updated successfully');
        return updatedPhotographer;
    } catch (error) {
        console.error('❌ FRONTEND: Error updating photographer:', error);
        throw error;
    }
};

// Delete photographer
export const deletePhotographer = async (photographerId) => {
    try {
        console.log('🗑️ FRONTEND: Deleting photographer via backend');
        const result = await api.delete(`/photographers/${photographerId}`);
        
        console.log('✅ FRONTEND: Photographer deleted successfully');
        return result;
    } catch (error) {
        console.error('❌ FRONTEND: Error deleting photographer:', error);
        throw error;
    }
};

// Verify photographer
export const verifyPhotographer = async (photographerId) => {
    try {
        console.log('✅ FRONTEND: Verifying photographer via backend');
        const result = await api.patch(`/photographers/${photographerId}/verify`);
        
        console.log('✅ FRONTEND: Photographer verified successfully');
        return result;
    } catch (error) {
        console.error('❌ FRONTEND: Error verifying photographer:', error);
        throw error;
    }
};

// Get photographer bookings
export const getPhotographerBookings = async (photographerId) => {
    try {
        console.log('📋 FRONTEND: Fetching photographer bookings from backend');
        const bookings = await api.get(`/photographers/${photographerId}/bookings`);
        
        console.log('✅ FRONTEND: Photographer bookings received:', bookings.length);
        return bookings;
    } catch (error) {
        console.error('❌ FRONTEND: Error getting photographer bookings:', error);
        throw error;
    }
};
