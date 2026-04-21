import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";
import User from "@/models/User";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// PATCH notification action (accept/reject service request)
export async function PATCH(req, { params }) {
  try {
    const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
    if (!sessionUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { notificationId } = await params;
    const { action } = await req.json(); // 'accept' or 'reject'

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Only providers can take action on service_request notifications
    if (notification.type !== "service_request") {
      return NextResponse.json(
        { error: "Invalid action for this notification type" },
        { status: 400 }
      );
    }

    // Check that the current user is a provider and owns this notification
    if (user.role !== "provider") {
      return NextResponse.json(
        { error: "Forbidden: Only providers can accept/reject notifications" },
        { status: 403 }
      );
    }

    const providerDoc = await Provider.findOne({ clerkId: user.clerkId }).select("_id").lean();
    if (!providerDoc || String(notification.providerId) !== String(providerDoc._id)) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized for this notification" },
        { status: 403 }
      );
    }

    // Check if action is already taken
    if (notification.actionStatus !== "pending") {
      return NextResponse.json(
        { error: "This action has already been taken" },
        { status: 400 }
      );
    }

    // Find the associated booking
    if (!notification.bookingId) {
      return NextResponse.json(
        { error: "No booking associated with this notification" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(notification.bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Get provider and user info for notification
    const provider = await Provider.findById(booking.providerId);
    const userData = await User.findById(booking.userId);

    // Update notification action status
    const newActionStatus = action === "accept" ? "accepted" : "rejected";
    notification.actionStatus = newActionStatus;
    notification.isRead = true;
    await notification.save();

    // Update booking status
    const newBookingStatus = action === "accept" ? "accepted" : "rejected";
    booking.status = newBookingStatus;
    await booking.save();

    // Send notification to user
    const providerName = provider?.businessName || "The provider";
    const notificationMessage = action === "accept"
      ? `${providerName} has accepted your service request. You can now proceed to payment.`
      : `${providerName} has rejected your service request.`;

    const notificationTitle = action === "accept"
      ? "Request Accepted ✅"
      : "Request Rejected ❌";

    const userNotification = await Notification.create({
      userId: booking.userId,
      bookingId: booking._id,
      title: notificationTitle,
      message: notificationMessage,
      type: "service_request",
      actionStatus: newActionStatus,
      actionUrl: `/user/bookings`,
    });

    return NextResponse.json(
      {
        notification,
        booking,
        userNotification,
        message: `Service request ${action}ed successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Notification action error:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
