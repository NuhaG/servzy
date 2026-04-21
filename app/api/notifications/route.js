import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import Provider from "@/models/Provider";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// GET all notifications for user
export async function GET(req) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    console.log("[GET /api/notifications] User:", { userId: user._id, role: user.role, clerkId: user.clerkId });

    // Build query based on user role and provider status
    let query = {};
    
    // Check if this user has a Provider document
    const providerDoc = await Provider.findOne({ clerkId: user.clerkId }).select("_id").lean();
    
    const isAdmin = hasRole(user, [ROLES.ADMIN]);
    const isProvider = hasRole(user, [ROLES.PROVIDER]) || Boolean(providerDoc?._id);

    if (isAdmin) {
      // Admins see ALL notifications
      console.log("[GET /api/notifications] Admin - returning all notifications");
      query = {}; // No filter - get everything
    } else if (isProvider) {
      // User has provider profile - show ONLY service request notifications
      console.log("[GET /api/notifications] Provider - showing ONLY service request notifications");
      if (!providerDoc?._id) {
        return NextResponse.json({
          notifications: [],
          total: 0,
          unreadCount: 0,
        });
      }
      query = { providerId: providerDoc._id, type: "service_request" };
    } else {
      // Regular user - show only their notifications
      console.log("[GET /api/notifications] User - showing user notifications");
      query = { userId: user._id };
    }
    
    console.log("[GET /api/notifications] Query:", JSON.stringify(query));

    if (unreadOnly) {
      query.isRead = false;
    }

    console.log("[GET /api/notifications] Final query:", JSON.stringify(query));

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    console.log("[GET /api/notifications] Results - found:", notifications.length, "total:", total, "unread:", unreadCount);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// CREATE notification
export async function POST(req) {
  try {
    // Optionally secure this route if it should only be called internally
    // For now, ensuring we have a session to block purely unauthenticated spam
    const { userId: sessionUserId } = await getSessionUser({ createIfMissing: false });
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { userId, providerId, adminId, bookingId, title, message, type, actionUrl, metadata, actionStatus } = body;

    // Validate that exactly ONE recipient is specified
    const recipientCount = [userId, providerId, adminId].filter(r => r).length;
    if (recipientCount !== 1) {
      return NextResponse.json(
        { error: "Exactly one recipient (userId, providerId, or adminId) is required" },
        { status: 400 }
      );
    }

    if (!message || !type) {
      return NextResponse.json(
        { error: "message and type are required" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      userId: userId || undefined,
      providerId: providerId || undefined,
      adminId: adminId || undefined,
      bookingId,
      title,
      message,
      type,
      actionUrl,
      actionStatus: actionStatus || "pending",
      metadata,
    });

    console.log("[POST /api/notifications] Created notification:", {
      id: notification._id,
      userId: notification.userId,
      providerId: notification.providerId,
      adminId: notification.adminId,
      type: notification.type
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Notification POST error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
