import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";

function createRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;
    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

export async function POST(request) {
    try {
        const razorpay = createRazorpayClient();
        if (!razorpay) {
            return NextResponse.json(
                { error: "Payment gateway is not configured" },
                { status: 500 }
            );
        }

        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { amount, currency = "INR", receipt } = await request.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const options = {
            amount: amount * 100, // Razorpay expects amount in paisa
            currency,
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1, // Auto capture
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
        });
    } catch (error) {
        console.error("Create order error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
