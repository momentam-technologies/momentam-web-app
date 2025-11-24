"use client";

import axios from "axios";
import { SERVER_URI } from "@/constants/constant";

export async function getAllPhotos(accessToken) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.get(`${SERVER_URI}/photos/photos`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 20000,
        });

        return response.data.data.map((p) => ({
            _id: p._id,
            status: p.status,
            fileName: p.fileName,
            fileUrl: p.fileUrl,
            thumbnailUrl: p.thumbnailUrl,
            mimeType: p.mimeType,
            fileSize: p.fileSize,
            isEnhanced: p.isEnhanced,
            enhancedUrl: p.enhancedUrl,
            rejectionReason: p.rejectionReason,
            uploadDate: p.uploadDate,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            storageKey: p.storageKey,
            booking: {
                _id: p.bookingId?._id,
                package: p.bookingId?.package,
                date: p.bookingId?.date,
                price: p.bookingId?.price,
            },
            photographer: {
                _id: p.bookingId?.photographerId?._id || p.photographerId,
                name: p.bookingId?.photographerId?.name || "Unknown Photographer",
                avatar: p.bookingId?.photographerId?.avatar || "",
                email: p.bookingId?.photographerId?.email || "",
            },
            client: {
                _id: p.bookingId?.userId?._id,
                name: p.bookingId?.userId?.name || "Unknown Client",
                avatar: p.bookingId?.userId?.avatar || "",
                email: p.bookingId?.userId?.email || "",
            },
        }));
    } catch (error) {
        console.error("Error fetching photos:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch photos");
    }
}

export async function replacePhoto(accessToken, photoId, photoFile, thumbnailFile, onProgress) {
    if (!accessToken) throw new Error("Not authenticated");

    const formData = new FormData();
    formData.append("photo", photoFile);
    formData.append("thumbnail", thumbnailFile);

    try {
        const response = await axios.patch(`${SERVER_URI}/photos/admin/photos/${photoId}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${accessToken}`,
                },
                timeout: 20000,
                // Built-in upload progress
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error updating photo:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to update photo");
    }
}

export async function handleStatusUpdate(accessToken, photoId, status, clientId, clientName) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        // Approve Photo
        if (status === "approved") {
            const approveRes = await axios.patch(`${SERVER_URI}/photos/admin/photos/approve/${photoId}`, {}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                timeout: 20000,
            })

            if (approveRes.status === 200) {
                // Send push notification (separate endpoint)
                try {
                    await axios.post(`${SERVER_URI}/notifications/notify/photo-approved`, { clientId, clientName },
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        }
                    );
                } catch (notifyErr) {
                    console.error("Notification error:", notifyErr);
                }
            }
        }

        // Reject Photo
        else if (status === "rejected") {
            const rejectRes = await axios.patch(`${SERVER_URI}/photos/admin/photos/reject/${photoId}`, { rejectionReason: "Rejected by admin" },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (rejectRes.status !== 200) {
                console.warn("Failed to reject photo:", rejectRes.status);
            }
        }
    } catch (error) {
        console.error("Error updating photo status:", error);
    }
}