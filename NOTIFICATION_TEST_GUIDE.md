# 🔔 Notification System - Complete Testing Guide

## Quick Start (5 minutes)

### Step 1: Open the Test Page
1. Open your app in a browser and **make sure you're logged in**
2. In the same browser window, open: `file:///c:/Users/Lenovo/Desktop/servzy/test-notifications.html`
   - Or copy `test-notifications.html` to your `public` folder and visit `/test-notifications.html`

### Step 2: Create a Test Notification
1. Click **"Create Test Notification"** button
2. Look at the result - it should show success ✅
3. Check the browser console (F12 → Console tab) for:
   ```
   Notifications loaded: { notifications: [...], unreadCount: 1, total: 1 }
   ```

### Step 3: Check Your App
1. Go back to your app tab
2. Look for the bell icon 🔔 in the top navigation
3. It should show a red badge with "1" (unread count)
4. Click the bell - you should see your test notification

---

## If Notifications Don't Appear

### Checklist:

**1. Are you logged in?**
- ✅ Must be signed in via Clerk
- ✅ AppNav should show "Dashboard" link (not Sign In)

**2. Check Console Logs (F12 → Console)**
- Look for any red error messages
- Look for "Notifications loaded:" messages
- If you see "Unauthorized" - authentication failed

**3. Test the API directly**
Run this in browser console while logged in:
```javascript
// This should return your notifications
fetch('/api/notifications').then(r => r.json()).then(d => console.log(d))
```

Expected output:
```javascript
{
  notifications: [...],
  total: 0,
  unreadCount: 0
}
```

**4. Test the Test Endpoint**
Run this in browser console:
```javascript
// This should create a test notification
fetch('/api/notifications/test').then(r => r.json()).then(d => console.log(d))
```

Expected output:
```javascript
{
  success: true,
  createdNotification: {...},
  totalNotifications: 1
}
```

---

## Troubleshooting

### Problem: "Unauthorized" Error

**Solution:**
1. Make sure you're logged in
2. Check that the `/api/me` endpoint returns your user info:
   ```javascript
   fetch('/api/me').then(r => r.json()).then(d => console.log(d))
   ```
3. Should show your user details with a `_id` and `role`

### Problem: Test Endpoint Works but Notifications Don't Show in Bell

**Solution:**
1. Clear browser cache: **Ctrl + Shift + R** (hard refresh)
2. Restart your dev server: **Ctrl + C** and then run it again
3. Make sure NotificationBell component is imported in AppNav ✅
4. Check if you're on a page where AppNav is rendered (not sign-in page)

### Problem: Error in Console about "getSessionUser"

**Solution:**
1. Check that `lib/auth.js` has the `getSessionUser` function
2. Check that `lib/rbac.js` exports `getSessionUser` and `hasRole`
3. Verify your user session is properly created

### Problem: Notifications Show, but Don't Update Automatically

**Solution:**
1. The bell polls every 15 seconds - wait up to 15 seconds
2. Click the bell to manually refresh
3. Check Network tab to see if API calls are being made

---

## API Endpoints Reference

### GET /api/notifications
Fetch all notifications for current user
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/notifications?limit=10"
```

Response:
```json
{
  "notifications": [...],
  "total": 5,
  "unreadCount": 2
}
```

### POST /api/notifications
Create a notification (use from API or internal)
```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "title": "Test",
    "message": "Test message",
    "type": "request_sent"
  }'
```

### GET /api/notifications/test
Create a test notification for the current user
```bash
curl "http://localhost:3000/api/notifications/test"
```

### PATCH /api/notifications/:id
Mark notification as read
```bash
curl -X PATCH "http://localhost:3000/api/notifications/NOTIFICATION_ID" \
  -H "Content-Type: application/json" \
  -d '{"read": true}'
```

### DELETE /api/notifications/:id
Delete a notification
```bash
curl -X DELETE "http://localhost:3000/api/notifications/NOTIFICATION_ID"
```

---

## Manual Testing in Browser Console

### 1. Create Multiple Test Notifications
```javascript
for (let i = 0; i < 5; i++) {
  fetch('/api/notifications/test').then(r => r.json()).then(d => {
    console.log('Created notification', i+1, d.createdNotification?.title);
  });
}
```

### 2. Fetch and Display All
```javascript
fetch('/api/notifications?limit=50').then(r => r.json()).then(d => {
  console.table(d.notifications.map(n => ({
    title: n.title,
    type: n.type,
    read: n.read,
    created: new Date(n.createdAt).toLocaleString()
  })));
});
```

### 3. Mark All as Read
```javascript
fetch('/api/notifications?limit=50').then(r => r.json()).then(async d => {
  for (const notif of d.notifications) {
    if (!notif.read) {
      await fetch(`/api/notifications/${notif._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
    }
  }
  console.log('All marked as read');
});
```

### 4. Delete All Notifications
```javascript
fetch('/api/notifications?limit=50').then(r => r.json()).then(async d => {
  for (const notif of d.notifications) {
    await fetch(`/api/notifications/${notif._id}`, { method: 'DELETE' });
  }
  console.log('All deleted');
});
```

---

## Database Debugging (MongoDB)

### Check All Notifications
```javascript
db.notifications.find({}).pretty()
```

### Find Notifications for a User
```javascript
db.notifications.find({ userId: ObjectId("USER_ID") }).pretty()
```

### Count Notifications by Type
```javascript
db.notifications.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } }
])
```

### Delete All Test Notifications
```javascript
db.notifications.deleteMany({ "metadata.test": true })
```

---

## Component Architecture

```
AppNav (components/AppNav.jsx)
  └─ NotificationBell (components/NotificationBell.jsx)
      ├─ Polls /api/notifications every 15 seconds
      ├─ Shows bell icon with unread badge 🔔
      └─ Dropdown with last 10 notifications
          ├─ Click notification to mark as read
          └─ ✕ button to delete

API Routes
  ├─ GET /api/notifications → Fetch notifications
  ├─ POST /api/notifications → Create notification
  ├─ PATCH /api/notifications/:id → Mark as read
  ├─ DELETE /api/notifications/:id → Delete
  └─ GET /api/notifications/test → Create test notification

Database
  └─ Notification MongoDB Collection
      ├─ userId or providerId (flexible recipient)
      ├─ title, message, type
      ├─ read (boolean)
      └─ timestamps
```

---

## Success Criteria

✅ **System is working if:**
1. Bell icon appears in navigation when signed in
2. Test endpoint creates notifications
3. Notifications appear in bell dropdown
4. Unread badge shows correct count
5. Clicking notification marks it as read
6. Console shows "Notifications loaded:" messages

❌ **Check these if something fails:**
1. Browser console for errors (F12)
2. Network tab for failed API calls (F12 → Network)
3. Verify logged-in status
4. Check that MongoDB is running
5. Restart dev server

---

## Support

If you're still having issues:
1. Share the console errors from F12
2. Show the Network tab API response
3. Confirm you're logged in with a role (user/provider/admin)
4. Check if test endpoint works: `/api/notifications/test`

Try the steps in order - most issues are resolved by the second step! 🎯
