"use server";

import axios from "axios";
import { SERVER_URI } from "@/constants/constant";

export async function getAllPhotographers(accessToken) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.get(`${SERVER_URI}/admin/photographers`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return response.data.data || [];
    } catch (error) {
        console.error("Error fetching Photographers:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch Photographers");
    }
}

export async function editPhotographer(photographerId, formData, accessToken) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.put(
            `${SERVER_URI}/admin/photographer/${photographerId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error updating photographer:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to update photographer");
    }
}

export async function deletePhotographer(id, accessToken) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.delete(`${SERVER_URI}/admin/photographer/delete/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        return response.data;
    } catch (error) {
        console.error("Error deleting photographer:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to delete photographer");
    }
}