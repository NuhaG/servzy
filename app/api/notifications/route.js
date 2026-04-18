import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
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

    // Build query - get notifications where user is either the userId or providerId
    let query = {
      $or: [
        { userId: user._id },
        { providerId: user._id }
      ]
    };

    if (unreadOnly) {
      query.read = false;
    }

    // Get notifications without populating to avoid errors
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, read: false });

    console.log("Notifications API - User:", user._id, "Query:", JSON.stringify(query), "Found:", notifications.length, "Unread:", unreadCount);

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

// CREATE notification (internal use)
export async function POST(req) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { userId, providerId, bookingId, title, message, type, actionUrl, metadata } = body;

    if (!userId && !providerId) {
      return NextResponse.json(
        { error: "Either userId or providerId required" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      userId: userId || undefined,
      providerId: providerId || undefined,
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
