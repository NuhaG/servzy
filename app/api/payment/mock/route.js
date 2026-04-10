import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/rbac";

export async function POST(req) {
  try {
    const { userId, user } = await getSessionUser({});
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, simulateFailure = false } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Make sure only the booking owner can pay
    if (String(booking.userId) !== String(user._id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (simulateFailure) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "failed",
      });
      return NextResponse.json(
        { success: false, message: "Payment failed (simulated)" },
        { status: 400 },
      );
    }

    const fakePaymentId = "mock_pay_" + Date.now();
    const fakeOrderId = "mock_order_" + Date.now();

    await Booking.findByIdAndUpdate(bookingId, {
      paymentId: fakePaymentId,
      paymentOrderId: fakeOrderId,
      paymentStatus: "paid",
      status: "accepted",
    });

    return NextResponse.json({
      success: true,
      paymentId: fakePaymentId,
      orderId: fakeOrderId,
    });
  } catch (error) {
    console.error("Mock payment error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 },
    );
  }
}
