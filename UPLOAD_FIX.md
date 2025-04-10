# Resource and Event Upload Fix Guide

If you're experiencing issues with uploading resources or creating events, follow this guide to troubleshoot and fix the problems.

## Common Problems and Solutions

### 1. Authentication Issues

The most common cause of upload failures is authentication problems:

- **Make sure you're logged in**: Both resource uploads and event creation require authentication. Click the "Sign In" button in the navigation bar.
- **Check the console**: Look for messages like "Authentication required - No token found" which indicate you need to sign in.
- **Test the auth token**: After logging in, you should see "AUTH - User is now authenticated" in the console.

### 2. Backend Server Not Running

If the backend server isn't running, uploads will fail:

- **Start the backend server**: Run `cd backend && npm run server` from the project root.
- **Verify it's running**: You should see "Server running on port 5000" in the terminal.
- **Test the connection**: Run `cd backend && npm run test-api` to check if the backend is working correctly.

### 3. MongoDB Connection Issues

If MongoDB isn't connected, data uploads will fail:

- **Check MongoDB connection**: Make sure your MongoDB service is running.
- **Verify connection string**: Check that the MONGO_URI in the `.env` file is correct.
- **Test the database**: Run `cd backend && npm test` to verify database connectivity.

### 4. Form Validation Errors

The form may have validation errors:

- **Check for error messages**: Look for error messages displayed on the form.
- **Fill out all required fields**: Make sure all required fields are filled in.
- **Special cases**: For Learning Materials, Industry field is required. For Online events, Meeting Link is required.

## Step-by-Step Upload Test

After ensuring you're logged in and the server is running:

1. **For Resources**:
   - Go to the Resources page
   - Click "Upload Resource"
   - Fill out all fields (title, description, category, file URL)
   - If category is Learning Material, fill out Industry
   - Click "Upload Resource"

2. **For Events**:
   - Go to the Events page
   - Click "Create Event"
   - Fill out all fields (title, description, type, start time, end time, location, capacity)
   - If location is "Online", fill out Meeting Link
   - Click "Create Event"

## Using the Debug Tools

We've added special debug tools to help diagnose issues:

```bash
# Test database connection and API routes
cd backend && npm run test-api

# Check MongoDB connection only
cd backend && npm test
```

## Browser Console Debugging

Check the browser console for these messages:

- "AUTH INIT - Token exists: true" - Confirms you're logged in
- "API Request to: /api/resources" - Shows API calls are being made
- "Added auth token to request headers" - Confirms auth token is being sent

If you see "Server responded with: 401" - This means authentication failed.

## Need More Help?

If you're still having issues, try these steps:

1. **Clear your browser storage**: In DevTools → Application → Storage → Clear Site Data
2. **Restart the app**: Kill both frontend and backend servers and restart them
3. **Check for missing dependencies**: Run `npm install` in both root and backend folders
