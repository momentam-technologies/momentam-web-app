'use server'

import axios from "axios";
import { SERVER_URI } from "@/constants/constant";

export async function getAllClients(accessToken) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.get(`${SERVER_URI}/admin/clients`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data.data || [];
    } catch (error) {
        console.error("Error fetching clients:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch clients");
    }
}

export async function editClient(accessToken, clientId, formData) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.put(
            `${SERVER_URI}/admin/clients/${clientId}`,
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
        console.error("Error updating client:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to update client");
    }
}

export async function deleteClient(accessToken, clientId) {
    if (!accessToken) throw new Error("Not authenticated");

    try {
        const response = await axios.delete(`${SERVER_URI}/admin/client/delete/${clientId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error deleting client:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to delete client");
    }
}