import { Client, Databases } from 'appwrite';

// Configuration
const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    user: {
        projectId: '66d00db0003702a664b7',
        databaseId: '66d00ed8003231569fd0',
        collections: {
            users: '66d00f0f00399b6036fd',
            photos: '66d00f2c002f105a9682',
            bookings: '66f155ee0008ff041e8b',
            notifications: '66fead61001e5ff6b52d'
        }
    },
    photographer: {
        projectId: '66f66b4100323a1b831f',
        databaseId: '66f66c740016da106c49',
        collections: {
            users: '66f66c970021be082279',
            livePhotographers: '66f703a5001bcd7be8a9',
            notifications: '670302070011aa1a320f',
            uploadedPhotos: '6704f38c001529b8ddbf'
        }
    }
};

// Initialize clients
const createClient = (projectId) => {
    return new Client()
        .setEndpoint(config.endpoint)
        .setProject(projectId);
};

export const userClient = createClient(config.user.projectId);
export const photographerClient = createClient(config.photographer.projectId);

// Initialize databases
export const userDB = new Databases(userClient);
export const photographerDB = new Databases(photographerClient);

export { config }; // Export config if needed elsewhere
