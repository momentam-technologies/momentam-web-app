import { Client, Databases } from 'appwrite';

// Configuration
export const config = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  user: {
    projectId: "68060bf7002c64e0caab",
    databaseId: "68060caa003a4a007b23",
    collections: {
      users: "68060cd300002f4b4a22",
      bookings: "68060d3b0034d04074e4",
      notifications: "68060d8600186ab097a1",
    },
  },
  photographer: {
    projectId: "6806248a0039b8e7044a",
    databaseId: "68062571001fb9f9d619",
    collections: {
      photographers: "68066515003b4dde4c23",
      livePhotographers: "6806637e0012de889a62",
      notifications: "680626b6000a303bdf3a",
      uploadedPhotos: "68062595001fef2f1329",
    },
  },
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
