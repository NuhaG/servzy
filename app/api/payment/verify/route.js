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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      bookingId,
    } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 },
      );
    }

    // If bookingId is provided, verify the booking is accepted
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 },
        );
      }
      if (booking.status !== "accepted") {
        return NextResponse.json(
          {
            error:
              "Payment can only be made after the provider accepts your booking request.",
          },
          { status: 400 },
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
      // Update booking with payment details
      if (bookingId) {
        try {
          await Booking.findByIdAndUpdate(
            bookingId,
            {
              paymentStatus: "paid",
              paymentId: razorpay_payment_id,
              paymentOrderId: razorpay_order_id,
            },
            { new: true },
          );
          console.log(`[Payment] Booking ${bookingId} marked as paid`);
        } catch (bookingErr) {
          console.error("Failed to update booking payment status:", bookingErr);
        }
      }

      // dispatch notification to user
      try {
        const message = amount
          ? `Payment of ₹${amount} has been verified. Your booking is ready!`
          : "Your recent payment has been verified successfully.";

        await Notification.create({
          userId: user._id,
          bookingId: bookingId || undefined,
          title: "Payment Successful ✅",
          message: message,
          type: "payment",
          actionUrl: bookingId ? `/user/bookings` : "/user/bookings",
        });

        // Send notification to provider as well
        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking && booking.providerId) {
            const providerName = user?.name || "Customer";
            await Notification.create({
              providerId: booking.providerId,
              bookingId: bookingId,
              title: "Payment Received ✅",
              message: `Payment of ₹${amount || booking.amount} received from ${providerName}. Booking is ready to complete.`,
              type: "payment",
              actionUrl: `/provider/bookings`,
            });
          }
        }
      } catch (notifErr) {
        console.error("Failed to create payment notification:", notifErr);
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
      });
    } else {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
