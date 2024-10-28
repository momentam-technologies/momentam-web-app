import { userDatabases, photographerDatabases, config } from './appwrite-config';
import { Query, ID } from 'appwrite';

// Get all users with pagination and filters
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
            queries.push(Query.greaterThan('$createdAt', filters.dateRange.start));
            queries.push(Query.lessThan('$createdAt', filters.dateRange.end));
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

// Get user details including bookings and activities
export const getUserDetails = async (userId) => {
    try {
        const [user, bookings, activities] = await Promise.all([
            userDatabases.getDocument(
                config.user.databaseId,
                config.user.userCollectionId,
                userId
            ),
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                [Query.equal('userId', userId)]
            ),
            userDatabases.listDocuments(
                config.user.databaseId,
                config.user.notificationCollectionId,
                [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
            )
        ]);

        const completedBookings = bookings.documents.filter(b => b.status === 'completed');
        const cancelledBookings = bookings.documents.filter(b => b.status === 'cancelled');

        return {
            ...user,
            totalBookings: bookings.total,
            completedBookings: completedBookings.length,
            cancelledBookings: cancelledBookings.length,
            recentActivities: activities.documents,
            lastLogin: user.lastLogin || user.$updatedAt
        };
    } catch (error) {
        console.error('Error getting user details:', error);
        throw error;
    }
};

// Create new user
export const createUser = async (userData) => {
    try {
        const user = await userDatabases.createDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            ID.unique(),
            {
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                avatar: userData.avatar || '',
                status: 'active',
                type: 'user',
                registrationComplete: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            }
        );

        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Update user
export const updateUser = async (userId, userData) => {
    try {
        const updatedUser = await userDatabases.updateDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            userId,
            {
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                avatar: userData.avatar || '',
                status: userData.status || 'active',
                lastUpdated: new Date().toISOString()
            }
        );

        return updatedUser;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// Delete user
export const deleteUser = async (userId) => {
    try {
        // Delete user's bookings first
        const bookings = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [Query.equal('userId', userId)]
        );

        await Promise.all(bookings.documents.map(booking => 
            userDatabases.deleteDocument(
                config.user.databaseId,
                config.user.bookingsCollectionId,
                booking.$id
            )
        ));

        // Delete user
        await userDatabases.deleteDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            userId
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// Ban user
export const banUser = async (userId) => {
    try {
        const updatedUser = await userDatabases.updateDocument(
            config.user.databaseId,
            config.user.userCollectionId,
            userId,
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

// Unban user
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

// Get user bookings
export const getUserBookings = async (userId) => {
    try {
        const bookings = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.bookingsCollectionId,
            [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
        );

        return bookings.documents;
    } catch (error) {
        console.error('Error getting user bookings:', error);
        throw error;
    }
};

// Get user activities
export const getUserActivities = async (userId) => {
    try {
        const activities = await userDatabases.listDocuments(
            config.user.databaseId,
            config.user.notificationCollectionId,
            [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
        );

        return activities.documents;
    } catch (error) {
        console.error('Error getting user activities:', error);
        throw error;
    }
};

// ... other user management functions ...
