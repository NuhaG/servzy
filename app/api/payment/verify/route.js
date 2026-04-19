import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Notification from "@/models/Notification";

export async function POST(request) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const payload = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, bookingId, bookingId } = payload;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
        }

        // If bookingId is provided, verify the booking is accepted
        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return NextResponse.json({ error: "Booking not found" }, { status: 404 });
            }
            if (booking.status !== "accepted") {
                return NextResponse.json(
                    { error: "Payment can only be made after the provider accepts your booking request." },
                    { status: 400 }
                );
            }
        }

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment verified successfully
            // Here you can update your database, e.g., mark booking as paid

            // dispatch notification
            try {
                // If you pass bookingId or amount in the request payload, use them here.
                // Assuming client passes them or we notify generally since payment verified:
                // amount and bookingId are extracted from the initial request payload
                
                await Notification.create({
                    userId: user._id, 
                    bookingId: bookingId || undefined,
                    title: "Payment Successful",
                    message: amount 
                        ? `Payment of ₹${amount} has been verified.` 
                        : "Your recent payment has been verified successfully.",
                    type: "payment",
                    actionUrl: bookingId ? `/bookings/${bookingId}` : '/bookings',
                });
            } catch (notifErr) {
                console.error("Failed to create payment notification:", notifErr);
            }

            return NextResponse.json({
                success: true,
                message: "Payment verified successfully",
                payment_id: razorpay_payment_id,
            });
        } else {
            return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
        }
    } catch (error) {
        console.error("Verify payment error:", error);
        return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }
}