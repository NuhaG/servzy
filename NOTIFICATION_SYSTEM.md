# Notification System Implementation Guide for Servzy

## Overview
The notification system is fully integrated with MongoDB, Next.js API routes, and React components. It supports real-time notifications with badges, read/unread status, and filtering by type.

## Architecture

### 1. Database Model (models/Notification.js)
- Stores notifications in MongoDB with:
  - `userId` / `providerId`: Who receives the notification
  - `bookingId`: Related booking (optional)
  - `type`: notification category
  - `read`: unread status
  - `createdAt`: timestamp for sorting

### 2. API Endpoints

#### GET /api/notifications
Fetch notifications for current user
```javascript
// Parameters:
// - unreadOnly=true (optional): get only unread
// - limit=20 (optional): max results
// - skip=0 (optional): pagination

const res = await fetch("/api/notifications?unreadOnly=true&limit=10");
const { notifications, total, unreadCount } = await res.json();
```

#### POST /api/notifications
Create a notification (backend use)
⚠️ Only use from backend API routes

#### PATCH /api/notifications/:id
Mark notification as read
```javascript
await fetch(`/api/notifications/${notificationId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ read: true })
});
```

#### DELETE /api/notifications/:id
Delete a notification
```javascript
await fetch(`/api/notifications/${notificationId}`, {
  method: "DELETE"
});
```

### 3. Frontend Components

#### NotificationBell Component
Located at: `components/NotificationBell.jsx`

Features:
- Bell icon with unread count badge
- Dropdown panel showing 10 recent notifications
- Auto-refresh every 30 seconds
- Mark as read on click
- Delete notifications
- Time formatting (e.g., "5m ago")

Usage in AppNav:
```javascript
import NotificationBell from "@/components/NotificationBell";

<NotificationBell />
```

## Usage Examples

### 1. Send Notification When Booking is Created
In `app/api/bookings/route.js`:
```javascript
import { createNotification } from "@/lib/notificationHelpers";

// After creating booking...
const user = await User.findById(bookingUserId).select("name");
const provider = await Provider.findById(providerId).select("businessName");
const service = await Service.findById(serviceId).select("title");

// Notify user
await createNotification({
  userId: bookingUserId,
  bookingId: booking._id,
  title: "Booking Created",
  message: `Your booking for "${service.title}" with ${provider.businessName} is pending.`,
  type: "request_sent",
  actionUrl: `/user/bookings/${booking._id}`
});

// Notify provider
await createNotification({
  providerId,
  bookingId: booking._id,
  title: "New Service Request",
  message: `${user.name} has requested your "${service.title}" service.`,
  type: "request_sent",
  actionUrl: `/provider/bookings`
});
```

### 2. Send Notification When Booking Status Changes
In booking status update API:
```javascript
import { notifyRequestAccepted } from "@/lib/notificationHelpers";

// When provider accepts booking
if (newStatus === "accepted") {
  const user = await User.findById(booking.userId).select("name");
  const service = await Service.findById(booking.serviceId).select("title");
  const provider = await Provider.findById(booking.providerId).select("businessName");
  
  await notifyRequestAccepted(
    booking.userId,
    service.title,
    provider.businessName,
    booking._id
  );
}
```

### 3. Send Notification on Payment
In payment verification API:
```javascript
import { notifyPaymentMade, notifyPaymentReceived } from "@/lib/notificationHelpers";

// Notify user
await notifyPaymentMade(booking.userId, booking.amount, service.title);

// Notify provider
await notifyPaymentReceived(
  booking.providerId,
  booking.amount,
  user.name,
  service.title
);
```

### 4. Send Notification for Reviews
In review creation API:
```javascript
import { notifyReviewReceived } from "@/lib/notificationHelpers";

await notifyReviewReceived(
  provider._id,
  user.name,
  review.rating,
  service.title
);
```

## Notification Types

| Type | Icon | Use Case |
|------|------|----------|
| `request_sent` | 📤 | User sends service request |
| `request_accepted` | ✅ | Provider accepts request |
| `request_rejected` | ❌ | Provider rejects request |
| `payment_made` | 💳 | User makes payment |
| `payment_received` | 💰 | Provider receives payment |
| `service_scheduled` | 📅 | Service date confirmed |
| `warning` | ⚠️ | System warning |
| `review_received` | ⭐ | Provider receives review |
| `complaint_filed` | 📋 | Complaint registered |

## Frontend Integration Points

### 1. Update Notifications When Event Occurs
After any significant user action, refresh notifications:
```javascript
// In any component
const handleBooking = async () => {
  // ... create booking ...
  
  // Refresh notifications (optional - they update every 30s)
  window.dispatchEvent(new Event("notificationsChanged"));
};
```

### 2. Real-time Updates (Optional Enhancement)
Add WebSocket support in the future:
```javascript
// Future enhancement with Socket.IO
useEffect(() => {
  const socket = io(process.env.NEXT_PUBLIC_WS_URL);
  socket.on("newNotification", (notif) => {
    setNotifications(prev => [notif, ...prev]);
  });
  return () => socket.disconnect();
}, []);
```

## Security Considerations

✅ **Implemented:**
- User can only see their own notifications
- Provider can only see their own notifications
- Admins can access any user's notifications
- Notifications are marked as read/unread per user
- Delete operations are authorized

## Testing the System

1. **Create a booking** → User and provider receive notifications
2. **Accept booking** → User receives "accepted" notification
3. **Click notification bell** → See dropdown with recent notifications
4. **Click notification** → Marks as read (blue dot disappears)
5. **Delete notification** → Hover and click ✕ icon
6. **Badge count** → Shows unread count, updates in real-time

## Performance Optimization

- Notifications are polled every 30 seconds (configurable)
- Only 10 most recent notifications shown in dropdown
- Pagination available via `skip` and `limit` params
- Indexes recommended on userId, providerId, read fields

## Future Enhancements

1. **Email Notifications** - Send email for important events
2. **SMS Notifications** - Send SMS for critical updates
3. **WebSocket Real-time** - Instant notifications without polling
4. **Notification Preferences** - Let users choose what they want to be notified about
5. **Notification Archive** - Separate page to view all past notifications
6. **Sound Alert** - Play sound for new notifications
7. **Bulk Mark as Read** - "Mark all as read" button
8. **Notification Categories** - Filter notifications by type
