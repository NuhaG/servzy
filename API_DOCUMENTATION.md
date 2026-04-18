# Notification System API Documentation

## Database Model

### Notification Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),           // Optional: recipient user
  providerId: ObjectId (ref: Provider),   // Optional: recipient provider
  bookingId: ObjectId (ref: Booking),     // Optional: related booking
  title: String,                           // Main notification text
  message: String,                         // Detailed message
  type: String (enum),                    // See notification types below
  read: Boolean (default: false),          // Read status
  actionUrl: String,                       // Link to related page
  metadata: Mixed,                         // Any additional data
  createdAt: Date (auto),                  // Timestamp
  updatedAt: Date (auto)
}
```

## API Endpoints

### 1. GET /api/notifications
**Fetch notifications for current user**

**Method:** GET  
**Authentication:** Required (via session)  
**Role Access:** User sees own, Provider sees own, Admin sees any

**Query Parameters:**
```
unreadOnly (boolean, optional): true - filter only unread
limit (number, optional): default 20, max results to return
skip (number, optional): default 0, for pagination
```

**Example:**
```bash
# Get all notifications
GET /api/notifications

# Get only unread
GET /api/notifications?unreadOnly=true

# Get first 10, then skip 10
GET /api/notifications?limit=10&skip=10
```

**Response:**
```json
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "bookingId": "507f1f77bcf86cd799439013",
      "title": "Request Accepted",
      "message": "John Doe has accepted your cleaning service request.",
      "type": "request_accepted",
      "read": false,
      "actionUrl": "/user/bookings/507f1f77bcf86cd799439013",
      "createdAt": "2026-04-18T10:30:00Z",
      "updatedAt": "2026-04-18T10:30:00Z"
    }
  ],
  "total": 45,
  "unreadCount": 3
}
```

**Error Responses:**
```json
// Unauthorized
{ "error": "Unauthorized" } // 401

// Query error
{ "error": "Failed to fetch notifications" } // 500
```

---

### 2. POST /api/notifications
**Create a new notification** (Backend only)

**Method:** POST  
**Authentication:** Required  
**Role Access:** System/Admin only (don't expose to frontend)

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",          // Optional
  "providerId": "507f1f77bcf86cd799439014",      // Optional (one required)
  "bookingId": "507f1f77bcf86cd799439013",       // Optional
  "title": "Payment Received",                    // Required
  "message": "You received ₹2,000 for cleaning",  // Required
  "type": "payment_received",                     // Required
  "actionUrl": "/provider/earnings",              // Optional
  "metadata": {                                    // Optional
    "amount": 2000,
    "serviceType": "cleaning"
  }
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "userId": null,
  "providerId": "507f1f77bcf86cd799439014",
  "title": "Payment Received",
  "message": "You received ₹2,000 for cleaning",
  "type": "payment_received",
  "read": false,
  "actionUrl": "/provider/earnings",
  "createdAt": "2026-04-18T10:30:00Z"
}
```

**Error Responses:**
```json
// Missing userId or providerId
{ "error": "Either userId or providerId required" } // 400

// Creation failed
{ "error": "Failed to create notification" } // 500
```

---

### 3. PATCH /api/notifications/:id
**Mark notification as read or update**

**Method:** PATCH  
**Authentication:** Required  
**Authorization:** Only owner or admin can update

**URL Parameters:**
```
id (string): Notification ID
```

**Request Body:**
```json
{
  "read": true  // Mark as read
}
```

**Example:**
```bash
PATCH /api/notifications/507f1f77bcf86cd799439011
Content-Type: application/json

{ "read": true }
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "title": "Request Accepted",
  "message": "John Doe has accepted your cleaning service request.",
  "type": "request_accepted",
  "read": true,
  "createdAt": "2026-04-18T10:30:00Z"
}
```

**Error Responses:**
```json
// Not found
{ "error": "Notification not found" } // 404

// Not authorized
{ "error": "Forbidden" } // 403

// Server error
{ "error": "Failed to update notification" } // 500
```

---

### 4. DELETE /api/notifications/:id
**Delete a notification**

**Method:** DELETE  
**Authentication:** Required  
**Authorization:** Only owner or admin can delete

**URL Parameters:**
```
id (string): Notification ID
```

**Example:**
```bash
DELETE /api/notifications/507f1f77bcf86cd799439011
```

**Response:**
```json
{ "success": true }
```

**Error Responses:**
```json
// Not found
{ "error": "Notification not found" } // 404

// Not authorized
{ "error": "Forbidden" } // 403

// Server error
{ "error": "Failed to delete notification" } // 500
```

---

## Notification Types

```javascript
"request_sent"      // 📤 User sends service request
"request_accepted"  // ✅ Provider accepts request  
"request_rejected"  // ❌ Provider rejects request
"payment_made"      // 💳 User makes payment
"payment_received"  // 💰 Provider receives payment
"service_scheduled" // 📅 Service scheduled
"warning"           // ⚠️  System warning
"review_received"   // ⭐ Provider receives review
"complaint_filed"   // 📋 Complaint registered
```

---

## Frontend Usage Examples

### Fetch Notifications
```javascript
// Get all notifications
const res = await fetch("/api/notifications");
const { notifications, unreadCount } = await res.json();

// Get unread only
const res = await fetch("/api/notifications?unreadOnly=true");
const { notifications } = await res.json();
```

### Mark as Read
```javascript
await fetch(`/api/notifications/${notificationId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ read: true })
});
```

### Delete Notification
```javascript
await fetch(`/api/notifications/${notificationId}`, {
  method: "DELETE"
});
```

---

## Backend Usage Examples

### Create Notification (in API route)
```javascript
import Notification from "@/models/Notification";

await Notification.create({
  userId: bookingUserId,
  bookingId: bookingId,
  title: "Booking Confirmed",
  message: "Your booking has been confirmed.",
  type: "request_accepted",
  actionUrl: `/user/bookings/${bookingId}`
});
```

### Send Notification via API
```javascript
const res = await fetch("/api/notifications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    providerId: providerId,
    bookingId: bookingId,
    title: "New Service Request",
    message: "You have a new service request",
    type: "request_sent",
    actionUrl: "/provider/bookings"
  })
});
```

---

## Rate Limiting & Performance

- **Polling Interval:** 30 seconds (in NotificationBell component)
- **Default Limit:** 20 notifications per request
- **Max Limit:** Recommend 50
- **Recommended Indexes:**
  - `userId` + `read`
  - `providerId` + `read`
  - `createdAt` (descending)

---

## Security Notes

✅ **Implemented:**
- Users can only see their own notifications
- Providers can only see their own notifications
- Admins can see any notifications
- Delete requires authorization
- Session-based authentication required

⚠️ **Important:**
- Do NOT expose `/api/notifications` POST endpoint to frontend directly
- Always create notifications from backend API routes
- Validate userId/providerId on backend
- Implement rate limiting in production

---

## Testing with cURL

```bash
# Get notifications
curl -H "Cookie: [session-cookie]" http://localhost:3000/api/notifications

# Mark as read
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"read":true}' \
  http://localhost:3000/api/notifications/507f1f77bcf86cd799439011

# Delete
curl -X DELETE http://localhost:3000/api/notifications/507f1f77bcf86cd799439011
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications showing | Check if notifications were created in MongoDB |
| Badge count not updating | Verify polling interval (30s), check network tab |
| "Unauthorized" error | Ensure user is logged in via Clerk |
| Notifications not deleted | Check if user is the owner or admin |
| Performance issues | Add MongoDB indexes, increase polling interval |
