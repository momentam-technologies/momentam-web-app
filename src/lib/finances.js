import { userDB, config } from './appwrite-config';
import { Query } from 'appwrite';

// Fetch total revenue, profit, and other financial metrics
export const getFinancialMetrics = async () => {
  try {
    // Fetch completed bookings
    const bookings = await userDB.listDocuments(
      config.user.databaseId,
      config.user.collections.bookings,
      [Query.equal('status', 'completed')]
    );

    console.log('Completed bookings:', bookings.documents);

    const totalRevenue = bookings.documents.reduce((sum, booking) => sum + parseFloat(booking.price || 0), 0);
    const totalProfit = totalRevenue * 0.8; // Assuming 20% platform fee
    const pendingPayouts = totalRevenue * 0.2; // Assuming payouts are pending for the platform fee

    return {
      totalRevenue,
      totalProfit,
      pendingPayouts,
      dailyRevenue: totalRevenue / 30, // Simplified daily revenue calculation
      monthlyGrowth: 10, // Placeholder for monthly growth calculation
      losses: 0 // Placeholder for losses calculation
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    throw error;
  }
};

// Fetch recent transactions
export const getRecentTransactions = async () => {
  try {
    // Fetch completed bookings
    const bookings = await userDB.listDocuments(
      config.user.databaseId,
      config.user.collections.bookings,
      [Query.equal('status', 'completed'), Query.orderDesc('$createdAt'), Query.limit(5)]
    );

    console.log('Recent transactions:', bookings.documents);

    return bookings.documents.map(booking => ({
      id: booking.$id,
      type: 'incoming',
      amount: parseFloat(booking.price || 0),
      description: `Booking payment from ${booking.userDetails.name}`,
      date: booking.$createdAt
    }));
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    throw error;
  }
};

// Fetch payment methods distribution
export const getPaymentMethods = async () => {
  try {
    // Simulate fetching payment methods from gallery or other relevant data
    const response = await axios.get('/api/payment-methods');
    console.log('Payment methods:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};