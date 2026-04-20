import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import Provider from "@/models/Provider";
import User from "@/models/User";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";
import Notification from "@/models/Notification";

// CREATE booking
export async function POST(req) {
    try {
        const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
        if (!sessionUserId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasRole(user, [ROLES.USER, ROLES.ADMIN])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const body = await req.json();
        const { userId, serviceId, scheduledDate, timeSlot, notes, type = "one-time" } = body;
        const bookingUserId = hasRole(user, [ROLES.ADMIN]) && userId ? userId : user._id;

        if (!["one-time", "contract"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid booking type" },
                { status: 400 }
            );
        }

        // check service exists
        const service = await Service.findById(serviceId);

        if (!service || !service.isActive) {
            return NextResponse.json(
                { error: "Service not available" },
                { status: 404 }
            );
        }

        // check provider
        const provider = await Provider.findById(service.providerId);

        if (!provider || provider.blocked === true || provider.status === "blocked") {
            return NextResponse.json(
                { error: "Provider not available" },
                { status: 403 }
            );
        }

        // prevent booking clash
        const clash = await Booking.findOne({
            providerId: provider._id,
            scheduledDate,
            timeSlot,
            status: { $in: ["pending", "accepted"] }
        });

        if (clash) {
            return NextResponse.json(
                { error: "Time slot already booked" },
                { status: 400 }
            );
        }

        // create booking
        const amount =
            (provider.basePrice || service.price || 0) +
            (provider.bookingCharge || 0) +
            (provider.consultationFee || 0) +
            (provider.serviceFee || 0);

        const booking = await Booking.create({
            userId: bookingUserId,
            providerId: provider._id,
            serviceId,
            scheduledDate,
            timeSlot,
            notes,
            status: "pending",
            amount,
            type
        });

        // Get user details for notification
        const customerUser = await User.findById(bookingUserId);

        // dispatch notification to provider (service request)
        try {
            const notificationData = {
                providerId: provider._id,
                bookingId: booking._id,
                title: "New Service Request 🔔",
                message: `You have a new service request for "${service.title}". Review and accept or reject the request.`,
                type: "service_request",
                isRead: false,
                actionStatus: "pending",
                actionUrl: `/provider/bookings`,
                metadata: {
                    serviceId: service._id,
                    serviceName: service.title,
                    serviceDescription: service.description,
                    servicePrice: service.price,
                    scheduledDate: scheduledDate,
                    timeSlot: timeSlot,
                    amount: amount,
                    notes: notes,
                    customerId: bookingUserId,
                    customerName: customerUser?.name || "Unknown",
                    customerEmail: customerUser?.email || "N/A",
                    bookingId: booking._id,
                }
            };

            const notification = await Notification.create(notificationData);
            console.log("[Bookings] Service request notification created:", notification._id);
        } catch (notifErr) {
            console.error("[Bookings] Failed to create notification:", notifErr.message);
        }

        return NextResponse.json(booking, { status: 201 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
        );
    }
}


// GET bookings
export async function GET(req) {
    try {
        const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
        if (!sessionUserId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const providerId = searchParams.get("providerId");
        const isAdmin = hasRole(user, [ROLES.ADMIN]);
        const isProvider = hasRole(user, [ROLES.PROVIDER]);
        const isUser = hasRole(user, [ROLES.USER]);

        let query = {};

        if (isAdmin) {
            if (userId) query.userId = userId;
            if (providerId) query.providerId = providerId;
        } else if (isProvider) {
            const ownProvider = await Provider.findOne({ clerkId: user.clerkId }).select("_id").lean();
            if (!ownProvider?._id) {
                return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
            }
            if (providerId && providerId !== String(ownProvider._id)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            query.providerId = ownProvider._id;
        } else if (isUser) {
            if (userId && userId !== String(user._id)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            query.userId = user._id;
        } else {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const bookings = await Booking.find(query)
            .populate("serviceId", "title price")
            .populate("providerId", "businessName")
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        return NextResponse.json(bookings, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: 500 }
        );
    }
}
