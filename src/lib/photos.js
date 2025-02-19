import { photographerDB, userDB, config } from "./appwrite-config";
import { signInAnonymously } from "firebase/auth";
import { uploadBytes, ref, getDownloadURL } from "firebase/storage";
import { Query, ID } from "appwrite";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { auth, storage } from "../config/storage";

// Get all photos grouped by bookings
export const getPhotosByBookings = async (
  limit = 20,
  offset = 0,
  filters = {}
) => {
  try {
    // First get ALL bookings without limit
    const allBookings = await userDB.listDocuments(
      config.user.databaseId,
      config.user.collections.bookings,
      [Query.orderDesc("$createdAt")]
    );

    // Get photos for each booking
    const bookingsWithPhotos = await Promise.all(
      allBookings.documents.map(async (booking) => {
        try {
          // Get photos for this booking from uploadedPhotos collection
          const photos = await photographerDB.listDocuments(
            config.photographer.databaseId,
            config.photographer.collections.uploadedPhotos,
            [Query.equal("bookingId", booking.$id)]
          );

          if (photos.total === 0) return null; // Skip bookings with no photos

          // Get photographer details
          const photographer = await photographerDB.getDocument(
            config.photographer.databaseId,
            config.photographer.collections.users,
            booking.photographerId
          );

          // Parse client details
          const client = JSON.parse(booking.userDetails);

          return {
            booking: {
              id: booking.$id,
              date: booking.date,
              price: booking.price,
              status: booking.status,
              package: booking.package,
              location: booking.location,
            },
            photographer: {
              id: photographer.$id,
              name: photographer.name,
              email: photographer.email,
              avatar: photographer.avatar,
            },
            client: {
              name: client.name,
              email: client.email,
              avatar: client.avatar,
            },
            photos: photos.documents.map((photo) => ({
              ...photo,
              status: photo.status || "pending",
              isEnhanced: photo.isEnhanced || false,
              enhancedUrl: photo.enhancedUrl || photo.photoUrl, // Use enhanced URL if exists
            })),
            totalPhotos: photos.total,
            pendingPhotos: photos.documents.filter(
              (p) => !p.status || p.status === "pending"
            ).length,
            approvedPhotos: photos.documents.filter(
              (p) => p.status === "approved"
            ).length,
            uploadedAt: photos.documents[0]?.$createdAt || booking.$createdAt,
          };
        } catch (error) {
          console.error("Error processing booking photos:", booking.$id, error);
          return null;
        }
      })
    );

    // Filter out null values and sort by upload date
    const validBookings = bookingsWithPhotos
      .filter(Boolean)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Apply pagination after getting all bookings
    const paginatedBookings = validBookings.slice(offset, offset + limit);

    return {
      bookings: paginatedBookings,
      total: validBookings.length,
    };
  } catch (error) {
    console.error("Error getting photos by bookings:", error);
    throw error;
  }
};

