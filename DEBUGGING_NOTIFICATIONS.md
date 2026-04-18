# 🔧 Notification System - Debugging Guide

## Quick Test (30 seconds)

### Step 1: Test the API directly
Open your browser console and run:

```javascript
// Test 1: Create a notification
fetch('/api/notifications/test').then(r => r.json()).then(d => console.log(d))

// Test 2: Fetch notifications after 2 seconds
setTimeout(() => {
  fetch('/api/notifications').then(r => r.json()).then(d => console.log(d))
}, 2000)
```

### Step 2: Check if bell icon appears
- Look for 🔔 bell icon in the navbar next to user avatar
- If not visible, check browser console for errors

### Step 3: Check the dropdown
- Click the bell icon
- If you see notifications, the system works! ✅
- If dropdown is empty, notifications weren't created

---

## Common Issues & Fixes

### Issue 1: "Bell icon not showing"

**Cause:** NotificationBell component not imported or AppNav not updated

**Fix:** Verify `components/AppNav.jsx` has:
```javascript
import NotificationBell from "@/components/NotificationBell";

// And in the JSX (after line 42):
<NotificationBell />
```

**Test:** Check browser console - should see logs from NotificationBell

---

### Issue 2: "Dropdown shows but no notifications"

**This is the main issue!** Notifications aren't being created or fetched.

**Step 1: Verify API is working**
```bash
# In browser console
fetch('/api/notifications/test').then(r => r.json()).then(d => console.log(d))
```

Expected response:
```json
{
  "success": true,
  "message": "Test notification created successfully",
  "createdNotification": { ... },
  "allUserNotifications": [ ... ],
  "totalNotifications": 1,
  "userId": "..." 
}
```

**Step 2: If test works but no notifications show**
- Hard refresh page (Ctrl+Shift+R)
- Check console logs - should see "Notifications loaded:"
- Verify unreadCount is > 0

**Step 3: If test fails**
- Check if you're logged in (should see user avatar)
- Try logging out and back in
- Check browser storage/cookies

---

### Issue 3: "Getting 401 Unauthorized"

**Cause:** Session not authenticated

**Fix:**
1. Check if Clerk auth is working (user should see avatar in navbar)
2. Check if `/api/me` endpoint works:
   ```javascript
   fetch('/api/me').then(r => r.json()).then(d => console.log(d))
   ```
3. If no user object, try re-authenticating

---

### Issue 4: "Getting 500 error"

**Cause:** Backend error

**Action:**
1. Check server terminal for error logs
2. Verify MongoDB connection
3. Check if Notification model is imported correctly
4. Try the test endpoint: `/api/notifications/test`

---

## Complete Testing Workflow

### Test 1: Verify Backend Setup
```javascript
// Open browser console while logged in
fetch('/api/notifications/test')
  .then(r => r.json())
  .then(data => {
    console.log('Created notification:', data.createdNotification._id);
    console.log('Total for user:', data.totalNotifications);
    console.log('User ID:', data.userId);
    console.log('User role:', data.userRole);
  })
```

### Test 2: Verify Frontend immediately loads it
```javascript
// Wait 1 second, then check if it appears in the dropdown
setTimeout(() => {
  fetch('/api/notifications?limit=10')
    .then(r => r.json())
    .then(data => {
      console.log('Unread count:', data.unreadCount);
      console.log('Notifications:', data.notifications);
    })
}, 1000)
```

### Test 3: Reload and verify it persists
- Reload the page (F5)
- Check if notification is still there
- If yes, system is working! ✅

---

## Manual Notification Creation (MongoDB)

If API isn't creating notifications, test directly in MongoDB:

```javascript
// In MongoDB console
db.notifications.insertOne({
  userId: ObjectId("YOUR-USER-ID"),
  title: "Manual Test",
  message: "This notification was created manually",
  type: "request_sent",
  read: false,
  createdAt: new Date()
})
```

Then reload the page and check if it appears.

---

## Advanced Debugging

### Enable verbose logging
Add this to NotificationBell component at the top of the file after `useRef`:

```javascript
// Add console logging
useEffect(() => {
  console.log('NotificationBell mounted, loading notifications immediately...');
  loadNotifications();
  
  const interval = setInterval(() => {
    console.log('Polling for notifications...');
    loadNotifications();
  }, 15000);
  
  return () => {
    console.log('NotificationBell unmounting');
    clearInterval(interval);
  };
}, []);
```

### Check Network Activity
1. Open DevTools → Network tab
2. Filter by "notifications"
3. Click bell icon
4. Should see request to `/api/notifications`
5. Check response - should have `notifications` array and `unreadCount`

### Check MongoDB directly
```bash
# Connect to MongoDB and check:
db.notifications.countDocuments()                    # Total notifications
db.notifications.countDocuments({read: false})       # Unread
db.notifications.find({userId: ObjectId("...")})     # For specific user
```

---

## Step-by-Step Fix Checklist

- [ ] Bell icon 🔔 visible in navbar
- [ ] Can click bell and dropdown opens
- [ ] Run test endpoint: `/api/notifications/test`
- [ ] Check console for "Notifications loaded:" logs
- [ ] Reload page and verify notification persists
- [ ] Mark notification as read (click it)
- [ ] Delete notification (hover → click ✕)
- [ ] Unread count updates correctly

---

## If Still Not Working

### Option 1: Complete Reset
1. Delete all notifications from MongoDB
2. Restart server (`npm run dev`)
3. Hard refresh browser (Ctrl+Shift+R)
4. Run test endpoint again

### Option 2: Check Imports
Verify these exist:
- ✅ `models/Notification.js`
- ✅ `app/api/notifications/route.js`
- ✅ `app/api/notifications/[id]/route.js`
- ✅ `components/NotificationBell.jsx`
- ✅ Updated `components/AppNav.jsx`

### Option 3: Server Logs
In terminal where `npm run dev` is running:
```
// You should see:
Notifications loaded: { notifications: [...], unreadCount: 0 }
```

If you don't see this, notifications aren't being fetched.

---

## Performance Check

- [ ] Bell icon appears instantly
- [ ] Dropdown opens within 100ms
- [ ] Notifications load within 1 second
- [ ] Marking as read is instant
- [ ] Deleting is instant

If slow, check:
- Network tab for slow requests
- MongoDB indexes (see NOTIFICATION_SYSTEM.md)
- Server CPU/memory

---

## Success Criteria

✅ You'll know it's working when:
1. Bell icon shows in navbar
2. Can see test notification in dropdown
3. Badge shows unread count
4. Clicking notification marks it as read
5. Deleting removes it from list
6. Hard refresh shows persisted notifications

---

## Quick Links

- API Reference: See `API_DOCUMENTATION.md`
- Implementation: See `INTEGRATION_EXAMPLE.js`
- Full Guide: See `NOTIFICATION_SYSTEM.md`
- Quick Start: See `QUICK_START.md`
