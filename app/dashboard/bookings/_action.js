"use server";

import axios from "axios";
import { SERVER_URI } from "@/constants/constant";

export async function getAllBookings(accessToken) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.get(`${SERVER_URI}/admin/bookings`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.data?.success) {
            return response.data.data || [];
        }


        return [];
    } catch (error) {
        console.error("Error fetching bookings:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch bookings");
    }
}