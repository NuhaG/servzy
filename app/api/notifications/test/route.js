import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/rbac";

// TEST endpoint - creates a test notification for current user
export async function GET(req) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    console.log("Creating test notification for user:", user._id, "Role:", user.role);

    // Create test notification
    const notification = await Notification.create({
      userId: user._id,
      title: "🎉 Test Notification",
      message: "This is a test notification. If you see this, the system works!",
      type: "request_sent",
      read: false,
      actionUrl: "/services",
      metadata: { test: true, createdAt: new Date() }
    });

    console.log("Test notification created:", notification._id);

    // Fetch all notifications for user
    const allNotifications = await Notification.find({ userId: user._id });
    
    return NextResponse.json({
      success: true,
      message: "Test notification created successfully",
      createdNotification: notification,
      allUserNotifications: allNotifications,
      totalNotifications: allNotifications.length,
      userId: user._id,
      userRole: user.role
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create test notification",
        details: error.message
      },
      { status: 500 }
    );
  }
}
