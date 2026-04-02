import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Complaint from "@/models/Complaint";
import Provider from "@/models/Provider";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";

export async function GET(request) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user || (user.role !== "admin" && user.role !== "provider")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (user.role === "admin") {
            const complaints = await Complaint.find({})
                .populate("userId", "name email")
                .populate("providerId", "businessName")
                .sort({ createdAt: -1 })
                .lean();
            return NextResponse.json(complaints);
        }

        // provider role: only show complaints for this provider, hide user identity
        const provider = await Provider.findOne({ clerkId });
        if (!provider) {
            return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
        }

        const complaints = await Complaint.find({ providerId: provider._id })
            .populate("providerId", "businessName")
            .sort({ createdAt: -1 });

        const anonymousComplaints = complaints.map((item) => ({
            ...item.toObject(),
            userId: null,
        }));

        return NextResponse.json(anonymousComplaints);
    } catch (error) {
        console.error("Get admin complaints error:", error);
        return NextResponse.json({ error: "Failed to get complaints" }, { status: 500 });
    }
}