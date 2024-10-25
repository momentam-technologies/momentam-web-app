import { Client, Databases, ID, Query } from 'appwrite';

// Configuration
const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    admin: {
        projectId: '671a8623003471deefdd',
        databaseId: '671a86e00027af7227db',
        collectionId: '671a86ff0017003e3898',
    },
};

// Initialize Appwrite client for admin
const adminClient = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.admin.projectId);

const adminDatabases = new Databases(adminClient);

export const getAdminUsers = async (limit = 20, offset = 0) => {
    try {
        const admins = await adminDatabases.listDocuments(
            config.admin.databaseId,
            config.admin.collectionId,
            [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]
        );
        return { admins: admins.documents, total: admins.total };
    } catch (error) {
        console.error(`Error in getAdminUsers: ${error.message}`);
        throw new Error(`Failed to get admin users: ${error.message}`);
    }
};

export const addAdminUser = async (adminData) => {
    try {
        return await adminDatabases.createDocument(
            config.admin.databaseId,
            config.admin.collectionId,
            ID.unique(),
            adminData
        );
    } catch (error) {
        console.error(`Error in addAdminUser: ${error.message}`);
        throw new Error(`Failed to add admin user: ${error.message}`);
    }
};

export const updateAdminUser = async (adminId, updatedData) => {
    try {
        return await adminDatabases.updateDocument(
            config.admin.databaseId,
            config.admin.collectionId,
            adminId,
            updatedData
        );
    } catch (error) {
        console.error(`Error in updateAdminUser: ${error.message}`);
        throw new Error(`Failed to update admin user: ${error.message}`);
    }
};

export const deleteAdminUser = async (adminId) => {
    try {
        await adminDatabases.deleteDocument(
            config.admin.databaseId,
            config.admin.collectionId,
            adminId
        );
    } catch (error) {
        console.error(`Error in deleteAdminUser: ${error.message}`);
        throw new Error(`Failed to delete admin user: ${error.message}`);
    }
};

export { Query };

