# Notification System - Quick Start Guide

## ✅ What's Been Created

### 1. **Database Model**
- `models/Notification.js` - MongoDB schema for notifications

### 2. **Backend API Routes**
- `app/api/notifications/route.js` - GET all notifications, POST create
- `app/api/notifications/[id]/route.js` - PATCH (mark read), DELETE

### 3. **Frontend Components**
- `components/NotificationBell.jsx` - Bell icon + dropdown panel
- Integrated in `components/AppNav.jsx`

### 4. **Helper Functions**
- `lib/notificationHelpers.js` - Convenient notification creators

### 5. **Documentation**
- `NOTIFICATION_SYSTEM.md` - Complete implementation guide
- `API_DOCUMENTATION.md` - Detailed API reference
- `INTEGRATION_EXAMPLE.js` - Code examples for bookings API

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Database Indexes (Optional but Recommended)
In your MongoDB admin panel, create these indexes for performance:
```
Collection: notifications
Index 1: { userId: 1, read: 1 }
Index 2: { providerId: 1, read: 1 }
Index 3: { createdAt: -1 }
```

### Step 2: Test the Frontend
1. Start your dev server: `npm run dev`
2. Sign in as a user
3. Look for the 🔔 bell icon in the navbar (next to user avatar)
4. Click the bell - a dropdown should appear
5. It should show "No notifications yet"

### Step 3: Create Your First Notification (Backend)
Add this to any API route (e.g., after creating a booking):

```javascript
import Notification from "@/models/Notification";

await Notification.create({
  userId: userId,
  title: "Welcome!",
  message: "This is your first notification",
  type: "request_sent"
});
```

### Step 4: See It Work
1. Trigger the API that creates the notification
2. Check the bell icon - badge count should update
3. Click bell to see the notification
4. Click notification to mark it as read

---

## 🔧 Integration Steps

### Add Notifications to Booking Creation
**File:** `app/api/bookings/route.js`

After `const booking = await Booking.create({...})`, add:

```javascript
// Send notifications
try {
  const bookingUser = await User.findById(bookingUserId).select("name");
  
  // Notify user
  await Notification.create({
    userId: bookingUserId,
    bookingId: booking._id,
    title: "Service Request Sent",
    message: `Your request for "${service.title}" has been sent to ${provider.businessName}.`,
    type: "request_sent",
    actionUrl: `/user/bookings/${booking._id}`
  });

  // Notify provider
  await Notification.create({
    providerId: provider._id,
    bookingId: booking._id,
    title: "New Service Request",
    message: `${bookingUser.name} has requested your "${service.title}" service.`,
    type: "request_sent",
    actionUrl: `/provider/bookings`
  });
} catch (err) {
  console.error("Notification error:", err);
}
```

### Add to Booking Status Updates
**File:** Create/update `app/api/bookings/[id]/status/route.js`

```javascript
if (newStatus === "accepted") {
  await Notification.create({
    userId: booking.userId,
    bookingId: booking._id,
    title: "Request Accepted!",
    message: `${provider.businessName} has accepted your request.`,
    type: "request_accepted",
    actionUrl: `/user/bookings/${booking._id}`
  });
}

if (newStatus === "rejected") {
  await Notification.create({
    userId: booking.userId,
    title: "Request Declined",
    message: `${provider.businessName} cannot fulfill your request right now.`,
    type: "request_rejected"
  });
}
```

### Add to Payment Events
**File:** `app/api/payment/verify/route.js` (or your payment handler)

```javascript
// After payment success
await Notification.create({
  userId: booking.userId,
  bookingId: booking._id,
  title: "Payment Received",
  message: `Payment of ₹${booking.amount} confirmed.`,
  type: "payment_made"
});

await Notification.create({
  providerId: booking.providerId,
  bookingId: booking._id,
  title: "Payment Received",
  message: `You received ₹${booking.amount} from ${user.name}.`,
  type: "payment_received"
});
```

---

## 📝 Best Practices

### ✅ DO:
- Create notifications after important status changes
- Include `actionUrl` to link to related page
- Use appropriate notification type
- Wrap in try-catch so notifications don't crash bookings
- Test with sample data first

### ❌ DON'T:
- Create notifications for every small change
- Expose notification creation to frontend directly
- Create notifications without userId or providerId
- Forget error handling
- Assume notifications always succeed

---

## 🧪 Testing Checklist

- [ ] Bell icon shows in navbar when signed in
- [ ] Bell icon shows badge count when there are unread notifications
- [ ] Clicking bell opens dropdown
- [ ] Notifications appear in dropdown (create one manually via Mongoose)
- [ ] Clicking notification marks it as read (blue dot disappears)
- [ ] Deleting notification removes it from list
- [ ] Notifications update when you refresh (30-second polling)
- [ ] Different notification types show correct icons
- [ ] Timestamps format correctly ("5m ago", "2h ago", etc.)

---

## 📊 Monitoring

### Check Database
```javascript
// In MongoDB console
db.getCollection('notifications').find({read: false}).count()  // Unread count
db.getCollection('notifications').aggregate([                   // By user
  { $group: { _id: "$userId", count: { $sum: 1 } } }
])
```

### Check Logs
Look for notification errors in console (marked with "Notification error")

---

## 🎯 Next Features to Add

1. **Notification Preferences** - Let users choose notification types
2. **Email Notifications** - Send important events via email
3. **Notification Center** - Full-page notification history
4. **Real-time Updates** - Replace polling with WebSocket
5. **Sound Alerts** - Play notification sound
6. **Bulk Actions** - Mark all as read

---

## ❓ FAQ

**Q: Notifications not showing up?**  
A: 1) Check if they're being created in MongoDB  
   2) Check browser console for errors  
   3) Verify user is logged in (session exists)

**Q: How do I test without creating real bookings?**  
A: Use MongoDB directly to create test notifications:
```javascript
db.notifications.insertOne({
  userId: ObjectId("your-user-id"),
  title: "Test",
  message: "This is a test",
  type: "request_sent",
  read: false
})
```

**Q: Can I customize the bell icon?**  
A: Yes! Edit `NotificationBell.jsx` line 83-87 to change the emoji or icon

**Q: Will notifications persist on page reload?**  
A: Yes! They're fetched from the server each time

**Q: How many can I store?**  
A: No limit, but recommend archiving old ones for performance

---

## 🆘 Troubleshooting

**Problem:** "Module not found: Can't find Notification"  
**Solution:** Make sure `models/Notification.js` exists and is imported correctly

**Problem:** Notifications only show for one user  
**Solution:** Check `userId` vs `providerId` - make sure you're creating for the right recipient

**Problem:** Badge count stuck  
**Solution:** Check if polling is working (Network tab in DevTools), may need to clear cache

**Problem:** Dropdown appears but is empty  
**Solution:** Create a test notification manually in MongoDB

---

## 📞 Support

For issues:
1. Check `NOTIFICATION_SYSTEM.md` for implementation details
2. Review `API_DOCUMENTATION.md` for endpoint specs
3. Check browser console for client errors
4. Check server logs for backend errors
5. Verify MongoDB connection and collections exist

---

## 🎉 You're All Set!

The notification system is production-ready. Start by:
1. Testing the bell icon in navbar
2. Adding notifications to booking API
3. Watching them appear in real-time
4. Extending to other events (payments, reviews, complaints)

Happy notifying! 🚀
