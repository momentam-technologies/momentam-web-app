import { api } from './api';

// Get all photos grouped by bookings
export const getPhotosByBookings = async (
  limit = 20,
  offset = 0,
  filters = {}
) => {
  try {
    console.log('📸 FRONTEND: Fetching photos by bookings from backend');
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    // Add filters to params
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.dateRange) params.append('dateRange', JSON.stringify(filters.dateRange));

    const response = await api.get(`/photos/by-bookings?${params.toString()}`);
    
    console.log('✅ FRONTEND: Photos by bookings received:', response.bookings.length);
    return response;
  } catch (error) {
    console.error('❌ FRONTEND: Error getting photos by bookings:', error);
    throw error;
  }
};

// Get photo statistics
export const getPhotoStats = async () => {
  try {
    console.log('📊 FRONTEND: Fetching photo statistics from backend');
    const stats = await api.get('/photos/stats');
    
    console.log('✅ FRONTEND: Photo statistics received');
    return stats;
  } catch (error) {
    console.error('❌ FRONTEND: Error getting photo stats:', error);
    throw error;
  }
};

// Update photo
export const updatePhoto = async (photoId, updates) => {
  try {
    console.log('✏️ FRONTEND: Updating photo via backend');
    const updatedPhoto = await api.put(`/photos/${photoId}`, updates);
    
    console.log('✅ FRONTEND: Photo updated successfully');
    return updatedPhoto;
  } catch (error) {
    console.error('❌ FRONTEND: Error updating photo:', error);
    throw error;
  }
};

// Bulk update photos
export const bulkUpdatePhotos = async (photoIds, updates) => {
  try {
    console.log('🔄 FRONTEND: Bulk updating photos via backend');
    const result = await api.put('/photos/bulk/update', { photoIds, updates });
    
    console.log('✅ FRONTEND: Bulk photo update completed');
    return result;
  } catch (error) {
    console.error('❌ FRONTEND: Error bulk updating photos:', error);
    throw error;
  }
};

// Get photos by booking ID
export const getPhotosByBooking = async (bookingId) => {
  try {
    console.log('📸 FRONTEND: Fetching photos for booking from backend');
    const photos = await api.get(`/photos/booking/${bookingId}`);
    
    console.log('✅ FRONTEND: Photos for booking received:', photos.length);
    return photos;
  } catch (error) {
    console.error('❌ FRONTEND: Error getting photos by booking:', error);
    throw error;
  }
};

// Delete photo
export const deletePhoto = async (photoId) => {
  try {
    console.log('🗑️ FRONTEND: Deleting photo via backend');
    const result = await api.delete(`/photos/${photoId}`);
    
    console.log('✅ FRONTEND: Photo deleted successfully');
    return result;
  } catch (error) {
    console.error('❌ FRONTEND: Error deleting photo:', error);
    throw error;
  }
};

// Download single photo
export const downloadPhoto = async (photoUrl, fileName = 'photo.jpg') => {
  try {
    console.log('📥 FRONTEND: Downloading photo:', photoUrl);
    
    // Fetch the image as blob
    const response = await fetch(photoUrl);
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    console.log('✅ FRONTEND: Photo downloaded successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ FRONTEND: Error downloading photo:', error);
    throw error;
  }
};

// Bulk download photos
export const bulkDownloadAsZip = async (files) => {
  try {
    console.log('📦 FRONTEND: Bulk downloading photos');
    
    // Download files individually for now (can be enhanced to ZIP later)
    for (const file of files) {
      const fileName = file.photoId ? `photo_${file.photoId}.jpg` : 'photo.jpg';
      await downloadPhoto(file.url, fileName);
    }
    
    console.log('✅ FRONTEND: Bulk download completed');
    return { success: true };
  } catch (error) {
    console.error('❌ FRONTEND: Error bulk downloading photos:', error);
    throw error;
  }
};

// Upload photo (placeholder - implement if needed)
export const uploadPhotoToFirebase = async (photo) => {
  try {
    console.log('📤 FRONTEND: Upload photo to Firebase (placeholder)');
    // TODO: Implement photo upload functionality
    // This would typically involve uploading to your storage service
    return { url: '', id: '' };
  } catch (error) {
    console.error('❌ FRONTEND: Error uploading photo:', error);
    throw error;
  }
};

// Replace photo with edited version
export const replacePhoto = async (photoId, file) => {
  try {
    console.log('🔄 FRONTEND: Replacing photo:', photoId);
    
    const formData = new FormData();
    formData.append('photo', file);
    
    // Get the token for authorization
    const token = localStorage.getItem("admin_token");
    
    // Make direct axios request to bypass the JSON content-type issue
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/photos/${photoId}/replace`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to replace photo');
    }
    
    const result = await response.json();
    console.log('✅ FRONTEND: Photo replaced successfully');
    return result;
  } catch (error) {
    console.error('❌ FRONTEND: Error replacing photo:', error);
    throw error;
  }
};

// Save edited photos (placeholder - implement if needed)
export const saveEditedPhotos = async (photos) => {
  try {
    console.log('💾 FRONTEND: Saving edited photos (placeholder)');
    // TODO: Implement saving edited photos
    return { success: true, message: "All photos saved successfully" };
  } catch (error) {
    console.error('❌ FRONTEND: Error saving edited photos:', error);
    throw error;
  }
};
