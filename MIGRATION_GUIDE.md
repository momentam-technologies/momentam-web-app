# Admin Portal Authentication Migration Guide

## Overview
The admin portal has been migrated from Appwrite to our custom backend authentication system.

## Changes Made

### 1. New API Configuration (`src/lib/api.js`)
- Created new API client for backend communication
- Handles authentication tokens automatically
- Provides centralized API request functions

### 2. Updated Authentication (`src/lib/auth.js`)
- Replaced Appwrite authentication with custom backend
- Uses JWT tokens instead of Appwrite sessions
- Updated localStorage keys from `appwrite_session` to `admin_token`

### 3. Backend Integration
- Added admin authentication endpoints
- Created Admin model with password hashing
- Added JWT token generation and validation

## Setup Instructions

### 1. Environment Configuration
Create a `.env.local` file in the Admin-portal directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Development mode
NODE_ENV=development
```

### 2. Create Admin User
Run the following command in the backend directory to create the first admin user:

```bash
cd backend
node scripts/createAdmin.js
```

This will create an admin user with:
- Email: `admin@momentam.com`
- Password: `admin123`

### 3. Start the Backend
Make sure your backend server is running:

```bash
cd backend
npm start
```

### 4. Start the Admin Portal
```bash
cd Admin-portal
npm run dev
```

## Authentication Flow

1. **Login**: User enters email/password
2. **Backend Validation**: Credentials are validated against MongoDB
3. **JWT Token**: Backend returns a JWT token
4. **Token Storage**: Token is stored in localStorage as `admin_token`
5. **API Requests**: All subsequent requests include the token in Authorization header
6. **Token Validation**: Backend validates token on protected routes

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/admin/me` - Get current admin user (protected)

### Usage
```javascript
import { authAPI } from '@/lib/api';

// Login
const result = await authAPI.login(email, password);

// Get current user
const user = await authAPI.getCurrentUser();

// Logout
authAPI.logout();
```

## Security Notes

1. **Password Change**: Change the default admin password after first login
2. **Token Expiry**: JWT tokens expire after 7 days
3. **HTTPS**: Use HTTPS in production
4. **Environment Variables**: Keep API URLs and secrets in environment variables

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for admin portal domain
2. **Token Expired**: Clear localStorage and re-login
3. **API Connection**: Verify backend server is running and accessible

### Debug Mode
Enable debug logging by checking browser console for authentication flow details. 