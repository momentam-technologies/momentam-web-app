import { Client, Account } from 'appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('671a8623003471deefdd');

const account = new Account(client);

const logError = (functionName, error) => {
    console.error(`Error in ${functionName}:`, error);
    console.error('Error details:', JSON.stringify(error, null, 2));
};

export const loginUser = async (email, password) => {
    try {
        // Attempt to create a session
        const session = await account.createSession(email, password);
        console.log('Session created:', session);

        // Attempt to get user details
        const user = await account.get();
        console.log('User details:', user);

        // Store the session and user info in localStorage
        localStorage.setItem('appwrite_session', JSON.stringify(session));
        localStorage.setItem('user', JSON.stringify(user));

        return { success: true, user };
    } catch (error) {
        logError('loginUser', error);
        return { success: false, error: error.message };
    }
};

export const logoutUser = async () => {
    try {
        await account.deleteSession('current');
        localStorage.removeItem('appwrite_session');
        localStorage.removeItem('user');
        return { success: true };
    } catch (error) {
        logError('logoutUser', error);
        return { success: false, error: error.message };
    }
};

export const isAuthenticated = () => {
    const session = localStorage.getItem('appwrite_session');
    return !!session;
};

export const getCurrentUser = () => {
    try {
        const userString = localStorage.getItem('user');
        if (!userString) return null;
        const user = JSON.parse(userString);
        console.log('Current user:', user);
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
        console.log('User ID:', user.$id);
        return user.$id;
    } catch (error) {
        logError('getUserId', error);
        return null;
    }
};
