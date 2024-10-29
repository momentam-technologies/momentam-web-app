import { userDB, photographerDB, config } from './appwrite-config';
import { Query, ID } from 'appwrite';

// Get all users with pagination and filters
export const getUsers = async (limit = 10, offset = 0, filters = {}) => {
    try {
        let queries = [Query.limit(limit), Query.offset(offset)];

        // Add filters if they exist
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

        // Fetch only users (clients), not photographers
        const users = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.users,
            queries
        );

        // Enhance user data with additional information
        const enhancedUsers = await Promise.all(users.documents.map(async user => {
            // Get user's bookings
            const bookings = await userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings,
                [Query.equal('userId', user.$id)]
            );

            // Calculate user statistics
            const completedBookings = bookings.documents.filter(b => b.status === 'completed');
            const totalSpent = completedBookings.reduce((sum, booking) => sum + parseFloat(booking.price || 0), 0);

            return {
                ...user,
                totalBookings: bookings.total,
                completedBookings: completedBookings.length,
                totalSpent,
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

// Get detailed user information
export const getUserDetails = async (userId) => {
    try {
        const [user, bookings, activities] = await Promise.all([
            userDB.getDocument(
                config.user.databaseId,
                config.user.collections.users,
                userId
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings,
                [Query.equal('userId', userId)]
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.notifications,
                [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
            )
        ]);

        // Calculate statistics
        const completedBookings = bookings.documents.filter(b => b.status === 'completed');
        const cancelledBookings = bookings.documents.filter(b => b.status === 'cancelled');
        const totalSpent = completedBookings.reduce((sum, booking) => sum + parseFloat(booking.price || 0), 0);

        return {
            ...user,
            totalBookings: bookings.total,
            completedBookings: completedBookings.length,
            cancelledBookings: cancelledBookings.length,
            totalSpent,
            recentActivities: activities.documents,
            lastLogin: user.lastLogin || user.$updatedAt,
            bookings: bookings.documents
        };
    } catch (error) {
        console.error('Error getting user details:', error);
        throw error;
    }
};

// Create new user
export const createUser = async (userData) => {
    try {
        const user = await userDB.createDocument(
            config.user.databaseId,
            config.user.collections.users,
            ID.unique(),
            {
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                avatar: userData.avatar || '',
                registrationComplete: true,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                recentLocations: JSON.stringify([])
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
        // Only update fields that exist in the user collection
        const updatedUser = await userDB.updateDocument(
            config.user.databaseId,
            config.user.collections.users,
            userId,
            {
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                avatar: userData.avatar || '',
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
        // Make sure we're using just the ID string
        const id = typeof userId === 'object' ? userId.$id : userId;

        // First, get all user's bookings
        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
            [Query.equal('userId', id)]
        );

        // Delete all bookings
        await Promise.all(bookings.documents.map(booking => 
            userDB.deleteDocument(
                config.user.databaseId,
                config.user.collections.bookings,
                booking.$id
            )
        ));

        // Delete user's notifications if they exist
        try {
            const notifications = await userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.notifications,
                [Query.equal('userId', id)]
            );

            await Promise.all(notifications.documents.map(notification => 
                userDB.deleteDocument(
                    config.user.databaseId,
                    config.user.collections.notifications,
                    notification.$id
                )
            ));
        } catch (error) {
            console.log('No notifications to delete');
        }

        // Finally delete the user
        await userDB.deleteDocument(
            config.user.databaseId,
            config.user.collections.users,
            id
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

export const getUserBookings = async (userId) => {
    try {
        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
            [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
        );

        return bookings.documents;
    } catch (error) {
        console.error('Error getting user bookings:', error);
        throw error;
    }
};

export const getUserActivities = async (userId) => {
    try {
        const activities = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.notifications,
            [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
        );

        return activities.documents;
    } catch (error) {
        console.error('Error getting user activities:', error);
        throw error;
    }
};
