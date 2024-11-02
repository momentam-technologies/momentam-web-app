// Simulate fetching user engagement data
export const getUserEngagement = async () => {
  try {
    // Simulate an API call
    return {
      activeUsers: 1200,
      newSignups: 300,
      trends: [
        { date: '2023-01-01', activeUsers: 1000 },
        { date: '2023-02-01', activeUsers: 1100 },
        { date: '2023-03-01', activeUsers: 1200 },
      ],
    };
  } catch (error) {
    console.error('Error fetching user engagement data:', error);
    throw error;
  }
};

// Simulate fetching traffic sources data
export const getTrafficSources = async () => {
  try {
    // Simulate an API call
    return [
      { source: 'Direct', value: 400 },
      { source: 'Referral', value: 300 },
      { source: 'Social Media', value: 200 },
      { source: 'Search Engines', value: 100 },
    ];
  } catch (error) {
    console.error('Error fetching traffic sources data:', error);
    throw error;
  }
};

// Simulate fetching conversion rates data
export const getConversionRates = async () => {
  try {
    // Simulate an API call
    return {
      rate: 5.2,
      trends: [
        { date: '2023-01-01', rate: 4.8 },
        { date: '2023-02-01', rate: 5.0 },
        { date: '2023-03-01', rate: 5.2 },
      ],
    };
  } catch (error) {
    console.error('Error fetching conversion rates data:', error);
    throw error;
  }
};

// Simulate fetching frequent locations data
export const getFrequentLocations = async () => {
  try {
    // Simulate an API call
    return [
      { name: 'New York', lat: 40.7128, lng: -74.0060, description: 'High user activity' },
      { name: 'London', lat: 51.5074, lng: -0.1278, description: 'Popular location' },
    ];
  } catch (error) {
    console.error('Error fetching frequent locations data:', error);
    throw error;
  }
};

// Simulate fetching most used booking data
export const getMostUsedBooking = async () => {
  try {
    // Simulate an API call
    return { name: 'Wedding Package' };
  } catch (error) {
    console.error('Error fetching most used booking data:', error);
    throw error;
  }
};

// Simulate fetching most booked photographer data
export const getMostBookedPhotographer = async () => {
  try {
    // Simulate an API call
    return { name: 'John Doe' };
  } catch (error) {
    console.error('Error fetching most booked photographer data:', error);
    throw error;
  }
};
