import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/rbac";

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

    // Build query - get notifications where the current user is the target
    // They can receive notifications as a User, Provider, or Admin.
    let query = {
      $or: [
        { userId: user._id },
        { providerId: user._id },
        { adminId: user._id }
      ]
    };

    if (unreadOnly) {
      query.isRead = false; // changed from read to isRead based on requirements
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error("Notification GET error:", error);
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
    const { userId, providerId, adminId, bookingId, title, message, type, actionUrl, metadata } = body;

    if (!userId && !providerId && !adminId) {
      return NextResponse.json(
        { error: "At least one target (userId, providerId, or adminId) is required" },
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
      metadata,
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
