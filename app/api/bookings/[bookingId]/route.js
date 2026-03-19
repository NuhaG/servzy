import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";

// GET single booking
export async function GET(req, { params }) {
    try {
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

        return NextResponse.json(booking, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch booking" },
            { status: 500 }
        );
    }
}
