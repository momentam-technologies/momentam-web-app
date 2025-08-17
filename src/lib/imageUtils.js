// Image utility functions for the admin portal

// Generate thumbnail from file using Canvas API
export const generateThumbnail = async (file) => {
  return new Promise((resolve, reject) => {
    console.log('🔵 FRONTEND: Generating thumbnail for:', file.name, 'Type:', file.type);
    
    // For all image files, generate actual thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to 800x800
      canvas.width = 800;
      canvas.height = 800;
      
      // Calculate scaling to maintain aspect ratio
      const scale = Math.min(800 / img.width, 800 / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Center the image
      const x = (800 - scaledWidth) / 2;
      const y = (800 - scaledHeight) / 2;
      
      // Draw the image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      // Convert to blob as WebP for better compression
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a new file with the thumbnail
          const thumbnailFile = new File([blob], `thumb_${file.name.replace(/\.[^/.]+$/, '.webp')}`, {
            type: 'image/webp',
            lastModified: Date.now()
          });
          console.log('✅ FRONTEND: Thumbnail generated:', thumbnailFile.name, 'Size:', (thumbnailFile.size / 1024).toFixed(2) + 'KB');
          resolve(thumbnailFile);
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      }, 'image/webp', 0.9);
    };
    
    img.onerror = (error) => {
      console.error('❌ FRONTEND: Image loading error:', error);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    
    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
    };
  });
};

// Check if file is a RAW format
export const isRawFile = (fileName) => {
  const rawExtensions = ['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'rw2', 'orf', 'rwl', 'pef', 'srw', 'x3f', '3fr', 'mrw', 'mos', 'raw'];
  const extension = fileName.toLowerCase().split('.').pop();
  return rawExtensions.includes(extension);
};

// Get MIME type for file
export const getMimeType = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
  const mimeTypeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
  };
  
  return mimeTypeMap[extension] || 'image/jpeg';
};

// Validate file size (60MB limit)
export const validateFileSize = (file) => {
  const maxSize = 60 * 1024 * 1024; // 60MB
  return file.size <= maxSize;
};

// Validate file format
export const validateFileFormat = (file) => {
  const validFormats = [
    'image/jpeg', 'image/png', 'image/webp', 'image/jpg'
  ];
  
  return validFormats.includes(file.type);
};
