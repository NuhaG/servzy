import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import Provider from "@/models/Provider";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// PATCH - update notification (mark as read, etc.)
export async function PATCH(req, { params }) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { notificationId } = await params;
    const body = await req.json();
    const { isRead } = body;

    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify user has permission to update this notification based on role
    let canUpdate = false;
    
    if (hasRole(user, [ROLES.ADMIN])) {
      canUpdate = true;
    } else if (user.role === "provider") {
      // Provider can only update provider notifications for their account
      const providerDoc = await Provider.findOne({ clerkId: user.clerkId }).select("_id").lean();
      canUpdate = providerDoc && String(notification.providerId) === String(providerDoc._id);
    } else if (user.role === "user") {
      // User can only update their own user notifications
      canUpdate = String(notification.userId) === String(user._id);
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update fields
    if (typeof isRead !== "undefined") {
      notification.isRead = isRead;
    }

    await notification.save();

    return NextResponse.json(notification, { status: 200 });
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - delete notification
export async function DELETE(req, { params }) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { notificationId } = await params;

    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify user has permission to delete this notification based on role
    let canDelete = false;
    
    if (hasRole(user, [ROLES.ADMIN])) {
      canDelete = true;
    } else if (user.role === "provider") {
      // Provider can only delete provider notifications for their account
      const providerDoc = await Provider.findOne({ clerkId: user.clerkId }).select("_id").lean();
      canDelete = providerDoc && String(notification.providerId) === String(providerDoc._id);
    } else if (user.role === "user") {
      // User can only delete their own user notifications
      canDelete = String(notification.userId) === String(user._id);
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);

    return NextResponse.json(
      { message: "Notification deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Notification DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
