import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// PATCH - mark as read or update notification
export async function PATCH(req, { params }) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const { isRead } = body; // updated to use isRead

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Check authorization: user can only modify their own notification, or admins can modify anything
    const isOwner =
      String(notification.userId) === String(user._id) ||
      String(notification.providerId) === String(user._id) || 
      String(notification.adminId) === String(user._id);

    if (!isOwner && !hasRole(user, [ROLES.ADMIN])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (typeof isRead === "boolean") {
      notification.isRead = isRead;
    }

    await notification.save();

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Notification PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - remove notification
export async function DELETE(req, { params }) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Check authorization
    const isOwner =
      String(notification.userId) === String(user._id) ||
      String(notification.providerId) === String(user._id) || 
      String(notification.adminId) === String(user._id);

    if (!isOwner && !hasRole(user, [ROLES.ADMIN])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Notification.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
