import { userDB, photographerDB, config } from './appwrite-config';
import { Query } from 'appwrite';

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
        let queries = [
            Query.limit(limit), 
            Query.offset(offset),
            Query.orderDesc('$createdAt')
        ];

        // Add filters if they exist
        if (filters.status) {
            queries.push(Query.equal('status', filters.status));
        }
        if (filters.search) {
            queries.push(Query.search('package', filters.search));
        }
        if (filters.dateRange) {
            queries.push(Query.greaterThan('date', filters.dateRange.start));
            queries.push(Query.lessThan('date', filters.dateRange.end));
        }

        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
            queries
        );

        // Enhance booking data with photographer and client details
        const enhancedBookings = await Promise.all(bookings.documents.map(async booking => {
            try {
                // Get photographer details with error handling
                let photographer;
                try {
                    photographer = await photographerDB.getDocument(
                        config.photographer.databaseId,
                        config.photographer.collections.users,
                        booking.photographerId
                    );
                } catch (error) {
                    // If photographer not found, use placeholder data
                    photographer = {
                        name: 'Deleted Photographer',
                        email: 'N/A',
                        phone: 'N/A',
                        avatar: null
                    };
                }

                // Parse client details with error handling
                let client;
                try {
                    client = JSON.parse(booking.userDetails);
                    // Handle avatar URL
                    if (client.avatar) {
                        // If it's a full URL, use it as is
                        if (client.avatar.startsWith('https://')) {
                            client.avatar = client.avatar;
                        } 
                        // If it's a Firebase path
                        else {
                            // Add the full Firebase storage URL with token
                            client.avatar = `https://firebasestorage.googleapis.com/v0/b/momentam-f9e3b.appspot.com/o/${encodeURIComponent(client.avatar)}?alt=media`;
                        }
                    } else {
                        client.avatar = '/default-avatar.png';
                    }
                } catch (error) {
                    console.error('Error parsing client details:', error);
                    client = {
                        name: 'Unknown Client',
                        email: 'N/A',
                        avatar: '/default-avatar.png'
                    };
                }

                // Get readable location if coordinates are provided
                let readableLocation = booking.location;
                if (booking.location && booking.location.includes(',')) {
                    readableLocation = await getReadableAddress(booking.location);
                }

                return {
                    ...booking,
                    photographer: {
                        name: photographer.name,
                        email: photographer.email,
                        phone: photographer.phone,
                        avatar: photographer.avatar
                    },
                    client,
                    location: readableLocation,
                    revenue: parseFloat(booking.price || 0),
                    photographerEarnings: parseFloat(booking.price || 0) * 0.8,
                    platformFee: parseFloat(booking.price || 0) * 0.2
                };
            } catch (error) {
                console.error('Error processing booking:', booking.$id, error);
                return {
                    ...booking,
                    photographer: {
                        name: 'Error Loading Photographer',
                        email: 'N/A',
                        phone: 'N/A',
                        avatar: null
                    },
                    client: {
                        name: 'Error Loading Client',
                        email: 'N/A',
                        avatar: null
                    },
                    location: booking.location,
                    revenue: 0,
                    photographerEarnings: 0,
                    platformFee: 0
                };
            }
        }));

        return {
            bookings: enhancedBookings,
            total: bookings.total
        };
    } catch (error) {
        console.error('Error getting bookings:', error);
        throw error;
    }
};

// Get booking statistics
export const getBookingStats = async () => {
    try {
        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings
        );

        const stats = {
            total: bookings.total,
            pending: bookings.documents.filter(b => b.status === 'pending').length,
            active: bookings.documents.filter(b => b.status === 'active').length,
            completed: bookings.documents.filter(b => b.status === 'completed').length,
            cancelled: bookings.documents.filter(b => b.status === 'cancelled').length,
            totalRevenue: bookings.documents
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + parseFloat(b.price || 0), 0),
            platformRevenue: bookings.documents
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (parseFloat(b.price || 0) * 0.2), 0),
            photographerEarnings: bookings.documents
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (parseFloat(b.price || 0) * 0.8), 0)
        };

        return stats;
    } catch (error) {
        console.error('Error getting booking stats:', error);
        throw error;
    }
};

// Get monthly booking trends
export const getBookingTrends = async () => {
    try {
        // Get current date and date 12 months ago
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 11); // Go back 11 months for a total of 12 months

        const bookings = await userDB.listDocuments(
            config.user.databaseId,
            config.user.collections.bookings,
            [
                Query.greaterThan('$createdAt', startDate.toISOString()),
                Query.lessThan('$createdAt', endDate.toISOString())
            ]
        );

        // Initialize all 12 months with zero values
        const monthlyData = {};
        for (let i = 0; i < 12; i++) {
            const date = new Date(endDate);
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().slice(0, 7); // YYYY-MM format
            monthlyData[month] = {
                total: 0,
                completed: 0,
                revenue: 0,
                platformFee: 0
            };
        }

        // Process bookings
        bookings.documents.forEach(booking => {
            const month = new Date(booking.$createdAt).toISOString().slice(0, 7);
            if (monthlyData[month]) {
                monthlyData[month].total++;
                if (booking.status === 'completed') {
                    monthlyData[month].completed++;
                    monthlyData[month].revenue += parseFloat(booking.price || 0);
                    monthlyData[month].platformFee += parseFloat(booking.price || 0) * 0.2;
                }
            }
        });

        // Convert to array and sort by date
        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                ...data
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error('Error getting booking trends:', error);
        throw error;
    }
};