// Get photo statistics
export const getPhotoStats = async () => {
  try {
    // Get all photos
    const photos = await photographerDB.listDocuments(
      config.photographer.databaseId,
      config.photographer.collections.uploadedPhotos
    );

    // Get current date and previous dates for comparisons
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Filter photos by date
    const thisMonthPhotos = photos.documents.filter(
      (p) =>
        new Date(p.$createdAt) >= new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const lastMonthPhotos = photos.documents.filter(
      (p) =>
        new Date(p.$createdAt) >= lastMonth &&
        new Date(p.$createdAt) < new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const lastYearPhotos = photos.documents.filter(
      (p) =>
        new Date(p.$createdAt) >= lastYear &&
        new Date(p.$createdAt) < new Date(now.getFullYear(), now.getMonth(), 1)
    );

    // Calculate changes
    const monthlyChange =
      lastMonthPhotos.length > 0
        ? ((thisMonthPhotos.length - lastMonthPhotos.length) /
            lastMonthPhotos.length) *
          100
        : 0;

    const yearOverYearChange =
      lastYearPhotos.length > 0
        ? ((thisMonthPhotos.length - lastYearPhotos.length) /
            lastYearPhotos.length) *
          100
        : 0;

    // Get bookings with photos
    const bookings = await userDB.listDocuments(
      config.user.databaseId,
      config.user.collections.bookings
    );

    const bookingsWithPhotos = bookings.documents.filter((booking) =>
      photos.documents.some((photo) => photo.bookingId === booking.$id)
    );

    const stats = {
      total: photos.total,
      pending: photos.documents.filter(
        (p) => !p.status || p.status === "pending"
      ).length,
      approved: photos.documents.filter((p) => p.status === "approved").length,
      rejected: photos.documents.filter((p) => p.status === "rejected").length,
      totalBookings: bookingsWithPhotos.length,
      photographerCount: new Set(photos.documents.map((p) => p.photographerId))
        .size,
      clientCount: new Set(
        bookingsWithPhotos.map((b) => JSON.parse(b.userDetails).email)
      ).size,
      monthlyChange: parseFloat(monthlyChange.toFixed(1)),
      yearOverYearChange: parseFloat(yearOverYearChange.toFixed(1)),
    };

    return stats;
  } catch (error) {
    console.error("Error getting photo stats:", error);
    throw error;
  }
};

// Update photo
export const updatePhoto = async (photoId, updates) => {
  try {
    const updatedPhoto = await photographerDB.updateDocument(
      config.photographer.databaseId,
      config.photographer.collections.uploadedPhotos,
      photoId,
      {
        ...updates,
        uploadDate: new Date().toISOString(),
      }
    );
    console.log("Updated photo:",updatePhoto);

    return updatedPhoto;
  } catch (error) {
    console.error("Error updating photo:", error);
    throw error;
  }
};

// Bulk update photos
export const bulkUpdatePhotos = async (photoIds, updates) => {
  try {
    const updatePromises = photoIds.map((id) => updatePhoto(id, updates));

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error("Error bulk updating photos:", error);
    throw error;
  }
};

// Download photo
const handleDownload = async (downloadURL) => {
  if (!downloadURL) return;
  const link = document.createElement("a");
  link.href = downloadURL;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Bulk download photos
export const bulkDownloadAsZip = async (files) => {
  const zip = new JSZip();
  const folder = zip.folder("bulk_download"); // Create a folder in the ZIP
  await signInAnonymously(auth); // Sign in anonymously to Firebase

  // Fetch and add each file to the ZIP
  await Promise.all(
    files.map(async (file) => {
      const filePath = file.photoId + file.url.slice(
        file.url.lastIndexOf("."),
        file.url.lastIndexOf("?")
      );
      const response = await fetch(file.url);

      if (response.ok) {
        const blob = await response.blob();
        folder.file(filePath, blob);
      } else {
        throw new Error("Error fetching file:" + filePath);
      }
    })
  );

  // Generate the ZIP file and download it
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "download_files.zip");
};

// Upload photo
export const uploadPhotoToFirebase = async (photo) => {
  await signInAnonymously(auth);
  const storageRef = ref(storage, `${photo.name}`);
  await uploadBytes(storageRef, photo);
  const downloadUrl = await getDownloadURL(storageRef);
  const photoId = photo.name.slice(0, photo.name.lastIndexOf("."));
  return {url: downloadUrl, id: photoId};
};

export const saveEditedPhotos = async (
  photos
) => {
  try {// Implement deletiing photos in firebase storage before updating, 
    // Idea is attach the name of the photo when downloading so that when deleting can be used to generate ref
    const updatePromises = photos.map((photo) => updatePhoto(photo.id, {photoUrl: photo.url}));

    await Promise.all(updatePromises);
    return { success: true, message: "All photos uploaded successfully" };
  } catch (error) {
    console.error("Error bulk uploading photos:", error);
    throw error;
  }
};
