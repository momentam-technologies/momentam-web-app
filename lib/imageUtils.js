// Generate thumbnail from file using Canvas API
export const generateThumbnail = async (file, maxSize = 300) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(new File([blob], `thumb_${file.name}`, { type: file.type }));
          else reject(new Error("Failed to generate thumbnail"));
        },
        file.type,
        0.8
      );
    };

    img.onerror = (err) => reject(err);
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
