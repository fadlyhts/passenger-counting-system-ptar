# Passenger Counting System API - Postman Guide

This guide explains how to use the Postman collection to test the Passenger Counting System API.

## Getting Started

1. Download and install [Postman](https://www.postman.com/downloads/) if you haven't already.
2. Import the `postman_collection.json` file into Postman:
   - Open Postman
   - Click on "Import" button in the top left
   - Drag and drop the `postman_collection.json` file or browse to select it
   - Click "Import"

## Setting Up Environment Variables

The collection uses two environment variables:

1. `base_url`: The base URL of your API (default: http://localhost:3000)
2. `token`: The JWT token received after login

To set up these variables:

1. Click on the "Environments" tab in Postman
2. Click "Create New Environment"
3. Name it "Passenger Counting System"
4. Add the following variables:
   - `base_url`: Set to `http://localhost:3000` (or your server URL)
   - `token`: Leave this empty for now
5. Click "Save"
6. Select this environment from the dropdown in the top right corner

## Authentication Flow

Before using most endpoints, you need to authenticate:

1. Use the "Admin Login" or "Driver Login" request in the Authentication folder
2. Fill in valid credentials in the request body
3. Send the request
4. From the response, copy the JWT token (without the "Bearer " prefix)
5. Set the `token` environment variable with this value

Now all other requests will automatically include this token in the Authorization header.

## Testing the API

The collection is organized into folders based on resource types:

1. **Authentication**: Login and logout endpoints
2. **Admin Management**: CRUD operations for admin users
3. **Driver Management**: CRUD operations for drivers
4. **Vehicle Management**: CRUD operations for vehicles (mobil)
5. **Device Management**: CRUD operations for ESP32 devices
6. **Session Management**: Driver clock-in/clock-out functionality
7. **Passenger Management**: Record passengers via RFID

### Typical Testing Flow

1. **Authentication**: Login as an admin or driver
2. **Admin/Driver Management**: Create, view, update, or delete users
3. **Vehicle Management**: Add vehicles to the system
4. **Device Management**: Register ESP32 devices and associate them with vehicles
5. **Session Management**: Start a driver session (clock in)
6. **Passenger Management**: Record passenger entries using the ESP32 endpoint
7. **Reporting**: View passenger counts and session history

### ESP32 Integration Testing

To simulate an ESP32 device sending passenger data:

1. Use the "Record Passenger" request in the Passenger Management folder
2. Provide a valid RFID code and device ID in the request body
3. This endpoint doesn't require authentication, as it's designed for IoT devices

## Troubleshooting

- If you get 401 Unauthorized errors, check that your token is valid and properly set in the environment variables
- If you get 404 Not Found errors, verify the API is running and the endpoint path is correct
- For validation errors (400 Bad Request), check the request body against the API requirements

## Additional Notes

- The token will expire after the time specified in your JWT_EXPIRATION environment variable
- When the token expires, you'll need to login again to get a new token
- Use the "Logout" endpoint to invalidate a token before it expires
