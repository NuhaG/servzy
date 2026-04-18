/**
 * INTEGRATION GUIDE: How to Add Notifications to Bookings API
 * 
 * Add this code to app/api/bookings/route.js right after creating a booking
 */

// Step 1: Add import at the top of app/api/bookings/route.js
import Notification from "@/models/Notification";
import User from "@/models/User"; // if not already imported

// Step 2: After const booking = await Booking.create({...}) add this:

// ─── Send Notifications ────────────────────────────────────────
try {
  const bookingUser = await User.findById(bookingUserId).select("name email");
  
  // Notify user
  await Notification.create({
    userId: bookingUserId,
    bookingId: booking._id,
    title: "Service Request Sent",
    message: `Your request for "${service.title}" has been sent to ${provider.businessName}. They will respond within 24 hours.`,
    type: "request_sent",
    actionUrl: `/user/bookings/${booking._id}`,
    metadata: { serviceName: service.title, providerName: provider.businessName }
  });

  // Notify provider
  await Notification.create({
    providerId: provider._id,
    bookingId: booking._id,
    title: "New Service Request",
    message: `${bookingUser.name} has requested your "${service.title}" service on ${new Date(scheduledDate).toLocaleDateString()}.`,
    type: "request_sent",
    actionUrl: `/provider/bookings/${booking._id}`,
    metadata: { userName: bookingUser.name, serviceName: service.title, scheduledDate }
  });

  console.log("Notifications sent for booking:", booking._id);
} catch (notifError) {
  console.error("Error sending notifications:", notifError);
  // Don't fail the booking creation if notifications fail
}

// ────────────────────────────────────────────────────────────────

// Full example of updated booking creation:
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

        const service = await Service.findById(serviceId);
        if (!service || !service.isActive) {
            return NextResponse.json(
                { error: "Service not available" },
                { status: 404 }
            );
        }

        const provider = await Provider.findById(service.providerId);
        if (!provider || provider.blocked === true || provider.status === "blocked") {
            return NextResponse.json(
                { error: "Provider not available" },
                { status: 403 }
            );
        }

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

        // ━━━ ADD NOTIFICATIONS HERE ━━━
        try {
          const bookingUser = await User.findById(bookingUserId).select("name email");
          
          await Notification.create({
            userId: bookingUserId,
            bookingId: booking._id,
            title: "Service Request Sent",
            message: `Your request for "${service.title}" has been sent to ${provider.businessName}. They will respond within 24 hours.`,
            type: "request_sent",
            actionUrl: `/user/bookings/${booking._id}`,
          });

          await Notification.create({
            providerId: provider._id,
            bookingId: booking._id,
            title: "New Service Request",
            message: `${bookingUser.name} has requested your "${service.title}" service.`,
            type: "request_sent",
            actionUrl: `/provider/bookings/${booking._id}`,
          });
        } catch (notifError) {
          console.error("Error sending notifications:", notifError);
        }
        // ━━━━━━━━━━━━━━━━━━━━━━━━━

        return NextResponse.json(booking, { status: 201 });

    } catch (error) {
        console.error("Booking creation error:", error);
        return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
        );
    }
}
