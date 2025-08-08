import { authAPI } from './api';

const logError = (functionName, error) => {
    console.error(`Error in ${functionName}:`, error);
    console.error('Error details:', JSON.stringify(error, null, 2));
};

export const signUpUser = async (email, password, name) => {
    try {
        // For admin portal, we'll use a different approach
        // This could be used for creating additional admin users
        console.log('Admin signup not implemented yet');
        return { success: false, error: 'Admin signup not implemented' };
    } catch (error) {
        logError('signUpUser', error);
        return { success: false, error: error.message };
    }
};

export const loginUser = async (email, password) => {
    try {
        // Use our custom backend authentication
        const response = await authAPI.login(email, password);
        
        if (response.success) {
            // Store the token and user info in localStorage
            localStorage.setItem('admin_token', response.token);
            localStorage.setItem('admin_user', JSON.stringify(response.admin));
            
            return { success: true, user: response.admin };
        } else {
            return { success: false, error: response.error || 'Login failed' };
        }
    } catch (error) {
        logError('loginUser', error);
        return { success: false, error: error.message };
    }
};

export const logoutUser = async () => {
    try {
        // Clear local storage
        authAPI.logout();
        return { success: true };
    } catch (error) {
        logError('logoutUser', error);
        return { success: false, error: error.message };
    }
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('admin_token');
    return !!token;
};

export const getCurrentUser = () => {
    try {
        const userString = localStorage.getItem('admin_user');
        if (!userString) return null;
        const user = JSON.parse(userString);
        console.log('Current admin user:', user);
        return user;
    } catch (error) {
        logError('getCurrentUser', error);
        return null;
    }
};

export const getUserId = () => {
    try {
        const user = getCurrentUser();
        if (!user) return null;
        console.log('Admin ID:', user.id);
        return user.id;
    } catch (error) {
        logError('getUserId', error);
        return null;
    }
};

// New function to validate token with backend
export const validateToken = async () => {
    try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            return { valid: false };
        }

        const response = await authAPI.getCurrentUser();
        return { valid: true, user: response.admin };
    } catch (error) {
        logError('validateToken', error);
        // If token is invalid, clear it
        authAPI.logout();
        return { valid: false };
    }
};
