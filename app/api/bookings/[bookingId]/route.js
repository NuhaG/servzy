import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// GET single booking
export async function GET(req, { params }) {
    try {
        const { userId, user } = await getSessionUser({ createIfMissing: true });
        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { bookingId } = await params;

        const booking = await Booking.findById(bookingId)
            .populate("serviceId", "title price category")
            .populate("providerId", "businessName location")
            .populate("userId", "name email");

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        if (!hasRole(user, [ROLES.ADMIN])) {
            if (hasRole(user, [ROLES.USER]) && String(booking.userId?._id || booking.userId) !== String(user._id)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            if (hasRole(user, [ROLES.PROVIDER])) {
                const ownProvider = await Provider.findOne({ clerkId: user.clerkId }).select("_id").lean();
                if (!ownProvider?._id || String(booking.providerId?._id || booking.providerId) !== String(ownProvider._id)) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
            }
        }

        return NextResponse.json(booking, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch booking" },
            { status: 500 }
        );
    }
}
