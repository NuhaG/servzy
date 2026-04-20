import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

const STATUS_TRANSITIONS = {
    pending: ["accepted", "rejected", "cancelled"],
    accepted: ["completed", "cancelled"],
};

// PATCH booking status (provider flow: pending -> accepted -> completed)
export async function PATCH(req, { params }) {
    try {
        const { userId, user } = await getSessionUser({ createIfMissing: true });
        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasRole(user, [ROLES.PROVIDER, ROLES.ADMIN])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { bookingId } = await params;
        const { status } = await req.json();

        if (!["accepted", "rejected", "completed", "cancelled"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status value" },
                { status: 400 }
            );
        }

        // find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // check provider exists and is approved
        const provider = await Provider.findById(booking.providerId);
        if (!provider || provider.blocked === true || provider.status === "blocked") {
            return NextResponse.json(
                { error: "Provider not authorized" },
                { status: 403 }
            );
        }

        if (!hasRole(user, [ROLES.ADMIN]) && provider.clerkId !== user.clerkId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const allowedNextStatuses = STATUS_TRANSITIONS[booking.status] || [];

        if (!allowedNextStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Cannot change booking from ${booking.status} to ${status}` },
                { status: 400 }
            );
        }

        // Check if trying to mark as completed without payment verification
        if (status === "completed" && booking.paymentStatus !== "paid") {
            return NextResponse.json(
                { error: "Payment must be verified before marking as completed" },
                { status: 400 }
            );
        }

        booking.status = status;
        await booking.save();

        // Keep the provider-facing request notification in sync when handled from bookings page.
        if (["accepted", "rejected", "cancelled", "completed"].includes(status)) {
            const actionStatusMap = {
                accepted: "accepted",
                rejected: "rejected",
            };

            const providerNotificationUpdate = {
                isRead: true,
            };

            if (actionStatusMap[status]) {
                providerNotificationUpdate.actionStatus = actionStatusMap[status];
            }

            await Notification.updateMany(
                {
                    bookingId: booking._id,
                    providerId: booking.providerId,
                    type: "service_request",
                },
                { $set: providerNotificationUpdate }
            );
        }

        // Send notification to user when status changes
        try {
            if (status === "accepted") {
                // Get provider name for notification
                const providerName = provider?.businessName || "The provider";
                
                await Notification.create({
                    userId: booking.userId,
                    bookingId: booking._id,
                    title: "Request Accepted ✅",
                    message: `${providerName} has accepted your service request. You can now proceed to payment.`,
                    type: "service_request",
                    actionStatus: "accepted",
                    actionUrl: `/user/bookings`,
                });
            } else if (status === "rejected") {
                // Get provider name for notification
                const providerName = provider?.businessName || "The provider";
                
                await Notification.create({
                    userId: booking.userId,
                    bookingId: booking._id,
                    title: "Request Rejected ❌",
                    message: `${providerName} has rejected your service request.`,
                    type: "service_request",
                    actionStatus: "rejected",
                    actionUrl: `/user/bookings`,
                });
            }
        } catch (notifErr) {
            console.error("Failed to create user notification:", notifErr);
            // Don't fail the request if notification creation fails
        }

        return NextResponse.json(booking, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update booking status" },
            { status: 500 }
        );
    }
}
