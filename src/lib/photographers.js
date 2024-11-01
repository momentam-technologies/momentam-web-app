import { photographerDB, userDB, config } from './appwrite-config';
import { Query, ID } from 'appwrite';

// Get all photographers with pagination and filters
export const getPhotographers = async (limit = 10, offset = 0, filters = {}) => {
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

        const photographers = await photographerDB.listDocuments(
            config.photographer.databaseId,
            config.photographer.collections.users,
            queries
        );

        // Get bookings for all photographers
        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings
        );

        // Enhance photographer data with additional information
        const enhancedPhotographers = photographers.documents.map(photographer => {
            // Get photographer's bookings
            const photographerBookings = bookings.documents.filter(b => b.photographerId === photographer.$id);
            const completedBookings = photographerBookings.filter(b => b.status === 'completed');
            
            // Calculate earnings
            const totalEarnings = completedBookings.reduce((sum, booking) => {
                return sum + parseFloat(booking.price || 0);
            }, 0);

            // Calculate rating
            const ratings = completedBookings.map(b => b.rating || 0);
            const averageRating = ratings.length > 0 
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
                : 0;

            return {
                ...photographer,
                totalBookings: photographerBookings.length,
                completedBookings: completedBookings.length,
                pendingBookings: photographerBookings.filter(b => b.status === 'pending').length,
                totalEarnings,
                rating: averageRating,
                lastBooking: photographerBookings[0]?.$createdAt || null
            };
        });

        return {
            photographers: enhancedPhotographers,
            total: photographers.total
        };
    } catch (error) {
        console.error('Error getting photographers:', error);
        throw error;
    }
};

// Get detailed photographer information
export const getPhotographerDetails = async (photographerId) => {
    try {
        const [photographer, bookings, uploadedPhotos] = await Promise.all([
            photographerDB.getDocument(
                config.photographer.databaseId,
                config.photographer.collections.users,
                photographerId
            ),
            userDB.listDocuments(
                config.user.databaseId,
                config.user.collections.bookings,
                [Query.equal('photographerId', photographerId)]
            ),
            photographerDB.listDocuments(
                config.photographer.databaseId,
                config.photographer.collections.uploadedPhotos,
                [Query.equal('accountId', photographerId)]
            )
        ]);

        // Calculate statistics
        const completedBookings = bookings.documents.filter(b => b.status === 'completed');
        const totalEarnings = completedBookings.reduce((sum, booking) => {
            return sum + parseFloat(booking.price || 0);
        }, 0);

        // Calculate rating
        const ratings = completedBookings.map(b => b.rating || 0);
        const averageRating = ratings.length > 0 
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
            : 0;

        return {
            ...photographer,
            bookings: bookings.documents,
            uploadedPhotos: uploadedPhotos.documents,
            stats: {
                totalBookings: bookings.total,
                completedBookings: completedBookings.length,
                pendingBookings: bookings.documents.filter(b => b.status === 'pending').length,
                totalPhotos: uploadedPhotos.total,
                totalEarnings,
                rating: averageRating
            }
        };
    } catch (error) {
        console.error('Error getting photographer details:', error);
        throw error;
    }
};

// Update photographer
export const updatePhotographer = async (photographerId, photographerData) => {
    try {
        const updatedPhotographer = await photographerDB.updateDocument(
            config.photographer.databaseId,
            config.photographer.collections.users,
            photographerId,
            {
                name: photographerData.name,
                email: photographerData.email,
                phone: photographerData.phone || '',
                avatar: photographerData.avatar || '',
                bio: photographerData.bio || '',
                location: photographerData.location || ''
            }
        );

        return updatedPhotographer;
    } catch (error) {
        console.error('Error updating photographer:', error);
        throw error;
    }
};

// Delete photographer
export const deletePhotographer = async (photographerId) => {
    try {
        // Delete photographer's live status
        const liveStatus = await photographerDB.listDocuments(
            config.photographer.databaseId,
            config.photographer.collections.livePhotographers,
            [Query.equal('accountId', photographerId)]
        );

        await Promise.all(liveStatus.documents.map(status => 
            photographerDB.deleteDocument(
                config.photographer.databaseId,
                config.photographer.collections.livePhotographers,
                status.$id
            )
        ));

        // Delete photographer's uploaded photos
        const uploadedPhotos = await photographerDB.listDocuments(
            config.photographer.databaseId,
            config.photographer.collections.uploadedPhotos,
            [Query.equal('accountId', photographerId)]
        );

        await Promise.all(uploadedPhotos.documents.map(photo => 
            photographerDB.deleteDocument(
                config.photographer.databaseId,
                config.photographer.collections.uploadedPhotos,
                photo.$id
            )
        ));

        // Finally delete the photographer
        await photographerDB.deleteDocument(
            config.photographer.databaseId,
            config.photographer.collections.users,
            photographerId
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting photographer:', error);
        throw error;
    }
};

// Verify photographer
export const verifyPhotographer = async (photographerId) => {
    try {
        const updatedPhotographer = await photographerDB.updateDocument(
            config.photographer.databaseId,
            config.photographer.collections.users,
            photographerId,
            {
                verified: true,
                verifiedAt: new Date().toISOString()
            }
        );

        return updatedPhotographer;
    } catch (error) {
        console.error('Error verifying photographer:', error);
        throw error;
    }
};
