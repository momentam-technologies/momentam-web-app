import { Client, Databases } from 'appwrite';

// Configuration
export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    photographer: {
        projectId: '66f66b4100323a1b831f',
        databaseId: '66f66c740016da106c49',
        userCollectionId: '66f66c970021be082279',
        livePhotographersCollectionId: '66f703a5001bcd7be8a9',
        notificationCollectionId: '670302070011aa1a320f',
        uploadedPhotosCollectionId: '6704f38c001529b8ddbf',
    },
    user: {
        projectId: '66d00db0003702a664b7',
        databaseId: '66d00ed8003231569fd0',
        userCollectionId: '66d00f0f00399b6036fd',
        photoCollectionId: '66d00f2c002f105a9682',
        storageId: '66d0104d00282cbfc0c8',
        bookingsCollectionId: '66f155ee0008ff041e8b',
        notificationCollectionId: '66fead61001e5ff6b52d',
    }
};

// Initialize clients
const createClient = (projectId) => {
    return new Client()
        .setEndpoint(config.endpoint)
        .setProject(projectId);
};

export const photographerClient = createClient(config.photographer.projectId);
export const userClient = createClient(config.user.projectId);

// Initialize databases
export const photographerDatabases = new Databases(photographerClient);
export const userDatabases = new Databases(userClient);
