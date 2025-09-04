import { api } from './api';
import { generateThumbnail, validateFileSize, validateFileFormat, getMimeType, isRawFile } from './imageUtils';

// API configuration for admin portal
const API_BASE_URL = "https://payment.momentam.io/api";

// Helper function to extract file extension from URL or filename
const extractFileExtension = (url, fileName) => {
  // First try to use the fileName if available
  if (fileName) {
    const fileNameParts = fileName.split('.');
    if (fileNameParts.length > 1) {
      return fileNameParts[fileNameParts.length - 1].toLowerCase();
    }
  }
  
  // Fallback to extracting from URL
  if (url) {
    // Extract filename from URL path
    const urlPath = url.split('?')[0].split('#')[0]; // Remove query params and fragments
    const pathParts = urlPath.split('/');
    const filename = pathParts[pathParts.length - 1]; // Get the last part (filename)
    
    // Extract extension from filename
    const filenameParts = filename.split('.');
    if (filenameParts.length > 1) {
      return filenameParts[filenameParts.length - 1].toLowerCase();
    }
  }
  
  // Default fallback
  return 'jpg';
};

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
      offset: offset.toString(),
      sort: 'desc', // Sort by latest first (descending order)
      sortBy: 'createdAt', // Sort by creation date
      hasPhotos: 'true' // Only return bookings that have photos
    });

    // Add filters to params
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.dateRange) {
      params.append('dateRange', JSON.stringify(filters.dateRange));
    }

    const fullUrl = `/photos/by-bookings?${params.toString()}`;

    const response = await api.get(fullUrl);

    // Filter out bookings without photos on the frontend as a backup
    if (response?.bookings && Array.isArray(response.bookings)) {
      const originalBookingsCount = response.bookings.length;
      const bookingsWithPhotos = response.bookings.filter(booking => {
        const hasPhotos = booking.photos && Array.isArray(booking.photos) && booking.photos.length > 0;
        return hasPhotos;
      });
      
      // Update the response with filtered bookings but preserve the backend's total count
      response.bookings = bookingsWithPhotos;
      // DO NOT modify response.total - keep the backend's correct total count
      response.filteredCount = originalBookingsCount - bookingsWithPhotos.length; // Track how many were filtered out from this page
    }
    
    console.log('✅ FRONTEND: Photos by bookings received:', response?.bookings?.length || 0);
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
      // Use the fileName from the file object if available, otherwise generate one
      const fileName = file.fileName || (file.photoId ? `photo_${file.photoId}.jpg` : 'photo.jpg');
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
    console.log('🔄 FRONTEND: Replacing photo:', photoId, {
      fileName: file.name,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      fileType: file.type
    });
    
    // Validate file size and format
    if (!validateFileSize(file)) {
      throw new Error('File size exceeds 60MB limit');
    }
    
    if (!validateFileFormat(file)) {
      throw new Error('Invalid file format. Please select a valid image file (JPG, PNG, WebP).');
    }
    
    // No thumbnail generation needed - backend will handle it
    console.log('🔵 FRONTEND: Sending file for replacement (backend will generate thumbnail)');
    
    const formData = new FormData();
    
    // Set proper MIME type for the file
    const fileWithMimeType = new File([file], file.name, {
      type: getMimeType(file.name),
      lastModified: file.lastModified
    });
    
    formData.append('photo', fileWithMimeType);
    
    // Get the token for authorization
    const token = localStorage.getItem("admin_token");
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log('🔵 FRONTEND: Sending replacement request with thumbnail...');
    console.log('🔵 FRONTEND: API URL:', `${API_BASE_URL}/photos/${photoId}/replace`);
    
    // Make direct fetch request to bypass the JSON content-type issue
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/replace`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });
    
    console.log('🔵 FRONTEND: Response status:', response.status);
    console.log('🔵 FRONTEND: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('❌ FRONTEND: Server error response:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('❌ FRONTEND: Could not parse error response:', parseError);
        
        // Check if response is HTML (wrong endpoint)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          errorMessage = 'Wrong API endpoint - server returned HTML instead of JSON. Please check the API URL configuration.';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    let result;
    try {
      result = await response.json();
      console.log('✅ FRONTEND: Photo replaced successfully with thumbnail:', result);
    } catch (parseError) {
      console.error('❌ FRONTEND: Could not parse success response:', parseError);
      throw new Error('Invalid response format from server');
    }
    
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
