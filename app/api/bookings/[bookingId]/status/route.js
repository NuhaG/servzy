import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";

// PATCH booking status (accept/reject)
export async function PATCH(req, { params }) {
    try {
        await connectDB();

        const { bookingId } = params;
        const { status } = await req.json();

        if (!["accepted", "rejected"].includes(status)) {
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
        if (!provider || provider.status !== "approved") {
            return NextResponse.json(
                { error: "Provider not authorized" },
                { status: 403 }
            );
        }

        // only pending bookings can be updated
        if (booking.status !== "pending") {
            return NextResponse.json(
                { error: "Only pending bookings can be updated" },
                { status: 400 }
            );
        }

        booking.status = status;
        await booking.save();

        return NextResponse.json(booking, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update booking status" },
            { status: 500 }
        );
    }
}